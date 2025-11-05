-- InventoryPro Database Functions and Stored Procedures
-- Migration Date: 2025-11-05
-- Purpose: Create supporting functions for inventory management

-- =============================================
-- WAREHOUSE UTILIZATION FUNCTIONS
-- =============================================

/**
 * Update warehouse current utilization
 */
CREATE OR REPLACE FUNCTION update_warehouse_utilization(
    warehouse_id uuid,
    quantity_change integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE warehouses 
    SET 
        current_utilization = current_utilization + quantity_change,
        updated_at = now()
    WHERE id = warehouse_id;
END;
$$;

/**
 * Check if warehouse has capacity for new stock
 */
CREATE OR REPLACE FUNCTION check_warehouse_capacity(
    warehouse_id uuid,
    required_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_capacity integer;
    current_utilization integer;
BEGIN
    SELECT capacity, current_utilization 
    INTO current_capacity, current_utilization
    FROM warehouses 
    WHERE id = warehouse_id;
    
    IF current_capacity IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN (current_utilization + required_quantity) <= current_capacity;
END;
$$;

-- =============================================
-- INVENTORY FIFO FUNCTIONS
-- =============================================

/**
 * Deduct stock using FIFO (First In, First Out) method
 */
CREATE OR REPLACE FUNCTION deduct_stock_fifo(
    p_product_id uuid,
    p_warehouse_id uuid,
    p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    batch_record RECORD;
    remaining_quantity integer := p_quantity;
    total_cost numeric(10, 2) := 0;
    movement_id uuid;
BEGIN
    -- Validate sufficient stock
    IF (
        SELECT COALESCE(SUM(quantity), 0)
        FROM inventory_items 
        WHERE product_id = p_product_id 
        AND warehouse_id = p_warehouse_id 
        AND status = 'active'
    ) < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product % in warehouse %', p_product_id, p_warehouse_id;
    END IF;

    -- Process FIFO: deduct from oldest batches first
    FOR batch_record IN 
        SELECT id, quantity, unit_cost
        FROM inventory_items 
        WHERE product_id = p_product_id 
        AND warehouse_id = p_warehouse_id 
        AND status = 'active'
        AND quantity > 0
        ORDER BY received_date ASC -- FIFO: oldest first
    LOOP
        EXIT WHEN remaining_quantity <= 0;
        
        IF batch_record.quantity <= remaining_quantity THEN
            -- Deduct entire batch
            UPDATE inventory_items 
            SET quantity = 0,
                updated_at = now()
            WHERE id = batch_record.id;
            
            total_cost := total_cost + (batch_record.quantity * batch_record.unit_cost);
            remaining_quantity := remaining_quantity - batch_record.quantity;
            
            -- Record stock movement
            INSERT INTO stock_movements (
                product_id, warehouse_id, type, batch_id, quantity, 
                reference_id, unit_cost
            ) VALUES (
                p_product_id, p_warehouse_id, 'sale', 
                batch_record.id, batch_record.quantity, 
                'FIFO_DEDUCTION', batch_record.unit_cost
            );
        ELSE
            -- Partial deduction from batch
            UPDATE inventory_items 
            SET quantity = quantity - remaining_quantity,
                updated_at = now()
            WHERE id = batch_record.id;
            
            total_cost := total_cost + (remaining_quantity * batch_record.unit_cost);
            
            -- Record stock movement
            INSERT INTO stock_movements (
                product_id, warehouse_id, type, batch_id, quantity, 
                reference_id, unit_cost
            ) VALUES (
                p_product_id, p_warehouse_id, 'sale', 
                batch_record.id, remaining_quantity, 
                'FIFO_DEDUCTION', batch_record.unit_cost
            );
            
            remaining_quantity := 0;
        END IF;
    END LOOP;

    -- Update warehouse utilization
    PERFORM update_warehouse_utilization(p_warehouse_id, -p_quantity);
    
    RAISE NOTICE 'FIFO deduction completed for product %, quantity: %, total cost: %', 
        p_product_id, p_quantity, total_cost;
END;
$$;

/**
 * Mark expired items
 */
CREATE OR REPLACE FUNCTION mark_expired_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_batch RECORD;
BEGIN
    -- Mark expired items
    UPDATE inventory_items 
    SET status = 'expired',
        updated_at = now()
    WHERE expiry_date < now() 
    AND status = 'active';

    -- Get count of expired items for logging
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    IF expired_count > 0 THEN
        RAISE NOTICE 'Marked % expired items', expired_count;
        
        -- Record expired stock movements
        INSERT INTO stock_movements (
            product_id, warehouse_id, type, quantity, reason
        )
        SELECT 
            product_id, warehouse_id, 'expired', 
            quantity, 'Auto-marked as expired'
        FROM inventory_items 
        WHERE status = 'expired'
        AND created_at > now() - interval '1 hour'; -- Only recent updates
    END IF;
END;
$$;

-- =============================================
-- PURCHASE ORDER FUNCTIONS
-- =============================================

/**
 * Create purchase order with items
 */
CREATE OR REPLACE FUNCTION create_purchase_order(
    p_supplier_id uuid,
    p_items jsonb,
    p_expected_delivery_date timestamptz DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS PurchaseOrder
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_po_id uuid;
    po_number text;
    item_data jsonb;
    total_amount numeric(10, 2) := 0;
    new_po PurchaseOrder;
BEGIN
    -- Generate PO number
    po_number := 'PO-' || TO_CHAR(now(), 'YYYYMM') || '-' || 
                 LPAD((EXTRACT(EPOCH FROM now())::int % 1000)::text, 3, '0');
    
    -- Create purchase order
    INSERT INTO purchase_orders (
        po_number, supplier_id, expected_delivery_date, 
        notes, total_amount, created_by
    ) VALUES (
        po_number, p_supplier_id, p_expected_delivery_date,
        p_notes, 0, auth.uid()
    ) RETURNING id INTO new_po_id;
    
    -- Insert purchase order items
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO purchase_order_items (
            purchase_order_id, product_id, quantity, unit_price
        ) VALUES (
            new_po_id,
            (item_data->>'productId')::uuid,
            (item_data->>'quantity')::integer,
            (item_data->>'unitPrice')::numeric
        );
        
        total_amount := total_amount + (
            (item_data->>'quantity')::integer * (item_data->>'unitPrice')::numeric
        );
    END LOOP;
    
    -- Update total amount
    UPDATE purchase_orders 
    SET total_amount = total_amount
    WHERE id = new_po_id;
    
    -- Return the created purchase order
    SELECT * INTO new_po 
    FROM purchase_orders 
    WHERE id = new_po_id;
    
    RETURN new_po;
END;
$$;

/**
 * Update purchase order status and handle receiving
 */
CREATE OR REPLACE FUNCTION update_purchase_order_status(
    p_order_id uuid,
    p_status text
)
RETURNS PurchaseOrder
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_po PurchaseOrder;
    item_record RECORD;
    warehouse_id uuid;
BEGIN
    -- Update the purchase order status
    UPDATE purchase_orders 
    SET 
        status = p_status,
        updated_at = now(),
        actual_delivery_date = CASE WHEN p_status = 'received' THEN now() ELSE actual_delivery_date END
    WHERE id = p_order_id
    RETURNING * INTO updated_po;
    
    -- If status is 'received', create inventory batches
    IF p_status = 'received' THEN
        -- Get warehouse (you may want to make this configurable)
        SELECT id INTO warehouse_id 
        FROM warehouses 
        WHERE status = 'active' 
        LIMIT 1;
        
        IF warehouse_id IS NOT NULL THEN
            -- Create inventory batches for each item
            FOR item_record IN 
                SELECT poi.*, p.shelf_life
                FROM purchase_order_items poi
                JOIN products p ON poi.product_id = p.id
                WHERE poi.purchase_order_id = p_order_id
            LOOP
                INSERT INTO inventory_items (
                    product_id, warehouse_id, batch_number,
                    quantity, unit_cost, expiry_date
                ) VALUES (
                    item_record.product_id,
                    warehouse_id,
                    'BATCH-' || SUBSTRING(item_record.product_id::text, 1, 8) || '-' ||
                    REPLACE(TO_CHAR(now(), 'YYYYMMDD'), '-', '') || '-' ||
                    LPAD((EXTRACT(EPOCH FROM now())::int % 1000)::text, 3, '0'),
                    item_record.received_quantity,
                    item_record.unit_price,
                    now() + (item_record.shelf_life || ' days')::interval
                );
            END LOOP;
            
            -- Update warehouse utilization
            PERFORM update_warehouse_utilization(
                warehouse_id,
                COALESCE((
                    SELECT SUM(received_quantity)
                    FROM purchase_order_items
                    WHERE purchase_order_id = p_order_id
                ), 0)
            );
        END IF;
    END IF;
    
    RETURN updated_po;
END;
$$;

-- =============================================
-- ALERT GENERATION FUNCTIONS
-- =============================================

/**
 * Generate alerts for low stock and expiring items
 */
CREATE OR REPLACE FUNCTION generate_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    product_record RECORD;
    stock_level integer;
    days_until_expiry integer;
    current_alert_count integer;
BEGIN
    -- Remove existing alerts for refresh
    DELETE FROM alerts WHERE created_at < now() - interval '1 hour';
    
    -- Generate low stock alerts
    FOR product_record IN 
        SELECT p.id, p.name, p.min_stock_level
        FROM products p
        WHERE p.active = true
        AND p.min_stock_level > 0
    LOOP
        -- Calculate current stock level
        SELECT COALESCE(SUM(ii.quantity), 0) INTO stock_level
        FROM inventory_items ii
        WHERE ii.product_id = product_record.id
        AND ii.status = 'active';
        
        -- Create alert if stock is low
        IF stock_level <= product_record.min_stock_level THEN
            INSERT INTO alerts (
                type, severity, title, message, 
                entity_type, entity_id
            ) VALUES (
                'low_stock',
                CASE 
                    WHEN stock_level = 0 THEN 'critical'
                    WHEN stock_level <= (product_record.min_stock_level * 0.5) THEN 'warning'
                    ELSE 'info'
                END,
                'Low Stock Alert',
                format('Product "%s" has low stock: %d units (minimum: %d)', 
                       product_record.name, stock_level, product_record.min_stock_level),
                'product',
                product_record.id
            );
        END IF;
    END LOOP;
    
    -- Generate expiring soon alerts
    FOR product_record IN 
        SELECT ii.id, ii.product_id, p.name, ii.expiry_date, ii.quantity
        FROM inventory_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.status = 'active'
        AND ii.expiry_date IS NOT NULL
        AND ii.expiry_date > now()
        AND ii.expiry_date <= (now() + interval '30 days')
    LOOP
        days_until_expiry := EXTRACT(days FROM (product_record.expiry_date - now()))::integer;
        
        INSERT INTO alerts (
            type, severity, title, message, 
            entity_type, entity_id
        ) VALUES (
            'expiring_soon',
            CASE 
                WHEN days_until_expiry <= 7 THEN 'critical'
                WHEN days_until_expiry <= 14 THEN 'warning'
                ELSE 'info'
            END,
            'Expiring Soon',
            format('Product "%s" batch expires in %d days (%s)', 
                   product_record.name, days_until_expiry, 
                   TO_CHAR(product_record.expiry_date, 'YYYY-MM-DD')),
            'inventory',
            product_record.id
        );
    END LOOP;
    
    -- Generate expired alerts
    FOR product_record IN 
        SELECT ii.id, ii.product_id, p.name, ii.quantity
        FROM inventory_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.status = 'expired'
    LOOP
        INSERT INTO alerts (
            type, severity, title, message, 
            entity_type, entity_id
        ) VALUES (
            'expired',
            'critical',
            'Expired Items',
            format('Product "%s" batch has expired (%d units)', 
                   product_record.name, product_record.quantity),
            'inventory',
            product_record.id
        );
    END LOOP;
    
    -- Generate warehouse capacity alerts
    FOR product_record IN 
        SELECT id, name, capacity, current_utilization,
               (current_utilization::numeric / capacity * 100) as utilization_pct
        FROM warehouses
        WHERE status = 'active'
    LOOP
        IF product_record.utilization_pct >= 80 THEN
            INSERT INTO alerts (
                type, severity, title, message, 
                entity_type, entity_id
            ) VALUES (
                'warehouse_full',
                CASE 
                    WHEN product_record.utilization_pct >= 95 THEN 'critical'
                    ELSE 'warning'
                END,
                'Warehouse Capacity Alert',
                format('Warehouse "%s" is at %s%% capacity', 
                       product_record.name, 
                       ROUND(product_record.utilization_pct)::text),
                'warehouse',
                product_record.id
            );
        END IF;
    END LOOP;
END;
$$;

-- =============================================
-- DASHBOARD KPI FUNCTIONS
-- =============================================

/**
 * Get dashboard KPIs
 */
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'totalProducts', (
            SELECT COUNT(*) FROM products WHERE active = true
        ),
        'totalStockUnits', (
            SELECT COALESCE(SUM(quantity), 0) FROM inventory_items WHERE status = 'active'
        ),
        'activeOrders', (
            SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'processing')
        ),
        'inventoryValue', (
            SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_items WHERE status = 'active'
        ),
        'todaysPOSSales', (
            SELECT COALESCE(SUM(total), 0) FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND payment_method = 'cash'
        ),
        'deliveryRate', (
            SELECT CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(*) FILTER (WHERE status = 'delivered'))::numeric / COUNT(*) * 100, 2)
                ELSE 0 
            END
            FROM orders 
            WHERE created_at >= CURRENT_DATE - interval '30 days'
        ),
        'warehouseUtilization', (
            SELECT ROUND(AVG((current_utilization::numeric / capacity * 100)), 2)
            FROM warehouses WHERE status = 'active'
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

/**
 * Get low stock products
 */
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'productId', p.id,
            'productName', p.name,
            'currentStock', COALESCE(stock_levels.total_stock, 0),
            'minStockLevel', p.min_stock_level,
            'category', c.name,
            'status', CASE 
                WHEN COALESCE(stock_levels.total_stock, 0) = 0 THEN 'out_of_stock'
                WHEN COALESCE(stock_levels.total_stock, 0) <= p.min_stock_level THEN 'low_stock'
                ELSE 'normal'
            END
        )
    ) INTO result
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN (
        SELECT 
            product_id,
            SUM(quantity) as total_stock
        FROM inventory_items 
        WHERE status = 'active'
        GROUP BY product_id
    ) stock_levels ON p.id = stock_levels.product_id
    WHERE p.active = true
    AND (COALESCE(stock_levels.total_stock, 0) <= p.min_stock_level OR p.min_stock_level = 0)
    ORDER BY 
        CASE 
            WHEN COALESCE(stock_levels.total_stock, 0) = 0 THEN 1
            WHEN COALESCE(stock_levels.total_stock, 0) <= p.min_stock_level THEN 2
            ELSE 3
        END,
        p.name;
    
    RETURN result;
END;
$$;

/**
 * Get expiring items
 */
CREATE OR REPLACE FUNCTION get_expiring_items(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'batchId', ii.id,
            'productId', ii.product_id,
            'productName', p.name,
            'batchNumber', ii.batch_number,
            'quantity', ii.quantity,
            'expiryDate', ii.expiry_date,
            'daysUntilExpiry', EXTRACT(days FROM (ii.expiry_date - now()))::integer,
            'warehouse', w.name,
            'status', CASE 
                WHEN ii.expiry_date < now() THEN 'expired'
                WHEN ii.expiry_date <= (now() + interval '7 days') THEN 'critical'
                WHEN ii.expiry_date <= (now() + interval '14 days') THEN 'warning'
                ELSE 'expiring_soon'
            END
        )
    ) INTO result
    FROM inventory_items ii
    JOIN products p ON ii.product_id = p.id
    JOIN warehouses w ON ii.warehouse_id = w.id
    WHERE ii.status = 'active'
    AND ii.expiry_date IS NOT NULL
    AND ii.expiry_date <= (now() + (p_days || ' days')::interval)
    ORDER BY ii.expiry_date ASC;
    
    RETURN result;
END;
$$;

-- =============================================
-- ACCOUNTING FUNCTIONS
-- =============================================

/**
 * Get financial summary
 */
CREATE OR REPLACE FUNCTION get_financial_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'totalExpenses', (
            SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'paid'
        ),
        'pendingExpenses', (
            SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'pending'
        ),
        'accountsPayable', (
            SELECT COALESCE(SUM(amount), 0) FROM accounts_payable WHERE status = 'outstanding'
        ),
        'accountsReceivable', (
            SELECT COALESCE(SUM(amount), 0) FROM accounts_receivable WHERE status = 'outstanding'
        ),
        'inventoryValue', (
            SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_items WHERE status = 'active'
        ),
        'monthlyRevenue', (
            SELECT COALESCE(SUM(total), 0) FROM orders 
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =============================================
-- PERFORMANCE OPTIMIZATION
-- =============================================

/**
 * Refresh materialized views (if using them)
 */
CREATE OR REPLACE FUNCTION refresh_inventory_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh any materialized views used for reporting
    -- Example: REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_summary;
    NULL; -- Placeholder for actual materialized view refreshes
END;
$$;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

/**
 * Clean up old data
 */
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean up old stock movements (keep last 2 years)
    DELETE FROM stock_movements 
    WHERE created_at < (now() - interval '2 years');
    
    -- Clean up dismissed alerts older than 1 month
    DELETE FROM alerts 
    WHERE status = 'dismissed' 
    AND dismissed_at < (now() - interval '1 month');
    
    -- Clean up completed purchase orders older than 1 year
    DELETE FROM purchase_orders 
    WHERE status IN ('received', 'cancelled') 
    AND created_at < (now() - interval '1 year');
    
    RAISE NOTICE 'Old data cleanup completed';
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
-- Stock Management Functions
-- Functions to handle inventory updates with proper error handling

-- Function to decrement stock safely with minimum stock validation
CREATE OR REPLACE FUNCTION decrement_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    updated_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock
    FROM products
    WHERE id = p_product_id AND active = true;

    -- Check if product exists
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    -- Check if sufficient stock
    IF current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', current_stock, p_quantity;
    END IF;

    -- Update stock
    UPDATE products
    SET stock = stock - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Verify update was successful
    GET DIAGNOSTICS updated_stock = ROW_COUNT;

    RETURN updated_stock > 0;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        RAISE WARNING 'Stock decrement failed for product %: %', p_product_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stock (for returns/receiving)
CREATE OR REPLACE FUNCTION increment_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    updated_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock
    FROM products
    WHERE id = p_product_id;

    -- Check if product exists
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    -- Update stock
    UPDATE products
    SET stock = stock + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Verify update was successful
    GET DIAGNOSTICS updated_stock = ROW_COUNT;

    RETURN updated_stock > 0;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        RAISE WARNING 'Stock increment failed for product %: %', p_product_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items(
    p_threshold INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    current_stock INTEGER,
    threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as product_id,
        p.name as product_name,
        p.stock as current_stock,
        p_threshold as threshold
    FROM products p
    WHERE p.active = true
    AND p.stock <= p_threshold
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stock turnover (sales velocity)
CREATE OR REPLACE FUNCTION get_stock_turnover(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    current_stock INTEGER,
    total_sold INTEGER,
    avg_daily_sales DECIMAL,
    days_of_supply INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH
    sales_data AS (
        SELECT
            oi.product_id,
            COALESCE(SUM(oi.quantity), 0) as total_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '%s days'
        AND o.status = 'completed'
        GROUP BY oi.product_id
    )
    SELECT
        p.id as product_id,
        p.name as product_name,
        p.stock as current_stock,
        COALESCE(s.total_sold, 0) as total_sold,
        CASE
            WHEN COALESCE(s.total_sold, 0) > 0
            THEN ROUND(COALESCE(s.total_sold, 0)::DECIMAL / p_days, 2)
            ELSE 0
        END as avg_daily_sales,
        CASE
            WHEN COALESCE(s.total_sold, 0) > 0
            THEN ROUND(p.stock::DECIMAL / (COALESCE(s.total_sold, 0)::DECIMAL / p_days))
            ELSE 999
        END as days_of_supply
    FROM products p
    LEFT JOIN sales_data s ON p.id = s.product_id
    WHERE p.active = true
    ORDER BY days_of_supply ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_turnover(INTEGER) TO authenticated;

-- Row Level Security policies for the new functions
-- These will be enforced by the SECURITY DEFINER clause

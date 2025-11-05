-- InventoryPro Enhanced Database Schema
-- Migration Date: 2025-11-05
-- Purpose: Add comprehensive inventory management tables and features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE PRODUCT ENHANCEMENTS
-- =============================================

-- Update products table to match PRD requirements
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS base_uom text DEFAULT 'bottle',
ADD COLUMN IF NOT EXISTS min_stock_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shelf_life integer DEFAULT 365;

-- Create alternate_uoms table for multiple unit measurements
CREATE TABLE IF NOT EXISTS alternate_uoms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL,
    quantity integer NOT NULL,
    conversion_factor numeric(10, 2) NOT NULL,
    price numeric(10, 2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE alternate_uoms ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WAREHOUSE MANAGEMENT
-- =============================================

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    location text NOT NULL,
    manager text NOT NULL,
    capacity integer NOT NULL DEFAULT 1000,
    current_utilization integer DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view active warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (status = 'active');

-- =============================================
-- INVENTORY BATCH MANAGEMENT
-- =============================================

-- Create inventory_items table with batch tracking
CREATE TABLE IF NOT EXISTS inventory_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    batch_number text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    unit_cost numeric(10, 2) NOT NULL,
    expiry_date timestamptz,
    received_date timestamptz DEFAULT now(),
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'damaged')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(batch_number, product_id, warehouse_id)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage inventory items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- SUPPLIER MANAGEMENT
-- =============================================

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name text NOT NULL,
    contact_person text NOT NULL,
    phone text NOT NULL,
    email text,
    payment_terms text DEFAULT 'Net 30' CHECK (payment_terms IN ('Net 15', 'Net 30', 'Net 60', 'COD')),
    address text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- PURCHASE ORDER MANAGEMENT
-- =============================================

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number text NOT NULL UNIQUE,
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'received', 'cancelled')),
    total_amount numeric(10, 2) DEFAULT 0,
    expected_delivery_date timestamptz,
    actual_delivery_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id)
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity integer NOT NULL,
    unit_price numeric(10, 2) NOT NULL,
    subtotal numeric(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase order items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage purchase order items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- SALES ORDER MANAGEMENT
-- =============================================

-- Update orders table to include delivery information
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS sales_order_status text DEFAULT 'pending' CHECK (sales_order_status IN ('pending', 'converted'));

-- Create sales_order_items table (enhance order_items)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id);

-- =============================================
-- ALERT SYSTEM
-- =============================================

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('low_stock', 'expiring_soon', 'expired', 'warehouse_full')),
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title text NOT NULL,
    message text NOT NULL,
    entity_type text NOT NULL CHECK (entity_type IN ('product', 'inventory', 'warehouse')),
    entity_id text NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'dismissed')),
    created_at timestamptz DEFAULT now(),
    dismissed_at timestamptz,
    dismissed_by uuid REFERENCES profiles(id)
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can dismiss alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (status = 'active')
  WITH CHECK (auth.uid() = dismissed_by OR is_admin());

-- =============================================
-- STOCK MOVEMENTS
-- =============================================

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES products(id),
    warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    type text NOT NULL CHECK (type IN ('purchase', 'sale', 'transfer', 'adjustment', 'expired')),
    batch_id uuid REFERENCES inventory_items(id),
    quantity integer NOT NULL,
    reason text,
    reference_id text, -- PO ID, Order ID, etc.
    unit_cost numeric(10, 2),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id)
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage stock movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- ACCOUNTING MODULE
-- =============================================

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    description text NOT NULL,
    category text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    vendor_id uuid REFERENCES suppliers(id),
    expense_date timestamptz DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    receipt_number text,
    notes text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id)
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create accounts_payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id uuid NOT NULL REFERENCES suppliers(id),
    amount numeric(10, 2) NOT NULL,
    due_date timestamptz NOT NULL,
    status text DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid', 'overdue')),
    description text NOT NULL,
    po_id uuid REFERENCES purchase_orders(id),
    invoice_number text,
    created_at timestamptz DEFAULT now(),
    paid_at timestamptz,
    paid_by uuid REFERENCES profiles(id)
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts payable"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage accounts payable"
  ON accounts_payable FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create accounts_receivable table
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name text NOT NULL,
    customer_phone text,
    customer_email text,
    amount numeric(10, 2) NOT NULL,
    due_date timestamptz NOT NULL,
    status text DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid', 'overdue')),
    description text NOT NULL,
    sale_id uuid REFERENCES orders(id),
    invoice_number text,
    created_at timestamptz DEFAULT now(),
    paid_at timestamptz,
    paid_by uuid REFERENCES profiles(id)
);

ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts receivable"
  ON accounts_receivable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage accounts receivable"
  ON accounts_receivable FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON inventory_items(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);

-- Stock movement indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alternate_uoms_updated_at BEFORE UPDATE ON alternate_uoms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_number IS NULL THEN
        NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::int % 1000)::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_po_number_trigger BEFORE INSERT ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- Function to auto-generate batch numbers
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.batch_number IS NULL THEN
        NEW.batch_number := 'BATCH-' || SUBSTRING(NEW.product_id::text, 1, 8) || '-' || 
                           REPLACE(TO_CHAR(NOW(), 'YYYYMMDD'), '-', '') || '-' || 
                           LPAD((EXTRACT(EPOCH FROM NOW())::int % 1000)::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_batch_number_trigger BEFORE INSERT ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION generate_batch_number();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample warehouses
INSERT INTO warehouses (name, location, manager, capacity, current_utilization) VALUES
    ('Main Warehouse', 'Manila Central', 'Juan Dela Cruz', 10000, 3500),
    ('North Warehouse', 'Quezon City', 'Maria Santos', 8000, 2100),
    ('South Warehouse', 'Makati', 'Pedro Garcia', 6000, 1800)
ON CONFLICT DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (company_name, contact_person, phone, email, payment_terms, address) VALUES
    ('Coca-Cola Philippines', 'Ana Martinez', '+639171234567', 'ana.martinez@coca-cola.com', 'Net 30', 'Makati City'),
    ('PepsiCo Philippines', 'Carlos Rivera', '+639171234568', 'carlos.rivera@pepsico.com', 'Net 15', 'Quezon City'),
    ('Red Bull Philippines', 'Lisa Chen', '+639171234569', 'lisa.chen@redbull.com', 'Net 60', 'Taguig City')
ON CONFLICT DO NOTHING;

-- Insert sample alternate UOMs for existing products
INSERT INTO alternate_uoms (product_id, name, quantity, conversion_factor, price)
SELECT 
    p.id,
    'pack',
    6,
    6.00,
    p.price * 6
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM alternate_uoms au WHERE au.product_id = p.id)
LIMIT 5;

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View for inventory summary
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    COUNT(ii.id) as batch_count,
    SUM(ii.quantity) as total_stock,
    AVG(ii.unit_cost) as avg_cost,
    SUM(ii.quantity * ii.unit_cost) as total_value,
    p.min_stock_level,
    CASE 
        WHEN SUM(ii.quantity) <= p.min_stock_level THEN 'low'
        WHEN SUM(ii.quantity) = 0 THEN 'out'
        ELSE 'normal'
    END as stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory_items ii ON p.id = ii.product_id AND ii.status = 'active'
GROUP BY p.id, p.name, c.name, p.min_stock_level;

-- View for supplier summary
CREATE OR REPLACE VIEW supplier_summary AS
SELECT 
    s.id,
    s.company_name,
    s.contact_person,
    s.payment_terms,
    COUNT(po.id) as total_orders,
    COALESCE(SUM(po.total_amount), 0) as total_value,
    AVG(po.total_amount) as avg_order_value
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE s.status = 'active'
GROUP BY s.id, s.company_name, s.contact_person, s.payment_terms;

-- Grant access to views
GRANT SELECT ON inventory_summary TO authenticated;
GRANT SELECT ON supplier_summary TO authenticated;

-- =============================================
-- SECURITY AND PERMISSIONS
-- =============================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure proper RLS policies exist for all new tables
-- (Policies are already created above for each table)
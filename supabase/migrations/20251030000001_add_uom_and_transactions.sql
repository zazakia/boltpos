-- Migration: Add Unit of Measure support and new transaction types
-- Created: 2025-10-30

-- ============================================================================
-- 1. ADD UOM FIELDS TO PRODUCTS TABLE
-- ============================================================================

-- Add base_uom and uom_list to products
ALTER TABLE products
ADD COLUMN base_uom TEXT DEFAULT 'piece',
ADD COLUMN uom_list JSONB DEFAULT '[{"name": "piece", "conversion_to_base": 1, "is_base": true}]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN products.base_uom IS 'The base unit of measure for the product (e.g., kilo, piece, liter)';
COMMENT ON COLUMN products.uom_list IS 'Array of units with conversion rates to base UOM. Format: [{"name": "sack", "conversion_to_base": 50, "is_base": false}]';

-- ============================================================================
-- 2. ADD UOM TO EXISTING ORDER_ITEMS TABLE
-- ============================================================================

ALTER TABLE order_items
ADD COLUMN uom TEXT DEFAULT 'piece',
ADD COLUMN conversion_to_base NUMERIC(10,4) DEFAULT 1,
ADD COLUMN base_quantity NUMERIC(10,4);

-- Update existing records to have base_quantity
UPDATE order_items SET base_quantity = quantity WHERE base_quantity IS NULL;

COMMENT ON COLUMN order_items.uom IS 'Unit of measure used in this transaction line';
COMMENT ON COLUMN order_items.conversion_to_base IS 'Conversion rate to base UOM (for audit trail)';
COMMENT ON COLUMN order_items.base_quantity IS 'Quantity converted to base UOM';

-- ============================================================================
-- 3. CREATE SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Supplier/vendor master data';

-- Create index on active suppliers
CREATE INDEX idx_suppliers_active ON suppliers(active) WHERE active = true;

-- ============================================================================
-- 4. CREATE BRANCHES TABLE (for transfers)
-- ============================================================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE branches IS 'Branch/location master data for inventory transfers';

-- Insert default main branch
INSERT INTO branches (code, name, address)
VALUES ('MAIN', 'Main Branch', 'Main Office');

-- ============================================================================
-- 5. CREATE RECEIVING VOUCHERS TABLE
-- ============================================================================

CREATE TABLE receiving_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers(id),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    total_amount NUMERIC(10,2) DEFAULT 0,
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    received_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE receiving_vouchers IS 'Inventory receiving from suppliers';

CREATE INDEX idx_receiving_vouchers_supplier ON receiving_vouchers(supplier_id);
CREATE INDEX idx_receiving_vouchers_user ON receiving_vouchers(user_id);
CREATE INDEX idx_receiving_vouchers_date ON receiving_vouchers(received_date);

-- ============================================================================
-- 6. CREATE RECEIVING VOUCHER ITEMS TABLE
-- ============================================================================

CREATE TABLE receiving_voucher_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_voucher_id UUID REFERENCES receiving_vouchers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    conversion_to_base NUMERIC(10,4) DEFAULT 1,
    base_quantity NUMERIC(10,4) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE receiving_voucher_items IS 'Line items for receiving vouchers';

CREATE INDEX idx_receiving_voucher_items_voucher ON receiving_voucher_items(receiving_voucher_id);
CREATE INDEX idx_receiving_voucher_items_product ON receiving_voucher_items(product_id);

-- ============================================================================
-- 7. CREATE INVENTORY ADJUSTMENTS TABLE
-- ============================================================================

CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    reason TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    adjustment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_adjustments IS 'Inventory adjustments (in/out) for corrections, damages, etc.';

CREATE INDEX idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);
CREATE INDEX idx_inventory_adjustments_user ON inventory_adjustments(user_id);
CREATE INDEX idx_inventory_adjustments_date ON inventory_adjustments(adjustment_date);

-- ============================================================================
-- 8. CREATE INVENTORY ADJUSTMENT ITEMS TABLE
-- ============================================================================

CREATE TABLE inventory_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID REFERENCES inventory_adjustments(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    conversion_to_base NUMERIC(10,4) DEFAULT 1,
    base_quantity NUMERIC(10,4) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_adjustment_items IS 'Line items for inventory adjustments';

CREATE INDEX idx_inventory_adjustment_items_adjustment ON inventory_adjustment_items(adjustment_id);
CREATE INDEX idx_inventory_adjustment_items_product ON inventory_adjustment_items(product_id);

-- ============================================================================
-- 9. CREATE TRANSFERS TABLE
-- ============================================================================

CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    from_branch_id UUID REFERENCES branches(id) NOT NULL,
    to_branch_id UUID REFERENCES branches(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    remarks TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
    transfer_date TIMESTAMPTZ DEFAULT NOW(),
    received_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_branches CHECK (from_branch_id != to_branch_id)
);

COMMENT ON TABLE transfers IS 'Inventory transfers between branches';

CREATE INDEX idx_transfers_from_branch ON transfers(from_branch_id);
CREATE INDEX idx_transfers_to_branch ON transfers(to_branch_id);
CREATE INDEX idx_transfers_user ON transfers(user_id);
CREATE INDEX idx_transfers_status ON transfers(status);

-- ============================================================================
-- 10. CREATE TRANSFER ITEMS TABLE
-- ============================================================================

CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    conversion_to_base NUMERIC(10,4) DEFAULT 1,
    base_quantity NUMERIC(10,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE transfer_items IS 'Line items for transfers';

CREATE INDEX idx_transfer_items_transfer ON transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_product ON transfer_items(product_id);

-- ============================================================================
-- 11. CREATE CUSTOMER RETURNS TABLE
-- ============================================================================

CREATE TABLE customer_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    total_amount NUMERIC(10,2) DEFAULT 0,
    reason TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    return_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customer_returns IS 'Customer return transactions';

CREATE INDEX idx_customer_returns_order ON customer_returns(order_id);
CREATE INDEX idx_customer_returns_user ON customer_returns(user_id);
CREATE INDEX idx_customer_returns_date ON customer_returns(return_date);

-- ============================================================================
-- 12. CREATE CUSTOMER RETURN ITEMS TABLE
-- ============================================================================

CREATE TABLE customer_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES customer_returns(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    conversion_to_base NUMERIC(10,4) DEFAULT 1,
    base_quantity NUMERIC(10,4) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customer_return_items IS 'Line items for customer returns';

CREATE INDEX idx_customer_return_items_return ON customer_return_items(return_id);
CREATE INDEX idx_customer_return_items_product ON customer_return_items(product_id);

-- ============================================================================
-- 13. CREATE SUPPLIER RETURNS TABLE
-- ============================================================================

CREATE TABLE supplier_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    receiving_voucher_id UUID REFERENCES receiving_vouchers(id),
    supplier_id UUID REFERENCES suppliers(id),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    total_amount NUMERIC(10,2) DEFAULT 0,
    reason TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    return_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplier_returns IS 'Return items to suppliers (RTS)';

CREATE INDEX idx_supplier_returns_voucher ON supplier_returns(receiving_voucher_id);
CREATE INDEX idx_supplier_returns_supplier ON supplier_returns(supplier_id);
CREATE INDEX idx_supplier_returns_user ON supplier_returns(user_id);
CREATE INDEX idx_supplier_returns_date ON supplier_returns(return_date);

-- ============================================================================
-- 14. CREATE SUPPLIER RETURN ITEMS TABLE
-- ============================================================================

CREATE TABLE supplier_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES supplier_returns(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    conversion_to_base NUMERIC(10,4) DEFAULT 1,
    base_quantity NUMERIC(10,4) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplier_return_items IS 'Line items for supplier returns';

CREATE INDEX idx_supplier_return_items_return ON supplier_return_items(return_id);
CREATE INDEX idx_supplier_return_items_product ON supplier_return_items(product_id);

-- ============================================================================
-- 15. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receiving_vouchers_updated_at BEFORE UPDATE ON receiving_vouchers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_adjustments_updated_at BEFORE UPDATE ON inventory_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_returns_updated_at BEFORE UPDATE ON customer_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_returns_updated_at BEFORE UPDATE ON supplier_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 16. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiving_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiving_voucher_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_return_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 17. CREATE RLS POLICIES
-- ============================================================================

-- Suppliers: Authenticated users can read all, only admins can modify
CREATE POLICY "Users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert suppliers" ON suppliers
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update suppliers" ON suppliers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Branches: Authenticated users can read all
CREATE POLICY "Users can view branches" ON branches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage branches" ON branches
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Receiving Vouchers: All authenticated users can view and create
CREATE POLICY "Users can view receiving vouchers" ON receiving_vouchers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert receiving vouchers" ON receiving_vouchers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their receiving vouchers" ON receiving_vouchers
    FOR UPDATE USING (auth.uid() = user_id);

-- Receiving Voucher Items: All authenticated users can view
CREATE POLICY "Users can view receiving voucher items" ON receiving_voucher_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage receiving voucher items" ON receiving_voucher_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM receiving_vouchers
            WHERE id = receiving_voucher_id AND user_id = auth.uid()
        )
    );

-- Inventory Adjustments: All authenticated users can view and create
CREATE POLICY "Users can view inventory adjustments" ON inventory_adjustments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert inventory adjustments" ON inventory_adjustments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their inventory adjustments" ON inventory_adjustments
    FOR UPDATE USING (auth.uid() = user_id);

-- Inventory Adjustment Items
CREATE POLICY "Users can view inventory adjustment items" ON inventory_adjustment_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage inventory adjustment items" ON inventory_adjustment_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM inventory_adjustments
            WHERE id = adjustment_id AND user_id = auth.uid()
        )
    );

-- Transfers: All authenticated users can view and create
CREATE POLICY "Users can view transfers" ON transfers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert transfers" ON transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their transfers" ON transfers
    FOR UPDATE USING (auth.uid() = user_id);

-- Transfer Items
CREATE POLICY "Users can view transfer items" ON transfer_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage transfer items" ON transfer_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transfers
            WHERE id = transfer_id AND user_id = auth.uid()
        )
    );

-- Customer Returns: All authenticated users can view and create
CREATE POLICY "Users can view customer returns" ON customer_returns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customer returns" ON customer_returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their customer returns" ON customer_returns
    FOR UPDATE USING (auth.uid() = user_id);

-- Customer Return Items
CREATE POLICY "Users can view customer return items" ON customer_return_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage customer return items" ON customer_return_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customer_returns
            WHERE id = return_id AND user_id = auth.uid()
        )
    );

-- Supplier Returns: All authenticated users can view and create
CREATE POLICY "Users can view supplier returns" ON supplier_returns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert supplier returns" ON supplier_returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their supplier returns" ON supplier_returns
    FOR UPDATE USING (auth.uid() = user_id);

-- Supplier Return Items
CREATE POLICY "Users can view supplier return items" ON supplier_return_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage supplier return items" ON supplier_return_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM supplier_returns
            WHERE id = return_id AND user_id = auth.uid()
        )
    );

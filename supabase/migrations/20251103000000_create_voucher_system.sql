-- Voucher Receiving System Database Schema
--
-- 1. New Tables
--    - suppliers: Supplier/vendor information
--    - vouchers: Purchase orders/receiving vouchers from suppliers
--    - voucher_items: Line items for each voucher
--    - accounts_payable: Track amounts owed to suppliers
--
-- 2. Functions
--    - receive_voucher_items: Atomically update stock when receiving voucher
--
-- 3. Security
--    - Enable RLS on all tables
--    - Admin-only access for creating/managing vouchers and suppliers

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- VOUCHERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  received_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert vouchers"
  ON vouchers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update vouchers"
  ON vouchers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete vouchers"
  ON vouchers FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- VOUCHER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS voucher_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost numeric(10, 2) NOT NULL DEFAULT 0,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view voucher items"
  ON voucher_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert voucher items"
  ON voucher_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update voucher items"
  ON voucher_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete voucher items"
  ON voucher_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- ACCOUNTS PAYABLE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  voucher_id uuid REFERENCES vouchers(id) ON DELETE SET NULL,
  amount_due numeric(10, 2) NOT NULL DEFAULT 0,
  amount_paid numeric(10, 2) DEFAULT 0,
  balance numeric(10, 2) GENERATED ALWAYS AS (amount_due - COALESCE(amount_paid, 0)) STORED,
  payment_date timestamptz,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all accounts payable"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert accounts payable"
  ON accounts_payable FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update accounts payable"
  ON accounts_payable FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete accounts payable"
  ON accounts_payable FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_vouchers_supplier_id ON vouchers(supplier_id);
CREATE INDEX idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_voucher_items_voucher_id ON voucher_items(voucher_id);
CREATE INDEX idx_voucher_items_product_id ON voucher_items(product_id);
CREATE INDEX idx_accounts_payable_supplier_id ON accounts_payable(supplier_id);
CREATE INDEX idx_accounts_payable_voucher_id ON accounts_payable(voucher_id);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);

-- =====================================================
-- FUNCTION: RECEIVE VOUCHER AND UPDATE STOCK
-- =====================================================
CREATE OR REPLACE FUNCTION receive_voucher_items(
  p_voucher_id uuid,
  p_create_payable boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_voucher_record record;
  v_item record;
  v_total_amount numeric(10, 2) := 0;
  v_payable_id uuid;
  v_updated_products jsonb := '[]'::jsonb;
BEGIN
  -- Check if voucher exists and is in pending status
  SELECT * INTO v_voucher_record
  FROM vouchers
  WHERE id = p_voucher_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found: %', p_voucher_id;
  END IF;

  IF v_voucher_record.status != 'pending' THEN
    RAISE EXCEPTION 'Voucher is not in pending status. Current status: %', v_voucher_record.status;
  END IF;

  -- Process each voucher item and update product stock
  FOR v_item IN
    SELECT vi.*, p.name as product_name
    FROM voucher_items vi
    JOIN products p ON p.id = vi.product_id
    WHERE vi.voucher_id = p_voucher_id
  LOOP
    -- Update product stock
    UPDATE products
    SET stock = stock + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;

    -- Log stock change
    INSERT INTO stock_logs (product_id, quantity_change, remaining_stock, created_at)
    SELECT v_item.product_id, v_item.quantity, stock, now()
    FROM products
    WHERE id = v_item.product_id;

    -- Calculate total
    v_total_amount := v_total_amount + v_item.subtotal;

    -- Track updated products
    v_updated_products := v_updated_products || jsonb_build_object(
      'product_id', v_item.product_id,
      'product_name', v_item.product_name,
      'quantity_added', v_item.quantity
    );
  END LOOP;

  -- Update voucher status and total
  UPDATE vouchers
  SET status = 'received',
      total_amount = v_total_amount,
      received_date = now(),
      updated_at = now()
  WHERE id = p_voucher_id;

  -- Create accounts payable entry if requested
  IF p_create_payable THEN
    INSERT INTO accounts_payable (
      supplier_id,
      voucher_id,
      amount_due,
      amount_paid,
      status
    )
    VALUES (
      v_voucher_record.supplier_id,
      p_voucher_id,
      v_total_amount,
      0,
      'unpaid'
    )
    RETURNING id INTO v_payable_id;
  END IF;

  -- Return result summary
  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', p_voucher_id,
    'total_amount', v_total_amount,
    'payable_id', v_payable_id,
    'updated_products', v_updated_products
  );
END;
$$;

-- =====================================================
-- FUNCTION: UPDATE ACCOUNTS PAYABLE PAYMENT
-- =====================================================
CREATE OR REPLACE FUNCTION update_payable_payment(
  p_payable_id uuid,
  p_payment_amount numeric(10, 2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payable record;
  v_new_amount_paid numeric(10, 2);
  v_new_status text;
BEGIN
  -- Get current payable record
  SELECT * INTO v_payable
  FROM accounts_payable
  WHERE id = p_payable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Accounts payable record not found: %', p_payable_id;
  END IF;

  -- Calculate new amount paid
  v_new_amount_paid := COALESCE(v_payable.amount_paid, 0) + p_payment_amount;

  -- Validate payment doesn't exceed amount due
  IF v_new_amount_paid > v_payable.amount_due THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds amount due (%)', v_new_amount_paid, v_payable.amount_due;
  END IF;

  -- Determine new status
  IF v_new_amount_paid = 0 THEN
    v_new_status := 'unpaid';
  ELSIF v_new_amount_paid < v_payable.amount_due THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'paid';
  END IF;

  -- Update accounts payable
  UPDATE accounts_payable
  SET amount_paid = v_new_amount_paid,
      status = v_new_status,
      payment_date = CASE WHEN v_new_status = 'paid' THEN now() ELSE payment_date END,
      updated_at = now()
  WHERE id = p_payable_id;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION receive_voucher_items TO authenticated;
GRANT EXECUTE ON FUNCTION update_payable_payment TO authenticated;

-- =====================================================
-- TRIGGER: AUTO-UPDATE VOUCHER UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================
-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, active) VALUES
  ('ABC Suppliers Inc.', 'John Doe', 'john@abcsuppliers.com', '+1-555-0100', '123 Main St, City', true),
  ('XYZ Wholesale', 'Jane Smith', 'jane@xyzwholesale.com', '+1-555-0200', '456 Oak Ave, Town', true)
ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE suppliers IS 'Stores supplier/vendor information for purchase orders';
COMMENT ON TABLE vouchers IS 'Purchase orders and receiving vouchers from suppliers';
COMMENT ON TABLE voucher_items IS 'Line items for each voucher showing products and quantities';
COMMENT ON TABLE accounts_payable IS 'Tracks outstanding payments owed to suppliers';
COMMENT ON FUNCTION receive_voucher_items IS 'Processes voucher receipt, updates stock, and creates accounts payable entry';
COMMENT ON FUNCTION update_payable_payment IS 'Records payment against accounts payable and updates status';

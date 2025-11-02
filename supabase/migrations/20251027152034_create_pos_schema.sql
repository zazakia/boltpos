-- POS System Database Schema
-- 
-- 1. New Tables
--    - profiles: User profiles linked to auth.users
--    - categories: Product categories with colors for UI
--    - products: Items for sale with pricing and inventory
--    - orders: Customer orders with totals and payment info
--    - order_items: Line items for each order
-- 
-- 2. Security
--    - Enable RLS on all tables
--    - Authenticated users can manage their data
--    - Admins can manage products and categories
-- 
-- 3. Important Notes
--    - Prices stored as numeric for precision
--    - Order items snapshot prices for historical accuracy
--    - Categories have colors for Square-style UI

-- Create security helper function for admin checks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
$$;

-- Profiles table is created in 20251027000000_create_profiles_table.sql

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  stock integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  tax numeric(10, 2) DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10, 2) NOT NULL,
  subtotal numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
  
  CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (is_admin());
  
  -- Create trigger function to prevent sensitive field updates on orders
  CREATE OR REPLACE FUNCTION prevent_sensitive_order_updates()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    -- Check if sensitive fields are being updated by non-superuser
    IF (
      TG_OP = 'UPDATE' AND
      (
        OLD.user_id IS DISTINCT FROM NEW.user_id OR
        OLD.total IS DISTINCT FROM NEW.total OR
        OLD.tax IS DISTINCT FROM NEW.tax OR
        OLD.payment_method IS DISTINCT FROM NEW.payment_method
      ) AND
      NOT pg_has_role(session_user, 'postgres', 'MEMBER')
    ) THEN
      RAISE EXCEPTION 'Cannot update sensitive order fields (user_id, total, tax, payment_method) without proper privileges';
    END IF;
    
    RETURN NEW;
  END;
  $$;
  
  -- Create trigger to enforce sensitive field protection
  CREATE TRIGGER orders_sensitive_fields_protection
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION prevent_sensitive_order_updates();
  
  -- Insert default categories
INSERT INTO categories (name, color) VALUES
  ('Food', '#10B981'),
  ('Drinks', '#3B82F6'),
  ('Snacks', '#F59E0B'),
  ('Electronics', '#8B5CF6'),
  ('Accessories', '#EC4899')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, price, category_id, stock, active)
SELECT 
  'Sample Product', 
  9.99, 
  (SELECT id FROM categories WHERE name = 'Food' LIMIT 1),
  100,
  true
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Add stock management functions for POS system

-- Function to safely decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  product_id uuid,
  quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Get current stock and lock the row
  SELECT stock INTO current_stock
  FROM products
  WHERE id = decrement_product_stock.product_id
  FOR UPDATE;
  
  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', product_id;
  END IF;
  
  -- Check if sufficient stock is available
  IF current_stock < quantity THEN
    RAISE EXCEPTION 'Insufficient stock: requested %, available %', quantity, current_stock;
  END IF;
  
  -- Update stock
  UPDATE products
  SET stock = stock - quantity,
      updated_at = now()
  WHERE id = decrement_product_stock.product_id;
  
  -- Log the stock change (optional, for audit purposes)
  INSERT INTO stock_logs (product_id, quantity_change, remaining_stock, created_at)
  VALUES (product_id, -quantity, current_stock - quantity, now());
END;
$$;

-- Function to safely increment product stock (for returns/cancellations)
CREATE OR REPLACE FUNCTION increment_product_stock(
  product_id uuid,
  quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Get current stock and lock the row
  SELECT stock INTO current_stock
  FROM products
  WHERE id = increment_product_stock.product_id
  FOR UPDATE;
  
  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', product_id;
  END IF;
  
  -- Update stock
  UPDATE products
  SET stock = stock + quantity,
      updated_at = now()
  WHERE id = increment_product_stock.product_id;
  
  -- Log the stock change (optional, for audit purposes)
  INSERT INTO stock_logs (product_id, quantity_change, remaining_stock, created_at)
  VALUES (product_id, quantity, current_stock + quantity, now());
END;
$$;

-- Create stock_logs table for audit purposes
CREATE TABLE IF NOT EXISTS stock_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change integer NOT NULL, -- Positive for increases, negative for decreases
  remaining_stock integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all stock logs"
  ON stock_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION decrement_product_stock TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_stock TO authenticated;
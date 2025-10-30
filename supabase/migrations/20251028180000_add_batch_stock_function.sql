-- Add batch stock management function for atomic operations

-- Function to safely decrement stock for multiple products in a single transaction
CREATE OR REPLACE FUNCTION decrement_multiple_product_stock(
  order_items jsonb  -- Array of objects with product_id and quantity
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_record jsonb;
  product_id uuid;
  quantity integer;
  current_stock integer;
BEGIN
  -- Process each item in the order
  FOR item_record IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    -- Extract product_id and quantity from the JSON object
    product_id := (item_record->>'product_id')::uuid;
    quantity := (item_record->>'quantity')::integer;
    
    -- Get current stock and lock the row
    SELECT stock INTO current_stock
    FROM products
    WHERE id = product_id
    FOR UPDATE;
    
    -- Check if product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', product_id;
    END IF;
    
    -- Check if sufficient stock is available
    IF current_stock < quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %', product_id, quantity, current_stock;
    END IF;
    
    -- Update stock
    UPDATE products
    SET stock = stock - quantity,
        updated_at = now()
    WHERE id = product_id;
    
    -- Log the stock change (optional, for audit purposes)
    INSERT INTO stock_logs (product_id, quantity_change, remaining_stock, created_at)
    VALUES (product_id, -quantity, current_stock - quantity, now());
  END LOOP;
END;
$$;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION decrement_multiple_product_stock TO authenticated;
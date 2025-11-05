-- Add customer_id to orders table
-- This migration links orders to customers

-- Add customer_id column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add index for customer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Add index for composite queries (user_id + customer_id + created_at)
CREATE INDEX IF NOT EXISTS idx_orders_user_customer_date ON public.orders(user_id, customer_id, created_at DESC);

-- Function to get customer order history
CREATE OR REPLACE FUNCTION get_customer_order_history(
    p_customer_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    total DECIMAL,
    tax DECIMAL,
    status TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    item_count INTEGER,
    items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.total,
        o.tax,
        o.status,
        o.payment_method,
        o.created_at,
        COUNT(oi.id) as item_count,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'product_name', p.name,
                'quantity', oi.quantity,
                'price', oi.price,
                'subtotal', oi.subtotal
            )
        ) FILTER (WHERE p.id IS NOT NULL) as items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON oi.product_id = p.id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.id, o.total, o.tax, o.status, o.payment_method, o.created_at
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create order with customer
CREATE OR REPLACE FUNCTION create_order_with_customer(
    p_user_id UUID,
    p_customer_id UUID DEFAULT NULL,
    p_total DECIMAL,
    p_tax DECIMAL,
    p_status TEXT DEFAULT 'completed',
    p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
    order_id UUID;
BEGIN
    INSERT INTO public.orders (
        user_id,
        customer_id,
        total,
        tax,
        status,
        payment_method
    )
    VALUES (
        p_user_id,
        p_customer_id,
        p_total,
        p_tax,
        p_status,
        p_payment_method
    )
    RETURNING id INTO order_id;

    -- Update customer stats if customer exists
    IF p_customer_id IS NOT NULL THEN
        -- Add loyalty points (1 point per dollar spent)
        PERFORM update_loyalty_points(p_customer_id, FLOOR(p_total)::INTEGER);
    END IF;

    RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to include customer_id in checks
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id OR (auth.jwt() ->> 'role' = 'admin'));

DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Users can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING ((auth.jwt() ->> 'role' = 'admin'));

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_customer_order_history(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_customer(UUID, UUID, DECIMAL, DECIMAL, TEXT, TEXT) TO authenticated;

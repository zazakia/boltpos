-- Add customer_id to orders table
-- Allows associating orders with customers

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Update RLS policy to handle customer_id
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
    auth.role() = 'authenticated' AND (
        user_id = auth.uid() OR
        (EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND user_id = auth.uid()
);

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Function to get order with customer details
CREATE OR REPLACE FUNCTION get_order_with_customer(p_order_id UUID)
RETURNS TABLE (
    id UUID,
    customer_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    user_id UUID,
    total DECIMAL,
    tax DECIMAL,
    status TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        o.user_id,
        o.total,
        o.tax,
        o.status,
        o.payment_method,
        o.created_at
    FROM public.orders o
    LEFT JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_order_with_customer(UUID) TO authenticated;

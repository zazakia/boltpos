-- Add customer_id to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for customer queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON public.orders(customer_id, created_at);

-- Function to get customer sales summary
CREATE OR REPLACE FUNCTION get_customer_sales_summary(
    p_customer_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_orders INTEGER,
    total_amount DECIMAL,
    avg_order_value DECIMAL,
    last_order_date TIMESTAMP WITH TIME ZONE,
    loyalty_points_earned INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT o.id)::INTEGER as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount,
        CASE
            WHEN COUNT(DISTINCT o.id) > 0
            THEN COALESCE(SUM(o.total), 0) / COUNT(DISTINCT o.id)
            ELSE 0
        END as avg_order_value,
        MAX(o.created_at) as last_order_date,
        FLOOR(COALESCE(SUM(o.total), 0))::INTEGER as loyalty_points_earned
    FROM public.orders o
    WHERE o.customer_id = p_customer_id
    AND o.created_at >= NOW() - INTERVAL '%s days'
    AND o.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_customer_sales_summary(UUID, INTEGER) TO authenticated;

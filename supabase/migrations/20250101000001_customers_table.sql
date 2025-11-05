-- Customers Table
-- Customer management for POS system

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    address TEXT,
    company TEXT,
    notes TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);

-- Create index for full text search
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING gin(
    to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' || COALESCE(company, ''))
);

-- Update trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
CREATE POLICY "Allow full access to authenticated users"
ON public.customers
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Customer Orders View
CREATE OR REPLACE VIEW public.customer_orders AS
SELECT
    c.*,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    COALESCE(AVG(o.total), 0) as avg_order_value,
    MAX(o.created_at) as last_order_date,
    o.created_at as first_order_date
FROM public.customers c
LEFT JOIN public.orders o ON c.id = o.customer_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.company, c.notes,
         c.credit_limit, c.current_balance, c.loyalty_points, c.is_active,
         c.created_at, c.updated_at;

-- Customer Transactions View
CREATE OR REPLACE VIEW public.customer_transactions AS
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    c.phone,
    o.id as order_id,
    o.total,
    o.status,
    o.payment_method,
    o.created_at as order_date
FROM public.customers c
JOIN public.orders o ON c.id = o.customer_id
WHERE c.is_active = true
AND o.status IN ('completed', 'refunded')
ORDER BY o.created_at DESC;

-- Sample Customer Data (optional - for development)
INSERT INTO public.customers (name, email, phone, company, address) VALUES
('Walk-in Customer', NULL, NULL, NULL, NULL),
('John Doe', 'john@example.com', '+1234567890', 'Doe Enterprises', '123 Main St, City, State 12345'),
('Jane Smith', 'jane@example.com', '+0987654321', 'Smith & Co', '456 Oak Ave, City, State 67890')
ON CONFLICT (email) DO NOTHING;

-- Functions for Customer Management

-- Function to get customer by email or phone
CREATE OR REPLACE FUNCTION get_customer_by_contact(
    p_contact TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    loyalty_points INTEGER,
    total_orders INTEGER,
    total_spent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.address,
        c.loyalty_points,
        COALESCE(o_stats.total_orders, 0)::INTEGER,
        COALESCE(o_stats.total_spent, 0)
    FROM public.customers c
    LEFT JOIN (
        SELECT
            customer_id,
            COUNT(DISTINCT id) as total_orders,
            SUM(total) as total_spent
        FROM public.orders
        WHERE customer_id IS NOT NULL
        AND status = 'completed'
        GROUP BY customer_id
    ) o_stats ON c.id = o_stats.customer_id
    WHERE c.is_active = true
    AND (c.email = p_contact OR c.phone = p_contact OR name ILIKE '%' || p_contact || '%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add or update customer
CREATE OR REPLACE FUNCTION upsert_customer(
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_company TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    customer_id UUID;
BEGIN
    -- Try to find existing customer by email or phone
    SELECT id INTO customer_id
    FROM public.customers
    WHERE (email = p_email AND p_email IS NOT NULL)
       OR (phone = p_phone AND p_phone IS NOT NULL)
    LIMIT 1;

    IF customer_id IS NOT NULL THEN
        -- Update existing customer
        UPDATE public.customers
        SET
            name = COALESCE(p_name, name),
            email = COALESCE(p_email, email),
            phone = COALESCE(p_phone, phone),
            company = COALESCE(p_company, company),
            address = COALESCE(p_address, address),
            updated_at = NOW()
        WHERE id = customer_id;

        RETURN customer_id;
    ELSE
        -- Insert new customer
        INSERT INTO public.customers (name, email, phone, company, address)
        VALUES (p_name, p_email, p_phone, p_company, p_address)
        RETURNING id INTO customer_id;

        RETURN customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer loyalty points
CREATE OR REPLACE FUNCTION update_loyalty_points(
    p_customer_id UUID,
    p_points INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.customers
    SET
        loyalty_points = loyalty_points + p_points,
        updated_at = NOW()
    WHERE id = p_customer_id AND is_active = true;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT SELECT ON public.customer_orders TO authenticated;
GRANT SELECT ON public.customer_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_by_contact(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_loyalty_points(UUID, INTEGER) TO authenticated;

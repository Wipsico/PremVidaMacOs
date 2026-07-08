-- Prem Vida - Database Schema (Supabase / PostgreSQL)
-- Highly organized, relational, and optimized for internationalization (i18n)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- 1. PROFILES (Access control & i18n)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
    preferred_language TEXT NOT NULL DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 2. PRODUCTS (Inventory)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    category TEXT, -- Added for classification (e.g., Dairy-Free, Confectionery, Beverage)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 3. ASSETS (Warehouse assets)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    original_cost NUMERIC(12, 2) NOT NULL CHECK (original_cost >= 0),
    salvage_value NUMERIC(12, 2) NOT NULL CHECK (salvage_value >= 0),
    life_years INTEGER NOT NULL CHECK (life_years > 0),
    purchase_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 4. SUPPLIERS (Supplier directory)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    contact_info JSONB, -- Dynamic contact info (phone, email, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 5. PURCHASE ORDERS (Procurement)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pendiente', 'solicitado', 'pagado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 6. EXPENSES (Operating expenses)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('alquiler', 'agua', 'luz', 'otros')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 7. EMPLOYEES (Staff profiles)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 8. PAYROLL (Chronological records)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid >= 0),
    status TEXT NOT NULL CHECK (status IN ('pendiente', 'pagado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 9. SALES (Orders)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'espera_aprobacion', 'confirmado')),
    delivery_type TEXT NOT NULL,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-----------------------------------------
-- 10. SALE ITEMS (Junction for sales and products)
-----------------------------------------
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;


-------------------------------------------------------------------------------
-- AUTOMATION: UPDATED_AT TRIGGER FUNCTION
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-------------------------------------------------------------------------------
-- PERFORMANCE INDEXES (Optimizing queries and simulated folder structures)
-------------------------------------------------------------------------------
-- For employee folders / payroll history query
CREATE INDEX IF NOT EXISTS idx_payroll_employee_date ON public.payroll(employee_id, payment_date DESC);

-- For sales operators and status filtering
CREATE INDEX IF NOT EXISTS idx_sales_operator_status ON public.sales(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);

-- For purchase orders and suppliers
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);


-------------------------------------------------------------------------------
-- ATOMIC DATABASE TRANSACTION FUNCTION: CONFIRM SALE & DEDUCT STOCK
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_sale(p_sale_id UUID)
RETURNS public.sales AS $$
DECLARE
    v_sale public.sales;
    v_item RECORD;
BEGIN
    -- 1. Retrieve and lock the sale row to prevent concurrent updates
    SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale with ID % not found.', p_sale_id;
    END IF;
    
    -- 2. Check if the sale is already confirmed
    IF v_sale.status = 'confirmado' THEN
        RETURN v_sale;
    END IF;

    -- 3. Loop through items and deduct stock
    FOR v_item IN 
        SELECT product_id, quantity FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        -- Update product stock, checking that we don't go below 0 (handled by the CHECK constraint on products.stock)
        UPDATE public.products 
        SET stock = stock - v_item.quantity
        WHERE id = v_item.product_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found.', v_item.product_id;
        END IF;
    END LOOP;

    -- 4. Update the sale status to confirmed
    UPDATE public.sales
    SET status = 'confirmado'
    WHERE id = p_sale_id
    RETURNING * INTO v_sale;

    RETURN v_sale;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Default secure setup: admins have full access; operators have restricted access.
-------------------------------------------------------------------------------

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view and manage all profiles" ON public.profiles
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 2. Products Policies
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins and Operators can manage products" ON public.products
    FOR ALL USING (public.get_current_user_role() IN ('admin', 'operator'));

-- 3. Assets Policies
CREATE POLICY "Admins can manage assets" ON public.assets
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Operators can view assets" ON public.assets
    FOR SELECT USING (public.get_current_user_role() = 'operator');

-- 4. Suppliers Policies
CREATE POLICY "Admins and Operators can view suppliers" ON public.suppliers
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 5. Purchase Orders Policies
CREATE POLICY "Admins and Operators can view purchase orders" ON public.purchase_orders
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 6. Expenses Policies
CREATE POLICY "Admins can manage expenses" ON public.expenses
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Operators can view expenses" ON public.expenses
    FOR SELECT USING (public.get_current_user_role() = 'operator');

-- 7. Employees Policies
CREATE POLICY "Admins and Operators can view employees" ON public.employees
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins can manage employees" ON public.employees
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 8. Payroll Policies
CREATE POLICY "Admins can manage payroll" ON public.payroll
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 9. Sales Policies
CREATE POLICY "Admins can manage all sales" ON public.sales
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Operators can view and manage their own sales" ON public.sales
    FOR ALL USING (operator_id = auth.uid() OR public.get_current_user_role() = 'admin');

-- 10. Sale Items Policies
CREATE POLICY "Users can view and manage sale items for accessible sales" ON public.sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sales 
            WHERE id = sale_items.sale_id 
              AND (operator_id = auth.uid() OR public.get_current_user_role() = 'admin')
        )
    );

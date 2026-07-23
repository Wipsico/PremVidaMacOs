-- Prem Vida - Backlog Phase 2
-- Ejecutar en Supabase SQL Editor despues de auth_rls_phase1.sql.
-- Objetivo: tickets publicos de tienda + confirmacion admin con descuento atomico.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS expiry_date DATE;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_public_order(
    p_order_code TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_type TEXT,
    p_delivery_notes TEXT,
    p_payment_method TEXT,
    p_total_amount NUMERIC,
    p_items JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order public.orders;
    v_item JSONB;
    v_product public.products;
    v_quantity INTEGER;
    v_unit_price NUMERIC(10, 2);
BEGIN
    IF p_order_code IS NULL OR length(trim(p_order_code)) < 6 THEN
        RAISE EXCEPTION 'Codigo de pedido invalido.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El ticket no tiene productos.';
    END IF;

    INSERT INTO public.orders (
        order_code,
        customer_name,
        customer_phone,
        delivery_type,
        delivery_notes,
        payment_method,
        total_amount,
        status
    )
    VALUES (
        upper(trim(p_order_code)),
        nullif(trim(coalesce(p_customer_name, 'Cliente WhatsApp')), ''),
        nullif(trim(coalesce(p_customer_phone, '')), ''),
        coalesce(nullif(trim(p_delivery_type), ''), 'pickup'),
        nullif(trim(coalesce(p_delivery_notes, '')), ''),
        coalesce(nullif(trim(p_payment_method), ''), 'No especificado'),
        ROUND(coalesce(p_total_amount, 0) * 100) / 100,
        'espera_aprobacion'
    )
    RETURNING * INTO v_order;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := greatest(coalesce((v_item->>'quantity')::INTEGER, 0), 0);
        v_unit_price := ROUND(coalesce((v_item->>'unit_price')::NUMERIC, 0) * 100) / 100;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Cantidad invalida en un producto.';
        END IF;

        SELECT *
        INTO v_product
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
          AND is_active = TRUE
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto no encontrado o inactivo.';
        END IF;

        IF v_product.stock < v_quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para %. Disponible: %, solicitado: %.',
                v_product.name, v_product.stock, v_quantity;
        END IF;

        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order.id, v_product.id, v_quantity, v_unit_price);
    END LOOP;

    RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order public.orders;
    v_item RECORD;
BEGIN
    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada.';
    END IF;

    IF v_order.status = 'confirmado' THEN
        RETURN v_order;
    END IF;

    FOR v_item IN
        SELECT oi.product_id, oi.quantity, p.name, p.stock
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
        FOR UPDATE OF p
    LOOP
        IF v_item.stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para %. Disponible: %, requerido: %.',
                v_item.name, v_item.stock, v_item.quantity;
        END IF;

        UPDATE public.products
        SET stock = stock - v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;

    UPDATE public.orders
    SET status = 'confirmado',
        updated_at = now(),
        operator_id = auth.uid()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$;

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Operators can view and manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and operators can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and operators can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view and manage order items for accessible orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins and operators can view order items" ON public.order_items;

CREATE POLICY "Admins and operators can view orders"
ON public.orders
FOR SELECT
USING (public.get_current_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins and operators can update orders"
ON public.orders
FOR UPDATE
USING (public.get_current_user_role() IN ('admin', 'operator'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'operator'));

CREATE POLICY "Admins and operators can view order items"
ON public.order_items
FOR SELECT
USING (
    public.get_current_user_role() IN ('admin', 'operator')
    AND EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
    )
);

GRANT EXECUTE ON FUNCTION public.create_public_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order(UUID) TO authenticated;

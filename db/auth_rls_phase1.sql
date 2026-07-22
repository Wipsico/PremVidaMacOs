-- Prem Vida - Fase 1 Auth/RLS hardening
-- Run this in Supabase SQL Editor after reviewing the first admin user/profile.
-- This script is additive/idempotent where possible and does not drop data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles are the approval gate for admin access.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
    preferred_language TEXT NOT NULL DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view and manage all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- Public ecommerce can read only active products. Admin/operator can manage products.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins and Operators can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins and operators can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins and operators can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins and operators can update products" ON public.products;
DROP POLICY IF EXISTS "Admins and operators can delete products" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins and operators can view all products"
ON public.products
FOR SELECT
USING (public.is_operator_or_admin());

CREATE POLICY "Admins and operators can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.is_operator_or_admin());

CREATE POLICY "Admins and operators can update products"
ON public.products
FOR UPDATE
USING (public.is_operator_or_admin())
WITH CHECK (public.is_operator_or_admin());

CREATE POLICY "Admins and operators can delete products"
ON public.products
FOR DELETE
USING (public.is_operator_or_admin());

-- Keep payroll and settings-style operations admin-only through existing RLS.
-- IMPORTANT: Disable public signups in Supabase Dashboard:
-- Authentication -> Providers -> Email -> "Confirm email" as desired and avoid public signup links in UI.
-- First admin bootstrap must be done manually in SQL Editor after creating the auth user:
-- INSERT INTO public.profiles (id, name, role)
-- VALUES ('AUTH_USER_UUID_HERE', 'Admin Prem Vida', 'admin');

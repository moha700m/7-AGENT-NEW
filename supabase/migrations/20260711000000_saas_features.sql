-- ============================================
-- Agent Store SaaS - SaaS Features Migration
-- ============================================

-- 1. Update Users Table for Profile Information
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create Bank Transfers Table
CREATE TABLE IF NOT EXISTS public.bank_transfers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    phone VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    receipt_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable RLS on Bank Transfers
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Bank Transfers
CREATE POLICY "Users can view their own transfers" ON public.bank_transfers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transfers" ON public.bank_transfers
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all transfers" ON public.bank_transfers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Update handle_new_user to include more metadata if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    username,
    role, 
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        username = COALESCE(public.users.username, EXCLUDED.username),
        updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$;

-- 6. Add Indexes for Bank Transfers
CREATE INDEX IF NOT EXISTS idx_bank_transfers_user_id ON public.bank_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transfers_status ON public.bank_transfers(status);
CREATE INDEX IF NOT EXISTS idx_bank_transfers_created_at ON public.bank_transfers(created_at DESC);

-- ============================================
-- Agent Store SaaS - Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users & Authentication
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'customer', -- super_admin, admin, staff, customer
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- ============================================
-- 2. Customers (Leads)
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  agent_type VARCHAR(100),
  plan VARCHAR(100),
  message TEXT,
  status VARCHAR(50) DEFAULT 'جديد', -- جديد, تم التواصل, تم البيع, ملغي
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contacted_at TIMESTAMP,
  converted_at TIMESTAMP
);

-- ============================================
-- 3. Agents (AI Agents)
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- whatsapp, booking, sales, voice
  price DECIMAL(10, 2),
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  features JSONB, -- Array of features
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  sales INT DEFAULT 0
);

-- ============================================
-- 4. Plans (Pricing Plans)
-- ============================================

CREATE TABLE IF NOT EXISTS plans (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'SAR',
  billing_period VARCHAR(50), -- monthly, yearly
  features JSONB, -- Array of features
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. Orders
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  plan_id BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  agent_id BIGINT REFERENCES agents(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'SAR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_date TIMESTAMP,
  notes TEXT
);

-- ============================================
-- 6. Subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. Activity Logs
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100), -- create, update, delete, login, logout
  resource_type VARCHAR(100), -- leads, orders, agents, etc
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. Notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50), -- info, success, warning, error
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- ============================================
-- 9. Settings
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50), -- string, number, boolean, json
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. Files (Storage Metadata)
-- ============================================

CREATE TABLE IF NOT EXISTS files (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  bucket VARCHAR(100), -- customers, agents, logos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. Analytics
-- ============================================

CREATE TABLE IF NOT EXISTS analytics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE DEFAULT CURRENT_DATE,
  total_users INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  new_users INT DEFAULT 0,
  new_leads INT DEFAULT 0,
  new_orders INT DEFAULT 0,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0
);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin', 'staff')
      AND status = 'active'
  );
$$;

-- Revoke public access to is_admin
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - Users
-- ============================================

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================
-- RLS Policies - Leads
-- ============================================

CREATE POLICY "Public can create leads" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all leads" ON leads
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Agents
-- ============================================

CREATE POLICY "Anyone can view published agents" ON agents
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can manage agents" ON agents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Plans
-- ============================================

CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage plans" ON plans
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Orders
-- ============================================

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Notifications
-- ============================================

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- RLS Policies - Activity Logs
-- ============================================

CREATE POLICY "Admins can view activity logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================
-- RLS Policies - Settings
-- ============================================

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Files
-- ============================================

CREATE POLICY "Users can manage their own files" ON files
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all files" ON files
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- RLS Policies - Analytics
-- ============================================

CREATE POLICY "Admins can view analytics" ON analytics
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_published ON agents(is_published);

-- ============================================
-- Views for Analytics (Security Invoker)
-- ============================================

CREATE OR REPLACE VIEW user_stats WITH (security_invoker = true) AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
  COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admins
FROM users;

CREATE OR REPLACE VIEW lead_stats WITH (security_invoker = true) AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status IN ('جديد', 'new') THEN 1 END) as new_leads,
  COUNT(CASE WHEN status IN ('تم التواصل', 'contacted') THEN 1 END) as contacted,
  COUNT(CASE WHEN status IN ('تم البيع', 'sold', 'converted') THEN 1 END) as sold
FROM leads;

CREATE OR REPLACE VIEW order_stats WITH (security_invoker = true) AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status IN ('completed', 'paid') THEN 1 END) as completed_orders,
  COALESCE(SUM(CASE WHEN status IN ('completed', 'paid') THEN amount ELSE 0 END), 0) as total_revenue
FROM orders;

-- Grant access to views
REVOKE ALL ON public.user_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.lead_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.order_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_stats, public.lead_stats, public.order_stats TO authenticated;

-- ============================================
-- Sample Data
-- ============================================

-- Insert default plans
INSERT INTO plans (name, description, price, currency, billing_period, features, is_active)
VALUES 
  ('الباقة الأساسية', 'مناسبة للشركات الصغيرة', 499, 'SAR', 'monthly', '["عميل واتساب واحد", "دعم 24/7"]', TRUE),
  ('الباقة الاحترافية', 'مناسبة للشركات المتوسطة', 999, 'SAR', 'monthly', '["3 عملاء ذكيين", "تحليلات متقدمة", "دعم أولوي"]', TRUE),
  ('الباقة المتقدمة', 'مناسبة للمؤسسات الكبيرة', 2499, 'SAR', 'monthly', '["عملاء غير محدودة", "API كامل", "مدير حساب مخصص"]', TRUE)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, type, description)
VALUES 
  ('site_name', 'Agent Store', 'string', 'اسم الموقع'),
  ('site_email', 'hello@agentstore.sa', 'string', 'بريد الموقع'),
  ('site_phone', '+966555462764', 'string', 'رقم الموقع'),
  ('site_logo', '', 'string', 'شعار الموقع'),
  ('google_analytics_id', '', 'string', 'معرف Google Analytics'),
  ('meta_pixel_id', '', 'string', 'معرف Meta Pixel')
ON CONFLICT (key) DO NOTHING;

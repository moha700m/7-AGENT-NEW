/* ====== Supabase runtime configuration and shared API (SaaS Version) ====== */

let supabaseClient = null;
let configPromise = null;
let sdkPromise = null;

async function loadRuntimeConfig() {
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      const response = await fetch('/api/config', {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        const config = await response.json();
        if (config.supabaseUrl && config.supabaseAnonKey) {
          return config;
        }
      }
    } catch (error) {
      console.error('تعذر تحميل إعدادات Supabase من الخادم.');
    }

    // No fallback keys allowed for security. Must rely on environment variables.
    return {
      supabaseUrl: null,
      supabaseAnonKey: null
    };
  })();

  return configPromise;
}

function loadSupabaseSdk() {
  if (window.supabase?.createClient) return Promise.resolve(window.supabase);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-supabase-sdk]');
    const script = existingScript || document.createElement('script');

    const onLoad = () => {
      if (window.supabase?.createClient) resolve(window.supabase);
      else reject(new Error('تعذر تحميل مكتبة Supabase.'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('تعذر الاتصال بمصدر مكتبة Supabase.')), { once: true });

    if (!existingScript) {
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/dist/umd/supabase.min.js';
      script.async = true;
      script.dataset.supabaseSdk = 'true';
      document.head.appendChild(script);
    }
  });

  return sdkPromise;
}

async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  const [config, sdk] = await Promise.all([loadRuntimeConfig(), loadSupabaseSdk()]);
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('إعدادات Supabase غير متوفرة. يرجى التأكد من ضبط متغيرات البيئة.');
  }

  supabaseClient = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
}

// ---------- Auth Methods ----------

async function signUp(email, password, fullName) {
  const client = await initSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const client = await initSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const client = await initSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function resetPassword(email) {
  const client = await initSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });
  if (error) throw error;
}

async function updatePassword(newPassword) {
  const client = await initSupabase();
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

async function getSession() {
  const client = await initSupabase();
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  return session;
}

async function getUserProfile() {
  const client = await initSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return data;
}

async function updateProfile(profileData) {
  const client = await initSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولاً');

  const { data, error } = await client
    .from('users')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- Data Methods ----------

async function createLead(leadData) {
  const client = await initSupabase();
  const { data: { user } } = await client.auth.getUser();
  const payload = {
    user_id: user?.id || null,
    name: String(leadData.name || '').trim(),
    company: String(leadData.company || '').trim() || null,
    email: String(leadData.email || '').trim() || null,
    phone: String(leadData.phone || '').trim(),
    agent_type: String(leadData.agent_type || '').trim() || null,
    plan: String(leadData.plan || '').trim() || null,
    message: String(leadData.message || '').trim() || null,
    status: 'جديد'
  };

  if (!payload.name || !payload.phone) {
    throw new Error('الاسم ورقم الجوال مطلوبان.');
  }

  const { error } = await client.from('leads').insert(payload);
  if (error) throw error;
  return { success: true };
}

async function getLeads(page = 1, limit = 10, filters = {}) {
  const client = await initSupabase();
  let query = client.from('leads').select('*', { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  
  if (filters.search) {
    const safeSearch = String(filters.search).replace(/[,%_]/g, ' ').trim();
    if (safeSearch) {
      query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,company.ilike.%${safeSearch}%`);
    }
  }

  const from = Math.max(0, (page - 1) * limit);
  const to = from + limit - 1;
  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

async function getOrders(filters = {}) {
  const client = await initSupabase();
  let query = client.from('orders').select('*, plans(*), agents(*)');
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  const { data, error } = await query.order('order_date', { ascending: false });
  if (error) throw error;
  return data;
}

async function getSubscriptions(filters = {}) {
  const client = await initSupabase();
  let query = client.from('subscriptions').select('*, plans(*)');
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function submitBankTransfer(transferData) {
  const client = await initSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await client.from('bank_transfers').insert({
    ...transferData,
    user_id: user.id
  }).select().single();

  if (error) throw error;
  return data;
}

async function getNotifications() {
  const client = await initSupabase();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Legacy admin methods compatibility
async function updateLeadStatus(leadId, newStatus) {
  const client = await initSupabase();
  const { data, error } = await client
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteLead(leadId) {
  const client = await initSupabase();
  const { error } = await client.from('leads').delete().eq('id', leadId);
  if (error) throw error;
  return true;
}

async function getAdminSession() {
  const session = await getSession();
  if (!session) return null;
  const profile = await getUserProfile();
  if (!profile || !['super_admin', 'admin', 'staff'].includes(profile.role) || profile.status !== 'active') {
    return null;
  }
  return { session, profile };
}

window.SupabaseAPI = {
  initSupabase,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getUserProfile,
  updateProfile,
  createLead,
  getLeads,
  getOrders,
  getSubscriptions,
  submitBankTransfer,
  getNotifications,
  updateLeadStatus,
  deleteLead,
  getAdminSession
};

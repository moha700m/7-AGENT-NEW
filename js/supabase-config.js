/* ====== Supabase runtime configuration and shared API ====== */

const FALLBACK_SUPABASE_URL = 'https://pfrugircpdwrxmfikfhv.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_IakXGNQymg7awch3aiC6hg_CEV9BFSf';

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
      console.info('Runtime config endpoint unavailable; using the verified public project configuration.');
    }

    return {
      supabaseUrl: FALLBACK_SUPABASE_URL,
      supabaseAnonKey: FALLBACK_SUPABASE_ANON_KEY
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
  supabaseClient = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
}

async function createLead(leadData) {
  const client = await initSupabase();
  const payload = {
    user_id: null,
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

async function getLeads(page = 1, limit = 100, filters = {}) {
  const client = await initSupabase();
  let query = client.from('leads').select('*', { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
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

async function getLeadStats() {
  const client = await initSupabase();
  const { data, error } = await client.from('leads').select('status,agent_type,plan');
  if (error) throw error;

  const stats = { total: data?.length || 0, byStatus: {}, byAgentType: {}, byPlan: {} };
  data?.forEach((lead) => {
    const status = lead.status || 'جديد';
    const agent = lead.agent_type || 'غير محدد';
    const plan = lead.plan || 'غير محدد';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    stats.byAgentType[agent] = (stats.byAgentType[agent] || 0) + 1;
    stats.byPlan[plan] = (stats.byPlan[plan] || 0) + 1;
  });
  return stats;
}

async function signIn(email, password) {
  const client = await initSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('id,email,full_name,role,status')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile || !['super_admin', 'admin', 'staff'].includes(profile.role) || profile.status !== 'active') {
    await client.auth.signOut();
    throw new Error('هذا الحساب غير مخوّل للوصول إلى لوحة الإدارة.');
  }

  return { user: data.user, profile };
}

async function signOut() {
  const client = await initSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function getAdminSession() {
  const client = await initSupabase();
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) return null;

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('id,email,full_name,role,status')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile || !['super_admin', 'admin', 'staff'].includes(profile.role) || profile.status !== 'active') {
    return null;
  }

  return { session, profile };
}

window.SupabaseAPI = {
  initSupabase,
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  signIn,
  signOut,
  getAdminSession
};

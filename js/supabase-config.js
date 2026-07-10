/* ====== Supabase Configuration ====== */

// Import Supabase from CDN
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// For static HTML, we'll use fetch-based approach
// You can also use: https://cdn.jsdelivr.net/npm/@supabase/supabase-js

let supabaseClient = null;

// Initialize Supabase client
async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  
  // Load Supabase from CDN
  if (!window.supabase) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      const { createClient } = window.supabase;
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    };
    document.head.appendChild(script);
    
    // Wait for script to load
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (window.supabase) {
          clearInterval(checkInterval);
          const { createClient } = window.supabase;
          supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          resolve(supabaseClient);
        }
      }, 100);
    });
  }
  
  return supabaseClient;
}

// Helper functions for CRUD operations
async function createLead(leadData) {
  const client = await initSupabase();
  const { data, error } = await client
    .from('leads')
    .insert([{
      name: leadData.name,
      company: leadData.company,
      phone: leadData.phone,
      agent_type: leadData.agent_type,
      plan: leadData.plan,
      message: leadData.message,
      status: leadData.status || 'جديد',
      created_at: new Date().toISOString()
    }]);
  
  if (error) throw error;
  return data;
}

async function getLeads(page = 1, limit = 100, filters = {}) {
  const client = await initSupabase();
  let query = client.from('leads').select('*');
  
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order('created_at', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

async function updateLeadStatus(leadId, newStatus) {
  const client = await initSupabase();
  const { data, error } = await client
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId);
  
  if (error) throw error;
  return data;
}

async function deleteLead(leadId) {
  const client = await initSupabase();
  const { error } = await client
    .from('leads')
    .delete()
    .eq('id', leadId);
  
  if (error) throw error;
  return true;
}

async function getLeadStats() {
  const client = await initSupabase();
  const { data, error } = await client
    .from('leads')
    .select('*');
  
  if (error) throw error;
  
  const stats = {
    total: data?.length || 0,
    byStatus: {},
    byAgentType: {},
    byPlan: {}
  };
  
  data?.forEach(lead => {
    // By Status
    const status = lead.status || 'جديد';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // By Agent Type
    const agent = lead.agent_type || 'غير محدد';
    stats.byAgentType[agent] = (stats.byAgentType[agent] || 0) + 1;
    
    // By Plan
    const plan = lead.plan || 'غير محدد';
    stats.byPlan[plan] = (stats.byPlan[plan] || 0) + 1;
  });
  
  return stats;
}

// Export for use in other scripts
window.SupabaseAPI = {
  initSupabase,
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getLeadStats
};

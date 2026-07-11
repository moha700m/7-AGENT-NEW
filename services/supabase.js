/* ====== Supabase Service Module ====== */
'use strict';

const SUPABASE_URL = window.SUPABASE_URL || 'https://pfrugircpdwrxmfikfhv.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_IakXGNQymg7awch3aiC6hg_CEV9BFSf';

let supabaseClient = null;

// Initialize Supabase client
async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  if (!window.supabase) {
    throw new Error('Supabase SDK not loaded');
  }
  
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

// ============================================
// LEADS OPERATIONS
// ============================================

async function createLead(leadData) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .insert([{
      name: leadData.name,
      company: leadData.company || null,
      email: leadData.email || null,
      phone: leadData.phone,
      agent_type: leadData.agent_type,
      plan: leadData.plan,
      message: leadData.message || null,
      status: leadData.status || 'جديد'
    }])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function getLeads(filters = {}, page = 1, limit = 50) {
  const client = await getSupabaseClient();
  let query = client.from('leads').select('*', { count: 'exact' });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }
  if (filters.agent_type) query = query.eq('agent_type', filters.agent_type);
  if (filters.plan) query = query.eq('plan', filters.plan);
  
  const from = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return { data: data || [], total: count || 0, page, limit };
}

async function updateLead(leadId, updates) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function deleteLead(leadId) {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('leads')
    .delete()
    .eq('id', leadId);
  
  if (error) throw error;
  return true;
}

// ============================================
// AGENTS OPERATIONS
// ============================================

async function createAgent(agentData) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('agents')
    .insert([{
      name: agentData.name,
      description: agentData.description,
      category: agentData.category,
      price: agentData.price,
      image_url: agentData.image_url || null,
      is_published: agentData.is_published || false,
      features: agentData.features || []
    }])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function getAgents(filters = {}) {
  const client = await getSupabaseClient();
  let query = client.from('agents').select('*');
  
  if (filters.published) query = query.eq('is_published', true);
  if (filters.category) query = query.eq('category', filters.category);
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data || [];
}

async function updateAgent(agentId, updates) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('agents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', agentId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function deleteAgent(agentId) {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('agents')
    .delete()
    .eq('id', agentId);
  
  if (error) throw error;
  return true;
}

// ============================================
// PLANS OPERATIONS
// ============================================

async function getPlans() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

async function createPlan(planData) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('plans')
    .insert([{
      name: planData.name,
      description: planData.description,
      price: planData.price,
      currency: planData.currency || 'SAR',
      billing_period: planData.billing_period || 'monthly',
      features: planData.features || [],
      is_active: planData.is_active !== false
    }])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function updatePlan(planId, updates) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

// ============================================
// ORDERS OPERATIONS
// ============================================

async function createOrder(orderData) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .insert([{
      user_id: orderData.user_id || null,
      lead_id: orderData.lead_id || null,
      plan_id: orderData.plan_id,
      agent_id: orderData.agent_id || null,
      amount: orderData.amount,
      currency: orderData.currency || 'SAR',
      status: orderData.status || 'pending',
      payment_method: orderData.payment_method || null,
      transaction_id: orderData.transaction_id || null
    }])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function getOrders(filters = {}, page = 1, limit = 50) {
  const client = await getSupabaseClient();
  let query = client.from('orders').select('*', { count: 'exact' });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  
  const from = (page - 1) * limit;
  query = query.order('order_date', { ascending: false }).range(from, from + limit - 1);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return { data: data || [], total: count || 0 };
}

async function updateOrder(orderId, updates) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

// ============================================
// NOTIFICATIONS OPERATIONS
// ============================================

async function createNotification(userId, notification) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .insert([{
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      action_url: notification.action_url || null
    }])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

async function getNotifications(userId, limit = 20) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

async function markNotificationAsRead(notificationId) {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  
  if (error) throw error;
  return true;
}

// ============================================
// ACTIVITY LOGS
// ============================================

async function logActivity(userId, action, resourceType, resourceId, oldValues = null, newValues = null) {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('activity_logs')
    .insert([{
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    }]);
  
  if (error) console.error('Failed to log activity:', error);
  return true;
}

async function getActivityLogs(filters = {}, limit = 100) {
  const client = await getSupabaseClient();
  let query = client.from('activity_logs').select('*');
  
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.resource_type) query = query.eq('resource_type', filters.resource_type);
  
  query = query.order('created_at', { ascending: false }).limit(limit);
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data || [];
}

// ============================================
// ANALYTICS
// ============================================

async function getAnalytics(date = null) {
  const client = await getSupabaseClient();
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await client
    .from('analytics')
    .select('*')
    .eq('date', targetDate)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || {};
}

async function getLeadStats() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .rpc('get_lead_stats');
  
  if (error) throw error;
  return data || {};
}

async function getOrderStats() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .rpc('get_order_stats');
  
  if (error) throw error;
  return data || {};
}

// ============================================
// STORAGE OPERATIONS
// ============================================

async function uploadFile(bucket, file, path) {
  const client = await getSupabaseClient();
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${path}/${fileName}`;
  
  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, file);
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = client.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return { path: filePath, publicUrl, fileName };
}

async function deleteFile(bucket, path) {
  const client = await getSupabaseClient();
  const { error } = await client.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
  return true;
}

// ============================================
// SETTINGS
// ============================================

async function getSetting(key) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value || null;
}

async function updateSetting(key, value) {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  
  if (error) throw error;
  return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    return 'unknown';
  }
}

// ============================================
// EXPORT
// ============================================

window.SupabaseService = {
  // Leads
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  
  // Agents
  createAgent,
  getAgents,
  updateAgent,
  deleteAgent,
  
  // Plans
  getPlans,
  createPlan,
  updatePlan,
  
  // Orders
  createOrder,
  getOrders,
  updateOrder,
  
  // Notifications
  createNotification,
  getNotifications,
  markNotificationAsRead,
  
  // Activity Logs
  logActivity,
  getActivityLogs,
  
  // Analytics
  getAnalytics,
  getLeadStats,
  getOrderStats,
  
  // Storage
  uploadFile,
  deleteFile,
  
  // Settings
  getSetting,
  updateSetting,
  
  // Client
  getSupabaseClient
};

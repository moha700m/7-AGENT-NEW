/* ====== Agent Store Support Dashboard Logic (SaaS Edition) ====== */
'use strict';

const $ = id => document.getElementById(id);
let currentAdmin = null;
let supabase = null;

// ============================================
// INITIALIZATION & AUTH
// ============================================

async function init() {
  try {
    // 1. Check Auth & Admin Status
    const adminData = await window.SupabaseAPI.getAdminSession();
    if (!adminData) {
      window.location.href = '../login.html';
      return;
    }
    
    currentAdmin = adminData.profile;
    supabase = await window.SupabaseAPI.initSupabase();
    
    // 2. UI Setup
    renderAdminInfo();
    setupNavigation();
    setupEventListeners();
    updateTime();
    setInterval(updateTime, 1000 * 60);

    // 3. Load Initial Data (Overview)
    await loadOverview();
    
    // 4. Show Content
    $('loading-overlay').classList.add('opacity-0');
    setTimeout(() => {
      $('loading-overlay').classList.add('hidden');
      $('content-area').classList.replace('opacity-0', 'opacity-100');
    }, 500);

  } catch (err) {
    console.error('Support Dashboard Init Error:', err);
    toast('⚠️ فشل تحميل لوحة الإدارة', 'error');
  }
}

function renderAdminInfo() {
  $('admin-name').textContent = currentAdmin.full_name || currentAdmin.email.split('@')[0];
  $('admin-role').textContent = currentAdmin.role;
  $('admin-avatar').textContent = (currentAdmin.full_name || currentAdmin.email).charAt(0).toUpperCase();
}

function updateTime() {
  const now = new Date();
  $('server-time').textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  const triggers = document.querySelectorAll('[data-tab-trigger]');
  
  const switchTab = async (tabId) => {
    // Update Sidebar
    links.forEach(l => {
      if (l.dataset.tab === tabId) l.classList.add('active');
      else l.classList.remove('active');
    });

    // Update Content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    $(`tab-${tabId}`).classList.remove('hidden');

    // Update Header
    const titles = {
      overview: ['الإحصائيات العامة', 'نظرة شاملة على أداء المنصة الآن'],
      users: ['إدارة المستخدمين', 'التحكم في حسابات المستخدمين وصلاحياتهم'],
      leads: ['إدارة الـ Leads', 'متابعة العملاء المحتملين وطلبات الاهتمام'],
      orders: ['إدارة المبيعات', 'متابعة الطلبات المكتملة والعمليات المالية'],
      transfers: ['التحويلات البنكية', 'مراجعة وقبول إيصالات التحويل البنكي'],
      agents: ['إدارة الوكلاء', 'إضافة وتعديل وكلاء الذكاء الاصطناعي'],
      subscriptions: ['الاشتراكات', 'متابعة الاشتراكات النشطة والمنتهية'],
      audit: ['سجل النشاط (Audit Logs)', 'تتبع النشاطات والعمليات الحساسة في النظام']
    };
    
    $('tab-title').textContent = titles[tabId][0];
    $('tab-desc').textContent = titles[tabId][1];

    // Load Tab Data
    await loadTabData(tabId);
  };

  links.forEach(link => {
    link.addEventListener('click', () => switchTab(link.dataset.tab));
  });

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => switchTab(trigger.dataset.tabTrigger));
  });
}

async function loadTabData(tabId) {
  try {
    switch (tabId) {
      case 'overview': await loadOverview(); break;
      case 'users': await loadUsers(); break;
      case 'leads': await loadLeads(); break;
      case 'orders': await loadOrders(); break;
      case 'transfers': await loadTransfers(); break;
      case 'agents': if (typeof loadAgents === 'function') await loadAgents(); break;
      case 'subscriptions': await loadSubscriptions(); break;
      case 'audit': await loadAuditLogs(); break;
    }
  } catch (err) {
    toast(`⚠️ فشل تحميل بيانات ${tabId}`, 'error');
  }
}

// ============================================
// DATA LOADING
// ============================================

async function loadOverview() {
  const { count: uCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: lCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  const { count: oCount, data: orders } = await supabase.from('orders').select('amount').eq('status', 'completed');
  
  $('stat-users').textContent = uCount || 0;
  $('stat-leads').textContent = lCount || 0;
  $('stat-orders').textContent = oCount || 0;
  
  const revenue = orders?.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0) || 0;
  $('stat-revenue').textContent = revenue.toLocaleString();

  // Recent Users
  const { data: recentUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
  $('recent-users-list').innerHTML = (recentUsers || []).map(u => `
    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-brand-500/20 transition">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-brand-500">
          ${(u.full_name || u.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <p class="text-sm font-bold">${u.full_name || 'بدون اسم'}</p>
          <p class="text-[10px] text-slate-400 font-mono">${u.email}</p>
        </div>
      </div>
      <span class="badge ${u.role === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-brand-500 text-white'}">${u.role}</span>
    </div>
  `).join('');

  // Recent Logs
  const { data: recentLogs } = await supabase.from('activity_logs').select('*, users(full_name)').order('created_at', { ascending: false }).limit(5);
  $('recent-logs-list').innerHTML = (recentLogs || []).map(log => `
    <div class="flex items-start gap-3 p-3 border-b border-slate-50 last:border-0">
      <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
        <i class="fa-solid fa-${getActivityIcon(log.action)}"></i>
      </div>
      <div>
        <p class="text-xs font-bold">${log.users?.full_name || 'نظام'} <span class="font-normal text-slate-500">${getActivityText(log.action)}</span> ${log.resource_type}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">${new Date(log.created_at).toLocaleString('ar-SA')}</p>
      </div>
    </div>
  `).join('');
}

async function loadUsers() {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  $('users-table-body').innerHTML = (data || []).map(u => `
    <tr>
      <td class="table-cell">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">${(u.full_name || u.email).charAt(0).toUpperCase()}</div>
          <div>
            <p class="font-bold">${u.full_name || '—'}</p>
            <p class="text-[10px] text-slate-400 font-mono">${u.email}</p>
          </div>
        </div>
      </td>
      <td class="table-cell"><span class="badge bg-slate-100 text-slate-600">${u.role}</span></td>
      <td class="table-cell">${u.company || '—'}</td>
      <td class="table-cell text-xs text-slate-400">${new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
      <td class="table-cell">
        <button onclick="editUser('${u.id}')" class="text-brand-500 hover:bg-brand-50 p-2 rounded-lg transition"><i class="fa-solid fa-pen-to-square"></i></button>
      </td>
    </tr>
  `).join('');
}

async function loadLeads() {
  const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  $('leads-table-body').innerHTML = (data || []).map(l => `
    <tr>
      <td class="table-cell">
        <p class="font-bold">${l.name}</p>
        <p class="text-[10px] text-slate-400">${l.company || '—'}</p>
      </td>
      <td class="table-cell font-mono text-xs" dir="ltr">${l.phone}</td>
      <td class="table-cell text-xs">${l.agent_type || '—'}</td>
      <td class="table-cell text-xs">${l.plan || '—'}</td>
      <td class="table-cell">
        <span class="badge ${getStatusBadgeClass(l.status)}">${l.status}</span>
      </td>
      <td class="table-cell">
        <button onclick="viewLead('${l.id}')" class="text-slate-400 hover:text-brand-500 transition"><i class="fa-solid fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}

async function loadTransfers() {
  const { data } = await supabase.from('bank_transfers').select('*, users(full_name, email)').order('created_at', { ascending: false });
  const pending = (data || []).filter(t => t.status === 'pending').length;
  $('pending-transfers-count').textContent = `${pending} بانتظار المراجعة`;
  
  $('transfers-table-body').innerHTML = (data || []).map(t => `
    <tr>
      <td class="table-cell">
        <p class="font-bold text-xs">${t.beneficiary_name}</p>
        <p class="text-[10px] text-slate-400">${t.users?.email || '—'}</p>
      </td>
      <td class="table-cell font-bold text-brand-600">${t.amount} ر.س</td>
      <td class="table-cell text-xs text-slate-400">${new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
      <td class="table-cell">
        <a href="${t.receipt_url}" target="_blank" class="text-brand-500 hover:underline text-xs font-bold"><i class="fa-solid fa-image ml-1"></i> عرض</a>
      </td>
      <td class="table-cell">
        <span class="badge ${t.status === 'pending' ? 'bg-amber-50 text-amber-600' : (t.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}">
          ${t.status === 'pending' ? 'معلق' : (t.status === 'approved' ? 'مقبول' : 'مرفوض')}
        </span>
      </td>
      <td class="table-cell">
        ${t.status === 'pending' ? `
          <div class="flex gap-2">
            <button onclick="approveTransfer('${t.id}')" class="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center" title="قبول"><i class="fa-solid fa-check"></i></button>
            <button onclick="rejectTransfer('${t.id}')" class="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center" title="رفض"><i class="fa-solid fa-xmark"></i></button>
          </div>
        ` : '—'}
      </td>
    </tr>
  `).join('');
}

async function loadAuditLogs() {
  const { data } = await supabase.from('activity_logs').select('*, users(full_name, email)').order('created_at', { ascending: false }).limit(100);
  const container = $('audit-logs-full');
  if (!container) return;
  container.innerHTML = (data || []).map(log => `
    <div class="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-50 shadow-sm hover:border-brand-500/10 transition">
      <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
        <i class="fa-solid fa-${getActivityIcon(log.action)}"></i>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-1">
          <p class="text-sm font-bold text-night-900">${log.users?.full_name || 'نظام'}</p>
          <span class="text-[10px] text-slate-400 font-mono">${new Date(log.created_at).toLocaleString('ar-SA')}</span>
        </div>
        <p class="text-xs text-slate-500">قام بـ <span class="font-bold text-slate-700">${getActivityText(log.action)}</span> ${log.resource_type} (ID: ${log.resource_id})</p>
      </div>
    </div>
  `).join('');
}

async function loadOrders() {
  const { data } = await supabase.from('orders').select('*, users(full_name, email)').order('order_date', { ascending: false });
  $('orders-table-body').innerHTML = (data || []).map(o => `
    <tr>
      <td class="table-cell font-mono text-xs">#${o.id}</td>
      <td class="table-cell">
        <p class="font-bold text-xs">${o.users?.full_name || '—'}</p>
      </td>
      <td class="table-cell font-bold text-brand-600">${o.total_amount} ر.س</td>
      <td class="table-cell text-xs text-slate-400">${new Date(o.order_date).toLocaleDateString('ar-SA')}</td>
      <td class="table-cell"><span class="badge bg-green-50 text-green-600">${o.status}</span></td>
      <td class="table-cell">
        <button class="text-slate-400 hover:text-brand-500"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </td>
    </tr>
  `).join('');
}

async function loadSubscriptions() {
  const { data } = await supabase.from('subscriptions').select('*, users(full_name, email), plans(name)').order('created_at', { ascending: false });
  $('subscriptions-table-body').innerHTML = (data || []).map(s => `
    <tr>
      <td class="table-cell">
        <p class="font-bold text-xs">${s.users?.full_name || '—'}</p>
      </td>
      <td class="table-cell text-xs font-bold">${s.plans?.name || '—'}</td>
      <td class="table-cell text-xs text-slate-400">${new Date(s.start_date).toLocaleDateString('ar-SA')}</td>
      <td class="table-cell text-xs text-slate-400">${new Date(s.end_date).toLocaleDateString('ar-SA')}</td>
      <td class="table-cell"><span class="badge ${s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">${s.status}</span></td>
      <td class="table-cell">
        <button class="text-slate-400 hover:text-brand-500"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// ACTIONS
// ============================================

window.approveTransfer = async (id) => {
  if (!confirm('هل أنت متأكد من قبول هذا التحويل؟ سيتم تفعيل الخدمة للمستخدم.')) return;
  try {
    const { error } = await supabase.from('bank_transfers').update({ 
      status: 'approved', 
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    if (error) throw error;
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: currentAdmin.id,
      action: 'approve',
      resource_type: 'bank_transfer',
      resource_id: id.toString(),
      description: `تم قبول التحويل البنكي رقم ${id}`
    });

    toast('✅ تم قبول التحويل وتحديث الحالة');
    loadTransfers();
    loadOverview();
  } catch (err) {
    toast('⚠️ فشل معالجة الطلب', 'error');
  }
};

window.rejectTransfer = async (id) => {
  const reason = prompt('سبب الرفض (اختياري):');
  if (reason === null) return;
  
  try {
    const { error } = await supabase.from('bank_transfers').update({ 
      status: 'rejected', 
      admin_notes: reason,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: currentAdmin.id,
      action: 'reject',
      resource_type: 'bank_transfer',
      resource_id: id.toString(),
      description: `تم رفض التحويل البنكي رقم ${id}. السبب: ${reason || 'لم يذكر'}`
    });

    toast('❌ تم رفض التحويل');
    loadTransfers();
  } catch (err) {
    toast('⚠️ فشل معالجة الطلب', 'error');
  }
};

// ============================================
// UTILS
// ============================================

function getActivityIcon(action) {
  const icons = { create: 'plus', update: 'pen', delete: 'trash', login: 'sign-in', logout: 'sign-out', approve: 'check-double', reject: 'xmark' };
  return icons[action] || 'circle';
}

function getActivityText(action) {
  const texts = { create: 'إضافة', update: 'تحديث', delete: 'حذف', login: 'تسجيل دخول', logout: 'تسجيل خروج', approve: 'قبول', reject: 'رفض' };
  return texts[action] || action;
}

function getStatusBadgeClass(status) {
  const classes = { 'جديد': 'bg-blue-50 text-blue-600', 'تم التواصل': 'bg-amber-50 text-amber-600', 'تم البيع': 'bg-green-50 text-green-600', 'ملغي': 'bg-red-50 text-red-600' };
  return classes[status] || 'bg-slate-50 text-slate-500';
}

function toast(msg, type = 'success') {
  alert(msg); // Simple alert for admin dashboard
}

function setupEventListeners() {
  $('refresh-btn').addEventListener('click', () => {
    const activeTab = document.querySelector('.sidebar-link.active').dataset.tab;
    loadTabData(activeTab);
    toast('🔄 تم تحديث البيانات');
  });

  $('logout-btn').addEventListener('click', async () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      await window.SupabaseAPI.signOut();
      window.location.href = '../index.html';
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);

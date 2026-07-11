/* ====== Dashboard JavaScript ====== */
'use strict';

const $ = id => document.getElementById(id);
let currentLeadsPage = 1;
let leadsPerPage = 10;
let allLeads = [];
let agentChart = null;
let planChart = null;

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.getAttribute('href').slice(1);
    
    // Hide all sections
    document.querySelectorAll('section[id$="-section"]').forEach(s => s.classList.add('hidden'));
    
    // Show target section
    const section = $(`${target}-section`);
    if (section) section.classList.remove('hidden');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active', 'bg-brand-500', 'text-white'));
    link.classList.add('active', 'bg-brand-500', 'text-white');
    
    // Load data for section
    if (target === 'leads') loadLeads();
    if (target === 'orders') loadOrders();
    if (target === 'agents') loadAgents();
    if (target === 'analytics') loadAnalytics();
  });
});

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

async function initDashboard() {
  try {
    await loadDashboardData();
  } catch (err) {
    toast('⚠️ فشل تحميل البيانات');
  }
}

async function loadDashboardData() {
  try {
    // Load leads
    const leadsResult = await window.SupabaseService.getLeads({}, 1, 1000);
    allLeads = leadsResult.data;
    
    // Update KPIs
    updateKPIs();
    
    // Update charts
    updateCharts();
    
    // Load recent activity
    await loadRecentActivity();
  } catch (err) {
    // Silent fail for production dashboard
  }
}

function updateKPIs() {
  const total = allLeads.length;
  const newLeads = allLeads.filter(l => l.status === 'جديد').length;
  const completed = allLeads.filter(l => l.status === 'تم البيع').length;
  
  if ($('kpi-leads')) $('kpi-leads').textContent = total;
  if ($('kpi-new-leads')) $('kpi-new-leads').textContent = newLeads;
  if ($('kpi-completed')) $('kpi-completed').textContent = completed;
  if ($('kpi-revenue')) $('kpi-revenue').textContent = '0 ر.س';
}

function updateCharts() {
  const brandColors = ['#10b981', '#0d9668', '#d4af37', '#6366f1', '#f59e0b', '#94a3b8'];
  
  // Agent Type Distribution
  const agents = {};
  allLeads.forEach(l => {
    const type = l.agent_type || 'غير محدد';
    agents[type] = (agents[type] || 0) + 1;
  });
  
  const agentsChartEl = $('agents-chart');
  if (agentsChartEl && typeof Chart !== 'undefined') {
    if (agentChart) agentChart.destroy();
    agentChart = new Chart(agentsChartEl, {
      type: 'doughnut',
      data: {
        labels: Object.keys(agents),
        datasets: [{
          data: Object.values(agents),
          backgroundColor: brandColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'IBM Plex Sans Arabic' }, padding: 14 }
          }
        }
      }
    });
  }
  
  // Plan Distribution
  const plans = {};
  allLeads.forEach(l => {
    const plan = l.plan || 'غير محدد';
    plans[plan] = (plans[plan] || 0) + 1;
  });
  
  const plansChartEl = $('plans-chart');
  if (plansChartEl && typeof Chart !== 'undefined') {
    if (planChart) planChart.destroy();
    planChart = new Chart(plansChartEl, {
      type: 'bar',
      data: {
        labels: Object.keys(plans),
        datasets: [{
          label: 'عدد الطلبات',
          data: Object.values(plans),
          backgroundColor: '#10b981',
          borderRadius: 8,
          maxBarThickness: 60
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'IBM Plex Sans Arabic' } }
          },
          x: { ticks: { font: { family: 'IBM Plex Sans Arabic' } } }
        }
      }
    });
  }
}

async function loadRecentActivity() {
  try {
    const logs = await window.SupabaseService.getActivityLogs({}, 10);
    const container = $('recent-activity');
    if (!container) return;
    
    if (logs.length === 0) {
      container.innerHTML = '<p class="text-slate-500 text-center py-8">لا توجد أنشطة حديثة</p>';
      return;
    }
    
    container.innerHTML = logs.map(log => `
      <div class="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
            <i class="fa-solid fa-${getActivityIcon(log.action)}"></i>
          </div>
          <div>
            <p class="font-bold text-sm">${getActivityLabel(log.action, log.resource_type)}</p>
            <p class="text-xs text-slate-500">${new Date(log.created_at).toLocaleString('ar-SA')}</p>
          </div>
        </div>
        <span class="text-xs bg-slate-100 px-3 py-1 rounded-full">${log.resource_type}</span>
      </div>
    `).join('');
  } catch (err) {
    // Silent fail
  }
}

// ============================================
// LEADS MANAGEMENT
// ============================================

async function loadLeads() {
  try {
    const result = await window.SupabaseService.getLeads({}, currentLeadsPage, leadsPerPage);
    allLeads = result.data;
    
    renderLeadsTable();
    updateLeadsPagination(result.total);
  } catch (err) {
    toast('⚠️ فشل تحميل العملاء');
  }
}

function renderLeadsTable() {
  const tbody = $('leads-tbody');
  if (!tbody) return;
  
  if (allLeads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">لا توجد عملاء</td></tr>';
    return;
  }
  
  tbody.innerHTML = allLeads.map(lead => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="py-4 px-4">
        <p class="font-bold">${lead.name}</p>
        <p class="text-xs text-slate-500">${lead.company || '-'}</p>
      </td>
      <td class="py-4 px-4 font-mono text-sm" dir="ltr">${lead.phone}</td>
      <td class="py-4 px-4">${lead.agent_type || '-'}</td>
      <td class="py-4 px-4">${lead.plan || '-'}</td>
      <td class="py-4 px-4">
        <select class="lead-status-select px-3 py-1 border border-slate-200 rounded-lg text-sm" data-id="${lead.id}">
          <option ${lead.status === 'جديد' ? 'selected' : ''}>جديد</option>
          <option ${lead.status === 'تم التواصل' ? 'selected' : ''}>تم التواصل</option>
          <option ${lead.status === 'تم البيع' ? 'selected' : ''}>تم البيع</option>
          <option ${lead.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
        </select>
      </td>
      <td class="py-4 px-4">
        <button class="text-brand-500 hover:text-brand-600 transition" title="تعديل">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="text-red-500 hover:text-red-600 transition ml-3" title="حذف" data-delete="${lead.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Attach event listeners
  document.querySelectorAll('.lead-status-select').forEach(select => {
    select.addEventListener('change', async e => {
      const leadId = e.target.dataset.id;
      const newStatus = e.target.value;
      try {
        await window.SupabaseService.updateLead(leadId, { status: newStatus });
        toast('✅ تم تحديث الحالة');
      } catch (err) {
        toast('⚠️ فشل التحديث');
      }
    });
  });
  
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async e => {
      if (confirm('متأكد من حذف هذا العميل؟')) {
        try {
          await window.SupabaseService.deleteLead(e.target.closest('[data-delete]').dataset.delete);
          toast('✅ تم حذف العميل');
          loadLeads();
        } catch (err) {
          toast('⚠️ فشل الحذف');
        }
      }
    });
  });
}

function updateLeadsPagination(total) {
  const totalPages = Math.ceil(total / leadsPerPage);
  if ($('leads-count')) $('leads-count').textContent = `${total} عميل`;
  if ($('leads-page')) $('leads-page').textContent = `${currentLeadsPage} / ${totalPages}`;
  if ($('leads-prev')) $('leads-prev').disabled = currentLeadsPage <= 1;
  if ($('leads-next')) $('leads-next').disabled = currentLeadsPage >= totalPages;
}

$('leads-prev')?.addEventListener('click', () => {
  if (currentLeadsPage > 1) {
    currentLeadsPage--;
    loadLeads();
  }
});

$('leads-next')?.addEventListener('click', () => {
  currentLeadsPage++;
  loadLeads();
});

// ============================================
// ORDERS MANAGEMENT
// ============================================

async function loadOrders() {
  try {
    await window.SupabaseService.getOrders({}, 1, 50);
  } catch (err) {
    // Silent fail
  }
}

// ============================================
// AGENTS MANAGEMENT
// ============================================

async function loadAgents() {
  try {
    await window.SupabaseService.getAgents({});
  } catch (err) {
    // Silent fail
  }
}

// ============================================
// ANALYTICS
// ============================================

async function loadAnalytics() {
  try {
    await window.SupabaseService.getAnalytics();
  } catch (err) {
    // Silent fail
  }
}

// ============================================
// UTILITIES
// ============================================

function getActivityIcon(action) {
  const icons = {
    'create': 'plus',
    'update': 'pen',
    'delete': 'trash',
    'login': 'sign-in',
    'logout': 'sign-out'
  };
  return icons[action] || 'circle';
}

function getActivityLabel(action, resourceType) {
  const labels = {
    'create': `تم إضافة ${resourceType}`,
    'update': `تم تحديث ${resourceType}`,
    'delete': `تم حذف ${resourceType}`,
    'login': 'تسجيل دخول',
    'logout': 'تسجيل خروج'
  };
  return labels[`${action}`] || action;
}

function toast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================

$('refresh-btn')?.addEventListener('click', () => {
  loadDashboardData();
  toast('✅ تم التحديث');
});

$('logout-btn')?.addEventListener('click', () => {
  if (confirm('متأكد من تسجيل الخروج؟')) {
    sessionStorage.clear();
    location.href = '/';
  }
});

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', initDashboard);

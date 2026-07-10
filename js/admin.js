/* ====== Agent Store — سكربت لوحة التحكم ====== */
'use strict';

// ---------------- الإعدادات ----------------
const ADMIN_PIN = '2464';               // ⚠️ حماية واجهة فقط (موقع ثابت — ليست حماية حقيقية)
const PAGE_SIZE = 10;
const TABLE = 'tables/leads';

// حالة التطبيق
let allLeads = [];        // كل الطلبات (للإحصائيات والرسوم)
let filtered = [];        // بعد البحث والفلترة
let currentPage = 1;
let agentChart = null;
let planChart = null;

// عناصر DOM
const $ = id => document.getElementById(id);
const loginScreen = $('login-screen');
const dashboard = $('dashboard');

// ---------------- الدخول ----------------
function isLoggedIn() {
  return sessionStorage.getItem('as_admin') === '1';
}
function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadLeads();
}
$('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const pin = $('pin-input').value.trim();
  if (pin === ADMIN_PIN) {
    sessionStorage.setItem('as_admin', '1');
    showDashboard();
  } else {
    $('pin-error').classList.remove('hidden');
    $('pin-input').value = '';
    $('pin-input').focus();
  }
});
$('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('as_admin');
  location.reload();
});
if (isLoggedIn()) showDashboard();

// ---------------- جلب البيانات ----------------
async function loadLeads() {
  $('loading-state').classList.remove('hidden');
  $('empty-state').classList.add('hidden');
  try {
    // نجلب كل الصفحات (حد أقصى معقول 10 صفحات × 100)
    let page = 1, rows = [], total = Infinity;
    while (rows.length < total && page <= 10) {
      const res = await fetch(`${TABLE}?page=${page}&limit=100`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      total = json.total ?? 0;
      rows = rows.concat(json.data || []);
      if (!json.data || json.data.length === 0) break;
      page++;
    }
    // استبعاد المحذوف + الأحدث أولاً
    allLeads = rows
      .filter(r => !r.deleted)
      .sort((a, b) => (b.created_at || b.updated_at || 0) - (a.created_at || a.updated_at || 0));
    updateKPIs();
    updateCharts();
    applyFilters();
  } catch (err) {
    console.error('فشل تحميل الطلبات:', err);
    toast('⚠️ تعذر تحميل البيانات — تأكد من فتح الصفحة عبر المعاينة/النشر وليس كملف محلي');
  } finally {
    $('loading-state').classList.add('hidden');
  }
}
$('refresh-btn').addEventListener('click', () => { loadLeads(); toast('تم تحديث البيانات ✓'); });

// ---------------- الإحصائيات ----------------
function updateKPIs() {
  const count = s => allLeads.filter(l => (l.status || 'جديد') === s).length;
  $('kpi-total').textContent = allLeads.length;
  $('kpi-new').textContent = count('جديد');
  $('kpi-contacted').textContent = count('تم التواصل');
  $('kpi-won').textContent = count('تم البيع');
}

// ---------------- الرسوم البيانية ----------------
function groupBy(field, fallback) {
  const map = {};
  allLeads.forEach(l => {
    const key = l[field] || fallback;
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}
function updateCharts() {
  const brandColors = ['#10b981', '#0d9668', '#d4af37', '#6366f1', '#f59e0b', '#94a3b8'];

  const agents = groupBy('agent_type', 'غير محدد');
  const plans = groupBy('plan', 'غير محدد');

  if (agentChart) agentChart.destroy();
  agentChart = new Chart($('agent-chart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(agents),
      datasets: [{ data: Object.values(agents), backgroundColor: brandColors, borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'IBM Plex Sans Arabic' }, padding: 14 } } }
    }
  });

  if (planChart) planChart.destroy();
  planChart = new Chart($('plan-chart'), {
    type: 'bar',
    data: {
      labels: Object.keys(plans),
      datasets: [{ label: 'عدد الطلبات', data: Object.values(plans), backgroundColor: '#10b981', borderRadius: 8, maxBarThickness: 60 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'IBM Plex Sans Arabic' } } },
        x: { ticks: { font: { family: 'IBM Plex Sans Arabic' } } }
      }
    }
  });
}

// ---------------- البحث والفلترة ----------------
function applyFilters() {
  const q = $('search-input').value.trim().toLowerCase();
  const st = $('status-filter').value;
  filtered = allLeads.filter(l => {
    const matchQ = !q ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q);
    const matchS = !st || (l.status || 'جديد') === st;
    return matchQ && matchS;
  });
  currentPage = 1;
  renderTable();
}
$('search-input').addEventListener('input', applyFilters);
$('status-filter').addEventListener('change', applyFilters);

// ---------------- عرض الجدول ----------------
const STATUS_CLASS = { 'جديد': 'status-جديد', 'تم التواصل': 'status-تواصل', 'تم البيع': 'status-بيع', 'ملغي': 'status-ملغي' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderTable() {
  const tbody = $('leads-tbody');
  tbody.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  $('empty-state').classList.toggle('hidden', filtered.length > 0);
  $('table-count').textContent = `${filtered.length} طلب`;
  $('page-info').textContent = `${currentPage} / ${totalPages}`;
  $('prev-page').disabled = currentPage <= 1;
  $('next-page').disabled = currentPage >= totalPages;

  pageRows.forEach(lead => {
    const status = lead.status || 'جديد';
    const date = lead.created_at
      ? new Date(+lead.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '—';
    const phoneIntl = normalizePhone(lead.phone);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-td">
        <p class="font-bold text-slate-800">${esc(lead.name) || '—'}</p>
        <p class="text-xs text-slate-400">${esc(lead.company) || ''}</p>
      </td>
      <td class="table-td"><span dir="ltr" class="font-mono text-xs">${esc(lead.phone) || '—'}</span></td>
      <td class="table-td whitespace-nowrap">${esc(lead.agent_type) || '—'}</td>
      <td class="table-td">${esc(lead.plan) || '—'}</td>
      <td class="table-td max-w-[180px]"><p class="text-xs text-slate-500 truncate" title="${esc(lead.message)}">${esc(lead.message) || '—'}</p></td>
      <td class="table-td text-xs text-slate-500 whitespace-nowrap">${date}</td>
      <td class="table-td">
        <select class="status-select ${STATUS_CLASS[status] || 'status-جديد'}" data-id="${esc(lead.id)}" aria-label="تغيير الحالة">
          ${['جديد', 'تم التواصل', 'تم البيع', 'ملغي'].map(s => `<option ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="table-td whitespace-nowrap">
        ${phoneIntl ? `<a class="action-btn action-wa" href="https://wa.me/${phoneIntl}" target="_blank" rel="noopener" title="مراسلة واتساب" aria-label="مراسلة واتساب"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
        <button class="action-btn action-del" data-del="${esc(lead.id)}" title="حذف الطلب" aria-label="حذف الطلب"><i class="fa-solid fa-trash-can"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// تحويل رقم سعودي إلى صيغة دولية لواتساب
function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/[\s\-()]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('05')) p = '966' + p.slice(1);
  else if (p.startsWith('5') && p.length === 9) p = '966' + p;
  return /^\d{10,15}$/.test(p) ? p : '';
}

// ---------------- تغيير الحالة + الحذف (تفويض أحداث) ----------------
$('leads-tbody').addEventListener('change', async e => {
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  const id = sel.dataset.id;
  const newStatus = sel.value;
  sel.disabled = true;
  try {
    const res = await fetch(`${TABLE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const lead = allLeads.find(l => l.id === id);
    if (lead) lead.status = newStatus;
    sel.className = `status-select ${STATUS_CLASS[newStatus] || 'status-جديد'}`;
    updateKPIs();
    toast(`تم تحديث الحالة إلى "${newStatus}" ✓`);
  } catch (err) {
    console.error(err);
    toast('⚠️ فشل تحديث الحالة');
  } finally {
    sel.disabled = false;
  }
});

$('leads-tbody').addEventListener('click', async e => {
  const btn = e.target.closest('[data-del]');
  if (!btn) return;
  if (!confirm('متأكد من حذف هذا الطلب؟ لا يمكن التراجع.')) return;
  const id = btn.dataset.del;
  btn.disabled = true;
  try {
    const res = await fetch(`${TABLE}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('HTTP ' + res.status);
    allLeads = allLeads.filter(l => l.id !== id);
    updateKPIs();
    updateCharts();
    applyFilters();
    toast('تم حذف الطلب 🗑️');
  } catch (err) {
    console.error(err);
    toast('⚠️ فشل حذف الطلب');
    btn.disabled = false;
  }
});

// ---------------- ترقيم الصفحات ----------------
$('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
$('next-page').addEventListener('click', () => {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage < totalPages) { currentPage++; renderTable(); }
});

// ---------------- تصدير CSV ----------------
$('export-btn').addEventListener('click', () => {
  if (!filtered.length) { toast('لا توجد بيانات للتصدير'); return; }
  const headers = ['الاسم', 'النشاط', 'الجوال', 'نوع العميل', 'الباقة', 'التفاصيل', 'الحالة', 'التاريخ'];
  const csvRow = arr => arr.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  const lines = [csvRow(headers)];
  filtered.forEach(l => {
    lines.push(csvRow([
      l.name, l.company, l.phone, l.agent_type, l.plan, l.message,
      l.status || 'جديد',
      l.created_at ? new Date(+l.created_at).toLocaleString('ar-SA') : ''
    ]));
  });
  // BOM حتى يفتح عربي صحيح في Excel
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `agent-store-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('تم تصدير الملف 📄');
});

// ---------------- Toast ----------------
let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

/* Dashboard-only Supabase data adapters. Auth and shared configuration stay untouched. */
'use strict';

window.DashboardData = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const empty = message => `<div class="premium-empty"><span><i class="fa-regular fa-folder-open"></i></span><h3>${esc(message)}</h3><p>ستظهر البيانات هنا تلقائياً عند إضافتها.</p></div>`;
  const statusAr = status => ({
    active: 'نشط', online: 'متصل', working: 'يعمل', thinking: 'يفكر', offline: 'غير متصل',
    open: 'مفتوحة', in_progress: 'قيد المعالجة', waiting_customer: 'بانتظار العميل', resolved: 'محلولة', closed: 'مغلقة',
    pending: 'قيد المراجعة', approved: 'مقبولة', rejected: 'مرفوضة'
  }[status] || status || '—');

  async function client() { return window.SupabaseAPI.initSupabase(); }
  async function safe(query, fallback = []) {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data || fallback;
    } catch (error) {
      console.warn('Dashboard data unavailable:', error.message);
      return fallback;
    }
  }

  function renderCustomers(section, rows) {
    if (!section) return;
    const stats = section.querySelectorAll('.mini-stats strong');
    if (stats[0]) stats[0].textContent = rows.length.toLocaleString('ar-SA');
    if (stats[1]) stats[1].textContent = rows.filter(row => row.status === 'active').length.toLocaleString('ar-SA');
    const monthAgo = Date.now() - 30 * 86400000;
    if (stats[2]) stats[2].textContent = rows.filter(row => new Date(row.created_at).getTime() >= monthAgo).length.toLocaleString('ar-SA');
    const list = section.querySelector('.premium-list');
    if (!list) return;
    const head = list.querySelector('.list-head')?.outerHTML || '';
    list.innerHTML = head + (rows.slice(0, 8).map(row => `
      <div class="person-row"><span>${esc((row.full_name || row.email || 'ع').charAt(0))}</span>
      <div><strong>${esc(row.full_name || 'عميل')}</strong><small>${esc(row.email)}</small></div>
      <em>${esc(row.company || 'بدون شركة')}</em><b>${statusAr(row.status)}</b></div>`).join('') || empty('لا يوجد عملاء بعد'));
  }

  function renderAgents(container, rows) {
    if (!container) return;
    container.innerHTML = rows.map(row => `
      <article><i class="fa-solid fa-robot"></i><div><h3>${esc(row.name)}</h3><p>${esc(row.role || row.role_en || 'موظف ذكاء اصطناعي')}</p></div>
      <span class="${row.status === 'offline' ? 'paused' : ''}">${statusAr(row.status)}</span>
      <footer><b>${Number(row.success_rate || 0).toLocaleString('ar-SA')}%</b><small>${Number(row.conversations_count || 0).toLocaleString('ar-SA')} محادثة</small></footer></article>`).join('') || empty('لا يوجد موظفون نشطون');
  }

  async function loadAdmin() {
    const db = await client();
    const [users, agents, transfers, subscriptions, tickets] = await Promise.all([
      safe(db.from('users').select('id,email,full_name,company,status,created_at').eq('role', 'customer').order('created_at', { ascending: false })),
      safe(db.from('client_agents').select('*').order('created_at', { ascending: false })),
      safe(db.from('bank_transfers').select('amount,status,created_at').order('created_at', { ascending: false })),
      safe(db.from('subscriptions').select('id,status,created_at').order('created_at', { ascending: false })),
      safe(db.from('support_tickets').select('id,subject,priority,status,created_at,users(full_name)').order('created_at', { ascending: false }))
    ]);
    renderCustomers(document.querySelector('[data-admin-page="customers"]'), users);
    renderAgents(document.querySelector('[data-admin-page="employees"] .agent-grid'), agents);

    const paymentPage = document.querySelector('[data-admin-page="payments"]');
    const total = transfers.filter(row => row.status === 'approved').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const revenue = paymentPage?.querySelector('.finance-card strong');
    if (revenue) revenue.innerHTML = `${total.toLocaleString('ar-SA')} <small>ر.س</small>`;

    const subStats = document.querySelectorAll('[data-admin-page="subscriptions"] .mini-stats strong');
    if (subStats[0]) subStats[0].textContent = subscriptions.filter(row => row.status === 'active').length.toLocaleString('ar-SA');

    const ticketList = document.querySelector('[data-admin-page="tickets"] .premium-list');
    if (ticketList) ticketList.innerHTML = tickets.slice(0, 10).map(row => `
      <div class="person-row"><span class="ticket ${row.priority === 'high' || row.priority === 'urgent' ? 'high' : ''}">!</span>
      <div><strong>${esc(row.subject)}</strong><small>#${esc(String(row.id).slice(0, 8))} · ${esc(row.users?.full_name || 'عميل')}</small></div>
      <em>${esc(row.priority)}</em><b>${statusAr(row.status)}</b></div>`).join('') || empty('لا توجد تذاكر دعم');
  }

  function renderMarketplace(rows) {
    const cards = rows.map(row => `
      <article><div class="agent-cover"><i class="fa-solid fa-robot"></i></div><span>${esc(row.category || 'ذكاء اصطناعي')}</span>
      <h3>${esc(row.name)}</h3><p>${esc(row.description || 'موظف ذكي جاهز للانضمام إلى فريقك.')}</p>
      <footer><strong>${Number(row.price || 0).toLocaleString('ar-SA')} ر.س / شهر</strong><button>عرض التفاصيل</button></footer></article>`).join('');
    const market = document.querySelector('#tab-marketplace .market-grid');
    if (market) market.innerHTML = cards || empty('لا توجد عناصر منشورة في المتجر');
    const recommended = document.querySelector('.recommend-grid');
    if (recommended) recommended.innerHTML = rows.slice(0, 3).map(row => `
      <article><i class="fa-solid fa-robot"></i><h4>${esc(row.name)}</h4><p>${esc(row.description || 'موظف ذكي لفريقك.')}</p>
      <div><span>${Number(row.sales || 0).toLocaleString('ar-SA')} عملية</span><b>جرّبه الآن</b></div></article>`).join('') || empty('لا توجد توصيات حالياً');
  }

  async function loadCustomer(userId) {
    const db = await client();
    const [catalog, agents, conversations, tickets, settings] = await Promise.all([
      safe(db.from('agents').select('id,name,description,category,price,sales').eq('is_published', true).order('sales', { ascending: false })),
      safe(db.from('client_agents').select('*').eq('user_id', userId).order('created_at', { ascending: false })),
      safe(db.from('conversations').select('*').eq('user_id', userId).order('last_message_at', { ascending: false })),
      safe(db.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false })),
      safe(db.from('user_settings').select('*').eq('user_id', userId).maybeSingle(), null)
    ]);
    renderMarketplace(catalog);

    const agentsCard = document.querySelector('#tab-agents .card');
    if (agentsCard && agents.length) agentsCard.innerHTML = `<div class="agent-grid">${agents.map(row => `<article><i class="fa-solid fa-robot"></i><div><h3>${esc(row.name)}</h3><p>${esc(row.role || 'موظف ذكي')}</p></div><span>${statusAr(row.status)}</span><footer><b>${Number(row.success_rate || 0)}%</b><small>${Number(row.conversations_count || 0)} محادثة</small></footer></article>`).join('')}</div>`;

    const messages = document.querySelector('#tab-messages .card');
    if (messages) messages.innerHTML = conversations.map(row => `<div class="person-row"><span>${esc((row.customer_name || 'م').charAt(0))}</span><div><strong>${esc(row.customer_name || 'محادثة')}</strong><small>${esc(row.preview || 'لا توجد رسالة')}</small></div><em>${esc(row.channel || '')}</em><b>${Number(row.unread_count || 0)}</b></div>`).join('') || empty('لا توجد محادثات بعد');

    const support = document.querySelector('#tab-support .card');
    if (support && tickets.length) support.innerHTML = tickets.map(row => `<div class="person-row"><span class="ticket">؟</span><div><strong>${esc(row.subject)}</strong><small>${new Date(row.created_at).toLocaleDateString('ar-SA')}</small></div><em>${esc(row.priority)}</em><b>${statusAr(row.status)}</b></div>`).join('');

    if (settings) {
      const switches = document.querySelectorAll('#tab-settings .switch input');
      if (switches[0]) switches[0].checked = settings.activity_notifications;
      if (switches[1]) switches[1].checked = settings.theme === 'dark';
    }
  }

  return { loadAdmin, loadCustomer };
})();

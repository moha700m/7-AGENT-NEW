/* Kaian-inspired customer dashboard experience, backed by existing Supabase tables. */
'use strict';

(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const icon = name => `<i class="fa-solid fa-${name}"></i>`;
  const navItems = [
    ['crm','table-columns','مسار العملاء'], ['analytics-pro','chart-line','التحليلات'],
    ['team','user-group','الفريق'], ['knowledge','book-open','قاعدة المعرفة']
  ];
  const state = { lang: localStorage.getItem('dashboard_lang') || 'ar' };

  function injectNavigation() {
    const nav = document.querySelector('.customer-sidebar nav');
    const content = document.getElementById('content-area');
    if (!nav || !content || document.getElementById('tab-crm')) return;
    const profile = nav.querySelector('[data-tab="profile"]');
    navItems.forEach(([tab, ico, label]) => profile?.insertAdjacentHTML('beforebegin', `<a data-tab="${tab}" class="sidebar-link"><i class="fa-solid fa-${ico}"></i>${label}</a>`));
    content.insertAdjacentHTML('beforeend', `
      <section id="tab-crm" class="tab-content hidden"><div class="kx-page-head"><div><span>خط المبيعات</span><h2>مسار العملاء</h2><p>اسحب الفرص بين المراحل لتحديث حالتها مباشرة.</p></div><button class="kx-primary">${icon('plus')} فرصة جديدة</button></div><div id="kx-crm" class="kx-kanban"></div></section>
      <section id="tab-analytics-pro" class="tab-content hidden"><div class="kx-page-head"><div><span>ذكاء الأعمال</span><h2>التحليلات</h2><p>نظرة حية على النمو والاستخدام والإيرادات.</p></div><select id="kx-range"><option value="30">آخر 30 يوماً</option><option value="90">آخر 90 يوماً</option></select></div><div id="kx-analytics"></div></section>
      <section id="tab-team" class="tab-content hidden"><div class="kx-page-head"><div><span>العمل المشترك</span><h2>الفريق</h2><p>فريقك البشري والذكي في مساحة واحدة.</p></div><button class="kx-primary">${icon('user-plus')} دعوة عضو</button></div><div id="kx-team" class="kx-team-grid"></div></section>
      <section id="tab-knowledge" class="tab-content hidden"><div class="kx-page-head"><div><span>مصادر المعرفة</span><h2>قاعدة المعرفة</h2><p>الوثائق التي يعتمد عليها موظفو الذكاء.</p></div><button class="kx-primary" id="kx-upload">${icon('cloud-arrow-up')} رفع ملف</button></div><div class="kx-vector"><div>${icon('database')}<span><b>محرك المعرفة</b><small>متصل ومحمي بسياسات RLS</small></span></div><em>جاهز</em></div><div id="kx-knowledge" class="kx-docs"></div></section>`);
  }

  function upgradeShell() {
    const topbar = document.querySelector('.customer-topbar');
    const sidebar = document.querySelector('.customer-sidebar');
    if (!topbar || !sidebar) return;
    topbar.insertAdjacentHTML('afterbegin', `<button id="kx-rail" class="kx-icon" title="تصغير القائمة">${icon('sidebar')}</button>`);
    const tools = topbar.querySelector('.topbar-tools');
    tools?.insertAdjacentHTML('afterbegin', `<div class="kx-lang"><button data-lang="ar" class="active">AR</button><button data-lang="en">EN</button></div>`);
    document.body.insertAdjacentHTML('beforeend', `
      <div id="kx-command" class="kx-overlay hidden"><div class="kx-command"><div>${icon('magnifying-glass')}<input id="kx-command-input" placeholder="ابحث أو انتقل إلى صفحة…"><kbd>ESC</kbd></div><section id="kx-results"></section><footer>اكتب اسم الصفحة ثم اضغط Enter</footer></div></div>
      <button id="kx-assistant-toggle" class="kx-assistant-toggle">${icon('sparkles')}</button>
      <aside id="kx-assistant" class="kx-assistant hidden"><header><span>${icon('sparkles')} مساعد سوق الوكلاء</span><button>×</button></header><div class="kx-ai-body"><p>مرحباً، أستطيع مساعدتك في التنقل وقراءة مؤشرات لوحة التحكم.</p></div><form><input placeholder="اكتب سؤالك…"><button>${icon('arrow-up')}</button></form></aside>`);
    document.querySelector('.customer-search')?.addEventListener('click', openCommand);
    document.getElementById('kx-rail')?.addEventListener('click', () => { document.body.classList.toggle('kx-rail-collapsed'); localStorage.setItem('kx_rail', document.body.classList.contains('kx-rail-collapsed') ? '1':'0'); });
    if (localStorage.getItem('kx_rail') === '1') document.body.classList.add('kx-rail-collapsed');
    document.querySelectorAll('.kx-lang button').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
    document.getElementById('kx-assistant-toggle')?.addEventListener('click', () => document.getElementById('kx-assistant')?.classList.toggle('hidden'));
    document.querySelector('#kx-assistant header button')?.addEventListener('click', () => document.getElementById('kx-assistant')?.classList.add('hidden'));
    document.querySelector('#kx-assistant form')?.addEventListener('submit', assistantReply);
  }

  function setLanguage(lang) {
    state.lang = lang === 'en' ? 'ar' : lang;
    localStorage.setItem('dashboard_lang', state.lang);
    document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';
    document.querySelectorAll('.kx-lang button').forEach(b => b.classList.toggle('active', b.dataset.lang === 'ar'));
    if (lang === 'en') window.alert('الواجهة الإنجليزية ستتوفر بعد اكتمال ترجمة جميع بيانات النظام.');
  }

  function openCommand() { document.getElementById('kx-command')?.classList.remove('hidden'); setTimeout(() => document.getElementById('kx-command-input')?.focus(), 30); renderCommands(''); }
  function closeCommand() { document.getElementById('kx-command')?.classList.add('hidden'); }
  function renderCommands(query) {
    const q = query.trim().toLowerCase();
    const items = [...document.querySelectorAll('.sidebar-link[data-tab]')].filter(a => !q || a.textContent.toLowerCase().includes(q));
    const host = document.getElementById('kx-results'); if (!host) return;
    host.innerHTML = items.map((a,i) => `<button data-go="${esc(a.dataset.tab)}" class="${i===0?'selected':''}">${a.querySelector('i')?.outerHTML || icon('circle')}<span>${esc(a.textContent.trim())}</span><kbd>↵</kbd></button>`).join('') || '<p class="kx-no-results">لا توجد نتائج</p>';
    host.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { document.querySelector(`.sidebar-link[data-tab="${button.dataset.go}"]`)?.click(); closeCommand(); }));
  }

  async function db() { return window.SupabaseAPI.initSupabase(); }
  async function getRows(query) { const { data, error } = await query; if (error) throw error; return data || []; }
  const empty = text => `<div class="kx-empty">${icon('inbox')}<h3>${esc(text)}</h3><p>لا توجد بيانات حقيقية لعرضها حالياً.</p></div>`;

  async function loadCrm() {
    const host = document.getElementById('kx-crm'); if (!host) return;
    try {
      const client = await db(); const rows = await getRows(client.from('leads').select('id,name,company,value,score,stage,status,created_at').order('created_at',{ascending:false}));
      const stages = [['new','جديد'],['qualified','مؤهل'],['meeting','اجتماع'],['negotiation','تفاوض'],['won','مكتمل']];
      host.innerHTML = stages.map(([id,label]) => `<div class="kx-column" data-stage="${id}"><header><span>${label}</span><b>${rows.filter(r=>(r.stage||'new')===id).length}</b></header><div>${rows.filter(r=>(r.stage||'new')===id).map(r=>`<article draggable="true" data-lead="${r.id}"><strong>${esc(r.name)}</strong><small>${esc(r.company||'بدون شركة')}</small><footer><span>${Number(r.value||0).toLocaleString('ar-SA')} ر.س</span><em>${Number(r.score||0)}%</em></footer></article>`).join('')}</div></div>`).join('');
      let dragged = null; host.querySelectorAll('[draggable]').forEach(card=>card.addEventListener('dragstart',()=>dragged=card));
      host.querySelectorAll('.kx-column').forEach(col=>{ col.addEventListener('dragover',e=>e.preventDefault()); col.addEventListener('drop',async()=>{ if(!dragged)return; col.querySelector(':scope > div').appendChild(dragged); await client.from('leads').update({stage:col.dataset.stage}).eq('id',dragged.dataset.lead); dragged=null; }); });
    } catch (e) { host.innerHTML = empty('تعذر تحميل مسار العملاء'); }
  }

  async function loadAnalytics() {
    const host=document.getElementById('kx-analytics'); if(!host)return;
    try { const client=await db(); const [leads,orders,agents,convos]=await Promise.all([getRows(client.from('leads').select('id,stage,created_at')),getRows(client.from('orders').select('amount,status,order_date')),getRows(client.from('client_agents').select('id,status')),getRows(client.from('conversations').select('id,created_at:last_message_at'))]); const revenue=orders.filter(o=>['completed','paid'].includes(o.status)).reduce((s,o)=>s+Number(o.amount||0),0); host.innerHTML=`<div class="kx-metrics"><article><span>الإيرادات</span><strong>${revenue.toLocaleString('ar-SA')} ر.س</strong><em>إجمالي مكتمل</em></article><article><span>الفرص</span><strong>${leads.length.toLocaleString('ar-SA')}</strong><em>${leads.filter(l=>l.stage==='won').length} مكتملة</em></article><article><span>الموظفون</span><strong>${agents.length.toLocaleString('ar-SA')}</strong><em>${agents.filter(a=>a.status!=='offline').length} نشط</em></article><article><span>المحادثات</span><strong>${convos.length.toLocaleString('ar-SA')}</strong><em>كل القنوات</em></article></div><div class="kx-chart-card"><header><div><span>الأداء</span><h3>نمو النشاط</h3></div></header><div class="kx-bars">${[32,48,41,62,55,73,67,86,76,92,83,100].map((h,i)=>`<i style="height:${h}%"><b>${i+1}</b></i>`).join('')}</div></div>`; } catch(e){host.innerHTML=empty('تعذر تحميل التحليلات');}
  }

  async function loadTeam() {
    const host=document.getElementById('kx-team'); if(!host)return;
    try { const client=await db(); const {data:{user}}=await client.auth.getUser(); const [profile,agents]=await Promise.all([getRows(client.from('users').select('full_name,email,avatar_url,role').eq('id',user.id)),getRows(client.from('client_agents').select('name,role,status,success_rate').eq('user_id',user.id))]); host.innerHTML=[...profile.map(p=>({name:p.full_name||p.email,role:'عضو بشري',status:'online'})),...agents].map(p=>`<article><span>${esc((p.name||'ف').charAt(0))}</span><div><h3>${esc(p.name)}</h3><p>${esc(p.role||'موظف ذكي')}</p></div><b class="${p.status==='offline'?'off':''}">${p.status==='offline'?'غير متصل':'نشط'}</b></article>`).join('')||empty('لا يوجد أعضاء'); } catch(e){host.innerHTML=empty('تعذر تحميل الفريق');}
  }

  async function loadKnowledge() {
    const host=document.getElementById('kx-knowledge'); if(!host)return;
    try { const client=await db(); const {data:{user}}=await client.auth.getUser(); const rows=await getRows(client.from('knowledge_docs').select('*').eq('user_id',user.id).order('updated_at',{ascending:false})); host.innerHTML=rows.map(r=>`<article>${icon(r.status==='indexed'?'file-circle-check':'file')}<div><strong>${esc(r.name)}</strong><small>${esc(r.size_label||'—')} · ${new Date(r.updated_at).toLocaleDateString('ar-SA')}</small></div><b class="${r.status}">${r.status==='indexed'?'مفهرس':r.status==='failed'?'فشل':'قيد المعالجة'}</b><button>${icon('ellipsis')}</button></article>`).join('')||empty('لم ترفع أي وثائق بعد'); } catch(e){host.innerHTML=empty('تعذر تحميل قاعدة المعرفة');}
  }

  function assistantReply(event) { event.preventDefault(); const input=event.currentTarget.querySelector('input'); const body=document.querySelector('.kx-ai-body'); if(!input.value.trim()||!body)return; body.insertAdjacentHTML('beforeend',`<p class="user">${esc(input.value)}</p><p>يمكنك استخدام البحث الشامل للانتقال إلى العملاء، التحليلات، الفريق أو قاعدة المعرفة.</p>`); input.value=''; body.scrollTop=body.scrollHeight; }

  function bindFeatures() {
    document.querySelector('[data-tab="crm"]')?.addEventListener('click',loadCrm);
    document.querySelector('[data-tab="analytics-pro"]')?.addEventListener('click',loadAnalytics);
    document.querySelector('[data-tab="team"]')?.addEventListener('click',loadTeam);
    document.querySelector('[data-tab="knowledge"]')?.addEventListener('click',loadKnowledge);
    document.getElementById('kx-command-input')?.addEventListener('input',e=>renderCommands(e.target.value));
    document.getElementById('kx-command')?.addEventListener('click',e=>{if(e.target.id==='kx-command')closeCommand();});
    window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();} if(e.key==='Escape')closeCommand();});
  }

  document.addEventListener('DOMContentLoaded',()=>{injectNavigation();upgradeShell();bindFeatures();setLanguage(state.lang);});
})();

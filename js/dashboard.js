/* ====== User Dashboard Logic (SaaS Version) ====== */
'use strict';

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
  try {
    const session = await window.SupabaseAPI.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = session.user;
    userProfile = await window.SupabaseAPI.getUserProfile();
    
    document.getElementById('user-name').textContent = userProfile.full_name || currentUser.email;
    
    // Setup UI
    setupTabs();
    setupProfileForm();
    setupPaymentForm();
    setupLogout();
    
    // Load initial data
    await refreshAllData();
    
    document.getElementById('loading-overlay').classList.add('hidden');
    document.getElementById('content-area').classList.replace('opacity-0', 'opacity-100');
  } catch (err) {
    console.error(err);
    toast('حدث خطأ أثناء تحميل لوحة التحكم', 'error');
  }
}

async function refreshAllData() {
  await Promise.all([
    loadOverviewData(),
    loadLeadsData(),
    loadPaymentsData()
  ]);
}

function setupTabs() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  const sections = document.querySelectorAll('.tab-content');
  
  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.tab;
      
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      sections.forEach(s => {
        if (s.id === `tab-${target}`) {
          s.classList.remove('hidden');
        } else {
          s.classList.add('hidden');
        }
      });

      // Update URL hash without jumping
      history.pushState(null, null, `#${target}`);
    });
  });

  // Handle initial hash
  const hash = window.location.hash.substring(1);
  if (hash) {
    const activeLink = document.querySelector(`.sidebar-link[data-tab="${hash}"]`);
    if (activeLink) activeLink.click();
  }
}

async function loadOverviewData() {
  try {
    const leadsResult = await window.SupabaseAPI.getLeads(1, 5, { user_id: currentUser.id });
    const orders = await window.SupabaseAPI.getOrders({ user_id: currentUser.id });
    const subs = await window.SupabaseAPI.getSubscriptions({ user_id: currentUser.id });

    document.getElementById('stat-leads').textContent = leadsResult.total;
    document.getElementById('stat-agents').textContent = (orders || []).filter(o => o.status === 'completed').length;
    document.getElementById('stat-subs').textContent = (subs || []).length;

    const tbody = document.getElementById('recent-leads-body');
    if (leadsResult.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="py-8 text-center text-slate-400">لا توجد طلبات حديثة</td></tr>';
      return;
    }

    tbody.innerHTML = leadsResult.data.map(lead => `
      <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
        <td class="py-4 font-bold text-sm">${lead.agent_type || 'طلب عام'}</td>
        <td class="py-4 text-slate-500 text-xs">${new Date(lead.created_at).toLocaleDateString('ar-SA')}</td>
        <td class="py-4">
          <span class="badge ${getStatusClass(lead.status)}">${lead.status}</span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading overview:', err);
  }
}

async function loadLeadsData() {
  try {
    const leadsResult = await window.SupabaseAPI.getLeads(1, 50, { user_id: currentUser.id });
    const tbody = document.getElementById('full-leads-body');
    
    if (leadsResult.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">لا توجد طلبات مسجلة</td></tr>';
      return;
    }

    tbody.innerHTML = leadsResult.data.map(lead => `
      <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
        <td class="py-4 font-bold text-sm">${lead.agent_type || 'طلب عام'}</td>
        <td class="py-4 text-slate-600 text-sm">${lead.company || '-'}</td>
        <td class="py-4 text-slate-500 text-xs">${new Date(lead.created_at).toLocaleDateString('ar-SA')}</td>
        <td class="py-4">
          <span class="badge ${getStatusClass(lead.status)}">${lead.status}</span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading leads:', err);
  }
}

async function loadPaymentsData() {
  try {
    const supabase = await window.SupabaseAPI.initSupabase();
    const { data, error } = await supabase
      .from('bank_transfers')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('payments-body');
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">لا توجد عمليات دفع مسجلة</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(pay => `
      <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
        <td class="py-4 px-4 font-bold text-brand-600">${pay.amount} ر.س</td>
        <td class="py-4 px-4 text-slate-600 text-sm">${pay.beneficiary_name}</td>
        <td class="py-4 px-4 text-slate-500 text-xs">${new Date(pay.created_at).toLocaleDateString('ar-SA')}</td>
        <td class="py-4 px-4">
          <span class="badge ${getPaymentStatusClass(pay.status)}">${getPaymentStatusText(pay.status)}</span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading payments:', err);
  }
}

function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  // Fill form with current data
  form.full_name.value = userProfile.full_name || '';
  form.username.value = userProfile.username || '';
  form.company.value = userProfile.company || '';
  form.phone.value = userProfile.phone || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';

    try {
      const data = {
        full_name: form.full_name.value,
        username: form.username.value,
        company: form.company.value,
        phone: form.phone.value
      };
      await window.SupabaseAPI.updateProfile(data);
      toast('✅ تم تحديث الملف الشخصي بنجاح');
    } catch (err) {
      toast('⚠️ فشل التحديث: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'حفظ التغييرات';
    }
  });
}

function setupPaymentForm() {
  const form = document.getElementById('payment-form');
  const fileInput = document.getElementById('receipt-file');
  const fileInfo = document.getElementById('file-info');

  if (!form) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileInfo.innerHTML = `
        <i class="fa-solid fa-file-image text-3xl text-brand-500 mb-2"></i>
        <p class="text-brand-600 font-bold text-sm">${file.name}</p>
        <p class="text-slate-400 text-[10px]">${(file.size / 1024).toFixed(1)} KB</p>
      `;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('payment-submit-btn');
    const file = fileInput.files[0];

    if (!file) {
      toast('يرجى اختيار صورة الإيصال', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> جاري الرفع...';

    try {
      const supabase = await window.SupabaseAPI.initSupabase();
      
      // 1. Upload image to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // 3. Save to Database
      const transferData = {
        beneficiary_name: form.beneficiary_name.value,
        amount: parseFloat(form.amount.value),
        receipt_url: publicUrl,
        bank_name: 'البنك الأهلي السعودي',
        iban: 'SA 00 0000 0000 0000 0000 0000'
      };

      await window.SupabaseAPI.submitBankTransfer(transferData);
      
      toast('✅ تم إرسال الإيصال بنجاح. ستتم مراجعته قريباً.');
      form.reset();
      fileInfo.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 mb-2"></i>
        <p class="text-slate-500 text-sm">اضغط هنا أو اسحب الصورة لرفع الإيصال</p>
      `;
      
      // Switch to payments tab
      document.querySelector('.sidebar-link[data-tab="payments"]').click();
      await loadPaymentsData();

    } catch (err) {
      console.error(err);
      toast('⚠️ فشل الإرسال: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'إرسال الإيصال للمراجعة';
    }
  });
}

function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        await window.SupabaseAPI.signOut();
        window.location.href = 'index.html';
      }
    });
  }
}

// Helpers
function getStatusClass(status) {
  const classes = {
    'جديد': 'bg-blue-50 text-blue-600',
    'تم التواصل': 'bg-amber-50 text-amber-600',
    'تم البيع': 'bg-green-50 text-green-600',
    'ملغي': 'bg-red-50 text-red-600'
  };
  return classes[status] || 'bg-slate-50 text-slate-600';
}

function getPaymentStatusClass(status) {
  const classes = {
    'pending': 'bg-amber-50 text-amber-600',
    'approved': 'bg-green-50 text-green-600',
    'rejected': 'bg-red-50 text-red-600'
  };
  return classes[status] || 'bg-slate-50 text-slate-600';
}

function getPaymentStatusText(status) {
  const texts = {
    'pending': 'قيد المراجعة',
    'approved': 'تم القبول',
    'rejected': 'مرفوض'
  };
  return texts[status] || status;
}

function toast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastIcon = document.getElementById('toast-icon');
  
  toastMsg.textContent = msg;
  
  if (type === 'error') {
    toastIcon.className = 'w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white';
    toastIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  } else {
    toastIcon.className = 'w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white';
    toastIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
  }
  
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

/* ====== وكيل.AI — السكربت الرئيسي ====== */

// ---------- القائمة الجوال ----------
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
document.querySelectorAll('.mobile-link').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
);

// ---------- ظل الهيدر عند التمرير ----------
const header = document.getElementById('site-header');
window.addEventListener('scroll', () =>
  header.classList.toggle('scrolled', window.scrollY > 20)
);

// ---------- عداد الأرقام في الهيرو ----------
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.count;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 35);
  });
}
animateCounters();

// ---------- محاكاة محادثة واتساب ----------
const chatBody = document.getElementById('chat-body');
const chatScript = [
  { dir: 'in',  text: 'السلام عليكم، أبغى أحجز موعد تنظيف أسنان 🦷', time: '9:41 م' },
  { dir: 'out', text: 'وعليكم السلام! حياك الله 🌿 أكيد، عندنا مواعيد متاحة بكرة:\n• 10:00 صباحاً\n• 4:30 عصراً\nأي وقت يناسبك؟', time: '9:41 م' },
  { dir: 'in',  text: '4:30 العصر ممتاز', time: '9:42 م' },
  { dir: 'out', text: 'تم الحجز ✅\n📅 الأربعاء 4:30 عصراً\n👨‍⚕️ د. خالد المطيري\nراح يوصلك تذكير قبل الموعد بساعتين. نتشرف بزيارتك! 🙏', time: '9:42 م' },
  { dir: 'in',  text: 'الله يعطيكم العافية، سريعين ما شاء الله 👌', time: '9:43 م' },
  { dir: 'out', text: 'الله يعافيك! في خدمتك 24 ساعة 💚', time: '9:43 م' }
];

function addBubble({ dir, text, time }) {
  const div = document.createElement('div');
  div.className = `bubble bubble-${dir}`;
  div.innerHTML = text.replace(/\n/g, '<br>') + `<time>${time}</time>`;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'bubble bubble-out typing-bubble';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

async function playChat() {
  chatBody.innerHTML = '';
  await sleep(800);
  for (const msg of chatScript) {
    if (msg.dir === 'out') {
      const typing = showTyping();
      await sleep(1200);
      typing.remove();
    } else {
      await sleep(1100);
    }
    addBubble(msg);
  }
  await sleep(6000);
  playChat(); // إعادة تشغيل المحادثة
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
playChat();

// ---------- تعبئة النموذج تلقائياً من أزرار الأقسام ----------
document.querySelectorAll('[data-agent]').forEach(btn =>
  btn.addEventListener('click', () => {
    const select = document.getElementById('lead-agent');
    const value = btn.dataset.agent === 'عميل حجز مواعيد' ? 'عميل حجز مواعيد' : btn.dataset.agent;
    [...select.options].forEach(o => { if (o.text === value) select.value = o.text; });
  })
);
document.querySelectorAll('[data-plan]').forEach(btn =>
  btn.addEventListener('click', () => {
    document.getElementById('lead-plan').value = btn.dataset.plan;
  })
);

// ---------- إرسال نموذج الطلب (Supabase Integration) ----------
const form = document.getElementById('lead-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async e => {
  e.preventDefault();

  // تحقق بسيط
  let valid = true;
  ['lead-name', 'lead-phone', 'lead-agent'].forEach(id => {
    const el = document.getElementById(id);
    const empty = !el.value.trim();
    el.classList.toggle('input-error', empty);
    if (empty) valid = false;
  });
  const phone = document.getElementById('lead-phone');
  if (phone.value.trim() && !/^(\+?966|0)?5\d{8}$/.test(phone.value.replace(/[\s-]/g, ''))) {
    phone.classList.add('input-error');
    showStatus('فضلاً أدخل رقم جوال سعودي صحيح (05XXXXXXXX)', false);
    return;
  }
  if (!valid) {
    showStatus('فضلاً عبّي الحقول المطلوبة (*)', false);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال...';

  try {
    // استخدام Supabase API بدلاً من /tables/leads
    const leadData = {
      name: document.getElementById('lead-name').value.trim(),
      company: document.getElementById('lead-company').value.trim(),
      phone: phone.value.trim(),
      agent_type: document.getElementById('lead-agent').value,
      plan: document.getElementById('lead-plan').value,
      message: document.getElementById('lead-message').value.trim(),
      status: 'جديد'
    };

    // استدعاء Supabase API
    await window.SupabaseAPI.createLead(leadData);
    
    form.reset();
    showStatus('✅ وصلنا طلبك! بنتواصل معك خلال ساعات العمل إن شاء الله.', true);
  } catch (err) {
    console.error('خطأ في إرسال الطلب:', err);
    showStatus('حصل خطأ أثناء الإرسال، تأكد من الاتصال بالإنترنت أو حاول مرة ثانية.', false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> أرسل الطلب';
  }
});

function showStatus(msg, ok) {
  statusEl.textContent = msg;
  statusEl.className = `mt-4 text-center font-bold rounded-xl py-3 px-4 ${ok ? 'bg-brand-100 text-brand-900' : 'bg-red-100 text-red-700'}`;
  statusEl.classList.remove('hidden');
  if (ok) setTimeout(() => statusEl.classList.add('hidden'), 7000);
}

// ---------- تأثير الظهور عند التمرير ----------
const revealTargets = document.querySelectorAll(
  '.agent-card, .step-card, .feature-card, .price-card, .testimonial-card, .faq-item'
);
revealTargets.forEach(el => el.classList.add('reveal'));
const observer = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      observer.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
revealTargets.forEach(el => observer.observe(el));

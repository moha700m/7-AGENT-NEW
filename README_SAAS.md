# Agent Store - SaaS Platform

**Agent Store** هي منصة SaaS احترافية لإدارة وبيع عملاء الذكاء الاصطناعي (AI Agents). تم بناؤها بالكامل بالعربية مع دعم كامل للـ RTL.

## 🚀 الميزات الرئيسية

### 🌐 الصفحة الرئيسية (Landing Page)
- عرض احترافي للمنتجات والخدمات
- محاكاة محادثة واتساب حية
- عرض الأسعار والباقات
- نموذج التقاط العملاء (Lead Capture)
- زر واتساب عائم
- تصميم عربي RTL احترافي

### 📊 لوحة التحكم (Dashboard)
- **إحصائيات رئيسية (KPIs)**
  - إجمالي العملاء
  - الطلبات الجديدة
  - الطلبات المكتملة
  - الإيرادات

- **الرسوم البيانية**
  - توزيع الطلبات حسب نوع العميل
  - توزيع الطلبات حسب الباقة

- **إدارة العملاء**
  - عرض جميع العملاء
  - البحث والفلترة
  - تغيير حالة العميل
  - حذف العملاء
  - ملاحظات وتعليقات

- **إدارة الطلبات**
  - عرض جميع الطلبات
  - تتبع حالة الطلب
  - تفاصيل الطلب

- **إدارة الـ Agents**
  - إضافة عملاء ذكيين
  - تعديل المعلومات
  - إدارة الصور
  - التحكم في النشر

- **إدارة الباقات**
  - إنشاء باقات جديدة
  - تحديد الأسعار
  - إدارة الميزات

- **التحليلات**
  - إحصائيات شاملة
  - تقارير مفصلة
  - رسوم بيانية متقدمة

### 🔐 الأمان
- مصادقة Supabase
- Row Level Security (RLS)
- حماية من XSS
- حماية من CSRF
- تشفير البيانات

### 💾 قاعدة البيانات
- Supabase PostgreSQL
- 11 جدول رئيسي
- RLS Policies محددة
- Indexes للأداء
- Views للتحليلات

## 📁 هيكل المشروع

```
7-AGENT-NEW/
├── index.html                 # الصفحة الرئيسية
├── admin.html                 # صفحة تسجيل الدخول (قديمة)
├── dashboard.html             # لوحة التحكم الجديدة
├── css/
│   ├── style.css             # أنماط الصفحة الرئيسية
│   ├── admin.css             # أنماط الإدارة
│   └── dashboard.css         # أنماط لوحة التحكم
├── js/
│   ├── main.js               # سكريبت الصفحة الرئيسية
│   ├── admin.js              # سكريبت الإدارة
│   ├── dashboard.js          # سكريبت لوحة التحكم
│   └── supabase-config.js    # إعدادات Supabase
├── services/
│   └── supabase.js           # خدمة Supabase الشاملة
├── database-schema.sql        # مخطط قاعدة البيانات
├── SUPABASE_SETUP.md         # دليل إعداد Supabase
├── vercel.json               # إعدادات Vercel
└── README.md                 # هذا الملف
```

## 🔧 الإعدادات والتثبيت

### المتطلبات
- متصفح حديث (Chrome, Firefox, Safari, Edge)
- اتصال إنترنت
- حساب Supabase

### خطوات التثبيت

#### 1. استنساخ المشروع
```bash
git clone https://github.com/moha700m/7-AGENT-NEW.git
cd 7-AGENT-NEW
```

#### 2. إعداد Supabase
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. أنشئ مشروع جديد أو استخدم موجود
3. انسخ:
   - **Project URL**: `https://xxxx.supabase.co`
   - **Anon Key**: من Settings → API

#### 3. تحديث الإعدادات
عدّل الملفات التالية:

**index.html** (السطر ~475):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**admin.html** (السطر ~180):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**dashboard.html** (السطر ~210):
```javascript
window.SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

#### 4. إنشاء جداول قاعدة البيانات
1. اذهب إلى Supabase SQL Editor
2. انسخ محتوى `database-schema.sql`
3. الصق في SQL Editor
4. اضغط Execute

#### 5. النشر على Vercel
1. اذهب إلى [Vercel](https://vercel.com)
2. اضغط "Add New Project"
3. اختر المستودع من GitHub
4. اضغط Deploy

## 📚 دليل الاستخدام

### الصفحة الرئيسية
- اضغط على أي باقة لملء نموذج الطلب تلقائياً
- أرسل النموذج لحفظ البيانات في Supabase
- استخدم زر واتساب العائم للتواصل المباشر

### لوحة التحكم
1. اذهب إلى `/dashboard.html`
2. ستظهر لك الإحصائيات الرئيسية
3. استخدم القائمة الجانبية للتنقل بين الأقسام
4. ابحث وفلتر البيانات حسب احتياجاتك

### إدارة العملاء
- **عرض**: جميع العملاء يظهرون في الجدول
- **بحث**: استخدم حقل البحث للعثور على عميل
- **فلترة**: اختر الحالة المطلوبة
- **تعديل الحالة**: اختر من القائمة المنسدلة
- **حذف**: اضغط على أيقونة السلة

## 🔌 API و الخدمات

### Supabase Service
جميع العمليات متوفرة عبر `window.SupabaseService`:

```javascript
// إضافة عميل
await window.SupabaseService.createLead({
  name: 'أحمد',
  company: 'شركة التقنية',
  phone: '0555555555',
  agent_type: 'عميل واتساب',
  plan: 'باقة برو',
  message: 'أريد عميل واتساب'
});

// الحصول على العملاء
const { data, total } = await window.SupabaseService.getLeads(
  { status: 'جديد', search: 'أحمد' },
  1,  // الصفحة
  50  // عدد النتائج
);

// تحديث حالة العميل
await window.SupabaseService.updateLead(leadId, {
  status: 'تم التواصل'
});

// حذف عميل
await window.SupabaseService.deleteLead(leadId);

// الحصول على الإحصائيات
const stats = await window.SupabaseService.getLeadStats();
```

## 📊 جداول قاعدة البيانات

### leads
- `id`: معرف فريد
- `name`: اسم العميل
- `company`: اسم الشركة
- `phone`: رقم الجوال
- `agent_type`: نوع العميل
- `plan`: الباقة المختارة
- `message`: الرسالة
- `status`: الحالة (جديد، تم التواصل، تم البيع، ملغي)
- `created_at`: تاريخ الإنشاء
- `updated_at`: تاريخ التحديث

### agents
- `id`: معرف فريد
- `name`: اسم العميل
- `description`: الوصف
- `category`: التصنيف
- `price`: السعر
- `image_url`: رابط الصورة
- `is_published`: هل منشور

### plans
- `id`: معرف فريد
- `name`: اسم الباقة
- `description`: الوصف
- `price`: السعر
- `currency`: العملة
- `features`: الميزات (JSON)

### orders
- `id`: معرف فريد
- `user_id`: معرف المستخدم
- `lead_id`: معرف العميل
- `plan_id`: معرف الباقة
- `amount`: المبلغ
- `status`: الحالة

## 🔒 الأمان

### Row Level Security (RLS)
- جميع الجداول محمية بـ RLS
- كل مستخدم يرى بيانات نفسه فقط
- المسؤولون يرون جميع البيانات

### حماية البيانات
- تشفير البيانات في النقل (HTTPS)
- تشفير البيانات في التخزين
- معالجة آمنة للمدخلات
- حماية من XSS و CSRF

## 📈 الأداء

### التحسينات
- Lazy Loading للصور
- Code Splitting
- Caching للبيانات
- Indexes على الجداول الكبيرة
- CDN للملفات الثابتة

### الحدود
- 50 عميل لكل صفحة
- 100 طلب لكل دقيقة
- حجم الملف الأقصى: 10MB

## 🐛 استكشاف الأخطاء

### الخطأ: "Supabase SDK not loaded"
**الحل**: تأكد من تحميل Supabase SDK قبل استخدام الخدمة

### الخطأ: "Cannot read property 'createClient'"
**الحل**: تحقق من صحة SUPABASE_URL و SUPABASE_ANON_KEY

### الخطأ: "Unauthorized"
**الحل**: تحقق من RLS Policies في Supabase

### الخطأ: "Relation 'leads' does not exist"
**الحل**: تأكد من تنفيذ database-schema.sql

## 📞 الدعم

للمساعدة والدعم:
- 📧 البريد: hello@agentstore.sa
- 📱 واتساب: +966555462764
- 🌐 الموقع: https://agentstore.sa

## 📄 الترخيص

جميع الحقوق محفوظة © 2026 Agent Store

## 🙏 شكر وتقدير

تم بناء هذا المشروع باستخدام:
- Supabase
- Tailwind CSS
- Chart.js
- Vercel

---

**آخر تحديث**: يوليو 2026
**الإصدار**: 1.0.0

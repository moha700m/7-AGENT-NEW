import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata = { title: 'الباقات والأسعار', description: 'باقات مرنة لتشغيل وكلاء الذكاء الاصطناعي.' }

export default function PricingPage() {
  return <main><SiteHeader /><section><p className="eyebrow">الباقات</p><h1>ابدأ بحجم عملك اليوم</h1><div className="grid pricing-grid">
    <article className="card"><b>أساسي</b><h2>499 ر.س</h2><p>وكيل واحد، دعم أساسي، وتقارير شهرية.</p><Link className="button" href="/marketplace">اختر وكيلك</Link></article>
    <article className="card featured"><b>أعمال</b><h2>999 ر.س</h2><p>ثلاثة وكلاء، أولوية الدعم، وتحليلات متقدمة.</p><Link className="button" href="/marketplace">ابدأ الآن</Link></article>
    <article className="card"><b>مؤسسات</b><h2>حسب الطلب</h2><p>تكاملات خاصة، حوكمة، واتفاقية مستوى خدمة.</p><a className="button" href="tel:0509955337">تواصل معنا</a></article>
  </div></section><SiteFooter /></main>
}

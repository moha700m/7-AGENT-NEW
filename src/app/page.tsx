import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const categories = await prisma.category.findMany({ orderBy: { nameAr: 'asc' }, take: 8 })
  return <main><SiteHeader />
    <section className="hero"><p className="eyebrow">صُنع بفخر في السعودية</p><h1>وظّف وكيلاً ذكياً<br /><em>يعمل لأجلك 24 ساعة</em></h1><p>اكتشف وكلاء جاهزين لخدمة العملاء والمبيعات والحجوزات، مع تحكم كامل وخصوصية مدمجة.</p><div><Link className="button" href="/marketplace">استكشف السوق</Link><Link className="secondary" href="/pricing">شاهد الباقات</Link></div></section>
    <section><p className="eyebrow">حسب احتياجك</p><h2>اختر وكيلك المناسب</h2>{categories.length ? <div className="grid">{categories.map((category) => <Link className="card" href={`/marketplace?category=${category.slug}`} key={category.id}><b>{category.nameAr}</b><p>حلول جاهزة ومصممة للأعمال السعودية.</p><span>استكشف ←</span></Link>)}</div> : <div className="empty-state"><h3>السوق قيد التجهيز</h3><p>ستظهر التصنيفات المنشورة هنا فور إضافتها.</p></div>}</section>
    <SiteFooter />
  </main>
}

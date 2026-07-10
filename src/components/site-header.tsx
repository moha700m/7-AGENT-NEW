import Link from 'next/link'

export function SiteHeader() {
  return <header>
    <Link className="brand" href="/">وكيل<span>.AI</span></Link>
    <nav aria-label="التنقل الرئيسي">
      <Link href="/marketplace">السوق</Link>
      <Link href="/pricing">الباقات</Link>
      <Link href="/login">الدخول</Link>
      <Link className="button" href="/dashboard">لوحة التحكم</Link>
    </nav>
  </header>
}

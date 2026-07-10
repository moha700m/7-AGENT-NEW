import Link from 'next/link'

export default function NotFound() {
  return <main className="auth-shell"><section className="auth-panel"><p className="eyebrow">404</p><h1>الصفحة غير موجودة</h1><p>قد يكون الرابط تغير أو لم يعد متاحاً.</p><Link className="button" href="/">العودة للرئيسية</Link></section></main>
}

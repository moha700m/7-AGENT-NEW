import Link from 'next/link'

export const metadata = { title: 'تم الاشتراك' }

export default function CheckoutSuccess() {
  return <main className="auth-shell"><section className="auth-panel"><p className="eyebrow">تم استلام الدفع</p><h1>شكراً لاشتراكك</h1><p>سيظهر الوكيل في لوحة التحكم بعد تأكيد الدفع.</p><Link className="button" href="/dashboard">العودة إلى لوحة التحكم</Link></section></main>
}

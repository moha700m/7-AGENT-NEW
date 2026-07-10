'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-shell"><section className="auth-panel"><p className="eyebrow">خطأ</p><h1>تعذر إكمال الطلب</h1><p>حاول مرة أخرى، أو تواصل مع الدعم إذا استمرت المشكلة.</p><button className="button" type="button" onClick={reset}>المحاولة مجدداً</button></section></main>
}

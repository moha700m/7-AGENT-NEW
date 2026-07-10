'use client'

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const payload = { name: form.get('name'), email: form.get('email'), password: form.get('password') }
    const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error ?? 'تعذر إنشاء الحساب')
      setLoading(false)
      return
    }
    await signIn('credentials', { email: payload.email, password: payload.password, redirect: false })
    router.push('/dashboard')
    router.refresh()
  }

  return <main className="auth-shell"><section className="auth-panel">
    <Link className="brand auth-brand" href="/">وكيل<span>.AI</span></Link>
    <p className="eyebrow">ابدأ الآن</p><h1>إنشاء حساب</h1>
    {error && <p className="form-error" role="alert">{error}</p>}
    <form onSubmit={handleSubmit} className="auth-form">
      <label>الاسم<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>
      <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required /></label>
      <label>كلمة المرور<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><small>12 حرفاً على الأقل</small></label>
      <button className="button" type="submit" disabled={loading}>{loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</button>
    </form>
    <p>لديك حساب؟ <Link href="/login">تسجيل الدخول</Link></p>
  </section></main>
}

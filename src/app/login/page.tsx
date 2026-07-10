'use client'

import { signIn } from 'next-auth/react'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'), password: form.get('password'), redirect: false,
    })
    if (!result?.ok) {
      setError('بيانات الدخول غير صحيحة')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return <main className="auth-shell"><section className="auth-panel">
    <Link className="brand auth-brand" href="/">وكيل<span>.AI</span></Link>
    <p className="eyebrow">مرحباً بعودتك</p><h1>تسجيل الدخول</h1>
    {error && <p className="form-error" role="alert">{error}</p>}
    <form onSubmit={handleSubmit} className="auth-form">
      <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required /></label>
      <label>كلمة المرور<input name="password" type="password" autoComplete="current-password" minLength={12} required /></label>
      <button className="button" type="submit" disabled={loading}>{loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</button>
    </form>
    <p>ليس لديك حساب؟ <Link href="/signup">إنشاء حساب</Link></p>
  </section></main>
}

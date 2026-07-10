'use client'

import { signIn } from 'next-auth/react'
import { FormEvent, useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: '/dashboard',
    })

    if (!result?.ok) {
      setError('بيانات دخول غير صحيحة')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night to-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Link href="/" className="text-2xl font-bold text-night mb-8 block">
            وكيل<span className="text-brand">.AI</span>
          </Link>
          
          <h1 className="text-2xl font-bold text-night mb-6">تسجيل الدخول</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            ليس لديك حساب؟{' '}
            <Link href="/signup" className="text-brand hover:underline font-medium">
              إنشاء حساب
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

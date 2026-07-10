'use client'

import { useState } from 'react'

export function CheckoutButton({ agentSlug }: { agentSlug: string }) {
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function checkout() {
    setLoading(true); setError('')
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentSlug }) })
    const body = await response.json()
    if (!response.ok || !body.url) { setError(body.error ?? 'تعذر بدء الدفع'); setLoading(false); return }
    window.location.assign(body.url)
  }
  return <><button className="button" type="button" disabled={loading} onClick={checkout}>{loading ? 'جارٍ التحويل...' : 'الاشتراك الآن'}</button>{error && <p className="form-error" role="alert">{error}</p>}</>
}

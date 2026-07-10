'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

export function AgentRunner({ slug }: { slug: string }) {
  const [output, setOutput] = useState(''); const [runId, setRunId] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setOutput('')
    const form = new FormData(event.currentTarget)
    const response = await fetch(`/api/agents/${slug}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: form.get('prompt') }) })
    const body = await response.json(); setLoading(false)
    if (!response.ok) { setError(body.error ?? 'تعذر تشغيل الوكيل'); return }
    setOutput(body.output); setRunId(body.id)
  }
  return <form className="runner card" onSubmit={submit}><h2>جرّب الوكيل</h2><label>اكتب طلبك<textarea name="prompt" required maxLength={4000} rows={5} /></label><button className="button" disabled={loading} type="submit">{loading ? 'جارٍ التفكير...' : 'إرسال'}</button>{error && <p className="form-error" role="alert">{error}</p>}{output && <div className="run-output"><p>{output}</p><Link href={`/runs/${runId}`}>فتح النتيجة المحفوظة</Link></div>}</form>
}

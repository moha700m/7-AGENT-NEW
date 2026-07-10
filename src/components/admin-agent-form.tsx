'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminAgentForm() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('')
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form)
    const response = await fetch('/api/admin/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, publish: form.get('publish') === 'on' }) })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) { setMessage(body.error ?? 'تعذر حفظ الوكيل'); return }
    event.currentTarget.reset(); setMessage('تمت إضافة الوكيل'); router.refresh()
  }

  return <form className="admin-form card" onSubmit={submit}>
    <h2>إضافة وكيل</h2><div className="form-grid">
      <label>الاسم العربي<input name="nameAr" required minLength={2} /></label><label>الاسم الإنجليزي<input name="name" required minLength={2} /></label>
      <label>المعرّف<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="sales-agent" dir="ltr" /></label><label>السعر الشهري<input name="priceMonthly" required type="number" min={0} /></label>
      <label>التصنيف العربي<input name="categoryNameAr" required /></label><label>التصنيف الإنجليزي<input name="categoryName" required /></label>
      <label>معرّف التصنيف<input name="categorySlug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" dir="ltr" /></label><label className="check"><input name="publish" type="checkbox" /> نشر فوراً</label>
    </div><label>الملخص<textarea name="summary" required minLength={10} maxLength={240} /></label><label>الوصف<textarea name="description" required minLength={20} rows={6} /></label>
    {message && <p role="status">{message}</p>}<button className="button" disabled={loading} type="submit">{loading ? 'جارٍ الحفظ...' : 'حفظ الوكيل'}</button>
  </form>
}

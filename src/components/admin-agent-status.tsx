'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AdminAgentStatus({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) {
  const router = useRouter(); const [loading, setLoading] = useState(false)
  async function update(nextStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    setLoading(true)
    await fetch(`/api/admin/agents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
    setLoading(false); router.refresh()
  }
  return <select aria-label="حالة الوكيل" value={status} disabled={loading} onChange={(event) => update(event.target.value as typeof status)}><option value="DRAFT">مسودة</option><option value="PUBLISHED">منشور</option><option value="ARCHIVED">مؤرشف</option></select>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-[var(--radius-control)] border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {loading ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}

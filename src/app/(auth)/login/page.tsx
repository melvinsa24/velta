'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Message générique : on ne révèle pas si c'est l'email ou le mot de passe.
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Succès : on rafraîchit pour que le serveur relise la session, puis on
    // redirige vers le dashboard.
    router.replace('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Velta</h1>
        <p className="mb-8 text-sm text-muted">Connecte-toi pour continuer.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--radius-control)] border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-muted">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-[var(--radius-control)] border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-base font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}

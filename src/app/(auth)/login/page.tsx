'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input } from '@/components/ui'

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
    <main className="flex min-h-full items-center justify-center px-[18px] py-12">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Velta</h1>
        <p className="mb-8 text-sm text-ink-2">Connecte-toi pour continuer.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-ink-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-ink-2">
              Mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-down" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </main>
  )
}

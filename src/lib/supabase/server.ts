import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase à utiliser côté serveur (Server Components, Server Actions,
 * Route Handlers). S'appuie sur les cookies de la requête courante.
 *
 * `cookies()` est asynchrone depuis Next.js 15 : la fonction est donc async.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Appelé depuis un Server Component : l'écriture de cookies y est
            // interdite. On l'ignore car le proxy rafraîchit déjà la session.
          }
        },
      },
    }
  )
}

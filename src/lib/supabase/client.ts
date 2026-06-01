import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase à utiliser dans les Client Components (navigateur).
 * La session est persistée dans les cookies par @supabase/ssr, ce qui
 * permet au proxy et aux Server Components de la relire côté serveur.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

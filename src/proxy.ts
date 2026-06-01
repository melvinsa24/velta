import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy d'authentification (ex-"middleware", renommé en Next.js 16).
 *
 * Exécuté sur chaque requête correspondant au `matcher` : rafraîchit la
 * session Supabase et redirige vers /login si l'utilisateur n'est pas
 * connecté. La route /login elle-même reste toujours accessible.
 */
export async function proxy(request: NextRequest) {
  // Réponse de base : on la réécrit si Supabase doit mettre à jour des cookies.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser(), sous
  // peine de déconnexions aléatoires (recommandation @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')

  // Non connecté et hors page de login → redirection vers /login.
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico et fichiers image courants
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

import { redirect } from 'next/navigation'

// L'écran d'accueil renvoie vers le dashboard (le proxy gère l'auth en amont).
export default function Home() {
  redirect('/dashboard')
}

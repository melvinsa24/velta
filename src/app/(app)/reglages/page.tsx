import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { LogoutButton } from '@/app/logout-button'

// Écran squelette — catégories, objectif %, export arrivent en Phase 5/13.
export default function ReglagesPage() {
  return (
    <>
      <ScreenHeader title="Réglages" subtitle="Catégories, objectif, compte" />
      <LogoutButton />
    </>
  )
}

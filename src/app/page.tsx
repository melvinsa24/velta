import { LogoutButton } from './logout-button'

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-start gap-6 p-6">
      <h1 className="text-2xl font-bold">Velta</h1>
      <LogoutButton />
    </main>
  )
}

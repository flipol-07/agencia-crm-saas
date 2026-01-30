import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/actions/auth'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { FloatingChat } from '@/features/ai-assistant/components/FloatingChat'
import Image from 'next/image'
import { Suspense } from 'react'

async function UserNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400">{user.email}</span>
      <form action={signout}>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image src="/aurie-official-logo.png" alt="Aura" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              AURIE
            </h1>
          </Link>
          <Suspense fallback={<div className="h-10 w-32 animate-pulse bg-white/5 rounded-lg border border-white/10" />}>
            <UserNav />
          </Suspense>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
          <FloatingChat />
        </main>
      </div>
    </div>
  )
}

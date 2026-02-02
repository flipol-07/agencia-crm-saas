import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/actions/auth'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { MobileNav } from '@/shared/components/layout/MobileNav'
import { FloatingChat } from '@/features/ai-assistant/components/FloatingChat'
import Image from 'next/image'
import { Suspense } from 'react'
import { RealtimeNotifications } from '@/shared/components/providers/RealtimeNotifications'
import { Toaster } from 'sonner'
import { ProfileCompletionCheck } from '@/shared/components/features/ProfileCompletionCheck'

async function UserNav() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400 hidden md:block">{user.email}</span>
      <form action={signout}>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
        >
          <span className="hidden md:inline">Cerrar sesión</span>
          <span className="md:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
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
      <RealtimeNotifications />
      <Toaster position="top-right" theme="dark" richColors />

      <Suspense fallback={null}>
        <ProfileCompletionCheck />
      </Suspense>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl pt-safe">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative w-8 h-8 lg:w-10 lg:h-10">
                <Image src="/aurie-official-logo.png" alt="Aura" fill className="object-contain" sizes="(max-width: 768px) 32px, 40px" />
              </div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white uppercase hidden sm:block">
                AURIE
              </h1>
            </Link>
          </div>

          <Suspense fallback={<div className="h-10 w-32 animate-pulse bg-white/5 rounded-lg border border-white/10" />}>
            <UserNav />
          </Suspense>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <Suspense fallback={<div className="hidden lg:flex w-64 border-r border-white/10 animate-pulse bg-white/5" />}>
          <Sidebar />
        </Suspense>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 overflow-x-hidden scrollbar-hide">
          <Suspense fallback={<div className="animate-pulse bg-white/5 h-screen rounded-xl" />}>
            {children}
          </Suspense>
          <Suspense fallback={null}>
            <FloatingChat />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

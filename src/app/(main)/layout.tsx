import { Suspense } from 'react'
import { RealtimeNotifications } from '@/shared/components/providers/RealtimeNotifications'
import { Toaster } from 'sonner'
import { ProfileCompletionCheck } from '@/shared/components/features/ProfileCompletionCheck'
import { GlassSidebar } from '@/shared/components/layout/GlassSidebar'
import { GlassHeader } from '@/shared/components/layout/GlassHeader'
import { FloatingChat } from '@/features/ai-assistant/components/FloatingChat'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-[#8b5cf6]/30 selection:text-white font-sans">
      <Suspense fallback={null}>
        <RealtimeNotifications />
      </Suspense>
      <Toaster position="top-right" theme="dark" richColors />

      <Suspense fallback={null}>
        <ProfileCompletionCheck />
      </Suspense>

      {/* Glass Header */}
      <GlassHeader />

      <div className="flex relative">
        {/* Glass Sidebar */}
        <GlassSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-x-hidden">
          <Suspense fallback={<div className="animate-pulse bg-white/5 h-screen rounded-2xl glass-panel" />}>
            {children}
          </Suspense>

          <div className="print:hidden">
            <Suspense fallback={null}>
              <FloatingChat />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

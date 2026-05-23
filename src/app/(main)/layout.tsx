import { Suspense } from 'react'
import { RealtimeNotifications } from '@/shared/components/providers/RealtimeNotifications'
import { PushSubscriptionManager } from '@/shared/components/providers/PushSubscriptionManager'
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
    <div className="min-h-screen bg-bg text-ink-700 selection:bg-accent/30 selection:text-paper font-sans">
      <Suspense fallback={null}>
        <RealtimeNotifications />
      </Suspense>
      <Suspense fallback={null}>
        <PushSubscriptionManager />
      </Suspense>
      <Suspense fallback={null}>
        <ProfileCompletionCheck />
      </Suspense>

      {/* Glass Header */}
      <Suspense fallback={<div className="h-[73px] w-full border-b border-white/5 bg-background/80 backdrop-blur-2xl" />}>
        <GlassHeader />
      </Suspense>


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

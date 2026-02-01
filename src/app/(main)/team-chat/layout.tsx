'use client'

import { ChatList } from '@/features/team-chat/components/ChatList'

export default function TeamChatLayout({
    children
}: {
    children: React.ReactNode
}) {
    // Height calculation: Screen height - Header height (approx 64px/4rem + padding?)
    // Actually typically handled by flex-1 in parent structure?
    // MainLayout has: min-h-screen -> flex -> main className="flex-1 ... min-w-0"
    // So h-full works if parent has height.
    // We want the chat to fill the available space. 
    // Usually main has "h-[calc(100vh-theme(spacing.header))]" if strict.
    // Let's assume h-[calc(100vh-80px)] approx.

    return (
        <div className="flex h-[calc(100vh-100px)] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-80 h-full border-r border-white/10 bg-black/20">
                <ChatList />
            </div>

            {/* Content Area (Mobile List OR Chat Window) */}
            <div className="flex-1 h-full min-w-0 bg-zinc-950/30 relative">
                {children}
            </div>
        </div>
    )
}

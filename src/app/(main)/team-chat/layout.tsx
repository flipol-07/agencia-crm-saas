'use client'

import { ChatList } from '@/features/team-chat/components/ChatList'

export default function TeamChatLayout({
    children
}: {
    children: React.ReactNode
}) {
    // A more cohesive layout without harsh separators
    return (
        <div className="flex h-[calc(100vh-100px)] rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-zinc-900/50 backdrop-blur-3xl">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-80 h-full border-r border-white/5 bg-transparent">
                <ChatList />
            </div>

            {/* Content Area */}
            <div className="flex-1 h-full min-w-0 bg-transparent relative">
                {children}
            </div>
        </div>
    )
}

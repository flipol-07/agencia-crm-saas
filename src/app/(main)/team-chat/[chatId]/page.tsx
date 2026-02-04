import { ChatWindow } from '@/features/team-chat/components/ChatWindow'
import { Suspense } from 'react'

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {


    return (
        <Suspense fallback={<div className="flex-1 bg-black/20 animate-pulse" />}>
            <ChatContent params={params} />
        </Suspense>
    )
}

async function ChatContent({ params }: { params: Promise<{ chatId: string }> }) {
    const resolvedParams = await params
    return <ChatWindow chatId={resolvedParams.chatId} />
}


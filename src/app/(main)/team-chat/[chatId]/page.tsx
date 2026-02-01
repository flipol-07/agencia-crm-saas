import { ChatWindow } from '@/features/team-chat/components/ChatWindow'

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const resolvedParams = await params
    return <ChatWindow chatId={resolvedParams.chatId} />
}

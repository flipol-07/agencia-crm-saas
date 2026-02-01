'use client'

import { ChatList } from '@/features/team-chat/components/ChatList'

export default function TeamChatPage() {
    return (
        <>
            {/* Mobile: Show Chat List */}
            <div className="md:hidden h-full">
                <ChatList />
            </div>

            {/* Desktop: Show Empty State */}
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="w-32 h-32 bg-lime-500/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-6xl">💬</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Chat de Equipo</h2>
                <p className="text-gray-400 max-w-sm">
                    Selecciona una conversación de la izquierda o inicia un nuevo chat para comunicarte con tu equipo.
                </p>
                <div className="text-xs text-zinc-600 mt-8">
                    🔒 Mensajes encriptados de extremo a extremo (simulado)
                </div>
            </div>
        </>
    )
}

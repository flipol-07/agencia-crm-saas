import type { Message } from '@/types/database'

export function MessageBubble({ message }: { message: Message }) {
    const isOutbound = message.direction === 'outbound'

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[80%] rounded-lg px-4 py-2 relative shadow-sm ${isOutbound
                        ? 'bg-[#005c4b] text-white rounded-tr-none' // Verde WhatsApp Dark
                        : 'bg-[#202c33] text-white rounded-tl-none' // Gris oscuro WhatsApp Dark
                    }`}
            >
                <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </p>

                <div className={`flex items-center justify-end gap-1 mt-1 ${isOutbound ? 'text-[#8696a0]' : 'text-gray-400'}`}>
                    <span className="text-[11px]">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOutbound && (
                        <span className={message.status === 'read' ? 'text-[#53bdeb]' : ''}>
                            {/* Doble check icónico */}
                            <svg viewBox="0 0 16 15" width="16" height="15" className="w-3 h-3 fill-current">
                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l3.272-4.186c.003-.005.007-.01.01-.015a.366.366 0 0 0-.064-.492z"></path>
                            </svg>
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

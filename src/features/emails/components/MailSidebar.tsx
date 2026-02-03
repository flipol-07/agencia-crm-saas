'use client'

import { useState } from 'react'
import { syncGlobalEmails } from '../actions/sync-global'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MailSidebarProps {
    selectedFolder: 'inbound' | 'outbound'
    onFolderSelect: (folder: 'inbound' | 'outbound') => void
    onCompose: () => void
}

export function MailSidebar({ selectedFolder, onFolderSelect, onCompose }: MailSidebarProps) {
    const [isSyncing, setIsSyncing] = useState(false)
    const router = useRouter()

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const result = await syncGlobalEmails()
            toast.success(`Sincronización completada. ${result.count} correos procesados.`)
            router.refresh()
        } catch (error) {
            toast.error('Error al sincronizar correos')
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="w-64 border-r border-white/10 flex flex-col bg-black/20 h-full">
            <div className="p-4 space-y-3">
                <button
                    onClick={onCompose}
                    className="w-full flex items-center justify-center gap-2 bg-brand text-black font-bold rounded-lg py-3 text-sm shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all hover:scale-[1.02]"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Redactar
                </button>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
            </div>

            <nav className="flex-1 p-2 space-y-1">
                <button
                    onClick={() => onFolderSelect('inbound')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFolder === 'inbound'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    Bandeja de Entrada
                </button>

                <button
                    onClick={() => onFolderSelect('outbound')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFolder === 'outbound'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviados
                </button>
            </nav>
        </div>
    )
}

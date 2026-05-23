'use client'

import { useState } from 'react'
import { syncGlobalEmails } from '../actions/sync-global'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Inbox, PencilLine, RefreshCw, Send } from 'lucide-react'

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
        <div className="flex h-full w-[72px] flex-col border-r border-[var(--divider)] bg-[var(--bg)] transition-all duration-300 md:w-[280px]">
            <div className="border-b border-[var(--divider)] px-3 py-4 md:px-5 md:py-5">
                <div className="hidden md:block">
                    <p className="text-xs font-medium uppercase text-[var(--ink-300)]">Buzon</p>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--ink-700)]">Correo</h2>
                </div>
                <div className="flex justify-center md:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--divider-strong)] bg-[var(--bg-2)] text-[var(--ochre)]">
                        <Inbox className="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-3 md:p-4">
                <button
                    onClick={onCompose}
                    className="flex w-full items-center justify-center rounded-2xl bg-[var(--ochre)] px-3 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,91,255,0.28)] transition-all hover:brightness-110 md:justify-start md:gap-2 md:px-4"
                    title="Redactar"
                >
                    <PencilLine className="h-5 w-5" />
                    <span className="hidden md:inline">Redactar</span>
                </button>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex w-full items-center justify-center rounded-2xl border border-[var(--divider-strong)] bg-[var(--bg-2)] px-3 py-2.5 text-sm font-medium text-[var(--ink-500)] transition-all hover:border-[var(--ochre)] hover:text-[var(--ink-700)] disabled:opacity-50 md:justify-start md:gap-2 md:px-4"
                    title="Sincronizar"
                >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 pb-4 md:px-4">
                <button
                    onClick={() => onFolderSelect('inbound')}
                    className={`flex w-full items-center justify-center rounded-2xl px-3 py-3 text-sm font-medium transition-colors md:justify-start md:gap-3 md:px-4 ${selectedFolder === 'inbound'
                        ? 'border border-[var(--divider-strong)] bg-[var(--ochre-soft)] text-[var(--ink-700)]'
                        : 'text-[var(--ink-400)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-700)]'
                        }`}
                    title="Bandeja de Entrada"
                >
                    <Inbox className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden md:inline">Bandeja de Entrada</span>
                </button>

                <button
                    onClick={() => onFolderSelect('outbound')}
                    className={`flex w-full items-center justify-center rounded-2xl px-3 py-3 text-sm font-medium transition-colors md:justify-start md:gap-3 md:px-4 ${selectedFolder === 'outbound'
                        ? 'border border-[var(--divider-strong)] bg-[var(--ochre-soft)] text-[var(--ink-700)]'
                        : 'text-[var(--ink-400)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-700)]'
                        }`}
                    title="Enviados"
                >
                    <Send className="h-5 w-5 flex-shrink-0" />
                    <span className="hidden md:inline">Enviados</span>
                </button>
            </nav>
        </div>
    )
}

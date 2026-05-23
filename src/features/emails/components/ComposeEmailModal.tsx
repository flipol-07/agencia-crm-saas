'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { sendEmailAction } from '../actions/send'
import { Send, X } from 'lucide-react'

interface ComposeEmailModalProps {
    isOpen: boolean
    onClose: () => void
    initialTo?: string
    initialSubject?: string
    initialBody?: string
}

export function ComposeEmailModal({ isOpen, onClose, initialTo = '', initialSubject = '', initialBody = '' }: ComposeEmailModalProps) {
    const [to, setTo] = useState(initialTo)
    const [subject, setSubject] = useState(initialSubject)
    const [body, setBody] = useState(initialBody)
    const [isSending, setIsSending] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTo(initialTo)
            setSubject(initialSubject)
            setBody(initialBody)
        }
    }, [isOpen, initialTo, initialSubject, initialBody])

    /* Close on escape */
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)

        const formData = new FormData()
        formData.append('to', to)
        formData.append('subject', subject)
        formData.append('body', body)

        try {
            const result = await sendEmailAction(formData)
            if (result.success) {
                toast.success('Correo enviado correctamente')
                onClose()
            } else {
                toast.error(result.error || 'Error al enviar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setIsSending(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[var(--divider)] bg-[var(--bg)] shadow-[0_30px_90px_rgba(0,0,0,0.45)] animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-4 md:px-5">
                    <div>
                        <p className="text-xs font-medium uppercase text-[var(--ink-300)]">Correo</p>
                        <h3 className="text-lg font-semibold text-[var(--ink-700)]">Nuevo mensaje</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--divider-strong)] bg-[var(--bg-2)] text-[var(--ink-400)] transition-colors hover:text-[var(--ink-700)]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--ink-400)]">Para</label>
                            <input
                                type="email"
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="w-full rounded-2xl border border-[var(--divider)] bg-[var(--bg-2)] px-4 py-3 text-[var(--ink-700)] placeholder:text-[var(--ink-300)] focus:border-[var(--ochre)] focus:outline-none"
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--ink-400)]">Asunto</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full rounded-2xl border border-[var(--divider)] bg-[var(--bg-2)] px-4 py-3 text-[var(--ink-700)] placeholder:text-[var(--ink-300)] focus:border-[var(--ochre)] focus:outline-none"
                                required
                                placeholder="Asunto del mensaje"
                            />
                        </div>
                        <div className="flex-1 h-full min-h-[200px]">
                            <label className="mb-1 block text-sm font-medium text-[var(--ink-400)]">Mensaje</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                className="h-full min-h-[240px] w-full resize-none rounded-3xl border border-[var(--divider)] bg-[var(--bg-2)] px-4 py-3 font-sans text-[var(--ink-700)] placeholder:text-[var(--ink-300)] focus:border-[var(--ochre)] focus:outline-none"
                                required
                                placeholder="Escribe tu mensaje aquí..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[var(--divider)] bg-[var(--bg-2)] px-4 py-4 md:px-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full px-4 py-2 font-medium text-[var(--ink-500)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink-700)]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

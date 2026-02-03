'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { sendEmailAction } from '../actions/send'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Nuevo Mensaje</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Para:</label>
                            <input
                                type="email" // or text for multiple (simple for now)
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand/50"
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Asunto:</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand/50"
                                required
                                placeholder="Asunto del mensaje"
                            />
                        </div>
                        <div className="flex-1 h-full min-h-[200px]">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Mensaje:</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                className="w-full h-full min-h-[200px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand/50 resize-none font-sans"
                                required
                                placeholder="Escribe tu mensaje aquí..."
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="px-6 py-2 bg-brand text-black font-bold rounded-lg hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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

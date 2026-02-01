'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
    userId: string
}

export function ProfileCompletionModal({ userId }: Props) {
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName.trim()) return

        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim() })
                .eq('id', userId)

            if (error) throw error

            toast.success('¡Perfil actualizado!')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar nombre')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-lime-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-lime-500/10 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-lime-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-lime-500/20">
                        <span className="text-3xl">👋</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Bienvenido a Aurie!</h2>
                    <p className="text-gray-400">
                        Para empezar, necesitamos saber cómo te llamas. Este nombre aparecerá en tu perfil y en las interacciones del CRM.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-lime-500 tracking-widest pl-1">
                            Tu Nombre Completo
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all placeholder:text-gray-600 font-medium"
                            placeholder="Ej: Ana García"
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!fullName.trim() || loading}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-lime-500/20"
                    >
                        {loading ? 'Guardando...' : 'COMENZAR A USAR EL CRM →'}
                    </button>
                </form>
            </div>
        </div>
    )
}

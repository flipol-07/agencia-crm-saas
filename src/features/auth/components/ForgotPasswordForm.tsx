'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/actions/auth'

export function ForgotPasswordForm() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        setSuccess(false)

        const result = await resetPassword(formData)

        if (result?.error) {
            setError(result.error)
        } else if (result?.success) {
            setSuccess(true)
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 mx-auto bg-lime-400/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">¡Revisa tu email!</h3>
                <p className="text-gray-400">
                    Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
                </p>
                <Link
                    href="/login"
                    className="inline-block text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Volver al login
                </Link>
            </div>
        )
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-200"
                    placeholder="tu@email.com"
                />
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-transparent border-2 border-lime-400 text-white font-medium rounded-lg hover:bg-lime-400/10 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Enviando...</span>
                    </>
                ) : (
                    <span>Enviar enlace de recuperación</span>
                )}
            </button>

            <p className="text-center text-sm text-gray-400">
                <Link
                    href="/login"
                    className="text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Volver al login
                </Link>
            </p>
        </form>
    )
}

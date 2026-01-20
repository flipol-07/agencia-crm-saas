'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'

export function LoginForm() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await login(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
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

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-200"
                    placeholder="••••••••"
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
                        <span>Iniciando sesión...</span>
                    </>
                ) : (
                    <span>Iniciar sesión</span>
                )}
            </button>

            <div className="flex items-center justify-between text-sm">
                <Link
                    href="/forgot-password"
                    className="text-gray-400 hover:text-lime-400 transition-colors"
                >
                    ¿Olvidaste tu contraseña?
                </Link>
                <Link
                    href="/signup"
                    className="text-lime-400 hover:text-lime-300 transition-colors"
                >
                    Crear cuenta
                </Link>
            </div>
        </form>
    )
}

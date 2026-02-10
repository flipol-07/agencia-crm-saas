'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { motion } from 'framer-motion'
import Image from 'next/image'

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

    async function handleGoogleLogin() {
        setLoading(true)
        setError(null)

        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                throw error
            }
        } catch (err: any) {
            console.error('Google login error:', err)
            setError(err.message || 'Error al iniciar sesión con Google')
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-16 h-16 mx-auto mb-6"
                >
                    <div className="absolute inset-0 bg-brand-neon-purple/20 blur-xl rounded-full animate-pulse" />
                    <Image src="/aurie-official-logo.png" alt="Aurie" fill className="object-contain relative z-10" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold tracking-tight text-white font-display"
                >
                    Bienvenido a Aurie
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-text-secondary"
                >
                    Tu sistema operativo de agencia inteligente
                </motion.p>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-8 rounded-2xl relative overflow-hidden"
            >
                {/* Decorative top border gradient */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent" />

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
                            Email Corporativo
                        </label>
                        <div className="relative group">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:bg-white/10 transition-all duration-300"
                                placeholder="tu@empresa.com"
                            />
                            <div className="absolute inset-0 rounded-xl bg-brand-purple/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
                            Contraseña
                        </label>
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:bg-white/10 transition-all duration-300"
                                placeholder="••••••••"
                            />
                            <div className="absolute inset-0 rounded-xl bg-brand-purple/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm"
                        >
                            <p className="text-sm text-red-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-purple to-brand-brand text-white font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Accediendo...</span>
                            </>
                        ) : (
                            <span>Iniciar Sesión</span>
                        )}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                        <span className="px-4 bg-[#020617] text-text-muted">O continúa con</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="relative z-10">Google</span>
                    </button>

                    <div className="flex justify-center text-sm mt-6 pt-2">
                        <Link
                            href="/forgot-password"
                            className="text-text-secondary hover:text-brand-neon-purple transition-colors text-xs"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

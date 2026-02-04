'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/actions/auth'
import { motion } from 'framer-motion'
import Image from 'next/image'

export function SignupForm() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await signup(formData)

        if (result?.error) {
            setError(result.error)
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
                    <div className="absolute inset-0 bg-brand-neon-blue/20 blur-xl rounded-full animate-pulse" />
                    <Image src="/aurie-official-logo.png" alt="Aurie" fill className="object-contain relative z-10" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold tracking-tight text-white font-display"
                >
                    Únete a Aurie
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-text-secondary"
                >
                    Comienza a optimizar tu agencia hoy
                </motion.p>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-8 rounded-2xl relative overflow-hidden"
            >
                {/* Decorative top border gradient */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-neon-blue/50 to-transparent" />

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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon-blue focus:ring-1 focus:ring-brand-neon-blue focus:bg-white/10 transition-all duration-300"
                                placeholder="tu@empresa.com"
                            />
                            <div className="absolute inset-0 rounded-xl bg-brand-neon-blue/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
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
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon-blue focus:ring-1 focus:ring-brand-neon-blue focus:bg-white/10 transition-all duration-300"
                                placeholder="Mínimo 8 caracteres"
                            />
                            <div className="absolute inset-0 rounded-xl bg-brand-neon-blue/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="confirm-password" className="block text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
                            Confirmar contraseña
                        </label>
                        <div className="relative group">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon-blue focus:ring-1 focus:ring-brand-neon-blue focus:bg-white/10 transition-all duration-300"
                                placeholder="Repite tu contraseña"
                            />
                            <div className="absolute inset-0 rounded-xl bg-brand-neon-blue/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
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
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-neon-blue to-brand-cyan text-black font-bold rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-neon-blue focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] mt-4"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Creando cuenta...</span>
                            </>
                        ) : (
                            <span>Crear cuenta</span>
                        )}
                    </button>

                    <div className="flex items-center justify-center text-sm pt-4">
                        <span className="text-text-muted mr-2">¿Ya tienes cuenta?</span>
                        <Link
                            href="/login"
                            className="text-brand-neon-blue hover:text-brand-cyan transition-colors font-medium hover:underline"
                        >
                            Inicia sesión
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

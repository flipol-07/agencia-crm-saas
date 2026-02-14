'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MobileNav } from '@/shared/components/layout/MobileNav'
import { NotificationBell } from '@/shared/components/layout/NotificationBell'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

function UserNav() {
    const [user, setUser] = useState<User | null>(null)
    const [alias, setAlias] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser()
            if (data?.user) {
                setUser(data.user)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', data.user.id)
                    .single()
                if (profile?.full_name) {
                    setAlias(profile.full_name)
                }
            }
        }
        getUser()
    }, [supabase])

    const handleSignOut = async () => {
        const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?')
        if (!confirmed) return

        await supabase.auth.signOut()
        router.push('/login')
    }

    if (!user) return null

    return (
        <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-white tracking-wide">{alias || user.email}</span>
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-2" />

            <div className="flex items-center">
                <div className="relative group">
                    <div className="absolute inset-0 bg-brand/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <NotificationBell />
                </div>
            </div>

            <button
                onClick={handleSignOut}
                className="group relative p-2 rounded-lg hover:bg-white/5 transition-all outline-none"
                title="Cerrar sesión"
            >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
    )
}

export function GlassHeader() {
    const pathname = usePathname()
    const isEditor = pathname?.match(/\/settings\/templates\/[^\/]+/) && pathname !== '/settings/templates/new'

    if (isEditor) return null

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-2xl pt-safe supports-[backdrop-filter]:bg-background/60">
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-50" />

            <div className="flex items-center justify-between px-4 lg:px-6 py-4">
                <div className="flex items-center gap-6">
                    <Suspense fallback={null}>
                        <MobileNav />
                    </Suspense>
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8 lg:w-10 lg:h-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full animate-pulse" />
                            <Image src="/brand/logo.png" alt="Aurie" fill className="object-contain relative z-10" sizes="(max-width: 768px) 32px, 40px" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-widest text-white uppercase font-display">
                            AURIE
                            <span className="text-brand-neon-purple text-glow">.</span>
                        </h1>
                    </Link>
                </div>

                <div className="flex items-center">
                    <Suspense fallback={<div className="h-10 w-32 animate-pulse bg-white/5 rounded-lg border border-white/10" />}>
                        <UserNav />
                    </Suspense>
                </div>
            </div>
        </header>
    )
}

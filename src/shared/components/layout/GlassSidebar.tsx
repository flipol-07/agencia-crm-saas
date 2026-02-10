'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

function SidebarContent() {
    const pathname = usePathname()
    const { totalUnread, teamUnread } = useNotificationStore()

    const isEditor = pathname?.match(/\/settings\/templates\/[^\/]+/) && pathname !== '/settings/templates/new'
    if (isEditor) return null

    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(`${path}/`))

    const links = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            href: '/calendar',
            label: 'Calendario',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: '/pipeline',
            label: 'Pipeline',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            href: '/contacts',
            label: 'Contactos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            isContact: true
        },
        {
            href: '/tasks',
            label: 'Tareas',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            href: '/invoices',
            label: 'Facturas',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            href: '/team-chat',
            label: 'Chat de Equipo',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        },
        {
            href: '/meetings',
            label: 'Reuniones',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: '/mail',
            label: 'Correo',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: '/expenses',
            label: 'Economía',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            href: '/lead-scraper',
            label: 'Lead Scraper',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            href: '/settings',
            label: 'Configuración',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ]

    const mainLinks = links.filter(l => l.href !== '/settings')
    const settingsLink = links.find(l => l.href === '/settings')

    return (
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 sticky top-[73px] h-[calc(100vh-73px)] overflow-hidden bg-background/30 backdrop-blur-2xl">
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide py-6">
                {mainLinks.map((link) => {
                    const active = isActive(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
                                ? 'bg-brand/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-brand/20'
                                : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {/* Active Glow Indicator */}
                            {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-r-full shadow-[0_0_10px_#8b5cf6]" />
                            )}

                            <div className={`transition-colors relative z-10 ${active ? 'text-brand drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-current group-hover:text-brand transition-colors duration-300'}`}>
                                {link.icon}
                            </div>
                            <span className="font-medium flex-1 relative z-10 tracking-wide text-sm">{link.label}</span>

                            {(link as any).isContact && totalUnread > 0 && (
                                <span className="bg-brand-neon-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center relative z-10 shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                                    {totalUnread}
                                </span>
                            )}
                            {link.href === '/team-chat' && teamUnread > 0 && (
                                <span className="bg-brand-neon-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center animate-pulse relative z-10 shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                                    {teamUnread}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {settingsLink && (
                <div className="p-4 border-t border-white/5 mt-auto bg-black/20">
                    <Link
                        href={settingsLink.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive(settingsLink.href)
                            ? 'bg-brand-neon-purple/10 text-white shadow-[0_0_15px_rgba(217,70,239,0.15)] border border-brand-neon-purple/20'
                            : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <div className={`transition-colors relative z-10 ${isActive(settingsLink.href) ? 'text-brand-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'text-current group-hover:text-brand-neon-purple transition-colors duration-300'}`}>
                            {settingsLink.icon}
                        </div>
                        <span className="font-medium flex-1 tracking-wide text-sm">Configuración</span>
                    </Link>
                </div>
            )}
        </aside>
    )
}

export function GlassSidebar() {
    return (
        <Suspense fallback={<div className="hidden lg:flex w-64 fixed top-[73px] bottom-0 left-0 border-r border-white/5 animate-pulse bg-background/30 backdrop-blur-xl" />}>
            <SidebarContent />
        </Suspense>
    )
}

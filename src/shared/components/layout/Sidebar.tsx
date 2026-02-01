'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

function SidebarContent() {
    const pathname = usePathname()
    const { totalUnread } = useNotificationStore()

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

    const links = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
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
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 min-h-[calc(100vh-73px)]">
            <nav className="flex-1 p-4 space-y-1">
                {mainLinks.map((link) => {
                    const active = isActive(link.href)
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${active
                                ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className={`transition-colors ${active ? 'text-brand' : 'text-current group-hover:text-white'}`}>
                                {link.icon}
                            </div>
                            <span className="font-medium flex-1">{link.label}</span>
                            {(link as any).isContact && totalUnread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {totalUnread}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {settingsLink && (
                <div className="p-4 border-t border-white/10 mt-auto">
                    <Link
                        href={settingsLink.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive(settingsLink.href)
                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className={`transition-colors ${isActive(settingsLink.href) ? 'text-brand' : 'text-current group-hover:text-white'}`}>
                            {settingsLink.icon}
                        </div>
                        <span className="font-medium flex-1">Ajustes</span>
                    </Link>
                </div>
            )}
        </aside>
    )
}

export function Sidebar() {
    return (
        <Suspense fallback={<div className="hidden lg:flex w-64 fixed top-[73px] bottom-0 left-0 border-r border-white/10 animate-pulse bg-white/5" />}>
            <SidebarContent />
        </Suspense>
    )
}

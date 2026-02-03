'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/settings' && pathname === '/settings') return true
        if (path !== '/settings' && pathname.startsWith(path)) return true
        return false
    }

    return (
        <div className="flex h-full bg-[#0a0a0a]">
            <aside className="w-64 border-r border-white/5 p-6 bg-black/20">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white uppercase tracking-wider">Ajustes</h1>
                </div>

                <nav className="space-y-1">
                    <Link
                        href="/settings"
                        className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/settings')
                                ? 'bg-lime-400 text-black font-bold'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        General
                    </Link>
                    <Link
                        href="/settings/templates"
                        className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/settings/templates')
                                ? 'bg-lime-400 text-black font-bold'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        Plantillas
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 overflow-auto bg-[#0a0a0a] text-white">
                {children}
            </main>
        </div>
    )
}

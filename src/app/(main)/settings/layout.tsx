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
        <div className="flex flex-col lg:flex-row h-full bg-black relative overflow-hidden selection:bg-brand/30 selection:text-brand">
            {/* Global Ambient Background for Settings */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px] opacity-30 animate-pulse-slow delay-1000" />
            </div>

            {/* Mobile Tab Navigation */}
            <nav className="flex lg:hidden items-center gap-2 p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20 sticky top-0 overflow-x-auto scrollbar-hide">
                <Link
                    href="/settings"
                    className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${isActive('/settings')
                        ? 'bg-brand/10 text-brand border-brand/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'text-gray-500 border-transparent hover:text-white'
                        }`}
                >
                    <span className={`w-1 h-1 rounded-full ${isActive('/settings') ? 'bg-brand' : 'bg-gray-600'}`}></span>
                    Fiscal / CRM
                </Link>
                <Link
                    href="/settings/templates"
                    className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border ${isActive('/settings/templates')
                        ? 'bg-brand/10 text-brand border-brand/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'text-gray-500 border-transparent hover:text-white'
                        }`}
                >
                    <span className={`w-1 h-1 rounded-full ${isActive('/settings/templates') ? 'bg-brand' : 'bg-gray-600'}`}></span>
                    Plantillas
                </Link>
            </nav>

            <aside className="hidden lg:flex w-72 border-r border-white/5 p-6 bg-black/40 backdrop-blur-xl z-10 flex-col">
                <div className="mb-10 pl-2 border-l-2 border-brand">
                    <h1 className="text-xl font-display font-black text-white uppercase tracking-widest leading-none">Ajustes</h1>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Configuración General</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <Link
                        href="/settings"
                        className={`group flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isActive('/settings')
                            ? 'bg-brand/10 text-brand border border-brand/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive('/settings') ? 'bg-brand shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'bg-gray-600 group-hover:bg-white'}`}></span>
                        General / Fiscal
                    </Link>
                    <Link
                        href="/settings/templates"
                        className={`group flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isActive('/settings/templates')
                            ? 'bg-brand/10 text-brand border border-brand/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive('/settings/templates') ? 'bg-brand shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'bg-gray-600 group-hover:bg-white'}`}></span>
                        Plantillas Facturas
                    </Link>
                </nav>

                <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                        <strong className="text-white">Tip Pro:</strong> Mantén tus datos fiscales actualizados para evitar errores en la generación automática de facturas.
                    </p>
                </div>
            </aside>
            <main className="flex-1 overflow-auto relative z-10 custom-scrollbar p-5 lg:p-8">
                {children}
            </main>
        </div>
    )
}

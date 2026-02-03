import { Suspense } from 'react'

export const metadata = {
    title: 'Correo | Aurie CRM',
    description: 'Gestión global de correos electrónicos',
}

export default function MailLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col">
            <Suspense fallback={<div className="flex-1 animate-pulse bg-white/5 rounded-xl" />}>
                {children}
            </Suspense>
        </div>
    )
}

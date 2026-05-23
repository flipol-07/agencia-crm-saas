'use client'

import { useState } from 'react'

export function PrintButton() {
    const [busy, setBusy] = useState(false)

    const handleDownload = async () => {
        const id = window.location.pathname.split('/').filter(Boolean).pop()
        if (!id) return
        setBusy(true)
        try {
            const res = await fetch(`/api/invoices/${id}/pdf`)
            if (!res.ok) {
                const text = await res.text()
                alert('No se pudo generar el PDF: ' + text.slice(0, 200))
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const cd = res.headers.get('Content-Disposition') || ''
            const match = cd.match(/filename="([^"]+)"/)
            link.download = match?.[1] || `factura-${id}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            alert('Error de red descargando el PDF.')
            console.error(e)
        } finally {
            setBusy(false)
        }
    }

    const handlePrint = () => {
        const id = window.location.pathname.split('/').filter(Boolean).pop()
        if (id) window.open(`/print/invoices/${id}`, '_blank')
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handleDownload}
                disabled={busy}
                className="px-5 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-purple transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                {busy ? 'Generando…' : 'Descargar PDF'}
            </button>
            <button
                onClick={handlePrint}
                className="px-4 py-2 border border-white/10 text-text-secondary font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
                title="Abrir vista de impresión (canvas)"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
            </button>
        </div>
    )
}

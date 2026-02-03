'use client'

export function PrintButton() {
    return (
        <button
            onClick={() => {
                const id = window.location.pathname.split('/').pop()
                if (id) window.open(`/print/invoices/${id}`, '_blank')
            }}
            className="px-6 py-2 bg-lime-400 text-black font-semibold rounded-lg hover:bg-lime-300 transition-colors flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir / PDF
        </button>
    )
}

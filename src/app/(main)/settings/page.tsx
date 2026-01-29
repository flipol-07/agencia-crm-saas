'use client'

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto py-8 text-white space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Configuración</h1>
                <p className="text-gray-400">Estado de las integraciones de tu agencia.</p>
            </div>

            <div className="glass p-8 rounded-xl border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lime-500/20 rounded-lg flex items-center justify-center text-lime-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Privacidad y Canales</h2>
                        <p className="text-gray-400 text-sm">Los canales externos están desactivados</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Por motivos de privacidad y seguridad, las integraciones directas de mensajería (WhatsApp/Evolution API) 
                        se han deshabilitado en la interfaz. El CRM se centrará en la gestión de datos, facturación y tareas.
                    </p>
                </div>
            </div>
        </div>
    )
}

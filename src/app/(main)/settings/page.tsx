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
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306.942.315 1.28.308.381-.008 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">WhatsApp (Evolution API)</h2>
                        <p className="text-green-400 text-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Conectado vía Variables de Entorno
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        La integración con WhatsApp ahora funciona automáticamente para el envío y recepción de mensajes.
                        No es necesario realizar una sincronización inicial del historial.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Webhook Status</span>
                        <span className="text-green-400 font-medium">Activo</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Backend System</span>
                        <span className="text-white font-mono text-xs opacity-50">Node.js Serverless</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

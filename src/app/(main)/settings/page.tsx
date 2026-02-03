
import { SettingsForm } from '@/features/settings/components/SettingsForm'


export default function SettingsPage() {
    return (
        <div className="max-w-4xl p-8 space-y-8">
            <div>
                <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">Datos de Facturación</h2>
                <p className="text-sm text-gray-400">Información que aparecerá en tus facturas.</p>
            </div>

            <SettingsForm />
        </div>
    )
}

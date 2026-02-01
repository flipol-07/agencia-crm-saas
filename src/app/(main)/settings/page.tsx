
import { SettingsForm } from '@/features/settings/components/SettingsForm'


export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">Ajustes</h1>
                <p className="text-gray-400">Configura los datos de tu empresa para la facturación.</p>
            </header>

            <SettingsForm />
        </div>
    )
}

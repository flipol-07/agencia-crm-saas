import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { findDuplicates } from '@/features/contacts/services/duplicates.service'
import { DuplicatesClient } from '@/features/contacts/components/DuplicatesClient'

export default async function DuplicatesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const duplicates = await findDuplicates(user.id, 0.8)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink-700">Detectar duplicados</h1>
                <p className="text-sm text-ink-400 mt-1">
                    Pares de contactos con coincidencia en email, teléfono o nombre similar. Revisa y fusiona.
                </p>
            </div>

            {duplicates.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
                    <p className="text-ink-500">🎉 No se han detectado duplicados.</p>
                </div>
            ) : (
                <DuplicatesClient duplicates={duplicates} />
            )}
        </div>
    )
}

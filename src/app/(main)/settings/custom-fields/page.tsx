import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomFieldsManager } from './CustomFieldsManager'
import { listCustomFieldDefinitionsAction } from '@/features/contacts/actions/customFieldActions'

export const metadata = {
    title: 'Campos personalizados | CRM',
    description: 'Define campos extra para tus contactos',
}

export default async function CustomFieldsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const res = await listCustomFieldDefinitionsAction()
    const fields = res.success && res.data ? res.data : []

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            <div className="pb-6 border-b border-white/5">
                <h1 className="text-xl sm:text-2xl font-semibold text-ink-700 tracking-tight">
                    Campos personalizados
                </h1>
                <p className="text-sm text-ink-400 mt-1">
                    Añade campos extra a tus contactos sin tocar el código.
                </p>
            </div>
            <CustomFieldsManager initialFields={fields} />
        </div>
    )
}

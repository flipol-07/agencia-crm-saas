import { createClient } from '@supabase/supabase-js'
import { analyzeMeetingText } from '@/features/meetings/actions/process-meeting'
import { NextResponse } from 'next/server'

/**
 * Endpoint para recibir webhooks de Fathom Video Recorder
 */
export async function POST(req: Request) {
    try {
        const payload = await req.json()
        console.log('Webhook recibido de Fathom:', JSON.stringify(payload, null, 2))

        const recording = payload.recording || payload

        const {
            title,
            transcript,
            summary: fathomSummary,
            action_items,
            at: date,
            id: fathomId
        } = recording

        if (!fathomId) {
            return NextResponse.json({ error: 'No recording ID found' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Evitar duplicados: Ver si ya existe este ID de Fathom
        const { data: existing } = await supabase
            .from('meetings')
            .select('id')
            .eq('external_id', fathomId)
            .single()

        if (existing) {
            console.log('Reunión ya registrada, saltando duplicado:', fathomId)
            return NextResponse.json({ success: true, message: 'Duplicate skipped' })
        }

        if (!transcript) {
            return NextResponse.json({ error: 'No transcript found' }, { status: 400 })
        }

        // 2. Determinar a qué usuario de Aurie pertenece la reunión
        // Buscamos al organizador en nuestra tabla de perfiles/usuarios
        let userId = null
        if (recording.organizer_email) {
            // Intentar buscar por el email del organizador que envía Fathom
            const { data: user } = await supabase
                .from('profiles') // Asumiendo que hay una tabla 'profiles' con email
                .select('id')
                .eq('email', recording.organizer_email)
                .single()

            if (user) userId = (user as any).id
        }

        // 3. Análisis Aurie
        const analysis = await analyzeMeetingText(transcript)

        // 4. Buscar contacto
        let contactId = null
        if (recording.attendees && Array.isArray(recording.attendees)) {
            // Filtramos emails internos (esto se podría mejorar con una variable de entorno de dominio)
            const guest = recording.attendees.find((a: any) => a.email && !a.email.includes('aurie'))
            if (guest) {
                const { data: contact } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('email', guest.email)
                    .single()
                if (contact) contactId = (contact as any).id
            }
        }

        // 5. Guardar
        const { error: dbError } = await (supabase.from('meetings') as any).insert({
            title: title || 'Reunión de Fathom',
            date: date || new Date().toISOString(),
            contact_id: contactId,
            transcription: transcript,
            summary: analysis.summary || fathomSummary,
            key_points: analysis.key_points || [],
            conclusions: analysis.conclusions || (action_items ? [action_items] : []),
            feedback: analysis.feedback,
            external_id: fathomId,
            user_id: userId // Si no lo encontramos, se insertará como null o fallará según RLS
        })

        if (dbError) {
            console.error('Error guardando reunión:', dbError)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Reunión procesada sin duplicados' })

    } catch (error: any) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

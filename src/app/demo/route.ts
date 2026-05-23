import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_EMAIL } from '@/shared/lib/demo'
import { DEMO_INVOICE_TEMPLATES, type DemoInvoiceTemplate } from '@/features/invoices/demo/demo-invoice-templates'
import type { InvoiceTemplateConfig } from '@/types/database'

type CookieOptions = {
    name: string
    value: string
    options?: Record<string, unknown>
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'AurieDemo2026!'

export async function GET(request: NextRequest) {
    const redirectTo = new URL('/dashboard', request.url)
    const response = NextResponse.redirect(redirectTo)
    const admin = createAdminClient()

    const demoUserId = await ensureDemoUser(admin)
    await seedDemoData(admin, demoUserId)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieOptions[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    await supabase.auth.signOut()
    const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
    })

    if (error) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('No se pudo iniciar la demo')}`, request.url))
    }

    response.cookies.set('aurie_demo', '1', {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
    })

    return response
}

async function ensureDemoUser(admin: ReturnType<typeof createAdminClient>) {
    const { data: existingProfile } = await (admin.from('profiles') as any)
        .select('id')
        .eq('email', DEMO_EMAIL)
        .maybeSingle()

    let userId = existingProfile?.id as string | undefined

    if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            email_confirm: true,
            user_metadata: {
                full_name: 'Demo Aurie',
            },
        })

        if (error && !error.message.toLowerCase().includes('already')) {
            throw new Error(error.message)
        }

        userId = data.user?.id
    }

    if (!userId) {
        const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        userId = users.users.find(user => user.email?.toLowerCase() === DEMO_EMAIL.toLowerCase())?.id
    }

    if (!userId) {
        throw new Error('No se pudo crear o encontrar el usuario demo')
    }

    await admin.auth.admin.updateUserById(userId, {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
    })

    await (admin.from('profiles') as any).upsert({
        id: userId,
        email: DEMO_EMAIL,
        full_name: 'Demo Aurie',
        professional_role: 'Dirección / Gerencia',
        professional_description: 'Cuenta de demostración con datos ficticios para eventos y presentaciones.',
        billing_name: 'Aurie Demo SL',
        billing_tax_id: 'B10998877',
        billing_address: 'Calle Innovación 21, 28020 Madrid',
        billing_email: DEMO_EMAIL,
        billing_phone: '+34 600 000 000',
        invoice_prefix: 'DEMO-',
        next_invoice_number: 1043,
        default_irpf_rate: 0,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    return userId
}

async function seedDemoData(admin: ReturnType<typeof createAdminClient>, userId: string) {
    const now = new Date()
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
    const dateDaysAgo = (days: number) => daysAgo(days).slice(0, 10)

    const contacts = [
        {
            company_name: 'Nova Retail Group',
            contact_name: 'Laura Martín',
            email: 'laura.martin@nova-retail.demo',
            phone: '+34 611 234 001',
            tax_id: 'B88441230',
            tax_address: 'Paseo Comercial 18, 08015 Barcelona',
            status: 'proposal',
            pipeline_stage: 'enviada',
            source: 'inbound_email',
            created_by: userId,
            assigned_to: userId,
            estimated_value: 18500,
            website: 'https://nova-retail.example',
            services: ['CRM IA', 'Automatización', 'Reporting'],
            notes: 'Interesados en automatizar seguimiento comercial y reporting por tienda.',
            ai_description: 'Empresa retail con varias sedes. Oportunidad clara para centralizar datos comerciales y automatizar seguimiento.',
            probability_close: 78,
            inactivity_status: 'active',
            last_interaction: daysAgo(2),
            pain_points: ['Seguimiento comercial disperso', 'Poca visibilidad de pipeline'],
            requirements: ['Dashboard ejecutivo', 'Automatización de tareas', 'Facturación integrada'],
        },
        {
            company_name: 'Clínica Atlas',
            contact_name: 'Dr. Sergio Ramos',
            email: 'sergio@clinica-atlas.demo',
            phone: '+34 611 234 002',
            tax_id: 'B76221910',
            tax_address: 'Avenida Salud 44, 46010 Valencia',
            status: 'qualified',
            pipeline_stage: 'cualificacion',
            source: 'website',
            created_by: userId,
            assigned_to: userId,
            estimated_value: 9200,
            website: 'https://clinica-atlas.example',
            services: ['Agenda inteligente', 'Análisis reuniones'],
            notes: 'Quieren reducir trabajo administrativo y mejorar el seguimiento de pacientes corporativos.',
            ai_description: 'Potencial alto si se enfoca la propuesta en ahorro operativo y trazabilidad.',
            probability_close: 58,
            inactivity_status: 'warning',
            last_interaction: daysAgo(16),
            pain_points: ['Administración manual', 'Pérdida de contexto entre reuniones'],
            requirements: ['Automatización de agenda', 'Resumen de reuniones'],
        },
        {
            company_name: 'Alba Consulting',
            contact_name: 'Marta Soler',
            email: 'marta@alba-consulting.demo',
            phone: '+34 611 234 003',
            tax_id: 'B44129001',
            tax_address: 'Calle Estrategia 7, 28004 Madrid',
            status: 'prospect',
            pipeline_stage: 'nuevo',
            source: 'referral',
            created_by: userId,
            assigned_to: userId,
            estimated_value: 4800,
            website: 'https://alba-consulting.example',
            services: ['Facturación', 'Economía'],
            notes: 'Caso ideal para enseñar facturas y gastos con comprobantes.',
            ai_description: 'Cliente sensible a productividad administrativa. Recomendado demostrar facturas y análisis de gastos.',
            probability_close: 42,
            inactivity_status: 'inactive',
            last_interaction: daysAgo(35),
            pain_points: ['Facturación repetitiva', 'Archivo manual de tickets'],
            requirements: ['Generación de facturas', 'OCR de comprobantes'],
        },
    ]

    const contactRows = []
    for (const contact of contacts) {
        const data = await upsertContactByEmail(admin, contact)
        if (data) contactRows.push(data)
    }

    const nova = contactRows.find(row => row.email === 'laura.martin@nova-retail.demo')
    const atlas = contactRows.find(row => row.email === 'sergio@clinica-atlas.demo')
    const alba = contactRows.find(row => row.email === 'marta@alba-consulting.demo')
    const templates = await ensureDemoInvoiceTemplates(admin, userId)

    await (admin.from('expenses') as any)
        .delete()
        .eq('user_id', userId)

    await (admin.from('expenses') as any).insert([
        {
            user_id: userId,
            type: 'expense',
            amount: 126.5,
            currency: 'EUR',
            date: dateDaysAgo(4),
            description: 'Cena con cliente - Factura analizada por IA:\nProveedor: Restaurante Demo\nNIF/CIF: B00000000\nNº factura: F-2026-041\nFecha factura: ' + dateDaysAgo(4) + '\nBase imponible: 115.00 EUR\nIVA: 11.50 EUR (10%)\nTotal: 126.50 EUR\nResumen: Comida de trabajo con cliente potencial.',
            is_personal: false,
            tax_deductible: true,
            tax_rate: 10,
            receipt_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        },
        {
            user_id: userId,
            type: 'expense',
            amount: 89.9,
            currency: 'EUR',
            date: dateDaysAgo(9),
            description: 'Suscripción SaaS de automatización',
            is_personal: false,
            tax_deductible: true,
            tax_rate: 21,
            receipt_url: null,
        },
        {
            user_id: userId,
            type: 'income',
            amount: 2400,
            currency: 'EUR',
            date: dateDaysAgo(12),
            description: 'Pago proyecto demo Nova Retail',
            is_personal: false,
            tax_deductible: false,
            tax_rate: 0,
            receipt_url: null,
        },
    ])

    const demoInvoices = [
        {
            contact_id: nova?.id,
            invoice_number: 'DEMO-1040',
            issue_date: dateDaysAgo(14),
            due_date: dateDaysAgo(-16),
            status: 'sent',
            currency: 'EUR',
            subtotal: 2400,
            tax_rate: 21,
            tax_amount: 504,
            irpf_rate: 0,
            irpf_amount: 0,
            total: 2904,
            issuer_profile_id: userId,
            created_by: userId,
            template_id: templates.executive?.id || null,
            config: templates.executive?.config || null,
            notes: 'Factura demo para implantación inicial.',
            items: [
                { description: 'Setup CRM inteligente', quantity: 1, unit_price: 1800, total_price: 1800 },
                { description: 'Automatización de pipeline comercial', quantity: 1, unit_price: 600, total_price: 600 },
            ],
        },
        {
            contact_id: alba?.id,
            invoice_number: 'DEMO-1041',
            issue_date: dateDaysAgo(3),
            due_date: dateDaysAgo(-27),
            status: 'draft',
            currency: 'EUR',
            subtotal: 950,
            tax_rate: 21,
            tax_amount: 199.5,
            irpf_rate: 0,
            irpf_amount: 0,
            total: 1149.5,
            issuer_profile_id: userId,
            created_by: userId,
            template_id: templates.nordic?.id || null,
            config: templates.nordic?.config || null,
            notes: 'Borrador para demo de generación con IA.',
            items: [
                { description: 'Auditoría de facturación y gastos', quantity: 1, unit_price: 650, total_price: 650 },
                { description: 'Configuración de plantillas profesionales', quantity: 1, unit_price: 300, total_price: 300 },
            ],
        },
        {
            contact_id: atlas?.id,
            invoice_number: 'DEMO-1042',
            issue_date: dateDaysAgo(1),
            due_date: dateDaysAgo(-29),
            status: 'draft',
            currency: 'EUR',
            subtotal: 850,
            tax_rate: 21,
            tax_amount: 178.5,
            irpf_rate: 0,
            irpf_amount: 0,
            total: 1028.5,
            issuer_profile_id: userId,
            created_by: userId,
            template_id: templates.blue?.id || null,
            config: templates.blue?.config || null,
            notes: 'Factura demo con varias líneas y diseño corporativo.',
            items: [
                { description: 'Servicio de consultoría', quantity: 1, unit_price: 150, total_price: 150 },
                { description: 'Desarrollo de software', quantity: 3, unit_price: 200, total_price: 600 },
                { description: 'Mantenimiento mensual', quantity: 1, unit_price: 100, total_price: 100 },
            ],
        },
    ].filter(invoice => invoice.contact_id)

    for (const invoice of demoInvoices) {
        const { items, ...invoicePayload } = invoice
        const { data: existing } = await (admin.from('invoices') as any)
            .select('id')
            .eq('invoice_number', invoice.invoice_number)
            .eq('created_by', userId)
            .maybeSingle()

        const { data: invoiceRow } = existing
            ? await (admin.from('invoices') as any).update(invoicePayload).eq('id', existing.id).select('id').single()
            : await (admin.from('invoices') as any).insert(invoicePayload).select('id').single()

        if (invoiceRow) {
            await (admin.from('invoice_items') as any).delete().eq('invoice_id', invoiceRow.id)
            await (admin.from('invoice_items') as any).insert(
                items.map(item => ({
                    invoice_id: invoiceRow.id,
                    ...item,
                }))
            )
        }
    }

    if (atlas?.id) {
        await (admin.from('tasks') as any)
            .delete()
            .eq('contact_id', atlas.id)
            .eq('title', 'Enviar propuesta resumida a Clínica Atlas')

        await (admin.from('tasks') as any).insert([
            {
                title: 'Enviar propuesta resumida a Clínica Atlas',
                description: 'Preparar propuesta orientada a ahorro administrativo.',
                contact_id: atlas.id,
                assigned_to: userId,
                priority: 'high',
                status: 'todo',
                is_completed: false,
                due_date: dateDaysAgo(-2),
            }
        ])
    }
}

async function ensureDemoInvoiceTemplates(admin: ReturnType<typeof createAdminClient>, userId: string) {
    const result: Partial<Record<DemoInvoiceTemplate['key'], { id: string; config: InvoiceTemplateConfig }>> = {}

    for (const template of DEMO_INVOICE_TEMPLATES) {
        const payload = {
            name: template.name,
            description: template.description,
            config: template.config,
            max_items: template.max_items,
            background_url: template.config.background_url || null,
            is_default: template.is_default,
            profile_id: userId,
            updated_at: new Date().toISOString(),
        }

        const { data: existing } = await (admin.from('invoice_templates') as any)
            .select('id')
            .eq('profile_id', userId)
            .eq('name', template.name)
            .maybeSingle()

        const { data, error } = existing?.id
            ? await (admin.from('invoice_templates') as any)
                .update(payload)
                .eq('id', existing.id)
                .select('id')
                .single()
            : await (admin.from('invoice_templates') as any)
                .insert({
                    ...payload,
                    created_at: new Date().toISOString(),
                })
                .select('id')
                .single()

        if (error) {
            console.error('[Demo] Error upserting invoice template:', error)
            continue
        }

        if (data?.id) {
            result[template.key] = {
                id: data.id,
                config: template.config,
            }
        }
    }

    return result
}

async function upsertContactByEmail(admin: ReturnType<typeof createAdminClient>, contact: Record<string, unknown>) {
    const { data: existing } = await (admin.from('contacts') as any)
        .select('id, email')
        .eq('email', contact.email)
        .limit(1)
        .maybeSingle()

    if (existing?.id) {
        const { data, error } = await (admin.from('contacts') as any)
            .update(contact)
            .eq('id', existing.id)
            .select('id, email')
            .single()

        if (error) {
            console.error('[Demo] Error updating demo contact:', error)
            return null
        }

        return data
    }

    const { data, error } = await (admin.from('contacts') as any)
        .insert(contact)
        .select('id, email')
        .single()

    if (error) {
        console.error('[Demo] Error creating demo contact:', error)
        return null
    }

    return data
}

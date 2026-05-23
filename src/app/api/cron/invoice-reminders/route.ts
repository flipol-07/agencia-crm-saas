import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeInvoiceTotals, formatCurrency } from '@/features/invoices/lib/money'
import nodemailer from 'nodemailer'
import type { InvoiceWithDetails } from '@/types/database'

const CRON_SECRET = process.env.CRON_SECRET || ''

interface ProcessResult {
    markedOverdue: number
    remindersSent: number
    failures: string[]
}

export async function GET(request: NextRequest) {
    // Auth: header (vercel cron) o query secret.
    const headerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const querySecret = new URL(request.url).searchParams.get('secret')
    const isAuthorized = (CRON_SECRET && (headerSecret === CRON_SECRET || querySecret === CRON_SECRET))

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result: ProcessResult = { markedOverdue: 0, remindersSent: 0, failures: [] }
    const supabase = createAdminClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString().split('T')[0]

    try {
        // 1. Marcar como 'overdue' facturas con due_date < hoy y status = 'sent'.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supa = supabase as any
        const { data: toOverdue, error: overdueError } = await supa
            .from('invoices')
            .update({ status: 'overdue' })
            .lt('due_date', todayIso)
            .eq('status', 'sent')
            .select('id')

        if (overdueError) {
            result.failures.push(`Mark overdue: ${overdueError.message}`)
        } else {
            result.markedOverdue = (toOverdue || []).length
        }

        // 2. Buscar facturas que necesitan recordatorio (overdue 1, 7, 14 días atrás).
        const reminderOffsets = [1, 7, 14]
        const reminderDates = reminderOffsets.map(d => {
            const dt = new Date(today)
            dt.setDate(dt.getDate() - d)
            return dt.toISOString().split('T')[0]
        })

        const { data: dueInvoices, error: fetchError } = await supa
            .from('invoices')
            .select('*, contacts!inner(*), invoice_items(*)')
            .eq('status', 'overdue')
            .in('due_date', reminderDates)

        if (fetchError) {
            result.failures.push(`Fetch overdue: ${fetchError.message}`)
            return NextResponse.json(result)
        }

        const invoices = (dueInvoices || []) as InvoiceWithDetails[]

        if (invoices.length > 0) {
            const transporter = buildTransporter()
            if (!transporter) {
                result.failures.push('SMTP no configurado, recordatorios omitidos')
                return NextResponse.json(result)
            }

            for (const inv of invoices) {
                const email = inv.contacts.email
                if (!email) continue

                try {
                    const totals = computeInvoiceTotals({
                        items: inv.invoice_items.map(i => ({ quantity: i.quantity, unit_price: i.unit_price })),
                        taxRate: inv.tax_rate,
                        irpfRate: inv.irpf_rate || 0,
                    })
                    const currency = inv.currency || 'EUR'
                    const daysOverdue = Math.floor((today.getTime() - new Date(inv.due_date as string).getTime()) / (1000 * 60 * 60 * 24))

                    const html = buildReminderHtml({
                        clientName: inv.contacts.contact_name || inv.contacts.company_name,
                        invoiceNumber: inv.invoice_number || '',
                        total: formatCurrency(totals.total, currency),
                        daysOverdue,
                    })

                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || process.env.SMTP_USER,
                        to: email,
                        subject: `Recordatorio: factura ${inv.invoice_number || ''} pendiente`,
                        html,
                    })
                    result.remindersSent += 1
                } catch (e) {
                    result.failures.push(`Invoice ${inv.id}: ${e instanceof Error ? e.message : 'unknown'}`)
                }
            }
        }
    } catch (e) {
        result.failures.push(`Top-level: ${e instanceof Error ? e.message : 'unknown'}`)
    }

    return NextResponse.json(result)
}

function buildTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
}

function buildReminderHtml({ clientName, invoiceNumber, total, daysOverdue }: {
    clientName: string
    invoiceNumber: string
    total: string
    daysOverdue: number
}): string {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #ef4444;">Recordatorio de pago</h2>
            <p>Hola ${escapeHtml(clientName)},</p>
            <p>Te escribo para recordarte que la factura <strong>${escapeHtml(invoiceNumber)}</strong> por importe de <strong>${escapeHtml(total)}</strong> está pendiente de pago desde hace <strong>${daysOverdue} día${daysOverdue === 1 ? '' : 's'}</strong>.</p>
            <p>Si ya has realizado el pago, ignora este mensaje. Si necesitas más información o tienes alguna duda, responde a este correo.</p>
            <p>Un saludo.</p>
        </div>
    `
}

function escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

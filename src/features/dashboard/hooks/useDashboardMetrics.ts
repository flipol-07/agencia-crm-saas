'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subDays, startOfMonth, formatISO } from 'date-fns'

export interface DashboardMetrics {
    // The Engine (Activity)
    outreachVolume: number        // Scraper leads sent last 30 days
    responseRate: number          // % (Inbound Emails / Outreach Volume) - Approximate

    // The Pipeline (Health)
    activeLeads: number           // Total active leads (not won/lost)
    pipelineValue: number         // Estimated value of active leads
    avgDealValue: number          // Average value per deal

    // The Harvest (Results)
    invoicedMonth: number         // Total invoiced this month
    cashVelocity: number          // Paid invoices last 30 days

    // Actionables
    stalledDealsCount: number     // Deals with no interaction > 7 days
}

export function useDashboardMetrics() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        outreachVolume: 0,
        responseRate: 0,
        activeLeads: 0,
        pipelineValue: 0,
        avgDealValue: 0,
        invoicedMonth: 0,
        cashVelocity: 0,
        stalledDealsCount: 0
    })
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const now = new Date()
                const thirtyDaysAgo = formatISO(subDays(now, 30))
                const firstDayOfMonth = formatISO(startOfMonth(now))
                const sevenDaysAgo = formatISO(subDays(now, 7))

                // 1. Outreach Volume (Last 30d)
                const { count: outreachCount } = await supabase
                    .from('scraper_leads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', thirtyDaysAgo)
                // .eq('email_status', 'sent') // Uncomment if status tracking is reliable

                const outreachVolume = outreachCount || 0

                // 2. Response Rate (Approximate: Inbound Emails vs Outreach)
                // Getting unique leads who responded would be better but expensive without specialized table
                const { count: inboundCount } = await supabase
                    .from('contact_emails')
                    .select('*', { count: 'exact', head: true })
                    .eq('direction', 'inbound')
                    .gte('received_at', thirtyDaysAgo)

                const responseRate = outreachVolume > 0
                    ? Math.round(((inboundCount || 0) / outreachVolume) * 100)
                    : 0

                // 3. Pipeline Health
                const { data: leadsData } = await (supabase.from('contacts') as any)
                    .select('estimated_value, status, last_interaction')
                    .not('status', 'in', '("won","lost","archived")')

                const activeLeads = leadsData?.length || 0
                const pipelineValue = leadsData?.reduce((sum: number, lead: any) => sum + (lead.estimated_value || 0), 0) || 0
                const avgDealValue = activeLeads > 0 ? Math.round(pipelineValue / activeLeads) : 0

                const stalledDealsCount = leadsData?.filter((lead: any) =>
                    !lead.last_interaction || lead.last_interaction < sevenDaysAgo
                ).length || 0

                // 4. Financials
                const { data: invoicesData } = await (supabase.from('invoices') as any)
                    .select('total, status, issue_date, paid_date')

                const invoices = invoicesData || []

                // Invoiced This Month
                const invoicedMonth = invoices
                    .filter((inv: any) => inv.issue_date >= firstDayOfMonth && inv.status !== 'cancelled' && inv.status !== 'draft')
                    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)

                // Cash Velocity (Paid Last 30d)
                const cashVelocity = invoices
                    .filter((inv: any) => inv.status === 'paid' && inv.paid_date >= thirtyDaysAgo)
                    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)

                setMetrics({
                    outreachVolume,
                    responseRate,
                    activeLeads,
                    pipelineValue,
                    avgDealValue,
                    invoicedMonth,
                    cashVelocity,
                    stalledDealsCount
                })
            } catch (error) {
                console.error('Error fetching dashboard metrics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [supabase])

    return { metrics, loading }
}

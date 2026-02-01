import { StatCard, RecentLeads, PriorityTasks, TrendChart, ExpenseChart, ProjectProgress, PeriodSelector } from '@/features/dashboard/components'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  type DashboardPeriod,
  getExecutiveKPIs,
  getMonthlyTrend,
  getExpenseDistribution,
  getProjectsProgress
} from '@/features/dashboard/services/dashboard.service'
import { Suspense } from 'react'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ period?: DashboardPeriod }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { period = '30d' } = await searchParams
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es })

  const periods: { value: DashboardPeriod; label: string }[] = [
    { value: '30d', label: '30 días' },
    { value: '90d', label: '3 meses' },
    { value: '6m', label: '6 meses' },
    { value: '1y', label: '1 año' },
    { value: 'all', label: 'Todo' },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Page Shell (Instant) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wider uppercase">Dashboard</h1>
          <p className="text-gray-400 mt-1">El cerebro de tu agencia • <span className="capitalize">{currentMonth}</span></p>
        </div>

        <div className="flex flex-col sm:items-end gap-3">
          <PeriodSelector periods={periods} />
          <div className="flex items-center gap-2 text-[10px] text-text-muted bg-white/5 px-2 py-1 rounded-md border border-white/10 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
            Datos inteligentes (Next.js 16)
          </div>
        </div>
      </div>

      {/* Authenticated Content (Suspended) */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <AuthenticatedDashboardContent period={period} />
      </Suspense>
    </div>
  )
}

async function AuthenticatedDashboardContent({ period }: { period: DashboardPeriod }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userId = user.id

  return (
    <div className="space-y-8">
      {/* ZONA 1: KPIS EJECUTIVOS */}
      <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 animate-pulse bg-white/5 rounded-2xl border border-white/10" />)}
      </div>}>
        <DashboardKPIsSection userId={userId} period={period} />
      </Suspense>

      {/* ZONA 2: ANALYTICS */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 animate-pulse bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-80 animate-pulse bg-white/5 rounded-2xl border border-white/10" />
      </div>}>
        <DashboardAnalyticsSection userId={userId} period={period} />
      </Suspense>

      {/* ZONA 3: CENTRO DE ACCIÓN */}
      <section>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-4 flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-blue-500 to-transparent"></span>
          Centro de Acción
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-2xl border border-white/10" />}>
            <div className="lg:col-span-1">
              <PriorityTasks userId={userId} />
            </div>
          </Suspense>

          <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-2xl border border-white/10" />}>
            <div className="lg:col-span-1">
              <ProjectsProgressSection userId={userId} />
            </div>
          </Suspense>

          <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-2xl border border-white/10" />}>
            <div className="lg:col-span-1">
              <RecentLeads userId={userId} />
            </div>
          </Suspense>
        </div>
      </section>
    </div>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-80 bg-white/5 rounded-2xl border border-white/10" />
      </div>
    </div>
  )
}
async function DashboardKPIsSection({ userId, period }: { userId: string, period: DashboardPeriod }) {
  const kpis = await getExecutiveKPIs(userId, period)
  const profitTrend = kpis.netProfit >= 0 ? 'up' : 'down'

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  }

  const getPeriodLabel = (p: DashboardPeriod) => {
    switch (p) {
      case '30d': return 'en los últimos 30 días'
      case '90d': return 'en los últimos 3 meses'
      case '6m': return 'en los últimos 6 meses'
      case '1y': return 'en el último año'
      case 'all': return 'en todo el histórico'
      default: return 'este mes'
    }
  }
  const periodLabel = getPeriodLabel(period)

  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-4 flex items-center gap-2">
        <span className="w-8 h-px bg-gradient-to-r from-brand to-transparent"></span>
        KPIs Ejecutivos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Ingresos Cobrados"
          value={formatCurrency(kpis.incomeThisMonth)}
          subtitle={`Facturas pagadas ${periodLabel}`}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Gastos Empresa"
          value={formatCurrency(kpis.expensesThisMonth)}
          subtitle={`Gastos de negocio ${periodLabel}`}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        <StatCard
          title="Beneficio Neto"
          value={formatCurrency(kpis.netProfit)}
          subtitle="Ingresos - Gastos"
          color={kpis.netProfit >= 0 ? 'lime' : 'red'}
          trend={profitTrend}
          trendValue={kpis.netProfit >= 0 ? 'Positivo' : 'Negativo'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <StatCard
          title="Pipeline Potencial"
          value={formatCurrency(kpis.pipelinePotential)}
          subtitle={`${kpis.activeProjects} proyectos activos`}
          color="purple"
          tooltip="Suma del valor estimado de todos los contactos activos en el pipeline (no cerrados como ganados o perdidos)."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {kpis.pendingInvoices > 0 && (
        <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">
              {formatCurrency(kpis.pendingInvoices)} en facturas pendientes
            </h3>
            <p className="text-sm text-gray-400">Recuerda hacer seguimiento a las facturas enviadas.</p>
          </div>
        </div>
      )}
    </section>
  )
}

async function DashboardAnalyticsSection({ userId, period }: { userId: string, period: DashboardPeriod }) {
  const months = period === 'all' || period === '1y' ? 12 : 6
  const [trend, expenseDistribution] = await Promise.all([
    getMonthlyTrend(userId, months),
    getExpenseDistribution(userId, period)
  ])

  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-4 flex items-center gap-2">
        <span className="w-8 h-px bg-gradient-to-r from-brand-purple to-transparent"></span>
        Analytics
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trend} />
        <ExpenseChart data={expenseDistribution} />
      </div>
    </section>
  )
}

async function ProjectsProgressSection({ userId }: { userId: string }) {
  const projectsProgress = await getProjectsProgress(userId)
  return <ProjectProgress projects={projectsProgress} />
}

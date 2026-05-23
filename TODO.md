# TODO — CRM Aurie

Backlog priorizado de mejoras production-ready. Si entras en una sesión sin contexto: lee este archivo y empieza por el primer ítem no completado.

> **Estado actual**: Fase 1 (hardening P0), Fase 2 (Contactos production-ready), Fase 3 (Facturas + PDF servidor), Fase 4 (Facturas recurrentes, Aged Receivables, Timeline, Custom Fields, Multi-moneda, Tests unit, Crons en Supabase) completadas. Planes ejecutados: `.claude/plans/calm-wobbling-clock.md`, `.claude/plans/continuar-dejando-el-crm-vectorized-codd.md`.

---

## Próxima sesión: por dónde seguir

### 1. Verifactu / TicketBAI (CRÍTICO LEGAL ES) — BLOQUEADO
Obligatorio para autónomos y empresas en España desde 2025. Si la app se usa para facturación real, sin esto hay incumplimiento. **Requiere certificado digital de la AEAT** que debe gestionar el usuario.
- Solicitar certificado digital de la AEAT.
- Añadir columnas en `invoices`: `verifactu_hash`, `verifactu_previous_hash`, `verifactu_signed_xml`, `verifactu_status`, `verifactu_submitted_at`.
- Implementar hash chain (cada factura encadena la anterior con SHA-256 sobre campos canónicos).
- Firma XAdES con certificado.
- Envío SOAP al endpoint de la AEAT (`sis-verifactu`).
- Webhook/cron para reintentos ante fallo de red.

### ~~2. Facturas recurrentes~~ ✅ HECHO (2026-05-22)
- ✅ Tabla `invoice_subscriptions` (migration `20260522101000_invoice_subscriptions.sql`).
- ✅ Cron en **Supabase pg_cron** (migration `20260522101100_invoice_subscriptions_cron.sql`, schedule `0 7 * * *`). No usa Vercel Cron para evitar coste extra.
- ✅ Cron de `invoice-reminders` también migrado a Supabase pg_cron + pg_net (migration `20260522101200_invoice_reminders_cron.sql`). `vercel.json` ya no tiene crons.
- ✅ Función SQL `process_invoice_subscriptions()` que reusa el RPC `create_invoice_with_items`.
- ✅ Endpoint `/api/cron/invoice-subscriptions` reducido a wrapper manual del RPC (testing con curl).
- ✅ UI en detalle de contacto: `<SubscriptionsList>` + `<CreateSubscriptionModal>`.
- ✅ Página global `/invoices/subscriptions` para gestión.
- ✅ Server actions con Zod en `src/features/invoices/actions/subscriptionActions.ts`.
- ✅ Helper `computeNextRun` puro en `src/features/invoices/lib/recurrence.ts` (con tests).

### ~~3. Aged Receivables Report~~ ✅ HECHO (2026-05-22)
- ✅ Vista `/invoices/reports/aging` con buckets 0-30, 31-60, 61-90, 90+ días.
- ✅ Servicio `getAgingReport()` en `src/features/invoices/services/aging.service.server.ts`.
- ✅ Stacked bar simple (CSS) + tabla por contacto + export CSV.
- **Pendiente menor**: export PDF (CSV es suficiente para arrancar).

### ~~4. Timeline unificado del contacto~~ ✅ HECHO (parcial, 2026-05-22)
- ✅ Componente `<ContactTimeline>` en `src/features/contacts/components/ContactTimeline.tsx`.
- ✅ Mezcla `contact_emails + meetings + invoices + tasks + notes` ordenado por fecha desc.
- ✅ Filtros por tipo de actividad (chips multi-selección).
- ✅ Server action `getContactTimelineAction` con Zod en `src/features/contacts/actions/timelineActions.ts`.
- **Pendiente diferido**: refactor de `ContactDetail360.tsx` (758 LOC) — sigue en #7.

### ~~5. Custom fields dinámicos en contactos~~ ✅ HECHO (2026-05-22)
- ✅ Tabla `custom_field_definitions` (migration `20260522101300_custom_fields.sql`).
- ✅ Columna `contacts.custom_fields jsonb default '{}'`.
- ✅ UI en `/settings/custom-fields` para definir campos (text, textarea, number, date, select, checkbox).
- ✅ Render dinámico en `ContactForm` (fetch defs en mount → renderiza inputs adecuados → submit incluye `custom_fields`).
- ✅ Server actions con Zod en `src/features/contacts/actions/customFieldActions.ts`.

### ~~6. Kanban view para pipeline~~ ✅ HECHO (ya existía)
- ✅ `src/features/pipeline/components/PipelineKanban.tsx` ya implementa drag-drop con `@dnd-kit/core` y actualiza `pipeline_stage` al soltar. Vive en `/pipeline` (no `/pipeline/kanban`, pero la funcionalidad está).

### 7. Refactor archivos > 500 LOC (DEFERRED)
- `dashboard.service.ts` (811) → dividir por widget (KPIs, alerts, forecast, aging, top deals).
- `ContactDetail360.tsx` (758) → secciones independientes con lazy load (ahora tiene InvoiceList, SubscriptionsList, ContactTimeline, FileSection — los componentes están aislados; falta extraer las secciones inline restantes).
- `useTasks.ts` (748) → separar en `useTasksList`, `useTaskMutations`, `useTaskFilters`.

### ~~8. Tests automatizados~~ ✅ HECHO (parcial, 2026-05-22)
- ✅ **Unit con `node:test` + tsx** (sin instalar vitest):
  - `src/features/invoices/lib/recurrence.test.ts` — 7 tests.
  - `src/features/invoices/lib/money.test.ts` — 6 tests.
  - `src/features/invoices/lib/fiscal-validation.test.ts` — 10 tests.
  - Script: `npm test`. Total: 23 tests, todos pasan.
- **Pendiente**:
  - Tests para `duplicates.service.ts`.
  - E2E Playwright: contacto → factura → PDF.
  - CI GitHub Actions: typecheck + build + tests.

### 9. Bundle audit (lazy load de imports pesados) (DEFERRED)
- `@ffmpeg/ffmpeg` solo se necesita en grabador de meetings → dynamic import.
- `googleapis` solo en server actions de Calendar → confirmar que no entra al bundle cliente.
- `playwright` (devDep) → verificar que no se importa en runtime.
- `pdf-parse` solo en server.

### 10. Eliminar `as any` restantes (DEFERRED — riesgoso en legacy)
Inventario:
- `src/middleware.ts` (options?: any)
- `src/features/meetings/services/*` (10+ casteos)
- `src/features/tasks/hooks/useTasks.ts`
- `src/lib/supabase/client.ts` (`let client: any`)

### 11. Rotación de secretos antes de primer deploy real (USUARIO)
Los OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, PERPLEXITY_API_KEY, EVOLUTION_API_KEY, etc. en `.env.local` son production keys reales. `.env.local` ya está gitignored (sano) pero rotar antes de compartir con más manos.

### ~~12. Multi-moneda~~ ✅ HECHO (2026-05-22)
- ✅ Whitelist `SUPPORTED_CURRENCIES` (EUR/USD/GBP/CHF/MXN/ARS/COP/CLP/BRL/CAD) en `src/features/invoices/lib/money.ts`.
- ✅ `InvoiceForm` ya no hardcodea EUR — selector de moneda en bloque de totales.
- ✅ Persistencia en `invoices.currency` (ya existía), uso correcto en PDF/print/aging/email/reminders.
- **Pendiente**: tipos de cambio para reportes consolidados (multi-currency aggregations). Hoy cada total se muestra en su moneda nativa.

### 13. Notificaciones in-app (DEFERRED)
- Tabla `notifications (user_id, type, payload jsonb, read_at)`.
- Realtime con Supabase channels.
- Triggers: factura cobrada, contacto inactivo > 30d, nueva tarea asignada.

### ~~14. Validación adicional en otras server actions~~ ✅ HECHO (parcial, 2026-05-22)
- ✅ `expenses/actions/expenseActions.ts` — Zod en create/update/delete/getById. Schemas en `src/features/expenses/schemas.ts`.
- ⏸ `meetings/actions/*` — solo hay `process-meeting.ts` que es análisis IA, sin CRUD de usuario.
- ⏸ `tasks/actions/*` — no existen como server actions (mutations vía hooks).
- ⏸ `projects/actions/*` — no existen como server actions.

---

## Comandos útiles

```bash
npm run typecheck      # antes de commitear
npm run build          # antes de deploy
npm run dev            # desarrollo local
npm test               # 23 unit tests (node:test + tsx)
```

## Referencias internas

- Planes ejecutados: `.claude/plans/calm-wobbling-clock.md`, `.claude/plans/continuar-dejando-el-crm-vectorized-codd.md`
- CLAUDE.md raíz: convenciones y stack
- BUSINESS_LOGIC.md: lógica de negocio

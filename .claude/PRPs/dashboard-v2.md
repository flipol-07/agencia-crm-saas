# PRP: Dashboard V2 - The SaaS Engine (Pareto Optimized)

> "El 20% de las métricas que te dan el 80% del control sobre tu negocio."

## 1. El Problema / Diagnóstico
El dashboard actual muestra métricas estáticas ("Total Leads") o financieras retrasadas ("Facturado"). No dice **qué hacer hoy** ni **cómo de sano es el motor de crecimiento**.

Para una agencia/SaaS con Scraper, el éxito depende de:
1.  Volumen de Outreach (Input).
2.  Tasa de Respuesta (Quality).
3.  Velocidad de Cierre (Process).
4.  Cashflow Real (Output).

## 2. La Solución (Pareto 80/20)
Rediseñar el dashboard para mostrar **Flujo y Acción**, no solo "Estado".

### A. The Engine (KPIs Principales)
1.  **Outreach Velocity (30d)**:
    - Leads contactados por el Scraper en los últimos 30 días.
    - *Why*: Si esto baja, en 2 meses no hay ventas. Es el indicador líder #1.
    - *Source*: `scraper_leads.sent_at`.

2.  **Response Rate**:
    - % de Leads que respondieron (Inbound emails / Sent emails).
    - *Why*: Calidad del copy/target.
    - *Source*: `contact_emails` (inbound) match `scraper_leads`.

3.  **Active Pipeline (Weighted)**:
    - Valor estimado ponderado por probabilidad de cierre.
    - *Why*: Previsión realista de flujo de caja.
    - *Source*: `contacts.estimated_value` * `config.stage_probability`.

4.  **Cash Velocity (30d)**:
    - Dinero cobrado real últimos 30 días.
    - *Source*: `invoices` (status=paid, paid_date > 30d).

### B. Action Center (El 20% de acciones vitales)
1.  **"Hot Leads" (Requieren atención inmediata)**:
    - Leads que respondieron email en las últimas 48h.
    - Tareas vencidas de alta prioridad.
2.  **"Stalled Deals" (Cuellos de botella)**:
    - Deals en etapas avanzadas sin actividad por > 7 días.
    - *Acción*: "Revive or Kill". Limpia el pipeline.

### C. Visuals
- **Funnel Chart**: Scraped -> Contacted -> Replied -> Opp -> Won.
- **Trend Line**: Outreach vs Responses (Are we improving?).

## 3. Plan de Implementación (Blueprint)

### Fase 1: Backend Logic (Service Layer)
- [ ] Crear `DashboardService` que agrupe estas queries complejas.
- [ ] Crear SQL/RPC si es necesario para performance (evitar traer 5000 leads al cliente).

### Fase 2: UI Components
- [ ] `KpiCard` mejorada con tendencias (vs mes anterior).
- [ ] `ActionList` para Hot Leads.
- [ ] `FunnelChart` (usando Recharts o CSS puro simple).

### Fase 3: Integration
- [ ] Reemplazar `useDashboardMetrics` con `useEngineMetrics`.
- [ ] Actualizar `page.tsx`.

## 4. Estructura de Datos Requerida (Queries)

```sql
-- Ejemplo Logic Outreach 30d
SELECT count(*) FROM scraper_leads 
WHERE email_status = 'sent' 
AND sent_at > now() - interval '30 days';

-- Ejemplo Response Rate
-- (Requiere linkear emails con scraper_leads, asumiendo coincidencia de email)
```

## 5. Notas de Auto-Blindaje
- **Performance**: No hacer `.filter()` en cliente para miles de registros. Usar `count` en DB.
- **Null Safety**: Los valores monetarios deben manejar nulos como 0.

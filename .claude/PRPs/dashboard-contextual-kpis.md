# PRP: Dashboard Contextual con Recomendaciones por Rol

## 🎯 Objetivo
Transformar el Dashboard "genérico" en una herramienta inteligente que se adapta al rol del usuario.
1. **KPIs Contextuales**: Resaltar métricas clave según el rol (ej: Pipeline para Ventas, Beneficio para Dueño).
2. **Recomendaciones Automáticas**: Sugerencias accionables basadas en los datos (ej: "Pipeline bajo → Contacta leads antiguos").

## 🏗️ Cambios Propuestos

### 1. Motor de Contexto (Logic)
- **Archivo**: `src/features/dashboard/lib/recommendation-engine.ts`
- **Input**: `role`, `kpis` (ingresos, gastos, leads, tareas).
- **Output**: Lista de `Recommendation` { title, message, type, actionLabel, actionUrl }.
- **Reglas Iniciales**:
    - **General**: Si `pendingInvoices > 0` → "Reclamar facturas".
    - **General**: Si `netProfit < 0` → "Revisar gastos urgentes".
    - **CEO/Dueño/Admin**: Foco en Beneficio y Tendencia.
    - **Ventas/Marketing**: Si `activeLeads < 5` → "Llenar pipeline hoy".
    - **Developer/Product**: Si `overdueTasks > 3` → "Limpiar deuda técnica".

### 2. Servicios (Backend/Server)
- Actualizar `dashboard.service.ts` o crear wrapper para inyectar el rol y procesar recomendaciones.

### 3. Componentes (Frontend)
- **Nuevo**: `src/features/dashboard/components/RecommendationsWidget.tsx`
    - Diseño tipo Card con lista de items.
    - Colores semánticos (warning = amarillo, danger = rojo, info = azul).
- **Modificación**: `DashboardKPIsSection` para aceptar configs de orden/visibilidad según rol (opcional para V1, foco en recomendaciones primero).

## 🔄 Roadmap de Implementación (Fases)

### Fase 1: Motor y Datos
- Crear tipos `Recommendation`, `RoleContext`.
- Implementar `recommendation-engine.ts` con reglas hardcodeadas (fáciles de extender).
- Integrar en `AuthenticatedDashboardContent` para obtener el rol.

### Fase 2: Componente Visual
- Crear `RecommendationsWidget`.
- Integrar en `page.tsx` (probablemente arriba de KPIs o lateral).

### Fase 3: Refinamiento
- Añadir más reglas basadas en datos reales.

## ✅ Criterios de Éxito
- El dashboard muestra un bloque "Recomendaciones IA" (o similar).
- Si soy "CEO", veo alertas financieras.
- Si no tengo rol, veo recomendaciones genéricas de negocio.

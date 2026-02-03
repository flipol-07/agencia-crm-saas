# PRP: Mejora del Módulo de Economía (IA + Fiscal + Rentabilidad)

## 🎯 Objetivo
Transformar el actual gestor de gastos en una herramienta de inteligencia financiera que automatice la clasificación, prevea impuestos y analice la rentabilidad real por servicio.

## 💡 Propuestas

### 1. Clasificación Inteligente (Magic Expense)
- **Problem**: Clasificar gastos manualmente es tedioso.
- **Solution**: Usar Aura (AI) para que al escribir "Hosting Vercel", se seleccione automáticamente Sector: Tecnología y Categoría: Software/SaaS.
- **UI**: Un pequeño rayo ⚡ en el input de descripción que indica "IA activa".

### 2. Previsión Fiscal Trimestral
- **Problem**: Sorpresas al pagar el IVA al final del trimestre.
- **Solution**: Widget que calcula: `IVA Repercutido (Invoices) - IVA Soportado (Expenses Deducibles) = Estimado a pagar`.
- **UI**: Una Card en el resumen de economía con progreso del trimestre actual.

### 3. Rentabilidad Real por Servicio
- **Problem**: No sabemos qué servicio nos deja más dinero neto.
- **Solution**: Mapear facturas y gastos a etiquetas de servicio (Web, IA, SEO).
- **Formula**: `Ingresos por Servicio X - Gastos directos por Servicio X = Rentabilidad`.

## 🛠️ Stack Técnico
- **Backend**: Supabase (PostgreSQL + RLS).
- **AI**: Integración con el servicio interno de Aura.
- **Frontend**: Next.js 16, Tailwind CSS, Framer Motion para visualizaciones.

## 📅 Roadmap Estimado
1. **Fase 1**: Clasificación IA (Autocomplete).
2. **Fase 2**: Dashboard de Rentabilidad por Servicio.
3. **Fase 3**: Widget de Previsión Fiscal.

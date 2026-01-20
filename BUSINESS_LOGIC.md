# 📋 BUSINESS_LOGIC.md - Aurie CRM

> **Generado por SaaS Factory** | Fecha: 2026-01-20
> 
> *"Un CRM y Gestor de Proyectos 'Todo en Uno' para agencias digitales"*

---

## 1. Problema de Negocio

### El Dolor
La gestión operativa y comercial de la agencia está **fragmentada en silos desconectados**:

| Problema | Síntoma | Impacto |
|----------|---------|---------|
| 🔒 **Dependencia unipersonal** | Toda la relación con clientes reside en el WhatsApp de 1 persona | Equipo "ciego", Bus Factor = 1 |
| 🔥 **Saturación** | Una persona gestiona todo el flujo de entrada | Leads se enfrían por falta de respuesta |
| ❌ **Errores de ejecución** | Información "secuestrada" en chats personales | Entregas fallidas por falta de contexto |
| ⏰ **Ineficiencia** | Sincronización manual de chats con tareas | Horas perdidas, errores humanos |

### El Costo
- **Cuello de botella crítico**: El resto del equipo depende 100% de una persona para tener contexto
- **Leads perdidos**: Se enfrían porque no da abasto para responder a tiempo
- **Errores graves**: Servicios mal ejecutados por información que no fluyó a tiempo

---

## 2. Solución

### Propuesta de Valor
> *"Un CRM y Gestor de Proyectos 'Todo en Uno' que integra el pipeline de ventas, la gestión de tareas y el inbox de WhatsApp en una sola interfaz para agencias digitales que necesitan controlar todo el ciclo de vida del cliente, eliminando silos y dependencias unipersonales."*

### Pilares del Producto
1. 📊 **Pipeline de ventas** (Kanban visual)
2. ✅ **Gestión de tareas/proyectos** (Entregas)
3. 💬 **Inbox compartido de WhatsApp** (Comunicación unificada)
4. 📄 **Facturación integrada** (PDF automático)
5. 📈 **Dashboard financiero** (Métricas de negocio)

---

## 3. Flujo Principal (Happy Path)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FASE                │  ACCIÓN                                      │
├──────────────────────┼──────────────────────────────────────────────┤
│  1. CAPTACIÓN        │  Lead entra (WhatsApp/Email/Manual)          │
│                      │  → Sistema crea ficha "Prospecto"            │
├──────────────────────┼──────────────────────────────────────────────┤
│  2. CUALIFICACIÓN    │  Reunión diagnóstico                         │
│     (Consultoría)    │  → Registra: Puntos de Dolor + Requisitos    │
│                      │  → Avanza a "Preparando Propuesta" o Descarta│
├──────────────────────┼──────────────────────────────────────────────┤
│  3. CIERRE           │  Presenta propuesta + presupuesto            │
│     (Propuesta)      │  → Cliente acepta → "Ganado"                 │
│                      │  → Registra pago 50%                         │
│                      │  ⚡ TRIGGER: Lead → Cliente Activo           │
│                      │  → Genera tablero de proyecto automático     │
├──────────────────────┼──────────────────────────────────────────────┤
│  4. EJECUCIÓN        │  Equipo trabaja tareas en dashboard          │
│     (Desarrollo)     │  → Comunicación centralizada WA/Email        │
│                      │  → Tracking de progreso                      │
├──────────────────────┼──────────────────────────────────────────────┤
│  5. ENTREGA          │  Completa tareas → Cobra 50% restante        │
│     (Recurrencia)    │  → Estado: "Mantenimiento/Suscripción"       │
│                      │  → Prueba 1 semana → Cobro mensual           │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Estados del Pipeline
```
Prospecto → Cualificación → Preparando Propuesta → Propuesta Enviada → 
Ganado → En Ejecución → Entregado → Mantenimiento/Suscripción

(Alternativo: Descartado / Perdido)
```

---

## 4. Usuario Objetivo

### Usuarios Actuales
- **2 personas**: Pol y Anton (ambos Super Admin)

### Roles Funcionales (Sombreros)

| 🎩 Rol | Vista Principal | Necesidad |
|--------|-----------------|-----------|
| **Director Comercial** | Pipeline + Inbox WA | Cerrar tratos, ver contexto conversaciones, gestionar propuestas |
| **Project Manager** | Tablero proyectos | Crear proyectos desde cliente cerrado, asignar tareas, tracking entregas/cobros |
| **Desarrollador** | "Mis Tareas" | Vista limpia sin ruido comercial, acceso a specs y archivos del cliente |

### Insight de UX
> Ambos usuarios son Super Admin pero necesitan **cambiar de sombrero** según el contexto. 
> La UI debe permitir alternar fácilmente entre vistas: Comercial / Gestión / Ejecución.

---

## 5. Arquitectura de Datos

### INPUTS (Entradas al sistema)

| Fuente | Tipo | Descripción |
|--------|------|-------------|
| **Evolution API** | Webhook | Mensajes WhatsApp en tiempo real (texto, multimedia, estados) |
| **Formularios CRM** | Manual | Datos lead, requisitos técnicos, puntos de dolor |
| **Supabase Storage** | Archivos | Briefings, contratos firmados, assets |
| **Facturador** | Formulario | Cliente + Concepto + Precio → autocompletado fiscal |
| **Estados** | Manual | Marcar tareas completadas, hitos de pago recibidos |

### OUTPUTS (Salidas del sistema)

| Salida | Formato | Descripción |
|--------|---------|-------------|
| **WhatsApp** | Mensajes | Envío bidireccional desde interfaz |
| **Facturas** | PDF | Generación automática descargable |
| **Pipeline Kanban** | Vista | Visualización de ventas por etapa |
| **Lista Tareas** | Vista | Producción/ejecución por proyecto |
| **Dashboard** | Métricas | Facturación, pagos pendientes, tasa conversión |

### Integraciones Clave
- 🔗 **Evolution API** (WhatsApp Business): Webhook receiver + Message sender
- 🗄️ **Supabase Storage**: Archivos del cliente
- 📄 **PDF Generator**: Facturas automáticas (puede ser edge function o librería cliente)

---

## 6. Storage (Supabase Tables)

### Tablas Principales

```sql
-- Ya existe
profiles (id, email, full_name, avatar_url, created_at, updated_at)

-- Nuevas tablas a crear
contacts (
  id, 
  company_name,           -- Nombre empresa
  contact_name,           -- Nombre contacto
  email,
  phone,                  -- WhatsApp
  tax_id,                 -- NIF/CIF para facturas
  tax_address,            -- Dirección fiscal
  status,                 -- 'prospect' | 'qualified' | 'proposal' | 'won' | 'active' | 'maintenance' | 'lost'
  pipeline_stage,         -- Etapa actual en pipeline
  pain_points,            -- JSONB: puntos de dolor detectados
  requirements,           -- JSONB: requisitos técnicos
  assigned_to,            -- FK profiles (quién gestiona)
  source,                 -- 'inbound_whatsapp' | 'inbound_email' | 'outbound'
  created_at,
  updated_at
)

projects (
  id,
  contact_id,             -- FK contacts (cliente)
  name,
  status,                 -- 'active' | 'completed' | 'on_hold' | 'cancelled'
  start_date,
  due_date,
  initial_payment,        -- 50% inicial
  initial_payment_date,
  final_payment,          -- 50% final
  final_payment_date,
  subscription_amount,    -- Mensualidad
  created_at,
  updated_at
)

tasks (
  id,
  project_id,             -- FK projects
  title,
  description,
  status,                 -- 'pending' | 'in_progress' | 'completed'
  priority,               -- 'low' | 'medium' | 'high' | 'urgent'
  assigned_to,            -- FK profiles
  due_date,
  completed_at,
  created_at
)

messages (
  id,
  contact_id,             -- FK contacts
  direction,              -- 'inbound' | 'outbound'
  channel,                -- 'whatsapp' | 'email'
  content,                -- Texto del mensaje
  media_url,              -- URL de archivo adjunto (Supabase Storage)
  wa_message_id,          -- ID de Evolution API para tracking
  status,                 -- 'sent' | 'delivered' | 'read' | 'failed'
  sent_by,                -- FK profiles (si outbound)
  created_at
)

invoices (
  id,
  contact_id,             -- FK contacts
  project_id,             -- FK projects (opcional)
  invoice_number,         -- Número secuencial
  concept,                -- Descripción del servicio
  amount,
  tax_rate,               -- IVA (21% default)
  total,
  status,                 -- 'draft' | 'sent' | 'paid'
  issue_date,
  due_date,
  paid_date,
  pdf_url,                -- URL en Storage
  created_at
)

files (
  id,
  contact_id,             -- FK contacts
  project_id,             -- FK projects (opcional)
  name,
  type,                   -- 'briefing' | 'contract' | 'asset' | 'other'
  storage_path,           -- Path en Supabase Storage
  uploaded_by,            -- FK profiles
  created_at
)
```

---

## 7. KPI de Éxito (MVP)

### Métrica Principal
> **"Cualquier socio puede entrar en la ficha de un cliente que NO gestiona habitualmente, entender el contexto total (historial de chat, estado de pagos y tareas pendientes) y tomar una acción efectiva en < 60 segundos, sin preguntar nada al otro socio."**

### Métricas Secundarias
- 📉 Reducir a 0 los errores de ejecución por falta de información
- 📈 Mejorar tasa de respuesta a leads (< 5 minutos vs actual indefinido)
- ⏱️ Generar factura en < 1 minuto

---

## 8. Especificación Técnica

### Features a Implementar (Feature-First)

```
src/features/
├── auth/                 # ✅ DONE - Login/Signup Supabase
├── contacts/             # Gestión de contactos/leads
│   ├── components/       # ContactForm, ContactCard, ContactDetail
│   ├── hooks/            # useContacts, useContact
│   └── services/         # contactService.ts
├── pipeline/             # Pipeline de ventas (Kanban)
│   ├── components/       # KanbanBoard, PipelineCard, StageColumn
│   └── hooks/            # usePipeline
├── projects/             # Gestión de proyectos
│   ├── components/       # ProjectBoard, ProjectCard
│   └── hooks/            # useProjects, useProject
├── tasks/                # Tareas por proyecto
│   ├── components/       # TaskList, TaskCard, TaskForm
│   └── hooks/            # useTasks
├── inbox/                # Inbox unificado WhatsApp
│   ├── components/       # MessageList, MessageComposer, ConversationView
│   ├── hooks/            # useMessages, useConversation
│   └── services/         # evolutionApiService.ts (webhook + sender)
├── invoices/             # Facturación
│   ├── components/       # InvoiceForm, InvoicePreview, InvoiceList
│   ├── hooks/            # useInvoices
│   └── services/         # pdfGenerator.ts
├── files/                # Gestión de archivos
│   ├── components/       # FileUploader, FileList
│   └── hooks/            # useFiles
└── dashboard/            # Dashboard financiero
    ├── components/       # StatsCard, RevenueChart, ConversionFunnel
    └── hooks/            # useDashboardStats
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4
- **UI Style:** Aurie Design System (Dark mode, Anton font, Lime accents)
- **Backend:** Supabase (Auth + Database + Storage + Edge Functions)
- **Validación:** Zod
- **State:** Zustand (para estado global del inbox/mensajes)
- **PDF:** @react-pdf/renderer o edge function con PDFKit
- **WhatsApp:** Evolution API (self-hosted o cloud)
- **MCPs:** Next.js DevTools + Playwright + Supabase

### Vistas Principales (Routes)

```
/login                    # Auth
/signup                   # Auth
/dashboard                # Home con métricas
/pipeline                 # Kanban de ventas
/contacts                 # Lista de contactos
/contacts/[id]            # Ficha de cliente (360° view)
/projects                 # Lista de proyectos
/projects/[id]            # Detalle proyecto + tareas
/inbox                    # Inbox unificado WhatsApp
/invoices                 # Lista de facturas
/invoices/new             # Crear factura
/settings                 # Configuración
```

---

## 9. Priorización MVP (Roadmap)

### Fase 1: Core CRM (Completada) ✅
1. [x] Auth (Email/Password) ✅
2. [x] Tabla contacts + CRUD ✅
3. [x] Ficha de cliente 360° (3 columnas) ✅
4. [x] Pipeline Kanban básico ✅

### Fase 2: Proyectos y Tareas (En Progreso) 🏗️
5. [x] Tabla projects + CRUD ✅
6. [x] Trigger: Lead Ganado → Crear Proyecto ✅
7. [x] Tabla tasks + CRUD ✅
8. [x] Vista "Mis Tareas" (/tasks) ✅
9. [ ] Testing del flujo automático (Trigger)

### Fase 3: WhatsApp Integration (Semana 4)
9. [ ] Configurar Evolution API
10. [ ] Webhook receiver (Edge Function)
11. [ ] Tabla messages
12. [ ] Inbox UI + Envío de mensajes

### Fase 4: Facturación (Semana 5)
13. [ ] Tabla invoices + CRUD
14. [ ] Formulario con autocompletado fiscal
15. [ ] Generador PDF
16. [ ] Tracking de pagos

### Fase 5: Dashboard (Semana 6)
17. [ ] Métricas de facturación
18. [ ] Pagos pendientes
19. [ ] Tasa de conversión
20. [ ] Polish + Testing E2E

---

## 10. Notas para el Agente

### Prioridades de Implementación
1. **Ficha de cliente 360°** es el corazón del MVP (chat + pagos + tareas en una vista)
2. **WhatsApp** es crítico pero complejo → Fase 3 una vez el core esté sólido
3. **Facturación** puede ser simple al inicio (manual) y automatizar después

### Constraints
- Solo 2 usuarios iniciales → No necesitamos sistema de roles complejo (todos Super Admin)
- Evolution API requiere servidor propio o cloud → Planificar hosting
- Mantener el estilo Aurie en toda la UI (dark mode, lime accents)

### Testing Strategy
- E2E con Playwright: Flujo completo Lead → Cliente → Proyecto → Factura
- Validar KPI: Medir tiempo para entender contexto de cliente (< 60s)

---

*"Primero entiende el negocio. Después escribe código."*


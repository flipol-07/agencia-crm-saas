# PRP-001: Intelligent CRM Automations

> **Estado**: ACORDADO
> **Fecha**: 2026-01-30
> **Proyecto**: CRM_prueba

---

## Objetivo

Implementar dos potentes automatizaciones de IA:
1.  **Smart Invoicing ⚡**: Envío de facturas con un click (Email/WhatsApp).
2.  **AI Assistant (Bola Flotante) 🤖**: Chatbot contextual que conoce TODA la app pero respeta la privacidad de datos por usuario (ve "mis gastos", no "los de todos").

## Por Qué

| Problema | Solución |
|----------|----------|
| Proceso manual de envío de facturas | Botón "1-Click Send" para Email y WhatsApp |
| Usuario necesita consultar datos dispersos | Chatbot centralizado que responde sobre gastos, leads, etc. |

**Valor de negocio**: Ahorro de tiempo administrativo y acceso instantáneo a la información del negocio mediante lenguaje natural.

## Qué

### Criterios de Éxito
- [ ] Función "Enviar Factura" operativa para Email y WhatsApp.
- [ ] Chatbot flotante accesible desde cualquier página.
- [ ] Chatbot responde preguntas sobre datos del usuario ("¿Cuánto gasté hoy?").
- [ ] **Privacidad**: Chatbot NO revela datos de otros usuarios (RLS respetado).

### Comportamiento Esperado

1.  **Smart Invoicing**:
    *   Botón "Enviar" en detalle de factura.
    *   Modal para elegir Email o WhatsApp.
    *   Envío real via SMTP o redirección a API WhatsApp.

2.  **AI Chatbot**:
    *   Bola flotante en esquina inferior derecha.
    *   Al abrir, interfaz de chat simple.
    *   Usuario pregunta: "¿Tengo facturas pendientes?".
    *   AI consulta BD (filtrando por `user_id`) y responde.

---

## Contexto

### Referencias
- `src/features/chat/` - Chat existente (WhatsApp/Clientes). **NO mezclar**. Crear `src/features/ai-assistant/`.
- `package.json` - `openai` ya instalado.

### Arquitectura Propuesta (Feature-First)

**Shared**:
```
src/shared/services/
└── email.service.ts  <-- Refactor para uso global
```

**Feature: AI Assistant**:
```
src/features/ai-assistant/
├── components/
│   ├── FloatingChat.tsx
│   └── ChatWindow.tsx
├── services/
│   ├── ai.service.ts       <-- Llamadas a OpenAI
│   └── context.service.ts  <-- Recuperación de datos (RAG simplificado)
└── hooks/
    └── useAiChat.ts
```

**Feature: Invoices (Update)**:
```
src/features/invoices/
└── components/
    └── SendInvoiceButton.tsx
```

---

## Blueprint (Assembly Line)

### Fase 1: Infraestructura de Envío Global (Smart Invoicing Parte 1)
**Objetivo**: Desacoplar el envío de emails del Lead Scraper.
**Validación**:
- Servicio `EmailService` global creado.
- Endpoint genérico `/api/email/send`.

### Fase 2: Smart Invoicing UI & WhatsApp (Smart Invoicing Parte 2)
**Objetivo**: UI para enviar facturas.
**Validación**:
- Click en "Enviar" muestra modal.
- Integración con WhatsApp URL scheme (`https://wa.me/...`).

### Fase 3: AI Assistant - UI & Contexto
**Objetivo**: Bola flotante y lógica de recuperación de datos segura.
**Validación**:
- Componente visual en el Layout.
- Servicio que consulta Supabase filtrando SIEMPRE por `auth.uid()`.
- Prompt de sistema que fuerza la privacidad.

### Fase 4: Validación Final
**Validación**:
- [ ] `npm run build` exitoso.
- [ ] Test manual: Preguntar por datos de OTRO usuario y verificar que no responde.
- [ ] Test manual: Enviar factura real.

---

## 🧠 Aprendizajes (Self-Annealing)

> Espacio reservado para documentar errores durante la implementación.

---

## Gotchas

- [ ] **Seguridad AI**: El contexto pasado a OpenAI no debe exceder el límite de tokens ni incluir datos sensibles de otros. Usar `auth.uid()` en todas las queries de contexto.
- [ ] **WhatsApp Web**: Validar formato de teléfonos internacionales.

---

*PRP actualizado y listo para ejecución.*

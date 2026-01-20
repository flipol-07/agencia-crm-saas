---
description: Inicializar contexto del proyecto para el asistente AI. Usa esto al comenzar una nueva conversación.
---
# Primer: Contexto SaaS Factory

Este proyecto fue creado con **SaaS Factory**, una template optimizada para desarrollo Agent-First. Al ejecutar `/primer`, el agente entiende inmediatamente qué tiene disponible y cómo trabajar.

## Lo Que Ya Sabes (SaaS Factory DNA)

### Golden Path (Stack Fijo)
No hay decisiones técnicas que tomar. El stack está definido: Next.js 16 + Turbopack, React 19 + TypeScript, Tailwind CSS 3.4, Supabase (Auth + PostgreSQL + Storage + RLS), Zod.

### Arquitectura Feature-First
- `src/app/`: Rutas
- `src/features/`: Lógica colocalizada por feature
- `src/shared/`: Componentes y utilidades compartidas

### MCPs Disponibles
- **Supabase**: BD y Auth
- **Next.js DevTools**: Debug y logs
- **Playwright**: Validación visual

## Proceso de Contextualización

### 1. Leer Identidad del Proyecto
Lee `GEMINI.md` o `CLAUDE.md`.

### 2. Mapear Estado de BD
Usa `list_tables`.

### 3. Escanear Features
Revisa `src/features/`.

### 4. Entregar Resumen
Muestra el estado actual del proyecto, rutas y API endpoints.

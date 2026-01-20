---
description: Proceso metodológico para tareas complejas (Descomposición en Fases + Mapeo de Contexto JIT)
---
# 🏗️ Bucle Agéntico: Modo BLUEPRINT

> *"No planifiques lo que no entiendes. Mapea contexto, luego planifica."*

El modo BLUEPRINT es para sistemas complejos que requieren construcción por fases con mapeo de contexto just-in-time.

## 🎯 Cuándo Usar BLUEPRINT
- La tarea requiere múltiples componentes coordinados.
- Involucra cambios en DB + código + UI.
- Tiene fases que dependen una de otra.

## 🔄 El Flujo BLUEPRINT

### PASO 1: DELIMITAR
- Divide el problema en FASES cronológicas.
- **⚠️ NO generes subtareas todavía.**

### PASO 2: MAPEAR (JIT Context)
- ANTES de cada fase, explora:
  - **Codebase**: Patrones y archivos relacionados.
  - **DB**: Estructura de tablas y RLS.
  - **Dependencias**: Lo construido en fases previas.

### PASO 3: EJECUTAR
- Genera subtareas basadas en el contexto REAL.
- Usa MCPs activamente (Next.js, Playwright, Supabase).

### PASO 4: AUTO-BLINDAJE
- Si ocurre un error: Arregla -> Testea -> **Documenta**.
- El mismo error no debe ocurrir dos veces.

---

## 🏁 Principios
1. Fases primero, subtareas después.
2. Mapeo obligatorio antes de cada fase.
3. Contexto acumulativo.

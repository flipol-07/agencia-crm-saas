---
description: Modo de ejecución rápida para tareas pequeñas (correcciones, ajustes UI).
---
# /sprint - Modo SPRINT (Rápido)

> *"No pienses. Ejecuta. Itera. Confirma."*

Modo optimizado para tareas puntuales que no requieren planificación compleja.

## 🎯 Cuándo Usar
- Bugs visuales o lógicos simples.
- Ajustes pequeños de UI.
- Consultas rápidas.

## 🔄 Flujo SPRINT

### 1. Ejecutar Directamente
- Lee los archivos relevantes.
- Implementa el fix o cambio.
- **NO** crees planes detallados ni fases.

### 2. MCPs On-Demand
Usa tus herramientas solo si son necesarias:
- **Playwright**: Para verificar cambios visuales (`screenshot`).
- **Next.js**: Para ver errores de compilación (`get_errors`).
- **Supabase**: Para validar una query (`execute_sql`).

### 3. Iterar
Código -> Error -> Fix -> Repeat.

### 4. Confirmar
Confirma brevemente lo que hiciste y el resultado.

---
*Usa este modo para velocidad máxima.*

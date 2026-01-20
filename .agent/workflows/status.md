---
description: Verifica el estado de los servidores MCP y de la base de datos Supabase.
---
# /status - Reporte de la Factoría

Este comando realiza un chequeo rápido de la infraestructura.

## 1. Servidores MCP
- ¿Están activos `supabase`, `next-devtools` y `playwright`?
- Intenta listar recursos de cada uno.

## 2. Base de Datos
- Ejecuta `list_tables` en Supabase.
- Reporta el número de tablas y si hay datos.

## 3. Entorno Next.js
- Verifica si el servidor de desarrollo está respondiendo (vía `nextjs_index`).

## 4. Variables de Entorno
- Verifica la existencia de `.env.local` y si las claves críticas están presentes (sin mostrarlas completas).

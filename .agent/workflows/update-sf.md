---
description: Actualiza SaaS Factory a la última versión disponible del repositorio fuente.
---
# Update SaaS Factory

Este comando actualiza las herramientas de desarrollo (carpeta `.claude/` y `.agent/`) a la última versión.

## Proceso

1. **Buscar el alias saas-factory**: Busca en `~/.zshrc` o `~/.bashrc`.
2. **Actualizar el repositorio fuente**: Ejecuta `git pull` en la ruta del repo.
3. **Reemplazar herramientas**:
   - Elimina `.claude/` y copia la nueva versión.
   - (Personalizado para Antigravity) Actualiza también `.agent/workflows/`.
4. **Confirmar**: Informa qué se ha actualizado.

*Nota: Este comando no modifica `GEMINI.md`, `.mcp.json` ni el código fuente.*

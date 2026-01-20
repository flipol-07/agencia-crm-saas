---
description: Generar un Product Requirements Proposal (PRP) para una nueva feature.
---
# /blueprint-init: Generador de PRP

Este workflow te guía para crear el Blueprint de una nueva funcionalidad antes de implementarla.

## 1. Entrevista de Requisitos
Pregunta al usuario:
- **Objetivo**: Qué debe hacer la funcionalidad.
- **Dolor/Solución**: Qué problema resuelve.
- **Criterios de Éxito**: Cómo sabemos que está terminada.

## 2. Investigación de Contexto
- Revisa `src/features/` para encontrar patrones similares.
- Verifica la base de datos con `list_tables`.

## 3. Generación del PRP
Crea un archivo en `.claude/PRPs/PRP-XXX-[nombre].md` usando el template de `.claude/PRPs/prp-base.md`.

## 4. Estructura del PRP
- **Objetivo**
- **Por Qué**
- **Qué** (Criterios de éxito y Happy Path)
- **Contexto** (Arquitectura Feature-First propuesta)
- **Blueprint** (Define solo las FASES, NO subtareas)
- **Aprendizajes** (Vacío inicialmente)

## 5. Aprobación
Presenta el PRP al usuario y espera su aprobación antes de proceder con el `blueprint` workflow.

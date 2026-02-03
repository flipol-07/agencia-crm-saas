# PRP: Configuración de Rol Profesional para Personalización de IA

## 🎯 Objetivo
Permitir a los usuarios especificar su rol profesional y descripción en los ajustes del CRM para que el Asistente IA (Aura) pueda proporcionar recomendaciones y asistencia personalizada según su perfil específico.

## 🏗️ Cambios Propuestos

### 1. Base de Datos (Supabase)
- **Tabla**: `profiles`
- **Nuevas Columnas**:
    - `professional_role`: `text` (Ej: "Diseñador Web UX", "Estratega de Marketing", "Project Manager").
    - `professional_description`: `text` (Detalles adicionales sobre su experiencia o foco actual).

### 2. Tipos (TypeScript)
- Actualizar la interfaz `Profile` en `src/types/database.ts` para incluir los nuevos campos.

### 3. Interfaz de Usuario (Frontend)
- **Componente**: `SettingsForm.tsx`
- **Sección**: "Perfil Profesional" (o integrada en Datos del Perfil).
- **Funcionalidad**: Inputs para rol y descripción. Feedback visual de guardado.

### 4. Inteligencia Artificial (Backend)
- **Archivo**: `src/app/api/ai/chat/route.ts`
- **Cambio**: 
    1. Obtener el perfil del usuario desde Supabase al inicio de la petición.
    2. Inyectar el `professional_role` y `professional_description` en el `systemPrompt` de Aura AI.
    3. Instruir a Aura para que use esta información para adaptar su tono y recomendaciones.

## 🔄 Flujo de Trabajo
1. Ejecutar migración SQL para añadir columnas.
2. Actualizar tipos TypeScript.
3. Implementar campos en el formulario de ajustes.
4. Modificar el prompt del sistema en la API de chat.
5. Verificación visual con Playwright.

## ✅ Criterios de Aceptación
- El usuario puede guardar su rol en Ajustes.
- El dato persiste tras recargar.
- Aura AI reconoce el rol del usuario en la primera interacción (ej: "¿Cuál es mi perfil profesional?").

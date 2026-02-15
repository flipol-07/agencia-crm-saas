# PRP: Plantilla de Factura "AURIE Oficial"

## 🎯 Objetivo
Crear una plantilla de factura premium denominada **"AURIE Oficial"** que refleje la identidad visual de la marca (púrpura profundo, diseño minimalista y profesional) basándose en la referencia visual proporcionada.

## 🏗️ Fases de Implementación

### Fase 1: Infraestructura de Base de Datos
- **Creación de Tablas**: Asegurar que las tablas `invoice_templates`, `invoices` e `invoice_items` existan en la base de datos (según el esquema definido en `database.ts`).
- **Registro de Plantilla**: Insertar la configuración JSON de la plantilla "AURIE Oficial" con los elementos posicionados milimétricamente.

### Fase 2: Mejoras en el Motor de Renderizado (`InvoiceCanvas`)
- **Soporte de Estilos Extendidos**: Añadir `backgroundColor` y `borderRadius` a los elementos de la factura para permitir las barras de color y cajas de destaque.
- **Desglose de IRPF**: Actualizar el componente de totales para mostrar la retención de IRPF si el valor es distinto de cero.
- **Logo Aurie**: Integrar el asset `aurie-official-logo.png` en la cabecera.

### Fase 3: Refinamiento Visual (CSS/Tailwind)
- **Tipografía**: Forzar el uso de 'Outfit' para títulos y 'Inter' para el cuerpo, manteniendo la elegancia.
- **Micro-ajustes**: Espaciado milimétrico para simular una factura de diseño real (A4).

## 📊 Especificaciones Técnicas
- **Nombre**: `AURIE Oficial`
- **Capacidad**: 15 items.
- **Paleta de Colores**:
  - Primario (Header/Footer): `#2e1065` (Purple-950 aproximado)
  - Texto: `#1f2937` (Gray-800) e `#ffffff` para contrastes.

## ✅ Criterios de Aceptación
1. La plantilla es seleccionable desde el selector de plantillas.
2. El diseño coincide visualmente con la captura (barra superior púrpura, logo a la derecha, factura ID en caja).
3. Se calcula y muestra correctamente el IRPF (si aplica).
4. Exportación a PDF/Impresión mantiene el layout exacto.

---
*Brain: SaaS Factory V3 - Cerebro de la Fábrica*

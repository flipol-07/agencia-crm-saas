# PRP: Optimización de Experiencia Móvil (Mobile Friendly)

## Objetivo
Transformar la aplicación en una experiencia fluida y funcional en dispositivos móviles (PWA), eliminando la compresión de elementos y mejorando la navegación en secciones críticas como Ajustes y Facturas.

## Problemas Detectados
1.  **Ajustes**: El menú lateral de ajustes ocupa demasiado espacio en móvil, comprimiendo el formulario de datos.
2.  **Facturas**: El listado de facturas presenta elementos amontonados en pantallas estrechas.
3.  **Espaciado**: Paddings excesivos (`p-8`) que consumen el área visible útil en móviles de ~375px.

## Solución Propuesta
1.  **Navegación Adaptativa**: Sustituir el `aside` fijo en ajustes por un sistema de pestañas horizontales (`tabs`) en móvil.
2.  **Diseño Condensado**: Implementar utilidades de Tailwind (`p-4 sm:p-8`) para adaptar el espaciado según el dispositivo.
3.  **Componentes Flexibles**: Reorganizar las filas de listados para que fluyan verticalmente o usen grids de una sola columna cuando sea necesario.

## Impacto
- Mejora drástica en la retención de usuarios móviles.
- Facilita la gestión rápida desde el teléfono (PWA).
- Alineación con los estándares modernos de diseño responsivo.

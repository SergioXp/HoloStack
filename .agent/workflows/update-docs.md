---
description: Workflow para actualizar la documentación al terminar un desarrollo
---

# 📝 Actualizar Documentación y Calidad (Post-Desarrollo)

Ejecuta este workflow cada vez que termines un desarrollo, refactorización o corrección de error significativa para mantener la integridad del proyecto.

## 📋 Pasos Obligatorios

### 1. 🧪 Verificación y Creación de Tests
- **Tests Unitarios**: Ejecutar `npm run test` y asegurar que el 100% de los tests pasan. No se debe documentar nada como "terminado" si los tests fallan.
- **Nuevos Tests**: Si se ha añadido lógica de negocio en `src/lib`, crear tests unitarios correspondientes (ej: `version-utils.ts` → `version-utils.test.ts`).
- **Tipado Estricto**: Ejecutar `npx tsc --noEmit` para asegurar que no hay errores de TypeScript.
- **Build**: Ejecutar `npm run build` si el cambio afecta a rutas, layout o lógica core de Next.js.

### 2. 🔢 Sincronización de Versión
- **Incremento**: Incrementar la versión en `package.json` y `src/lib/constants/version.ts`.
- **ROADMAP.md**: Asegurar que la "Versión Actual" en el Roadmap coincide con los archivos anteriores.

### 3. 🗺️ Actualización del ROADMAP.md
- **Checkboxes**: Marcar como completadas las tareas correspondientes.
- **Próximos Pasos**: Si el desarrollo ha revelado nuevas necesidades, añadirlas a la sección "En Progreso" o "Futuro".

### 4. 🏗️ Actualización de ARCHITECTURE.md
- **Estructura de Carpetas**: Si se han creado archivos en `src/lib`, `src/services` o `src/db`, actualizar el árbol de directorios.
- **Lógica de Negocio**: Describir nuevas funciones puras, utilidades o procesos complejos (ej: sistemas de arrastre, lógica de precios).
- **Diagramas**: Actualizar diagramas Mermaid si ha cambiado la relación entre tablas o el flujo de datos principal.

### 5. 📔 Actualización de UTILITIES.md
- **Nuevas Utilidades**: Si se han creado o modificado funciones en `src/lib`, actualizar su descripción en el diccionario para que otros desarrolladores entiendan su propósito.

### 6. 🔌 Actualización de API_REFERENCE.md
- **Nuevos Endpoints**: Registrar cada nueva ruta API con su verbo HTTP, descripción y ejemplo de Body/Response.
- **Cambios en Payload**: Si se ha modificado la respuesta de un endpoint existente (ej: añadir campos de histórico), reflejarlo en el documento.

### 7. 🛡️ Actualización de TESTS.md
- **Nuevas Suites**: Añadir descripción de los nuevos archivos `.test.ts` creados.
- **Fases de Calidad**: Marcar los items correspondientes en el "Plan de Testing Futuro".
- **Estrategia**: Si se ha cambiado la forma de testear algo (ej: mockear global fetch), anotarlo en la sección de estrategia.

### 8. 🌐 Internacionalización (i18n)
- **Sincronización**: Verificar que todas las claves nuevas en `src/locales/es.json` han sido portadas y traducidas en `src/locales/en.json`.
- **Hardcoding**: Asegurar que no hay textos literales en la UI; todo debe pasar por el hook `useI18n`.

### 9. 📜 CHANGELOG.md (Interno)
- Añadir entrada bajo la categoría correspondiente (✨ Feature, ♻️ Refactor, 🐛 Bugfix).
- Este changelog es técnico y detallado para el equipo de desarrollo.

### 10. 🌍 PUBLIC_CHANGELOG.md (Usuarios)
- **Añadir entrada** en `PUBLIC_CHANGELOG.md` con lenguaje orientado al usuario final (sin jerga técnica).
- **Sincronización automática**: Al ejecutar `npm run release`, este archivo se sube automáticamente como `CHANGELOG.md` al repo público (SergioXp/HoloStack).
- **Formato**: Usar descripciones de beneficios, no de implementación (ej: "Faster startup" en lugar de "Refactored main.ts").

## 🚀 Emojis para Commit/Documentación

| Emoji | Significado |
|-------|-------------|
| ✨ | Nueva funcionalidad |
| 🐛 | Corrección de bug |
| ♻️ | Refactorización (sin cambio de lógica) |
| 🛡️ | Añadir/Actualizar tests |
| 📝 | Documentación |
| ⚡ | Mejora de rendimiento |
| 🎨 | Estilos / UI |
| 🔧 | Configuración / Infraestructura |
| 🌐 | Traducciones / i18n |

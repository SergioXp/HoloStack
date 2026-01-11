---
description: Workflow para actualizar la documentación al terminar un desarrollo
---

# Actualizar Documentación de Desarrollo

Ejecuta este workflow cada vez que termines un desarrollo o funcionalidad.

## Pasos

1. **Actualizar el CHANGELOG.md**
   - Añadir una nueva entrada bajo la versión actual o crear una nueva versión si aplica
   - Incluir: fecha, descripción del cambio, archivos modificados/creados
   - Categorizar como: ✨ Feature, 🐛 Bugfix, 🔧 Config, 📝 Docs, ♻️ Refactor

2. **Verificar Traducciones e Internacionalización**
   - **Buscar textos hardcoded**: Revisar visualmente o con grep los archivos modificados para asegurar que no quedaron textos sin usar `t()`.
   - **Sincronización**: Verificar que todas las claves nuevas en `es.json` existen también en `en.json`.
   - **Integridad JSON**: Asegurar que no hay claves duplicadas en los archivos de traducción.

3. **Verificar el estado del proyecto**
   - Ejecutar `npm run build` para confirmar que compila (esto también valida los tipos de i18n)
   - Ejecutar `npx tsc --noEmit` para verificar tipos
   - Anotar cualquier warning o error pendiente

3. **Documentar decisiones técnicas importantes**
   - Si hay decisiones de arquitectura, añadirlas al CHANGELOG
   - Documentar cualquier workaround o solución temporal

4. **Generar resumen del estado actual**
   - Listar features completados
   - Listar features pendientes
   - Anotar dependencias añadidas

## Formato de Entrada en CHANGELOG

```markdown
### [Emoji] Nombre del Desarrollo

**Fecha**: YYYY-MM-DD

#### Cambios
- Descripción del cambio 1
- Descripción del cambio 2

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `path/to/file` | Nuevo/Modificado/Eliminado | Descripción |

#### Notas Técnicas
- Cualquier decisión importante o workaround
```

## Emojis de Categoría

| Emoji | Categoría |
|-------|-----------|
| ✨ | Nueva funcionalidad |
| 🐛 | Corrección de bug |
| 🔧 | Configuración |
| 📝 | Documentación |
| ♻️ | Refactorización |
| 🗑️ | Eliminación de código |
| 🔒 | Seguridad |
| ⚡ | Mejora de rendimiento |
| 🎨 | Estilos/UI |

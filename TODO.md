# Lista de Tareas y Mejoras - HoloStack

Este documento sirve como backlog vivo para seguir el desarrollo de la aplicación.
Siéntete libre de añadir nuevas ideas o problemas detectados aquí. La IA revisará este archivo para planificar las siguientes iteraciones.

## 🔴 Prioridad Alta (Next Up)
- [X] **Lanzar v1.1.3** con corrección de GitHub Actions (fix `ERR_DLOPEN_FAILED` en Windows/Linux/Mac CI).

## 🟡 Backlog / Pendientes
- [ ] Revisar si la sincronización de precios de TCGPlayer funciona correctamente para todas las variantes.
- [ ] Investigar optimización de imágenes en el carrusel de la colección.
- [ ] Añadir soporte para escaneo de cartas mediante webcam/cámara del móvil.
- [ ] En la opción de la carta para buscar en cardmarket, añadir al buscador el id del set + el número de la carta, esto es para que busque la carta correcta.

## 🟢 Completado (Reciente)
- [x] Corregir lógica de actualización (`hasNewerVersion`) para evitar falsos positivos.
- [x] Solucionar bug de importación de backup (transacción síncrona en better-sqlite3).
- [x] Desactivar chequeo de Foreign Keys durante la importación inicial.
- [x] Corregir visualización de changelog (problema con claves de i18n con puntos).
- [x] Arreglar `npm ci` en Dockerfile con reintentos de red.
- [x] Configurar `electron-rebuild` forzoso en GitHub Actions para evitar mismatch de ABI.

## 💡 Ideas / Futuro
- [ ] Modo oscuro/claro alternable manualmente (actualmente es solo oscuro).
- [ ] Exportación a CSV/Excel de la colección.
- [ ] Integración con eBay para precios en tiempo real.

---
*Nota: Marca las tareas como completadas poniendo una `x` entre los corchetes: `[x]`.*

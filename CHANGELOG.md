### [1.0.3] - 2026-01-26

### 🛡️ Fix Crítico de Base de Datos y Red

**Fecha**: 2026-01-26

#### Cambios
- **Auto-Reparación de Base de Datos**: 
    - Se elimina el bloqueo que impedía actualizar la base de datos si ya existían tablas.
    - Ahora, cada vez que la app arranca, verifica y aplica las correcciones necesarias automáticamente (como añadir columnas faltantes `attacks`).
    - Soluciona el error `SqliteError: table cards has no column named attacks`.
- **Estabilidad de Red en Descargas**:
    - Optimización del proceso de sincronización de imágenes y datos de cartas.
    - Implementación de descargas por lotes (Batching 20 items) para evitar saturación de red y timeouts en conexiones lentas.
- **Prevención de Errores (CI/CD)**:
    - Nuevo comando `db:check` en el pipeline de construcción que impide generar una versión si el esquema de base de datos no coincide con las migraciones SQL.
    - Nuevo script `start:clean` para probar entornos limpios (Sandbox) sin afectar los datos del desarrollador.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `drizzle/0002_common_drax.sql` | SQL | Nueva migración con columnas faltantes en tabla `cards`. |
| `src/instrumentation.ts` | Fix | Lógica de migración corregida para ejecutarse siempre. |
| `src/app/api/sync/collection-cards/route.ts` | Perf | Batching de descargas para evitar timeouts. |
| `package.json` | Config | Scripts de seguridad `db:check` y `start:clean`. |

---

### [1.0.2] - 2026-01-22

### 🐛 Hotfix: Electron Database Path & Startup

**Fecha**: 2026-01-22

#### Cambios
- **Corrección de Ruta de Base de Datos**: Solucionado un problema donde la aplicación de escritorio no leía la base de datos del usuario correctamente.
    - **Causa**: Next.js standalone "hornea" las variables de entorno en tiempo de build, ignorando las que Electron pasa en runtime.
    - **Solución**: Electron ahora escribe un archivo `runtime-config.json` que Next.js lee dinámicamente al iniciar.
- **Health Check Mejorado**: El verificador de estado del servidor ahora acepta códigos HTTP 2xx y 3xx (antes solo 200).
    - Esto permite que la app inicie correctamente incluso cuando hay redirect a login.
- **Limpieza de Build**: Se eliminan archivos de base de datos del bundle para proteger la privacidad del desarrollador.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `electron/main.ts` | Fix | Escribe runtime-config.json antes de iniciar Next.js. |
| `src/db/index.ts` | Fix | Lee configuración desde archivo JSON en runtime. |
| `scripts/rebuild-standalone.js` | Fix | Limpia carpeta data/ del build. |

---

### [1.0.1] - 2026-01-21

### 🐛 Hotfix: Electron Startup Fix

**Fecha**: 2026-01-21

#### Cambios
- **Corrección Crítica de Inicio**: Solucionado un bug que impedía que la aplicación de escritorio (Electron) se iniciara correctamente.
    - **Causa**: El archivo `.migration.lock` intentaba crearse dentro del bundle empaquetado (`app.asar.unpacked`), que es de solo lectura en producción.
    - **Solución**: El lock file ahora se crea en el mismo directorio que la base de datos (`Library/Application Support/holostack/`), que es una ubicación escribible.
- **Impacto**: Este bug afectaba a todas las versiones de escritorio (Windows, Mac y Linux). La versión Docker y el modo desarrollo no estaban afectados.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/instrumentation.ts` | Fix | Ruta dinámica del lock file según entorno. |

---

### [1.0.0] - 2026-01-20

### ✨ HoloStack Desktop Launch & CI/CD Centralizado

**Fecha**: 2026-01-20

#### Cambios
- **Modo Escritorio (Electron)**:
    - Lanzamiento de la aplicación nativa para Windows, macOS y Linux.
    - Persistencia de datos integrada en carpetas de sistema (`AppData`/`Library`).
    - Motor de renderizado optimizado con Next.js Standalone.
- **CI/CD con GitHub Actions**:
    - Automatización total del empaquetado multiplataforma.
    - Generación automática de imágenes Docker y subida a GHCR.
- **Sistema de Actualizaciones Unificado**:
    - Las versiones de Docker y Escritorio ahora usan GitHub Releases como fuente única de verdad.
    - Detección automática de versiones basadas en fecha y SemVer.
- **Branding y UX**:
    - Icono de aplicación personalizado y pulido de interfaz para escritorio.
    - Mejora de estabilidad en el build de Docker (compilación nativa Alpine).

#### Archivos Nuevos/Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `electron/*` | Core | Motor principal de la app de escritorio. |
| `.github/workflows/build.yml` | Infra | Pipeline de automatización global. |
| `Dockerfile` | Infra | Soporte para compilación nativa en Alpine. |
| `scripts/rebuild-standalone.js` | Build | Optimizador de tamaño para la versión Desktop. |

---

### [0.9.1] - 2026-01-20

### ✨ Historial de Cambios Interactivo

**Fecha**: 2026-01-20

#### Cambios
- **Changelog Modal**: Nueva ventana modal accesible desde el header ("What's New") que muestra el historial de versiones de forma visual.
- **Contenido Curado**: Resúmenes amigables para el usuario final (no técnicos) de las últimas versiones.
- **Soporte i18n**: Traducción completa de las notas de la versión.

#### Archivos Nuevos/Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/ChangelogModal.tsx` | UI | Modal de historial interactivo. |
| `src/lib/changelog-data.ts` | Config | Definición de versiones y fechas. |
| `src/components/Header.tsx` | UI | Nuevo botón de acceso directo (Sparkles). |
| `src/locales/*.json` | Config | Textos de las notas de versión (v0.9.0, etc). |

---

### [0.9.0] - 2026-01-20

### ✨ Importador de Pedidos Cardmarket y Cross-Linking

**Fecha**: 2026-01-20

#### Cambios
- **Importación Inteligente Cardmarket**:
    - Parser de texto capaz de interpretar correos de confirmación de pedido.
    - **Detección Automática**: Extrae cantidad, nombre, set, variante (Holo/Reverse), idioma, condición y precio.
    - **Matching Inteligente**: Algoritmo de puntuación que usa rareza y códigos (ART, RR) para encontrar la carta exacta en DB.
    - **Acciones Masivas**: Asignación global a colección o presupuesto, variante por defecto, etc.
- **Cross-Linking Presupuestos <-> Colecciones**:
    - Ahora es posible navegar directamente desde un Presupuesto a su Colección asociada y viceversa.
    - Mejor visibilidad del progreso de gasto por colección.
- **Mejoras UX Importación**:
    - Selector de Set manual en cada fila con re-matching automático.
    - Validación visual de variantes (aviso si intentas forzar Holo en carta que no lo tiene).
    - Campo de Notas de Usuario integrado en la importación.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/import/page.tsx` | Nuevo | UI principal del importador. |
| `src/lib/import/cardmarket-parser.ts` | Lib | Lógica de Regex para parseo. |
| `src/app/api/import/bulk-save/route.ts` | API | Endpoint transaccional para guardar cartas y gastos. |
| `src/locales/*.json` | Config | I18n completo del importador. |

---

### [0.8.3] - 2026-01-15

### ✨ Sistema de Comprobación de Actualizaciones (Docker Hub)

**Fecha**: 2026-01-15

#### Cambios
- **Auto-check de Versiones**: La aplicación ahora consulta automáticamente Docker Hub para verificar si existe una imagen más reciente.
- **Banner de Notificación**: Implementación de un banner dinámico en el layout principal que avisa cuando hay una actualización disponible.
- **Guía de Actualización**: Incluido un modal con instrucciones paso a paso para actualizar contenedores Docker (`pull` & `up -d`) sin riesgo de pérdida de datos.
- **Normalización de Versión**: Sincronización de versiones en `package.json`, Roadmap y constantes internas.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/system/update-check/route.ts` | API | Backend para consulta a Docker Hub. |
| `src/components/UpdateBanner.tsx` | UI | Componente visual y modal de instrucciones. |
| `src/lib/constants/version.ts` | Config | Constantes de versión y nombre de imagen. |
| `src/app/layout.tsx` | UI | Integración del banner en el flujo de renderizado. |

### [0.8.2] - 2026-01-15

### ✨ Pokédex Nacional (1025) y Matching de Especies Potenciado

**Fecha**: 2026-01-15

#### Cambios
- **Colección Nacional Completa (1025 Pokémon)**: 
    - Reescritura del algoritmo de matching para colecciones automáticas.
    - **Normalización Agresiva**: El sistema ahora ignora apóstrofes ("Farfetch'd"), puntos ("Mr. Mime"), géneros ("Nidoran♂"), acentos ("Flabébé") y guiones.
    - Esto garantiza un matching cercano al 100% de las especies existentes (1025 Pokémon).
- **Ordenamiento Pokedex Prioritario**:
    - Integración de `nationalId` en la API de colecciones.
    - El centro de impresión (Proxies) ahora utiliza el ID Nacional como criterio de ordenación primario, asegurando que Bulbasaur (#001) siempre sea el primero, independientemente del set.
- **Corrección de Siluetas y Artes**:
    - Nuevo endpoint `/api/pokemon/species` para resolución de imágenes oficiales.
    - Soporte para prefijos complejos en el buscador de especies (ej: "Teal Mask", "Bloodmoon", "Rapid Strike").
    - Corrección de errores 404 al visualizar siluetas en etiquetas de impresión.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/collections/[id]/route.ts` | API | Nueva lógica de JOIN ultra-robusta con `pokemon_species`. |
| `src/app/api/pokemon/species/route.ts` | API | Endpoint de resolución de especies con limpieza de variantes. |
| `src/app/proxies/page.tsx` | UI | Ordenación por `nationalId` y limpieza de nombres para siluetas. |

#### Notas Técnicas
- **JOIN Performance**: Se optimizó la consulta SQL con múltiples niveles de `replace()` para realizar el matching en una sola pasada de base de datos.
- **Data Integrity**: Se añadió el campo `nationalId` al esquema de respuesta para facilitar el consumo en el frontend sin peticiones adicionales.

### [0.8.1] - 2026-01-15

### ✨ Coleccionismo Múltiple (Stacking) y Notas Privadas

**Fecha**: 2026-01-15

#### Cambios
- **Apilamiento de Cartas (Poker Hand)**: 
    - Rediseño de la rejilla genérica para permitir múltiples variantes/copias de un mismo Pokémon en un único slot.
    - **Efecto Abanico**: Al pasar el ratón por un slot con varias cartas, estas se abren en abanico dinámicamente.
    - **Foco Inteligente**: La carta sobre la que está el cursor resalta automáticamente (pasa al frente, se endereza y se agranda) mientras las demás se oscurecen sutilmente.
    - **Indicador de Cantidad**: Badge visual (+X) que indica cuántas cartas adicionales hay en el montón.
- **Notas Privadas por Carta**:
    - Implementación de un campo de texto libre para añadir anotaciones privadas a nivel de variante.
    - Integración en `CollectionItemManager` con persistencia en base de datos.
    - Indicador visual (icono de documento) en la rejilla cuando una carta tiene notas.
- **Buscador Global Potenciado**:
    - Soporte para búsquedas multi-término (ej: "Pikachu Base" busca por nombre y set simultáneamente).
    - Optimización de límites de resultados y priorización de categorías.
- **Mejoras Explorer**:
    - Implementación de filtros rápidos por Sagas (Series) y Cronología.
    - Buscador integrado en la lista de expansiones de cada serie.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/GenericCollectionGrid.tsx` | UI | Implementación del efecto de abanico y lógica de stacking. |
| `src/db/schema.ts` | DB | Campo `notes` añadido a `collectionItems`. |
| `src/app/actions/collection.ts` | Server Action | Soporte para actualizar notas. |
| `src/components/CollectionItemManager.tsx` | UI | Formulario de edición de notas y variante minimal circular. |
| `src/app/api/search/global/route.ts` | API | Lógica de búsqueda avanzada multi-término. |
| `src/locales/*.json` | Config | Nuevas traducciones para notas, buscador y explorador. |

#### Notas Técnicas
- **Z-Index Management**: Se implementó una gestión dinámica de profundidades para asegurar que el abanico no sea tapado por slots adyacentes.
- **Fuzzy Search API**: El buscador global ahora normaliza los términos de búsqueda y usa operadores AND de Drizzle para combinar condiciones de nombre y set.

### [0.7.0] - 2026-01-14

### ✨ Internacionalización Completa y Estandarización de Layouts

**Fecha**: 2026-01-14

#### Cambios
- **Internacionalización y Textos Hardcoded**: 
    - Se han eliminado prácticamente todos los textos *hardcodeados* detectados en la aplicación (Bulk Entry, Proxies, Wishlist, Collection Selector).
    - Actualización y sincronización completa de `en.json` para reflejar todas las nuevas claves añadidas a `es.json`, evitando errores de visualización de claves en inglés.
- **Estandarización de Layouts**:
    - Unificación del diseño de headers y contenedores principales usando `PageHeader` compartido y estructura `max-w-7xl` consistente en todas las páginas clave (`Binder`, `Proxies`, `Explorer`, `Settings`, etc.).
    - Se eliminaron discrepancias visuales de padding y margenes entre secciones.
- **Mejoras UX**:
    - Añadidos subtítulos descriptivos faltantes en varias páginas principales.
    - Traducción de componentes complejos como la barra de herramientas de proxies y alertas de entrada masivas.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/locales/es.json` | Config | Adición de todas las claves faltantes (40+). |
| `src/locales/en.json` | Config | Sincronización completa con estructura en español. |
| `src/components/PageHeader.tsx` | UI | Refactor para uso universal y props flexibles. |
| `src/app/bulk/page.tsx` | Page | I18n completo. |
| `src/components/BulkEntryClient.tsx` | UI | I18n de formularios y alertas. |
| `src/components/BulkDuplicatesClient.tsx` | UI | I18n de dashboard de duplicados. |
| `src/app/proxies/page.tsx` | Page | Estilos de toolbar e I18n. |
| `src/app/wishlist/page.tsx` | Page | I18n faltante (Botones de acción). |
| `src/components/CollectionSelectorModal.tsx` | UI | I18n de títulos y botones. |

#### Notas Técnicas
- **PageHeader Component**: Se extrajo lógica cliente (`use client`) innecesaria cuando era posible para permitir server rendering de partes estáticas, aunque muchas páginas padre siguen siendo Client Components por necesidad de interactividad.
- **I18n Strategy**: Se reforzó el uso de claves anidadas (ej: `bulk.entry.alerts.success`) para mejor organización semántica.
### [0.6.2] - 2026-01-14

### ✨ Duplicate Management Dashboard

**Fecha**: 2026-01-14

#### Cambios
- **Dashboard de Gestión de Duplicados**: Nueva herramienta integrada para gestión de inventario masivo.
    - **Detección Automática**: Identifica cartas con excedente de copias basado en un umbral personalizado (Playset por defecto: 4).
    - **Cálculo Inteligente**: Agrega cantidades de variantes separadas y calcula el exceso exacto para facilitar ventas o intercambios.
    - **Interfaz Tabulada**: Separación limpia entre "Entrada Masiva" y "Duplicados" en la página `/bulk`.
- **Mejora en Entrada Masiva (Fuzzy Matching)**:
    - Soporte para números de carta sin ceros a la izquierda (ej: `1` detecta `004/165` o `001/165` correctamente).
    - Algoritmo de normalización de números para coincidencia flexible en base de datos.
- **Correcciones de Inventario**:
    - **Fusión de Duplicados**: Corrección crítica en la actualización de cantidades. Al modificar una carta, el sistema ahora busca y fusiona automáticamente registros duplicados de la misma carta+variante en la base de datos, garantizando integridad de datos.
    - **Lógica de Borrado de Ítems**: El borrado masivo ahora decremente cantidades inteligentemente (restar 1 copia si hay múltiples) antes de eliminar el registro completo.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/bulk/duplicates/route.ts` | Nuevo | Endpoint con agregación SQL para detectar excedentes. |
| `src/components/BulkDuplicatesClient.tsx` | Nuevo | UI del dashboard de duplicados. |
| `src/app/bulk/page.tsx` | Modificado | Implementación de Tabs y montaje de componentes. |
| `src/app/api/bulk/validate/route.ts` | Modificado | Lógica "fuzzy match" para números de carta. |
| `src/app/actions/collection.ts` | Refactor | Lógica de fusión de ítems duplicados en `updateCollectionItem`. |
| `src/app/api/collections/[id]/items/route.ts` | Fix | Lógica DELETE corregida para decrementar antes de borrar. |
| `src/locales/*.json` | Config | Textos para dashboard de duplicados y navegación. |

#### Notas Técnicas
- **Agregación SQL**: Para la detección de duplicados se usa `HAVING SUM(quantity) > threshold` en SQL, delegando el cálculo pesado a la base de datos en lugar de procesar en memoria.
- **Integridad de Datos**: Se detectó que versiones anteriores podían crear múltiples filas para la misma carta+variante. `updateCollectionItem` ahora actúa como un "Auto-Fixer", limpiando proactivamente la base de datos con cada interacción de usuario.
# HoloStack - Changelog de Desarrollo

> Registro cronológico de todos los cambios realizados en la aplicación.

---

## [0.6.1] - 2026-01-14

### ✨ Real-time Collection Preview

**Fecha**: 2026-01-14

#### Cambios
- **Vista Previa en Tiempo Real**: Ahora al crear una colección (Automática o Predefinida), se muestra una previsualización dinámica:
    - **Fondo animado**: Grid de cartas aleatorias que coinciden con los filtros.
    - **Cartas de Ejemplo**: 4 cartas destacadas con detalle completo (nombre, imagen, rareza).
    - **Contador Dinámico**: Estimación del número total de cartas que compondrán la colección.
- **Mejoras en Colecciones Predefinidas**:
    - Soporte completo de vista previa para colecciones complejas ("Original 151", "Generational", etc.).
    - Lógica inteligente para mostrar cartas representativas (ej: Al seleccionar "Gen 1", se muestran Charizard, Pikachu, etc.).

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/cards/preview/route.ts` | Nuevo | Endpoint para obtener muestras aleatorias de cartas según filtros complejos (arrays de nombres, rarezas, etc). |
| `src/components/CreateCollectionForm.tsx` | Modificado | Implementación de UI de preview y lógica de debounce (500ms). |
| `src/lib/predefined-collections.ts` | Modificado | Añadido campo `estimatedCount` para mejorar la precisión del contador en el preview. |
| `src/locales/*.json` | Config | Textos para la sección de vista previa. |

#### Notas Técnicas
- **Estrategia de Preview**: El endpoint devuelve un subconjunto aleatorio (`ORDER BY RANDOM() LIMIT 4`) para mantener la respuesta rápida (<200ms).
- **Mapeo de Generaciones**: Dado que la API no tiene filtro directo de generación, el frontend transforma la selección de generación en una lista de nombres representativos (iniciales + legendarios) para la vista previa, o en filtros de rango de series para la creación real.

## [0.6.0] - 2026-01-13

### ✨ Generational Binder & National Dex

**Fecha**: 2026-01-13

#### Cambios
- **Generational Binders**: Nueva opción en "Top Picks" para crear álbumes basados en generación.
    - Soporte completo para las 9 Generaciones (Kanto a Paldea).
    - Opción "Todas las Generaciones" (National Dex) que incluye los 1025+ Pokémon.
- **Mejoras UI**:
    - Etiquetas dinámicas en el detalle de la colección (ej. "Gen 2 (Johto)" en lugar de "151 Genérica").
    - Porcentaje de progreso con decimales (ej. "0.1%") para mayor precisión en colecciones grandes.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/predefined-collections.ts` | Modificado | Añadidas variantes para Gen 1-9 y "All". |
| `src/lib/constants/pokemon-generations.ts` | Nuevo | Definición de rangos y nombres para 9 generaciones. |
| `src/components/CollectionDetailClient.tsx` | Modificado | Lógica dinámica para rendering de slots y cálculo de progreso. |
| `src/components/CreateCollectionForm.tsx` | Modificado | Soporte para creación de `generational-binder`. |
| `src/locales/*.json` | Config | Textos para generaciones y nuevas etiquetas. |

#### Notas Técnicas
- Se reutilizó el motor de "generic_151" pero inyectando dinámicamente la lista de Pokémon basada en el fitro `generation` guardado en la colección.
- Para "All Generations", se renderizan más de 1000 slots. El rendimiento en React parece estable sin virtualización por ahora.

---

## [0.5.1] - 2026-01-13

### 🐛 Hydration Fix & UI Polish

**Fecha**: 2026-01-13

#### Cambios
- **Corrección de Hidratación**: Solucionado error de mismatch entre servidor y cliente en `layout.tsx` causado por extensiones de navegador que inyectan atributos en `body`.
- **Refinamiento UI**: Ajustes menores en etiquetas y visualización de progreso.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/layout.tsx` | Fix | Añadido `suppressHydrationWarning`. |

---

## [0.5.0] - 2026-01-13

### ✨ Collection Management: Deletion & Advanced Sorting

**Fecha**: 2026-01-13

#### Cambios
- **Gestión Avanzada de Colecciones**:
    - **Eliminación y Exclusión**: Nueva funcionalidad para eliminar cartas. En colecciones manuales se borran permanentemente; en automáticas se añaden a una lista negra (`excludedCardIds`) persistente.
    - **Modo Edición**: Interfaz intuitiva con selección múltiple (checkboxes visuales) y confirmación de seguridad.
    - **Ordenación Secundaria**: Al ordenar por "Pokédex", ahora es posible definir un criterio de desempate (Precio Asc/Desc, Fecha).
- **Mejoras Visuales**:
    - Indicadores de selección claros en `CollectionItemManager`.
    - Ajuste de `aspect-ratio` en modo Binder para cumplir estándares de Tailwind.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/collections/[id]/items/route.ts` | Nuevo | Endpoint DELETE para manejo dual (manual/auto). |
| `src/app/collections/[id]/page.tsx` | Modificado | Lógica de filtrado `excludedCardIds` y ordenación secundaria. |
| `src/components/CollectionDetailClient.tsx` | Modificado | Estado de "Modo Edición" y lógica de selección. |
| `src/components/CollectionItemManager.tsx` | Modificado | UI de selección y overlays condicionales. |
| `src/components/CollectionSettings.tsx` | Modificado | UI para selectores de orden secundario. |
| `src/locales/*.json` | Config | Nuevas traducciones para diálogo de borrado y ordenación. |

#### Notas Técnicas
- **Estrategia de Exclusión**: Para evitar romper la lógica de colecciones automáticas (basadas en filtros dinámicos), la eliminación se implementa como una "máscara de exclusión" almacenada en el campo JSON `filters`. Esto permite que si el usuario resincroniza la colección, sus exclusiones manuales se respeten.


## [0.4.3] - 2026-01-12

### ⚡ Performance Optimization: Wishlist Batch Loading

**Fecha**: 2026-01-12

#### Cambios
- **Optimización Crítica**: Se eliminó el problema de N+1 peticiones en la vista de colección. Ahora la wishlist se carga en una única petición "batch" al inicio.
- **Mejora de UX**: Actualización optimista del estado de wishlist en la interfaz.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/CollectionFilter.tsx` | Refactor | Implementación de carga batch de wishlist y gestión de estado centralizada. |
| `src/components/CollectionItemManager.tsx` | Refactor | Eliminación de fetch interno, ahora recibe estado via props. Restauración de prop `variant`. |

## [0.4.2] - 2026-01-12

### 🌐 Internationalization Final Polish

**Fecha**: 2026-01-12

#### Cambios
- **Corrección Estructural I18n**: Reorganización de archivos JSON marcando namespaces globales fuera de `common` para evitar errores de acceso y conflictos.
- **Cobertura Total**: Traducción final de componentes complejos (`CollectionTableView`) y utilidades (`price-refresh`), eliminando los últimos textos hardcoded ("Sin datos", "Updated").
- **Integridad**: Eliminación de claves duplicadas en archivos de idioma y fusión de definiciones perdidas.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/locales/*.json` | Refactor | Reestructuración de namespaces y limpieza. |
| `src/lib/price-refresh.ts` | Refactor | Soporte i18n en funciones de utilidad. |
| `src/components/CardDetailModal.tsx` | Fix | Paso de función `t` a utilidades. |
| `src/components/CollectionTableView.tsx` | I18n | Traducción de headers y mensajes CSV. |
| `src/components/DeleteCollectionButton.tsx` | I18n | Traducción de diálogos. |

## [0.4.1] - 2026-01-12

### 🎨 Binder Visual Overhaul & Responsive Nav

**Fecha**: 2026-01-12

#### Cambios
- **Binder (Álbum) Mejorado**:
    - Cálculo dinámico de aspect-ratio para evitar recortes en todos los layouts (3x3, 4x3).
    - Aumento del tamaño visual del álbum (47vw por página) y márgenes reducidos para cartas más grandes.
    - Scroll vertical automático habilitado para adaptarse a diferentes alturas de viewport.
    - Cartas en modo binder optimizadas (`object-cover`, sin texto, badges reubicados).
- **Navegación Responsive**:
    - Adaptación inteligente del menú principal: textos ocultos en pantallas < 1280px.
    - Eliminación de scroll horizontal en favor de diseño limpio de iconos.
    - Tooltips añadidos para accesibilidad en modo iconos.
- **Mejoras API**:
    - Inclusión de `setName` en respuestas de colección individual.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/binder/page.tsx` | Modificado | Lógica de aspect-ratio y estilos de layout. |
| `src/components/CollectionItemManager.tsx` | Modificado | Variante 'binder' y estilos de carta. |
| `src/components/Header.tsx` | Modificado | Lógica responsive y tooltips. |
| `src/app/api/collections/[id]/route.ts` | Modificado | Campo `setName` añadido. |

#### Notas Técnicas
- El cálculo del binder ahora usa: `(layout.cols * 70 + 40) / (layout.rows * 95 + 40)` para garantizar que el contenedor siempre respete la proporción de las cartas + márgenes.

## [0.4.0] - 2026-01-11

### ✨ Phase 2 Complete: Proxies, Tags & Bulk Operations

**Fecha**: 2026-01-11

#### Nuevas Funcionalidades
- **Sistema de Etiquetas (Tags)**:
    - Creación de etiquetas personalizadas (Globales).
    - Asignación de etiquetas a cartas específicas en la colección.
    - Componente UI integrado en el gestor de items.
- **Generador de Proxies**:
    - Nueva página `/proxies` accesible desde el menú principal.
    - Buscador de cartas específico para esta herramienta.
    - Vista previa de impresión en formato A4 (3x3 grid).
    - Impresión optimizada vía CSS print media.
- **Operaciones en Lote (Bulk)**:
    - Vista de tabla mejorada con edición in-line de cantidades.
    - Importación/Exportación CSV robusta soportando variantes.

#### Archivos Nuevos/Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/proxies/page.tsx` | Nuevo | Página de generador de proxies. |
| `src/app/api/tags/*` | Nuevo | API Endpoints para Tags. |
| `src/components/TagManager.tsx` | Nuevo | Componente UI para gestión de etiquetas. |
| `src/app/api/cards/search/route.ts` | Nuevo | API de búsqueda de cartas. |
| `src/components/CollectionItemManager.tsx` | Modificado | Integración de Tags. |
| `src/components/CollectionTableView.tsx` | Modificado | Mejoras de bulk ops y CSV. |

---

## [0.3.3] - 2026-01-11

### 🎨 Refactorización Visual y Correcciones de Fase 2

**Fecha**: 2026-01-11

#### Cambios
- **Corrección de Temas UI**: Solucionado el problema donde el cambio de tema no afectaba a la interfaz.
    - Implementación completa de variables CSS semánticas (`--background`, `--foreground`, `--primary`, etc.) en componentes clave como `Settings`, `Header` y `CollectionItemManager`.
    - Eliminación de colores estáticos (hardcoded slate/purple) a favor de la paleta del tema activo.
- **Wishlist en Colecciones**: Ahora es posible añadir/quitar cartas de la wishlist directamente desde la vista de colección.
- **Limpieza i18n**: Eliminación de textos hardcoded restantes en componentes de colección, moviéndolos a los archivos de idioma.
- **Configuración de Temas**: Configuración explícita en `ThemeProvider` para asegurar compatibilidad con temas personalizados.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/settings/page.tsx` | Refactor | Migración total a semantic CSS. |
| `src/components/CollectionItemManager.tsx` | Refactor | I18n y Semantic CSS. |
| `src/components/Header.tsx` | Refactor | Semantic CSS. |
| `src/app/layout.tsx` | Config | Lista explícita de temas. |
| `src/locales/*.json` | Config | Nuevas claves de traducción. |

---
## [0.3.2] - 2026-01-11

### ✨ Gestión Avanzada y Personalización (Fase 2 Iniciada)

**Fecha**: 2026-01-11

#### Cambios
- **Sistema de Temas**: Añadido selector de apariencia con temas de tipos Pokémon (Fuego, Agua, Planta, Eléctrico, Psíquico) y modo oscuro base.
- **Estadísticas Avanzadas**: Nuevo dashboard `/stats` con gráficos interactivos (`recharts`) mostrando valor de colección, distribución por rareza y cartas top.
- **Wishlist (Lista de Deseos)**: Implementación completa de wishlist.
    - Página dedicada `/wishlist` con visualización de cartas deseadas y prioridades.
    - Integración en el explorador de sets: Botón de corazón en cada carta para añadir/quitar rápidamente.
    - API REST con soporte de prioridades (Low, Normal, High).
- **Base de Datos**: Nuevas tablas `tags`, `itemTags`, `wishlistItems` preparadas para gestión granular.
- **PWA**: Configuración de `manifest.json` y metadatos viewport para instalación en dispositivos móviles.

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/settings/page.tsx` | Modificado | Integración de selector de temas con `next-themes`. |
| `src/app/stats/page.tsx` | Nuevo | Dashboard con gráficos Recharts. |
| `src/app/wishlist/page.tsx` | Nuevo | UI de Lista de Deseos. |
| `src/db/schema.ts` | Modificado | Esquema extendido con Tablas de Fase 2. |
| `src/app/api/wishlist/route.ts` | Nuevo | API CRUD para Wishlist. |
| `src/app/api/stats/route.ts` | Nuevo | API de agregación de datos. |
| `src/app/globals.css` | Modificado | Definición de variables CSS para paletas de colores. |
| `src/components/SetCardsClientPage.tsx` | Modificado | Botón de Wishlist en overlay de carta. |

## [0.2.2] - 2026-01-11

### ✨ Internacionalización de Budgets y Login

**Fecha**: 2026-01-11

#### Cambios
- Internacionalización completa de la sección de Presupuestos (`Budgets`)
- Internacionalización del formulario de Login
- Implementación de settings de presupuesto con traducciones
- Sincronización y limpieza de archivos de idioma `es.json` y `en.json`

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/budgets/new/page.tsx` | Modificado | Aplicado i18n al formulario |
| `src/app/budgets/[id]/page.tsx` | Modificado | Aplicado i18n al detalle |
| `src/components/BudgetSettings.tsx` | Modificado | Aplicado i18n y mejoras de UI |
| `src/locales/es.json` | Modificado | Nuevas claves y estructura limpia |
| `src/locales/en.json` | Modificado | Sincronización completa con ES |

#### Notas Técnicas
- Se añadieron múltiples claves anidadas bajo `budgets` para soportar estados, periodos y configuraciones complejas.
- Se eliminaron duplicados que causaban conflictos en los archivos JSON.

## [0.2.1] - 2026-01-11

### ✨ Estandarización de Variantes y Tests

**Fecha**: 2026-01-11

#### Cambios
- Estandarización de nombres de variantes en toda la app (`normal`, `holofoil`, `reverseHolofoil`)
- Implementación de lógica centralizada para determinar variantes disponibles según rareza y tipo
- Migración de `CollectionTableView` para usar Server Actions en lugar de API Routes
- Corrección de discrepancias visuales entre Tabla y Modal de variantes
- Implementación de tests unitarios para lógica de negocio crítica
- Implementación de tests de integración para I18n y Componentes de UI
- Configuración completa de Vitest + React Testing Library

#### Archivos Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/card-utils.ts` | Nuevo | Utilidad centralizada para variantes |
| `src/lib/card-utils.test.ts` | Nuevo | Tests unitarios para card-utils |
| `src/lib/i18n.test.tsx` | Nuevo | Tests de integración para i18n |
| `src/components/CollectionItemManager.test.tsx` | Nuevo | Tests de componentes UI |
| `vitest.config.ts` | Nuevo | Configuración de tests |
| `src/components/CollectionTableView.tsx` | Modificado | Uso de SA y `card-utils` |
| `src/components/CollectionItemManager.tsx` | Modificado | Uso de `card-utils` para consistencia |
| `package.json` | Modificado | Añadidas dependencias de testing (vitest) |

#### Notas Técnicas
- Se eliminó la dependencia de precios de TCGPlayer para determinar variantes disponibles en el modal, usando ahora una lógica determinista basada en rareza.
- Se añadieron `vitest` y `@testing-library` al proyecto.

## [0.2.0] - 2026-01-11

### ✨ Sistema de Internacionalización (i18n)

**Fecha**: 2026-01-11

#### Cambios
- Sistema de traducciones completo con soporte para Español e Inglés
- Hook `useI18n` con contexto para idioma de la app y de las cartas
- Persistencia de preferencias de idioma en localStorage
- Soporte para 9 idiomas de cartas (según TCGDex API)

#### Archivos Creados/Modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/locales/es.json` | Nuevo | Traducciones en español |
| `src/locales/en.json` | Nuevo | Traducciones en inglés |
| `src/lib/i18n.tsx` | Nuevo | Hook y contexto de i18n |
| `src/app/layout.tsx` | Modificado | Añadido I18nProvider |

#### Idiomas de Cartas Soportados

| Código | Idioma |
|--------|--------|
| en | English |
| es | Español |
| fr | Français |
| de | Deutsch |
| it | Italiano |
| pt | Português |
| ja | 日本語 |
| ko | 한국어 |
| zh-tw | 繁體中文 |

---

### ✨ Página de Configuración de Usuario

**Fecha**: 2026-01-11

#### Cambios
- Nueva página `/settings` con diseño premium
- Sección de Perfil (nombre para mostrar)
- Sección de Idioma (app y cartas por defecto)
- Sección de Cuentas de Marketplaces (Cardmarket, TCGPlayer, eBay)
- API `/api/profile` para gestionar perfil de usuario

#### Archivos Creados/Modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/settings/page.tsx` | Nuevo | Página de configuración |
| `src/app/api/profile/route.ts` | Nuevo | API para perfil de usuario |
| `src/db/schema.ts` | Modificado | Nueva tabla `user_profiles` |
| `src/components/Header.tsx` | Modificado | Botón de acceso a configuración |

#### Esquema Nueva Tabla

```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'guest',
  display_name TEXT,
  avatar_url TEXT,
  app_language TEXT DEFAULT 'es',
  card_language TEXT DEFAULT 'en',
  cardmarket_username TEXT,
  tcgplayer_username TEXT,
  ebay_username TEXT,
  preferred_currency TEXT DEFAULT 'EUR',
  created_at INTEGER,
  updated_at INTEGER
);
```

---

### ✨ Menú de Configuración de Colección

**Fecha**: 2026-01-11

#### Cambios
- Modal de configuración completo con 3 pestañas
- **Pestaña General**: Editar nombre, descripción, idioma de cartas
- **Pestaña Visualización**: Mostrar/ocultar precios, orden de cartas
- **Pestaña Acciones**: Resincronizar cartas, eliminar colección
- API `/api/collections/[id]` con GET, PUT, DELETE
- Nuevos campos en tabla `collections`

#### Archivos Creados/Modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/CollectionSettings.tsx` | Nuevo | Modal de configuración de colección |
| `src/app/api/collections/[id]/route.ts` | Nuevo | API para gestionar colección individual |
| `src/app/collections/[id]/page.tsx` | Modificado | Integración del componente CollectionSettings |
| `src/db/schema.ts` | Modificado | Nuevos campos en tabla collections |
| `src/components/CreateCollectionForm.tsx` | Modificado | Selector de idioma de colección |

#### Nuevos Campos en Colecciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `description` | TEXT | Descripción opcional |
| `language` | TEXT | Idioma de cartas (null = perfil) |
| `show_prices` | BOOLEAN | Mostrar/ocultar precios |
| `sort_by` | TEXT | Orden: number/name/rarity/price |

---

### 🎨 Unificación de Estilos Premium

**Fecha**: 2026-01-10

#### Cambios
- Rediseño de todas las páginas con estilo visual unificado
- Efectos de fondo con gradientes y blur
- Animaciones hover consistentes
- Cards con estilo premium y bordes mejorados
- Estados vacíos atractivos

#### Páginas Actualizadas
- `/explorer` - Explorador de eras
- `/explorer/[seriesName]` - Sets de una era
- `/explorer/set/[setId]` - Cartas de un set
- `/collections` - Lista de colecciones
- `/collections/[id]` - Detalle de colección
- `/collections/new` - Formulario de nueva colección

---

## [0.1.0] - 2026-01-09

### ✨ Configuración Inicial del Proyecto

#### Stack Tecnológico
- **Framework**: Next.js 16.1.1 (con Turbopack)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: Shadcn/UI (button, input, label, card)
- **ORM**: Drizzle ORM
- **Base de Datos**: SQLite (better-sqlite3)
- **Autenticación**: NextAuth.js v5

#### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `src/proxy.ts` | Proxy de autenticación con lógica LOCAL/SERVER |
| `src/auth.ts` | Configuración de NextAuth.js |
| `src/db/schema.ts` | Esquema de usuarios (Drizzle) |
| `src/db/index.ts` | Conexión a SQLite |
| `src/app/login/page.tsx` | Página de login |
| `src/app/api/auth/[...nextauth]/route.ts` | Handler de NextAuth |
| `drizzle.config.ts` | Configuración de Drizzle Kit |
| `.env.local` | Variables de entorno |

#### Sistema de Autenticación
- **Variable `APP_MODE`**:
  - `LOCAL`: Acceso automático sin login (desarrollo)
  - `SERVER`: Requiere autenticación real (producción)
- Redirección automática a `/login` cuando no hay sesión
- Cookies de sesión: `authjs.session-token`

---

### ✨ Integración API Pokémon TCG

**Fecha**: 2026-01-09

#### Cambios
- Esquema de base de datos ampliado con tablas `sets` y `cards`
- Servicio de sincronización con rate limiting (2s entre requests)
- Soporte para API key opcional (aumenta rate limit)

#### Rate Limits Implementados

| Configuración | Valor |
|---------------|-------|
| Delay entre requests | 2 segundos |
| Reintentos automáticos | 3 |
| Manejo error 429 | Espera exponencial |

---

### ✨ Mejoras de UI y Soporte Offline
**Fecha**: 2026-01-09

#### Características Nuevas
- **Soporte Offline**: El explorador ahora usa SQLite como fuente primaria de datos
- **Sincronización Inteligente**: Pantalla de sync cuando DB vacía, indicadores de estado
- **Mejoras de UI**: Paleta de colores ajustada, Hero section, componentes de carga

#### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/sets` | GET | Lee sets desde DB local |
| `/api/cards/[setId]` | GET | Lee cartas de un set |
| `/api/cards/counts` | GET | Conteo de cartas por set |
| `/api/sync` | POST | Sincroniza todos los sets (SSE) |
| `/api/cards/[setId]` | POST | Sincroniza cartas de un set (SSE) |
| `/api/profile` | GET/PUT | Gestión de perfil de usuario |
| `/api/collections/[id]` | GET/PUT/DELETE | Gestión de colección individual |

---

## [0.3.1] - 2026-01-11

### ✨ Sistema de Backups (Importar/Exportar)

**Fecha**: 2026-01-11

#### Cambios
- Sistema completo de exportación e importación de datos en formato JSON.
- Nueva sección "Gestión de Datos" en Configuración.
- Endpoints de API seguros para volcar y restaurar la base de datos (excluyendo datos estáticos de cartas).
- Validación de versión en archivos de backup.

#### Archivos Nuevos/Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/api/backup/export/route.ts` | Nuevo | Endpoint generación backup |
| `src/app/api/backup/import/route.ts` | Nuevo | Endpoint restauración backup |
| `src/app/settings/page.tsx` | Modificado | UI para Download/Upload |
| `src/app/layout.tsx` | Modificado | Integración preliminar de ThemeProvider |

---

## [0.3.0] - 2026-01-11

### ✨ Dockerización y Despliegue

**Fecha**: 2026-01-11

#### Cambios
- **Dockerización Completa**: Creación de `Dockerfile` multi-stage optimizado (Alpine) y `docker-compose.yml`.
- **Persistencia de Datos**: Configuración de volúmenes Docker para persistir la base de datos SQLite en `./data`.
- **Configuración Dinámica**: Adaptación de la conexión a DB (`src/db/index.ts`) y Drizzle para soportar rutas dinámicas vía `DATABASE_FILE`.
- **Manual de Usuario**: Creación de `docs/USER_MANUAL.md` con guía de instalación y uso.
- **Optimización Build**: Resolución de conflictos de SSR en build time mediante `force-dynamic` en rutas que dependen de DB.
- **Limpieza**: Eliminación de archivos obsoletos (`local.db`, scripts de prueba).

#### Archivos Nuevos/Modificados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `Dockerfile` | Nuevo | Configuración de imagen Docker |
| `docker-compose.yml` | Nuevo | Orquestación de contenedores |
| `.dockerignore` | Nuevo | Exclusiones de contexto Docker |
| `docs/USER_MANUAL.md` | Nuevo | Guía de usuario y despliegue |
| `src/db/index.ts` | Modificado | Soporte para `DATABASE_FILE` env var |
| `next.config.ts` | Modificado | Output `standalone` para optimización |
| `.env.local` | Modificado | Estandarización de `DATABASE_FILE` |

#### Notas Técnicas
- Se ha movido la base de datos local de raíz a `data/sqlite.db` para unificar la estructura con el volumen de Docker.
- Se forzó el modo dinámico (`export const dynamic = "force-dynamic"`) en rutas críticas (`/collections`, `/budgets`, `/api/*`) para evitar errores de pre-renderizado estático cuando la DB no existe (build time).

---

## Próximos Desarrollos

- [x] Completar traducciones faltantes (Proyecto 100% traducido)
- [ ] Exportar/Importar colecciones (JSON/CSV)
- [ ] Estadísticas avanzadas de colección (Gráficos)
- [ ] Modo oscuro/claro configurable por usuario
- [ ] PWA para uso offline en móvil

---

## Estado Actual del Proyecto

**Última verificación**: 2026-01-13

| Check | Estado |
|-------|--------|
| `npm run build` | ✅ Compilación exitosa |
| `npx tsc --noEmit` | ✅ Sin errores de tipos |
| Migraciones DB | ✅ Aplicadas |

### Dependencias Principales

```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "drizzle-orm": "^0.45.1",
  "better-sqlite3": "^12.5.0",
  "next-auth": "^5.0.0-beta.30",
  "tailwindcss": "^4",
  "lucide-react": "^0.562.0"
}
```

# PokemonTCG - Changelog de Desarrollo

> Registro cronológico de todos los cambios realizados en la aplicación.

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

**Última verificación**: 2026-01-12

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

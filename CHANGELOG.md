# PokemonTCG - Changelog de Desarrollo

> Registro cronológico de todos los cambios realizados en la aplicación.

---

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

- [ ] Completar traducciones faltantes (si quedan componentes menores)
- [ ] Exportar/Importar colecciones (JSON/CSV)
- [ ] Estadísticas avanzadas de colección (Gráficos)
- [ ] Modo oscuro/claro configurable por usuario
- [ ] PWA para uso offline en móvil

---

## Estado Actual del Proyecto

**Última verificación**: 2026-01-11

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

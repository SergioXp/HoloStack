# API Reference - HoloStack

Esta documentación detalla los endpoints disponibles en la API REST de HoloStack. Todas las respuestas son en formato JSON, excepto los endpoints de sincronización (SSE).

**Base URL**: `/api`

---

## 📚 Core Data (Datos Maestros)

Endpoints para consultar la base de datos de cartas y sets (sincronizada desde TCGDex).

### `GET /api/sets`
Obtiene la lista de todos los sets disponibles en local.
- **Respuesta**: `{ count: number, sets: Set[] }`

### `GET /api/cards/[setId]`
Obtiene todas las cartas de un set específico almacenadas en local.
- **Params**: `setId` (ej: `sv3pt5`)
- **Respuesta**: `{ count: number, cards: Card[] }`

### `POST /api/cards/[setId]`
**Server-Sent Events (SSE)**. Inicia la descarga y sincronización de cartas de un set desde TCGDex.
- **Params**: `setId`
- **Respuesta**: Stream de eventos (`status`, `message`, `count`).

### `GET /api/cards/search`
Búsqueda de texto completo de cartas en la base de datos local.
- **Query**: `?q=Pikachu`
- **Respuesta**: `Card[]` (Límite 30)

### `GET /api/search/global`
Búsqueda multi-entidad (Cartas, Sets, Colecciones). Soporta términos combinados (nombre carta + set).
- **Query**: `?q=Pikachu+Base&type=card&limit=8`
- **Respuesta**: `{ results: SearchResult[] }`
- **SearchResult**: `{ id, title, subtitle, thumbnail, type, category }`

### `GET /api/cards/preview`
Obtiene una muestra aleatoria (4 cartas) que coinciden con filtros complejos. Usado para previsualizaciones de UI.
- **Query**:
    - `setId`: ID del set
    - `rarity`: Rareza (o lista separada por comas)
    - `name`: Nombre (o lista separada por comas)
    - `supertype`: `Pokemon`, `Trainer`, `Energy`
    - `series`: Series (ej: `Scarlet & Violet`)
- **Respuesta**: `Card[]` (Campos reducidos: id, name, images, rarity)

### `GET /api/sync/index`
**SSE**. Indexa nombres de Pokémon desde PokeAPI para el autocompletado.

### `GET /api/pokemon/species`
Busca una especie por nombre para obtener su ID Nacional y arte oficial. Soporta limpieza automática de variantes TCG (V, VMAX, ex, etc).
- **Query**: `?name=Pikachu`
- **Respuesta**: `{ id: number, name: string, artwork: string }`

### `GET /api/sync/collection-cards`
**SSE**. Hidrata una colección automática descargando las cartas que cumplen sus filtros desde TCGDex.
- **Query**: `?id=COLLECTION_ID`

---

## 📦 Collections (Colecciones)

Gestión de las colecciones del usuario y su inventario.

### `GET /api/collections`
Lista todas las colecciones del usuario.
- **Respuesta**: `Collection[]`

### `POST /api/collections`
Crea una nueva colección.
- **Body**: `{ name, type, filters?, language? }`
- **Respuesta**: `Collection` creada.

### `GET /api/collections/[id]`
Obtiene el detalle completo de una colección, incluyendo las cartas que contiene y las cantidades poseídas.
- **Respuesta**: `{ ...Collection, cards: (Card & { nationalId?: number })[], ownershipData: Map<cardId, { [variant]: { quantity, notes } }>, setName?: string }`
    - `nationalId`: ID de la Pokédex Nacional, usado para ordenamiento oficial en colecciones automáticas.

### `PUT /api/collections/[id]`
Actualiza los metadatos de una colección.
- **Body**: `{ name?, description?, showPrices?, sortBy?, filters? }`

### `DELETE /api/collections/[id]`
Elimina una colección y todos sus items.

### `POST /api/collections/[id]/items`
Añade una carta a una colección *Manual*. Si ya existe, incrementa la cantidad.
- **Body**: `{ cardId: string }`

### `DELETE /api/collections/[id]/items`
Elimina o decrementar cartas de una colección.
- **Body**: `{ cardIds: string[] }`
    - En colecciones **Manuales**: Decrementa cantidad en 1. Si llega a 0, elimina.
    - En colecciones **Automáticas**: Añade el ID a la lista negra (`filters.excludedCardIds`).

### `POST /api/collection-items`
Gestión granular de items (Upsert). Añade cantidad a una variante específica.
- **Body**: `{ collectionId, cardId, variant, quantity }`
- **Respuesta**: `{ success, action: "created" | "updated" | "deleted" }`

### `GET /api/collection/ownership`
Obtiene un mapa global de todas las cartas poseídas por el usuario en todas las colecciones.
- **Respuesta**: `{ [cardId]: totalQuantity }`

---

## 🏭 Bulk & Operations

Operaciones masivas para gestión de inventario.

### `POST /api/bulk/add`
Añade múltiples cartas a una colección de una sola vez.
- **Body**: `{ collectionId, cards: [{ card: { id }, quantity }] }`

### `POST /api/bulk/validate`
Valida una lista de números de carta contra un Set ID para "fuzzy matching" (coincidencia aproximada).
- **Body**: `{ setId, inputs: [{ number, quantity }] }`
- **Respuesta**: `{ results: [{ ...input, status: "valid"|"invalid", card? }] }`
    - `card` incluye `supertype` para determinar variantes válidas.

### `GET /api/bulk/duplicates`
Detecta cartas duplicadas que exceden un umbral (Playset) en una colección.
- **Query**: `?collectionId=...&threshold=4`
- **Respuesta**: `{ duplicates: [{ card, quantity, excess }] }`

---

## 👤 User & Settings

Perfil de usuario y configuración global.

### `GET /api/profile`
Obtiene el perfil del usuario (o crea uno guest por defecto).
- **Respuesta**: `UserProfile`

### `PUT /api/profile`
Actualiza el perfil.
- **Body**: `{ displayName, appLanguage, cardLanguage, preferredCurrency, ...usernames }`

### `GET /api/backup/export`
Genera un volcado completo de la base de datos (excluyendo datos estáticos de cartas) en JSON.
- **Respuesta**: `{ version, timestamp, data: { ...tablas } }`

### `POST /api/backup/import`
Restaura la base de datos desde un backup, eliminando los datos previos.
- **Body**: Output de `/api/backup/export`

### `GET /api/tags` / `POST /api/tags`
Gestión de etiquetas personalizadas globales.
- **Body POST**: `{ name, color }`

### `POST /api/collection-items/[itemId]/tags`
Asigna una etiqueta a un item específico de la colección.
- **Body**: `{ tagId }`

---

## 💰 Finances & Stats

Presupuestos y análisis de valor.

### `GET /api/portfolio`
Obtiene el valor de mercado total de la colección. Identifica precios obsoletos (>24h).
- **Respuesta**: `{ items: PortfolioItem[], staleCardIds: string[] }`

### `POST /api/prices/refresh`
Fuerza la actualización de precios para un lote de cartas (max 50).
- **Body**: `{ cardIds: string[] }`

### `GET /api/stats`
Estadísticas agregadas globales (Valor total, distribución por rareza, series, top cartas).

### `GET /api/budgets`
Lista todos los presupuestos con resumen de gasto actual.

### `GET /api/budgets/[id]`
Detalle de un presupuesto con histórico mensual.
- **Respuesta**: `{ ...Budget, history: MonthData[] }`
    - `MonthData` incluye: `month` (YYYY-MM), `budgetAmount`, `totalSpent`, `carryOver` (sobrante del mes anterior) y `available`.


### `POST /api/budgets`
Crea un presupuesto.
- **Body**: `{ name, type, amount, period... }`

### `GET /api/budgets/[id]/expenses`
Historial de gastos de un presupuesto.
- **Query**: `?startDate=...&endDate=...`

### `POST /api/budgets/[id]/expenses`
Registra un nuevo gasto.
- **Body**: `{ amount, date, description, category... }`

---

## 🛍️ Wishlist (Lista de Deseos)

### `GET /api/wishlist`
Lista de deseos.
- **Query**: `?cardId=...` (Opcional, para verificar estado de una carta)

### `POST /api/wishlist`
Añade item.
- **Body**: `{ cardId, priority?, notes? }`

### `DELETE /api/wishlist`
Elimina item.
- **Query**: `?id=ID` o `?cardId=CARD_ID`

---

## ⚙️ System
### `GET /api/system/update-check`
Comprueba si hay una nueva versión disponible en Docker Hub comparando con la versión local.
- **Respuesta**: `{ currentVersion, latestVersion, hasUpdate, lastUpdated, dockerImage }`


# Análisis de Datos: Pokémon TCG (TCGdex API vs Base de Datos Local)

Este documento detalla la información que actualmente extraemos de la API de TCGdex, cómo la almacenamos en nuestra base de datos, y qué datos mostramos en la UI.

| Estado | Significado |
| :--- | :--- |
| **[MOSTRANDO]** | Se guarda en DB y se muestra activamente en la UI (listas, detalles, modales). |
| **[GUARDADO]** | Se guarda en DB pero **NO se muestra** en la UI actual (datos latentes). |
| **[IGNORADO]** | La API lo provee pero lo descartamos antes de guardar. |

---

## 1. SETS (Expansiones)

Objeto `TCGdexSet` -> Tabla `sets`

| Campo API (TCGdex) | Campo BBDD (`sets`) | Estado | Uso en UI |
| :--- | :--- | :--- | :--- |
| `id` | `id` | **[MOSTRANDO]** | Rutas URL (`/explorer/set/swsh1`). |
| `name` | `name` | **[MOSTRANDO]** | Título de página y tarjetas. |
| `serie.name` | `series` | **[MOSTRANDO]** | Agrupación en `/explorer` y breadcrumbs. |
| `cardCount.official` | `printedTotal` | **[GUARDADO]** | No se usa explícitamente en la UI (usamos `total`). |
| `cardCount.total` | `total` | **[MOSTRANDO]** | Badges ("X/Y cartas"), cálculo de progreso. |
| `legal` | `legalities` (JSON) | **[GUARDADO]** | No se visualiza en la página del set. |
| `releaseDate` | `releaseDate` | **[MOSTRANDO]** | Ordenación y fecha en tarjetas de set. |
| `logo` | `images` (JSON) | **[MOSTRANDO]** | Cabeceras y listados. |
| `symbol` | `images` (JSON) | **[MOSTRANDO]** | Icono pequeño junto al nombre. |

---

## 2. CARTAS (Cards)

Objeto `TCGdexCard` -> Tabla `cards`

| Campo API (TCGdex) | Campo BBDD (`cards`) | Estado | Uso en UI |
| :--- | :--- | :--- | :--- |
| `id` | `id` | **[MOSTRANDO]** | Clave interna. |
| `localId` | `number` | **[MOSTRANDO]** | Número de colección ("001/102"). |
| `name` | `name` | **[MOSTRANDO]** | Título de carta (Rejilla y Modal). |
| `image` | `images` (JSON) | **[MOSTRANDO]** | Imagen principal (Small en grid, Large en modal). |
| `category` | `supertype` | **[MOSTRANDO]** | Subtítulo en Modal ("Pokémon", "Trainer"). |
| `rarity` | `rarity` | **[MOSTRANDO]** | Badge en Modal y Grid ("Rare Holo"). |
| `illustrator` | `artist` | **[MOSTRANDO]** | Detalle en Modal ("Artista: Ken Sugimori"). |
| `hp` | `hp` | **[MOSTRANDO]** | Cabecera en Modal ("HP 120"). |
| `types` | `types` (JSON) | **[MOSTRANDO]** | Detalle en Modal (Texto "Fire, Water"). |
| `stage` | `subtypes` (JSON) | **[MOSTRANDO]** | Subtítulo en Modal ("Stage 1"). |
| `pricing` | `tcgplayerPrices` | **[MOSTRANDO]** | Sección Precios en Modal (TCGPlayer Market). |
| `pricing` | `cardmarketPrices`| **[MOSTRANDO]** | Sección Precios en Modal (Cardmarket Trend). |
| `legal` | `legalities` (JSON) | **[GUARDADO]** | No se muestra en el Modal. |
| `evolveFrom` | `evolvesFrom` | **[AÑADELO]** | No se muestra link a pre-evolución. |
| `retreat` | `retreatCost` | **[GUARDADO]** | No se muestra en Modal. |
| `weaknesses` | `weaknesses` | **[GUARDADO]** | No se muestra en Modal. |
| `resistances` | `resistances` | **[GUARDADO]** | No se muestra en Modal. |
| `abilities` | `abilities` | **[GUARDADO]** | No se muestra en Modal (Texto de reglas). |
| `attacks` | `attacks` | **[GUARDADO]** | No se muestra en Modal (Texto de daño/coste). |
| - | `flavorText` | **[GUARDADO]** | Campo en DB pero siempre `null` (TCGdex standard no lo trae fácil). Se muestra condicionalmente en UI si existiera. |

---

## 3. RESUMEN DE ACCIÓN

Basado en tu petición **"marca como mostrada las que se muestren en la UI, las que sean para cosas internas no me interesan"**:

- **SI TE INTERESA (Visible)**:
  - Identificación: Nombre, Número, Rareza, Artista.
  - Visual: Imágenes (Logo set, Simbolo set, Carta).
  - Juego Básico: Tipos, HP, Supertipo, Subtipo (Stage).
  - Económico: Precios (TCGPlayer, Cardmarket).
  - Organización: Serie (Era), Fecha lanzamiento.

- **NO TE INTERESA (Interno / No Visible)**:
  - Reglas complejas: Ataques, Habilidades, Debilidades, Resistencias, Coste Retirada.
  - Legalidad competitiva.
  - Relaciones de evolución.
  - Totales impresos vs reales (solo usamos el total final).

### Plan de Limpieza Propuesto:
Procederé a eliminar del esquema de base de datos y de la sincronización los campos marcados como **[GUARDADO]** que son puramente de reglas de juego y no se están mostrando (Attacks, Abilities, Weaknesses, Resistances, Retreat, Legalities), para aligerar la base de datos y centrarla en Coleccionismo.

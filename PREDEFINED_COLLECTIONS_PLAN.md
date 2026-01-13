# Plan de Desarrollo: Colecciones Predefinidas (Detallado)

Este documento detalla el plan para implementar la funcionalidad de "Colecciones Predefinidas", permitiendo a los usuarios iniciar colecciones populares rápidamente con configuraciones y variantes específicas.

## 1. Visión General
El objetivo es simplificar la experiencia de nuevos coleccionistas ofreciendo "paquetes" de colecciones listos para usar. El sistema generará automáticamente la colección con los filtros adecuados que el sistema de sincronización utilizará para poblar la base de datos.

## 2. Colecciones Predefinidas (Top 10) - Especificaciones

### 1. Original 151 (Kanto)
*   **Descripción**: La colección clásica con los primeros 151 Pokémon.
*   **Filtro Base**: `name` IN [Lista de "Bulbasaur" a "Mew"]
*   **Variantes**:
    *   **Estándar (Cualquiera)**: Sin filtros adicionales. Muestra cualquier impresión de los 151.
    *   **Vintage (Wizards of the Coast)**: Filtrar por Series "Base", "Gym", "Neo".
        *   *Lógica*: `series` IN ["Base", "Gym", "Neo"] AND `name` IN [151 List].
    *   **Moderno 151**: Solo cartas del set especial Scarlet & Violet 151.
        *   *Lógica*: `setId` = "sv3pt5" (Código de SV: 151).
    *   **Solo Arte (Full Art)**: Versiones visualmente raras.
        *   *Lógica*: `rarity` LIKE "%Illustration%" OR `rarity` LIKE "%Full Art%" OR `rarity` LIKE "%Special%".

### 2. Iniciales (Starters)
*   **Descripción**: Los Pokémon iniciales de Planta, Fuego y Agua de todas las regiones.
*   **Filtro Base**: `name` IN [Lista de todos los starters y sus evoluciones].
*   **Variantes**:
    *   **Todas las Generaciones**: Sin filtro adicional.
    *   **Solo Kanto (Originales)**: Solo los 9 de Kanto.
        *   *Lógica*: `name` IN ["Bulbasaur", ..., "Charizard", ..., "Blastoise"].
    *   **Solo Full Art**:
        *   *Lógica*: `rarity` LIKE "%Full Art%" OR `rarity` LIKE "%Illustration%".

### 3. Pikachu Mania
*   **Descripción**: Todo tipo de cartas de Pikachu.
*   **Filtro Base**: `name` = "Pikachu" OR `name` LIKE "Pikachu %" (para incluir Pikachu V, ex, etc, pero excluyendo "Pikachu & Zekrom" si se desea estricto, aunque TCGdex suele separar nombres, usaremos `name` "contains" Pikachu).
*   **Variantes**:
    *   **Todo**: Cualquier carta con "Pikachu" en el nombre.
    *   **Promos**: Solo cartas promocionales.
        *   *Lógica*: `setId` LIKE "%promo%" OR `series` = "Pop" OR `series` LIKE "%Promos".
    *   **Solo Holos/Raras**:
        *   *Lógica*: `rarity` NOT IN ["Common", "Uncommon"].

### 4. Eeveelutions (La familia Eevee)
*   **Descripción**: Eevee y sus 8 evoluciones.
*   **Filtro Base**: `name` IN ["Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Sylveon"].
*   **Variantes**:
    *   **Todo**: Sin filtro adicional.
    *   **VMAX / VSTAR / ex**: Cartas de mecánica especial.
        *   *Lógica*: `name` LIKE "% V" OR `name` LIKE "% VMAX" OR `name` LIKE "% ex" OR `subtypes` LIKE "%VMAX%".
    *   **Trainer Gallery / Illustration**: Cartas con arte especial o entrenadores.
        *   *Lógica*: `setId` IN ["tg", "gg"] (Trainer Gallery codes) OR `rarity` LIKE "%Illustration%".

### 5. Charizard Hunter
*   **Descripción**: El rey de las cartas caras.
*   **Filtro Base**: `name` LIKE "Charizard%".
*   **Variantes**:
    *   **Todo**: Sin filtro adicional.
    *   **Shiny**: Versiones variocolor.
        *   *Lógica*: `rarity` LIKE "%Shiny%" OR `name` LIKE "Radiant Charizard" OR `name` LIKE "Shining Charizard".
    *   **Vintage**: Primeras apariciones.
        *   *Lógica*: `series` IN ["Base", "Neo", "E-Card", "EX"].

### 6. Galería de Arte (Illustration Rares)
*   **Descripción**: Las cartas más bellas del TCG moderno (AR y SAR).
*   **Filtro Base**: `rarity` IN ["Illustration Rare", "Special Illustration Rare", "Trainer Gallery Rare Holo"].
*   **Variantes**:
    *   **Scarlet & Violet (AR/SAR)**: Sets modernos.
        *   *Lógica*: `series` = "Scarlet & Violet".
    *   **Sword & Shield (Galarian Gallery)**: Era anterior (Yellow borders/Silver borders transition).
        *   *Lógica*: `series` = "Sword & Shield".

### 7. Entrenadas Full Art (Trainers)
*   **Descripción**: Cartas de Soporte (Supporter) en versión arte completo.
*   **Filtro Base**: `supertype` = "Trainer" AND `subtypes` LIKE "%Supporter%" AND (`rarity` LIKE "%Full Art%" OR `rarity` LIKE "%Special Illustration%").
*   **Variantes**:
    *   **Todo**: Cualquier entrenador.
    *   **Líderes de Gimnasio**: (Difícil de filtrar automáticamente sin lista de nombres, mantener solo "Todo" por ahora o filtrar por texto en tarjeta si fuera posible, por ahora solo "Todo").
    *   *Propuesta*: Simplificar a solo "Entrenadores Full Art".

### 8. Shiny Vault (Pokémon Variocolor)
*   **Descripción**: Colección de Pokémon brillantes.
*   **Filtro Base**: `rarity` LIKE "%Shiny%" OR `rarity` = "Radiant Rare" OR `name` LIKE "Shining %".
*   **Variantes**:
    *   **Paldean Fates**: Set `paf`.
    *   **Shining Fates**: Set `shf`.
    *   **Hidden Fates**: Set `hf`.
    *   **Destinos Brillantes (Todas)**: Unión de los sets anteriores.

### 9. Promos Black Star
*   **Descripción**: Cartas exclusivas de cajas y eventos.
*   **Filtro Base**: `name` (Cualquiera) con `setId` que indique promo.
*   **Variantes**:
    *   **Scarlet & Violet Promos (SVP)**: `setId` = "svp".
    *   **Sword & Shield Promos (SWSH)**: `setId` = "swsh".
    *   **Sun & Moon Promos (SM)**: `setId` = "smp".
    *   **Wizards Black Star Promos**: `setId` = "bsp".

### 10. Team Rocket
*   **Descripción**: Pokémon oscuros ("Dark...", "Rocket's...").
*   **Filtro Base**: `name` LIKE "Dark %" OR `name` LIKE "Rocket's %" OR `name` LIKE "Giovanni's %".
*   **Variantes**:
    *   **Vintage (Rocket & Gym)**: `series` IN ["Base", "Gym"].
    *   **Returns (Era EX)**: `id` LIKE "ex7%" (Team Rocket Returns).

## 3. Arquitectura Técnica

### A. Estructura de Datos (Nueva)
Se creará `src/lib/predefined-collections.ts` que exportará:
```typescript
interface PredefinedCollection {
    id: string;
    name: string; // Key de traducción
    description: string; // Key de traducción
    icon: any; // Lucide icon
    variants: CollectionVariant[];
}

interface CollectionVariant {
    id: string;
    name: string; // Key de traducción
    filterGenerator: () => CollectionFilter; // Retorna el filtro JSON para la DB
}
```

### B. Listas Estáticas
Se necesitará un archivo `src/lib/constants/pokemon-lists.ts` con:
- `KANTO_151_NAMES`: Array de strings.
- `STARTER_FAMILIES_NAMES`: Array de strings.
- `EEVEELUTIONS_NAMES`: Array de strings.

### C. UI Update (`CreateCollectionForm`)
1.  Añadir tab "Predefinida".
2.  Grid de tarjetas con Icono + Título + Descripción.
3.  Al seleccionar, modal o expansión para elegir Variante.
4.  Preview de qué filtros aplicará (ej: "Filtros: Nombre es 'Pikachu', Serie es 'Scarlet & Violet'").

### D. API Update
El endpoint de sincronización y búsqueda debe ser capaz de interpretar un filtro `name: { in: [...] }` o `series: { in: [...] }`.
Actualmente el filtro es:
```typescript
filters: { set: 'base1', rarity: 'Rare' }
```
Necesitamos extenderlo a:
```typescript
filters: { 
    set?: string, 
    series?: string | string[],
    name?: string, 
    names?: string[], // NUEVO
    rarity?: string | string[], // Array support
    supertype?: string
}
```
Esto requerirá actualizar `src/app/api/sync/collection-cards/route.ts` y posiblemente el job de sincronización.

## 4. Pasos de Implementación
1.  **Definición**: Crear archivos de listas y definiciones de colecciones.
2.  **Backend**: Adaptar `sync/collection-cards` para soportar `names` (array) y `series` (filtro).
3.  **Frontend**: Implementar UI en `CreateCollectionForm`.
4.  **Traducciones**: Añadir keys en `locales/es.json` y `en.json`.

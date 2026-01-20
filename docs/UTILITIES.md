# 📔 Diccionario de Utilidades (Core Logic)

Este documento sirve como referencia para entender las funciones puras, lógica de negocio y utilidades técnicas que impulsan **HoloStack**. Se encuentran principalmente en `src/lib`.

---

## 🏗️ Lógica Pokémon y Cartas

### 🧬 `pokemon-utils.ts`
*   **Función**: `cleanNameForSpecies(name)`
*   **Propósito**: Normaliza nombres de cartas TCG para el matching con la Pokédex Nacional.
*   **Casos**: Elimina sufijos (ex, VMAX), estilos de combate (Rapid Strike), normaliza géneros (♂/♀) y caracteres especiales (Mr. Mime, Flabébé).

### 🃏 `card-utils.ts`
*   **Propósito**: Define las reglas del juego físico aplicadas al inventario digital.
*   **Lógica**: Determina qué variantes (Normal, Holo, Reverse) son válidas según la rareza de la carta. Evita, por ejemplo, marcar una carta "Ultra Rare" como variante normal.

### 📐 `proxy-utils.ts`
*   **Propósito**: Procesamiento de metadatos para el generador de proxies.
*   **Lógica**: Extrae ataques, habilidades, costes de energía y debilidades de los JSONs complejos de la API para renderizar versiones de texto legibles.

---

## 💰 Finanzas y Precios

### 💹 `prices.ts`
*   **Propósito**: El motor de valoración de la colección.
*   **Funciones**:
    *   `getBestPrice()`: Elige inteligentemente entre Cardmarket y TCGPlayer según la moneda del usuario.
    *   `convertCurrency()`: Conversión de divisa en tiempo real (EUR/USD/GBP).
    *   `calculateTotalValue()`: Agregación masiva del valor de una colección.

### 📅 `budget-logic.ts`
*   **Propósito**: Lógica financiera de presupuestos.
*   **Lógica**: Implementa el sistema de **Carry-over** (arrastre), donde el excedente o déficit de un mes se traslada automáticamente al siguiente.

### 📈 `stats-logic.ts`
*   **Propósito**: Generación de datos para dashboards.
*   **Lógica**: Transforma el inventario plano en distribuciones estadísticas (por rareza, por serie, top cartas más caras).

---

## 🛠️ Gestión de Inventario

### 📥 `bulk-validator.ts`
*   **Propósito**: Detección difusa (fuzzy matching) en entrada masiva.
*   **Lógica**: Permite que el usuario escriba números de carta sin ceros iniciales o con formatos relajados, y los valida contra la base de datos local.


### 📧 `cardmarket-parser.ts`
*   **Propósito**: Importación de pedidos desde emails de Cardmarket.
*   **Lógica**: Regex avanzado para extraer Nombre, Set, Cantidad, Precio y Metadatos (Condición, Idioma, Rareza) de texto plano. Incluye heurística para detectar variantes especiales ("ART" -> Illustration Rare) y limpieza de nombres.

### 🔄 `sync-logic.ts`
*   **Propósito**: Filtrado inteligente durante la sincronización con TCGDex.
*   **Lógica**: Decide en tiempo de descarga qué cartas pertenecen a una colección automática basada en sus metadatos.

### 📋 `collection-utils.ts` / `collection-actions.ts`
*   **Propósito**: Helpers para la gestión de ítems.
*   **Lógica**: Agregaciones de cantidades, fusión de registros duplicados y Server Actions para manipulación de base de datos desde la UI.

---

## 🌐 Infraestructura

### 🌍 `i18n.tsx`
*   **Propósito**: Motor de traducción personalizado.
*   **Lógica**: Proveedor de contexto y hook `useI18n` para cambio dinámico de idioma sin recarga de página.

### ⏱️ `date-utils.ts`
*   **Propósito**: Gestión del tiempo.
*   **Lógica**: Calcula la "frescura" de los datos (ej: marca precios como obsoletos si tienen >24h) y formatea fechas según el locale.

### 🔍 `global-search.ts`
*   **Propósito**: Motor de búsqueda multi-término.
*   **Lógica**: Combina condiciones de nombre y set para permitir búsquedas como "Pikachu Base 2".

### 🎨 `utils.ts`
*   **Propósito**: Utilidad `cn` (classnames + tailwind-merge).
*   **Lógica**: Resolución de conflictos de clases Tailwind.

### 🔢 `constants/version.ts`
*   **Propósito**: Constantes de versión de la aplicación.
*   **Exports**: `APP_VERSION` (string), `DOCKER_IMAGE` (nombre en ghcr.io) y `GITHUB_REPO` (SergioXp/HoloStack).
*   **Uso**: Comparación con GitHub Releases para detectar actualizaciones disponibles.

### 🧩 `electron/main.ts`
*   **Propósito**: Orquestador del modo escritorio.
*   **Lógica**: Inicia el servidor Next.js como subproceso, asigna un puerto libre dinámicamente, y gestiona la persistencia de la base de datos en las carpetas nativas del sistema operativo.

### 🔄 `version-utils.ts`
*   **Propósito**: Lógica de comparación de versiones semánticas.
*   **Funciones**:
    *   `hasNewerVersion(current, remote)`: Devuelve `true` si la versión remota es mayor.
    *   `sortVersionTags(tags)`: Ordena un array de tags de versión de mayor a menor.

### 📝 `changelog-data.ts`
*   **Propósito**: Definición centralizada del historial de versiones.
*   **Contenido**: Array tipado de objetos de versión, fechas y claves de traducción para el modal de novedades. Fundamental para mantener el historial ordenado y validado.

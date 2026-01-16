# Tests y Cobertura - HoloStack

Este documento detalla la estrategia de pruebas y los tests implementados actualmente en el proyecto. Utilizamos **Vitest** como framework de testing unitario e integración.

---

## 🏗️ Estrategia de Testing

HoloStack prioriza el testing de la **lógica de negocio crítica** (`src/lib`) sobre el testing de componentes visuales (Snapshot testing), dado que la UI puede cambiar frecuentemente.

**Áreas Críticas Cubiertas:**
1.  **Cálculo de Precios**: Esencial para asegurar que la valoración de la colección es correcta y maneja bien las conversiones de divisa.
2.  **Lógica de Variantes**: Compleja debido a la gran variedad de tipos de cartas en Pokémon (Reverse, Holo, Normal, ex, etc.).
3.  **Utilidades de Colección**: Sumas y agregaciones de inventario.
4.  **Utilidades Generales**: Clases CSS condicionales.

---

## 🧪 Suites de Tests Actuales

### 1. Precios y Monedas (`src/lib/prices.test.ts`)
Esta es la suite más crítica. Verifica que no perdamos dinero (figurativo) en los cálculos.

*   `convertCurrency`: Verifica la conversión correcta entre USD y EUR usando las tasas hardcodeadas (o dinámicas si se implementan).
*   `formatPrice`: Asegura que $99.99 y 99,99 € se muestren según el locale correcto.
*   `parseTCGPlayerPrices` / `parseCardmarketPrices`: Tests de robustez para asegurar que si la API devuelve basura o NULL, la app no crashee.
*   `getMarketPrice`: Verifica la cascada de precios (Market > Mid > Low).
*   `getBestPrice`: Test de la lógica de negocio "inteligente" (preferir Cardmarket si el usuario usa EUR, TCGPlayer si usa USD).
*   `calculateTotalValue`: Verifica la suma agregada de una colección entera con mix de monedas.

### 2. Normas de Cartas (`src/lib/card-utils.test.ts`)
Asegura que las reglas del juego de cartas físico se respetan en la app digital.

*   **Rarezas Premium**: Verifica que cartas como `Ultra Rare`, `Secret Rare` o `ex` SOLO tengan variante "Holofoil" (no existen versiones normales).
*   **Energías**: Verifica que las Energías Básicas solo sean "Normal" (a menos que sean edición especial).
*   **Cartas Estándar**: Verifica que `Common`, `Uncommon` y `Rare` permitan variantes "Normal" y "Reverse Holofoil".
*   **Rare Holo**: Verifica que una carta que YA es Holo de base, tenga variante "Holofoil" y "Reverse Holofoil" (pero no normal).

### 3. Gestión de Inventario (`src/lib/collection-utils.test.ts`)
Pruebas sobre las estructuras de datos que manejan la posesión del usuario.

*   `getVariantCount`: Extracción segura de cantidades anidadas en el objeto ownership.
*   `getTotalOwned`: Sumatoria de todas las copias de una misma carta (ej: 2 Normales + 1 Reverse = 3 Totales). Casos borde de cartas no poseídas.

### 4. Análisis y Estadísticas (`src/lib/stats-logic.test.ts`)
Asegura que los resúmenes visuales y financieros de la colección sean exactos.

*   `calculateStats`: Verifica el cálculo del valor total del portfolio integrando las tasas de cambio (ej: 100 USD -> 92 EUR).
*   **Agregaciones**: Comprueba que el conteo de cartas por rareza y por serie sea correcto.
*   **Top Cards**: Asegura que se identifican correctamente las cartas más valiosas para el dashboard.

### 5. Presupuestos y Gastos (`src/lib/budget-logic.test.ts`)
Control exhaustivo de la lógica financiera del coleccionista.

*   **Carry-over (Arrastre)**: Una de las lógicas más complejas. Verifica que el excedente (o déficit) de un mes se traslade correctamente al siguiente.
*   **Periodos**: Pruebas específicas para presupuestos mensuales, anuales y de pago único (*one-time*).
*   **Historial**: Generación de meses perdidos (huecos sin gastos) para mantener la línea de tiempo.

### 6. Utilidades UI (`src/lib/utils.test.ts`)
Tests básicos de infraestructura.

*   `cn`: Verifica que la utilidad de mezcla de clases Tailwind (clsx + twMerge) resuelva conflictos correctamente (ej: `p-4` vs `p-2`).

### 7. Sistema de Versiones (`src/lib/version-utils.test.ts`)
Tests para la lógica de detección de actualizaciones.

*   `hasNewerVersion`: Comparación semántica de versiones (major, minor, patch).
*   `sortVersionTags`: Ordenamiento de tags de Docker Hub de mayor a menor versión.
*   **Casos Borde**: Manejo de prefijo `v`, versiones iguales, filtrado de tags no semánticos (`latest`, `dev`).

---

## 🚀 Cómo Ejecutar los Tests

El proyecto usa `vitest` que es compatible con la API de Jest pero mucho más rápido y nativo para Vite/Next.js.

```bash
# Ejecutar todos los tests una sola vez
npm run test

# Modo Watch (re-ejecuta al guardar archivos)
npx vitest

# Generar reporte de cobertura (Opcional)
npx vitest run --coverage
```

## 🎯 Plan de Testing Futuro (Roadmap de Calidad)

Para robustecer la aplicación de forma progresiva sin detener el desarrollo de features, abordaremos los tests necesarios en 3 fases:

### Fase 1: Integridad de Datos (Inmediata)
*Objetivo: Asegurar que lo que guardamos en la BD es correcto y no rompemos la sincronización.*

- [x] **Transformación de Datos API (`src/services/tcgdex.ts`)**:
    - [x] Crear Mock de una respuesta completa de TCGdex (Carta normal, Carta trainer, Carta energía).
    - [x] Verificar que `transformCardToSchema` mapea correctamente campos críticos (ID, setID, precios null).
    - [x] Testear casos bordes: Cartas sin rareza, sin imagen, o sets promocionales.
- [x] **API Endpoint Sincronización (`/api/sync/collection-cards`)**:
    - [x] Testear que el filtrado en memoria respeta la lógica (ej: "Solo Pikachus") - *Refactorizado a `src/lib/sync-logic.ts`*.
    - [x] Verificar que no se duplican registros si se corre el sync dos veces.
- [x] **Matching de Pokédex Nacional**:
    - [x] Validar normalización de nombres complejos (Mr. Mime, Nidoran♂) en el join SQL.
    - [x] Asegurar que el conteo total de especies alcanza los 1025 Pokémon esperados.

### Fase 2: Flujos Críticos de Usuario (Corto Plazo)
*Objetivo: Proteger las acciones más destructivas o importantes para el usuario.*

- [x] **Gestión de Colección (`/api/collection-items`)**:
    - [x] **Endpoint POST**: Verificar que añadir 1 carta incrementa el contador.
    - [x] **Endpoint POST**: Verificar crear una variante nueva vs actualizar existente.
    - [x] **Endpoint DELETE**: Verificar que borrar una carta con cantidad > 1 solo resta la cantidad.
- [x] **Bulk Import**:
    - [x] Testear parser de texto (`102, 105 x4`) - *Nota: El parser de input raw se testeó implícitamente en la lógica de validación fuzzy*.
    - [x] Verificar que IDs inválidos devuelven error y no basura.

### Fase 3: Estabilidad UI & E2E (Largo Plazo)
*Objetivo: Evitar regresiones visuales y de flujo completo.*

- [x] **Hooks Personalizados (`useI18n`)**:
    - [x] Verificar que cambia el idioma y persiste en localStorage/Context.
    - [x] Verificar fallback a la key si no hay traducción.
- [x] **Componentes Clave**:
    - [x] `CollectionCard`: Testear renderizado de estado vacío vs lleno (Grayscale vs Color).
    - [x] `PriceChart`: Verificar que muestra el color correcto (verde/rojo) según tendencia.
- [ ] **E2E (Playwright/Cypress)**:
    - [ ] Flujo completo: Crear Colección -> Añadir Carta -> Ver en Portfolio.

### Fase 4: Funcionalidades Avanzadas (Completado)
*Objetivo: Cubrir los módulos secundarios pero importantes para la retención del usuario.*

- [x] **Wishlist & Alertas**:
    - [x] Lógica de "check" de disponibilidad (¿tengo ya esta carta en alguna colección?).
    - [x] Alertas de bajada de precio (Umbral configurable).
- [x] **Etiquetas (Tags)**:
    - [x] Lógica de asignación y CRUD verificada (Fase manual/API).
- [x] **Generador de Proxies**:
    - [x] Lógica de formateo de texto para cartas proxy (Ajuste de tamaño y campos).
- [x] **Data Aging**:
    - [x] Verificar que el sistema detecta correctamente precios obsoletos (>24h).

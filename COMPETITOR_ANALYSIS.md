# Análisis de Competencia y Funcionalidades Faltantes en HoloStack

Este documento resume una investigación de mercado sobre las principales aplicaciones de gestión de colecciones de Pokémon TCG (**Collectr, Dragon Shield, TCGPlayer, Pokellector**) y destaca las funcionalidades clave que actualmente diferencian a estas apps de HoloStack.

## 🏆 Panorama Competitivo

| App | Enfoque Principal | Puntos Fuertes |
| :--- | :--- | :--- |
| **Collectr** | Inversión / Finanzas | Portfolio, valoración en tiempo real, soporte multi-TCG. |
| **Dragon Shield** | Jugadores y Coleccionistas | Escáner con traducción, Deck Builder, herramientas de trade. |
| **TCGPlayer** | Compra / Venta | Precios de mercado oficiales, integración directa con tienda. |
| **Pokellector** | Completismo | Gestión de Sets (Set Registry), base de datos exhaustiva. |

---

## 🚀 Funcionalidades Clave a Explorar

Estas son las características que hacen únicas a las apps de la competencia y que representan oportunidades de crecimiento para HoloStack.

### 1. Escáner de Cartas con Cámara (IA/OCR) 📷
**Prioridad: Alta**
*   **Descripción**: Capacidad de identificar cartas instantáneamente usando la cámara del dispositivo móvil.
*   **Referencia**: La app de *Dragon Shield* es líder en esto, permitiendo incluso traducir cartas japonesas en tiempo real.
*   **Valor para HoloStack**: Elimina la fricción de entrada de datos. Actualmente, añadir cartas requiere búsqueda manual.

### 2. Análisis Financiero de "Portafolio" 📈
**Prioridad: Alta**
*   **Descripción**: Herramientas analíticas que tratan la colección como una cartera de inversión.
    *   Gráficos históricos de valor (30 días, 1 año).
    *   Sección de "Mayores Subidas/Bajadas" (Market Movers).
    *   Valoración diferenciada por condición (Raw vs Graded).
*   **Referencia**: *Collectr* destaca por mostrar el "% de ganancia" total de la cuenta.
*   **Valor para HoloStack**: Aumenta la retención del usuario que entra diariamente a ver "cuánto vale su colección hoy".

### 3. Deck Builder (Constructor de Mazos) ⚔️
**Prioridad: Media**
*   **Descripción**: Herramienta para crear listas de mazos para jugar, verificando automáticamente qué cartas tienes en tu colección y cuáles te faltan.
*   **Referencia**: *Dragon Shield* permite exportar listas para torneos y analizar estadísticas del mazo (curva de maná/energía).
*   **Valor para HoloStack**: Expande el público objetivo de "solo coleccionistas" a "jugadores activos".

### 4. Herramientas Sociales y Trading 🤝
**Prioridad: Media**
*   **Descripción**:
    *   **Perfiles Públicos**: Compartir tu colección con un enlace.
    *   **Calculadora de Intercambios**: Seleccionar cartas de dos usuarios y calcular la diferencia de valor en tiempo real para asegurar trades justos.
*   **Referencia**: *Collectr* y *Dragon Shield* facilitan la interacción social.
*   **Valor para HoloStack**: Crea efectos de red y viralidad.

### 5. Gestión Avanzada de Condición y Grados 🏷️
**Prioridad: Media/Alta**
*   **Descripción**: Permitir especificar la condición exacta de cada copia individual (Near Mint, Lightly Played, etc.) y si está graduada (PSA 10, CGC 9.5).
*   **Referencia**: Todas las apps top permiten esto para dar una valoración precisa.
*   **Valor para HoloStack**: Esencial para coleccionistas serios cuyos items de alto valor dependen del estado.

---

## 💡 Recomendación Estratégica

Para diferenciar HoloStack en 2024-2025, el roadmap sugerido sería:

1.  **Fase 1 (Short-term):** Implementar **Gráficos de Historial de Precios** y profundizar en la analítica de datos (Market Movers), aprovechando que ya tenemos los datos de precios.
2.  **Fase 2 (Mid-term):** Desarrollar un sistema de **Importación masiva** (CSV) para facilitar la migración de usuarios desde Collectr/Pokellector.
3.  **Fase 3 (Long-term):** Investigar la integración de un **Escáner visual** (quizás usando librerías de terceros o ML básico) para la versión móvil.

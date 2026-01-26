# HoloStack - Roadmap & Project Status 🚀

Este documento es la fuente de verdad sobre el estado del proyecto, las funcionalidades implementadas y la visión futura.

> **Versión Actual**: 1.1.1
> **Última Actualización**: 26 Enero 2026 (Infraestructura QA & Tests Resilientes)

---

## ✅ Funcionalidades Completadas

### 1. Experiencia de Usuario (Core UX)
- [x] **Diseño Premium**: Interfaz moderna con gradientes, animaciones fluidas y modo oscuro profundo.
- [x] **Responsive Design**: Adaptación completa a móvil, tablet y escritorio con menú de navegación inteligente.
- [x] **PWA (Progressive Web App)**: Soporte para instalación en dispositivos móviles.
- [x] **Changelog Interactivo**: Modal de novedades visible para el usuario con historial de versiones.

### 2. Gestión de Colecciones
- [x] **Creación Flexible**: Colecciones Manuales (carta a carta) o Automáticas (basadas en filtros dinámicos).
- [x] **Colecciones Predefinidas (Top Picks)**: Plantillas listas para usar (ej: "Original 151", "Charizard Hunter", "Generational Binders").
- [x] **Modo Binder (Álbum)**: Visualización realista de carpetas con paginación, slot placeholders y vista de doble página.
- [x] **Modo Tabla**: Vista densa para gestión de inventario con edición rápida.
- [x] **Filtros Avanzados**: Búsqueda por nombre, rareza, serie, y estado de posesión.
- [x] **Stacking de Cartas de Pokémon**: Nueva rejilla genérica que permite apilar múltiples variantes de un mismo Pokémon con efecto "Abanico" (Poker Hand).

### 3. Herramientas Avanzadas
- [x] **Entrada Masiva (Bulk Entry)**:
    - Modo texto rápido (ej: "102, 105 x4") para digitalizar inventario rápidamente.
    - Modo texto rápido (ej: "102, 105 x4") para digitalizar inventario rápidamente.
    - Detección difusa (fuzzy matching) para números de carta.
- [x] **Importador Cardmarket**:
    - Parsing inteligente de emails de pedido (texto copiado).
    - Detección automática de Edición, Idioma, Estado y Rareza (ART, RR, UR).
    - Validación y corrección automática de variantes (Normal/Holo/Reverse).
- [x] **Gestión de Duplicados**: Dashboard dedicado para identificar excedentes (>4 copias) y optimizar el inventario.
- [x] **Centro de Impresión (Proxies)**:
    - Generador de hojas A4 para imprimir proxies de prueba.
    - Modo "Ahorro de Tinta" (Proxies de texto).
    - Importación directa desde colecciones existentes.

### 4. Inteligencia de Mercado
- [x] **Precios en Tiempo Real**: Integración con Cardmarket y TCGPlayer.
- [x] **Portfolio Inteligente**: Cálculo del valor total de la colección, desglose por rareza/set y conversión de moneda (EUR/USD/GBP).
- [x] **Lista de Deseos (Wishlist)**: Sistema de prioridades y seguimiento de cartas buscadas.
- [x] **Control de Presupuestos**: Registro de gastos y sistema de arrastre mensual (*carry-over*) automático.

### 5. Infraestructura y Datos
- [x] **Base de Datos Local**: SQLite optimizado con Drizzle ORM.
- [x] **Sincronización Global**: Descarga de metadatos de cartas de TCGDex.
- [x] **Sistema de Backups**: Exportación e importación completa de datos de usuario en JSON.
- [x] **Internacionalización (i18n)**: Soporte completo Español/Inglés en toda la interfaz y datos.
- [x] **Docker**: Despliegue contenerizado listo para producción.
- [x] **CI/CD Global**: Automatización completa con GitHub Actions para builds de Desktop y Docker.

### 6. HoloStack Desktop (Electron)
- [x] **App Nativa**: Ejecución standalone sin dependencia de navegador o Docker externo.
- [x] **Persistencia Nativa**: Gestión automática de la base de datos en carpetas del sistema (`%APPDATA%` / `Library`).
- [x] **Auto-Update**: Sistema de detección de nuevas versiones via GitHub Releases.
- [x] **Multiplataforma**: Instaladores oficiales para Windows (.exe), Mac (.dmg) y Linux (.AppImage).
- [x] **Estabilidad de Escritorio (v1.1.0)**: Motor optimizado y aislamiento de procesos para un rendimiento de roca.
- [x] **Branding**: Iconos personalizados y optimización de ventana nativa.

---

## 🚧 En Progreso / Próximos Pasos (Short Term)

### 📊 Análisis Avanzado
- [x] **Historial de Precios Gráfico**: Visualización de la tendencia de valor de cartas individuales. (Implementado vía `PriceChart`).
- [ ] **Profit/Loss Real**: Capacidad de registrar el precio de compra para calcular ganancias reales vs valor de mercado.
- [ ] **Market Movers**: Dashboard con las cartas que más han subido/bajado de precio en las últimas 24h/30d.

### 🏷️ Metadatos Privados
- [x] **Notas por Carta**: Campo de texto privado para anotaciones específicas por variante.
- [ ] **Gestión de Estado y Grados**: Campos nativos para condición (NM, LP, MP) y certificación profesional (PSA 10, BGS 9.5).

---

## 🔮 Futuro (Long Term / Ideas)

### 🔌 Conectividad
- [ ] **Comparador de Mercados**: Visualización simultánea de precios de múltiples fuentes (eBay, CM, TCGPlayer).
- [ ] **Importador Universal**: Carga masiva desde CSVs exportados de otras apps (Collectr, Dragon Shield).
- [ ] **Escáner de Cartas**: Uso de cámara para identificar cartas automáticamente (OCR/ML).

### 📱 Experiencia Móvil
- [ ] **Modo Offline Real**: Capacidad de consultar la colección sin conexión (cacheando imágenes clave).
- [ ] **Modo Quiosco**: Interfaz simplificada para exhibición en tablets.

### 👥 Social (Nuevas Ideas)
- [ ] **Perfiles Públicos**: Capacidad de compartir una colección mediante un enlace de solo lectura (ej: `holostack.app/u/ashreborn`).
- [ ] **Calculadora de Intercambios**: Herramienta para comparar el valor de mercado de dos grupos de cartas para trades justos.

---

## 📦 Estructura del Proyecto

```
src/
├── app/            # Next.js App Router (Páginas y API Routes)
├── components/     # Componentes React (UI, Features)
├── db/             # Esquema Drizzle y conexión SQLite
├── lib/            # Utilidades, Hooks, Constantes
├── locales/        # Archivos de traducción (es.json, en.json)
└── ...
```

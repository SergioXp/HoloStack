# HoloStack - Roadmap & Future Features 🚀

Este documento detalla la visión del proyecto centrada exclusivamente en el **coleccionismo**, priorizando la organización, exhibición y valoración de cartas, sin elementos de juego competitivo.

## ✅ Fase 1: Core Experience (Completada Q1 2026)

### 🌓 Temas Personalizados
- [x] Selector de temas basado en Tipos Pokémon.
- [x] Variables CSS dinámicas.

### 📊 Estadísticas Básicas
- [x] Dashboard gráfico con distribución por rareza y series.
- [x] Visualización de valor total estimado.

### 📱 PWA & Instalación
- [x] Soporte básico para instalación como App nativa.

---

## ✅ Fase 2: Gestión Avanzada (Completada Q2 2026)

### 🏷️ Sistema de Etiquetas Pro
- [x] Etiquetas personalizadas globales y por item.
- [x] Filtrado avanzado por etiquetas.

### ❤️ Lista de Deseos (Wishlist)
- [x] Sistema de wishlist con prioridades.
- [x] Integración en explorador.

### 📦 Herramientas de Gestión
- [x] Acciones masivas (Bulk) para inventario.
- [x] Importación/Exportación CSV.
- [x] Generador de Proxies para impresión física (organización de huecos).

---

## ✅ Fase 2.5: Precisión y Datos (Completada)

*Objetivo: Asegurar que los datos financieros sean fiables antes de escalar.*

### 💰 Revisión Integral de Precios
- [x] Módulo centralizado de precios (`src/lib/prices.ts`).
- [x] Soporte multimoneda real (EUR/USD/GBP con conversión).
- [x] Selector de moneda preferida en Settings.
- [x] Funciones para obtener precios de TCGPlayer y Cardmarket.
- [x] Tests unitarios completos (21 tests).

---

## ✅ Fase 3: La Experiencia "Binder" (Completada)

*Objetivo: Replicar la satisfacción visual de hojear una carpeta física.*

### 📖 Vista de Carpeta Virtual (Binder View)
- [x] Visualización en cuadrícula realista (3x3) paginada.
- [x] Navegación entre páginas con controles.
- [x] Placeholders visuales para cartas faltantes (modo silueta).
- [x] Indicador de cantidad en cartas duplicadas.
- [x] Selector de colección integrado.

---

## ✅ Fase 4: Portfolio Global y Valoración (Completada)

*Objetivo: Gestión profesional de activos y finanzas.*

### 💼 Smart Portfolio (Cartera Global)
- [x] **Vista Unificada**: Lista de TODAS las cartas que posees en todas las colecciones.
- [x] **Análisis Financiero**:
    - Valor total del portfolio en tiempo real.
    - Top 10 cartas más valiosas.
    - Desglose de valor por Set y Rareza.
- [x] **Selector de Moneda**: Vista en EUR/USD/GBP según preferencia.

---

## ✅ Fase 5: Infraestructura e Internacionalización (Completada)

*Objetivo: Robustez técnica, despliegue y alcance global.*

### 🌐 Internacionalización (i18n)
- [x] Soporte completo Español/Inglés en toda la app.
- [x] Traducción dinámica de datos de cartas (nombre, flavor text).
- [x] Recordatorio de preferencia de idioma.

### 🛡️ Seguridad y Datos
- [x] Sistema de Backups (Importar/Exportar JSON).
- [x] Validación de tipos estricta y Tests Unitarios (Vitest).

### 🐳 Despliegue
- [x] Dockerización completa (Alpine images, Docker Compose).
- [x] Persistencia de datos en volúmenes.

### 🎯 Próximos Pasos (Futuro)
- [ ] Comparador de Mercados (eBay, Cardmarket, TCGPlayer).
- [ ] Soporte nativo para cartas graduadas (Slabs: PSA, BGS, CGC).
- [ ] Historial de precios con gráficos de evolución.
- [ ] "Modo Quiosco" para exhibición en tablets.

<div align="center">

  <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/main.png" alt="HoloStack Banner" width="100%" />
  
  # HoloStack
  
  **El Gestor de Colecciones de Pokémon TCG de Siguiente Generación**
  
  [![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/SergioXp/HoloStack?style=for-the-badge&color=blue)](https://github.com/SergioXp/HoloStack/releases)
  [![Docker Pulls](https://img.shields.io/docker/pulls/sgonzalezh/holostack?style=for-the-badge&color=azure)](https://hub.docker.com/r/sgonzalezh/holostack)
  [![Platform](https://img.shields.io/badge/Plataforma-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Docker-slate?style=for-the-badge)](https://github.com/SergioXp/HoloStack/releases)

  <p align="center">
    <b>Rastrea. Analiza. Domina tu Colección.</b><br>
    HoloStack es la herramienta definitiva para coleccionistas serios, combinando gestión profesional de inventario con análisis de mercado en tiempo real.
  </p>
  
  [🇺🇸 Read in English](README.md) | **🇪🇸 Leer en Español**

  [📥 Descargar App de Escritorio](#-empezar) • [🐳 Ejecutar con Docker](#-auto-alojado-docker) • [💬 Unirse a la Comunidad](../../discussions)

</div>

---

## 🔥 ¿Por qué HoloStack?

Olvídate de las hojas de cálculo y las webs lentas. HoloStack está construido para velocidad, estética y soberanía de datos. Ya tengas 100 cartas o 100.000, te cubrimos.

### 📊 Análisis de Mercado Profesional
*   **Precios en Tiempo Real:** Datos en vivo de **TCGPlayer** y **Cardmarket**.
*   **Seguimiento de Portafolio:** Visualiza el valor de tu colección a lo largo del tiempo con gráficos interactivos.
*   **Detector de Ofertas:** Identifica automáticamente cartas que se venden por debajo del valor de mercado.

### 🗂️ Gestión Avanzada de Inventario
*   **Jerarquía Infinita:** Organiza por Carpetas, Archivadores o etiquetas personalizadas.
*   **Modo de Entrada Masiva:** Añade cientos de cartas en minutos usando nuestra interfaz optimizada de entrada rápida.
*   **Búsqueda Inteligente:** Filtra por Artista, Rareza, Set, Patrón Holo y más al instante.

### 🌍 Acceso Universal
*   **Multiplataforma:** Apps nativas para **Windows, macOS y Linux**.
*   **Auto-Alojado:** Despliega tu propia instancia con Docker. Tus datos, tus reglas.
*   **Offline First:** La app de escritorio funciona perfectamente incluso sin conexión a internet (la sincronización de precios se reanuda al volver online).

---

## 📸 Galería

<details>
<summary><b>Haz clic para expandir todas las capturas</b></summary>
<br>

| **Vista General de Colección** | **Análisis Detallado de Carta** |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/collections.png" alt="Colecciones" width="400"/> | <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/card_data.png" alt="Datos de Carta" width="400"/> |

| **Interior de un Archivador** | **Portafolio y Presupuestos** |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/collections_inside.png" alt="Interior Colección" width="400"/> | <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/budgets.png" alt="Presupuestos y Portafolio" width="400"/> |

| **Vista de Archivador Virtual** | **Herramientas de Impresión de Proxies** |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/binder.png" alt="Vista Binder" width="400"/> | <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/images_github/print.png" alt="Impresión Proxies" width="400"/> |

</details>

*&nbsp;&nbsp;&nbsp;&nbsp;👆 ¡Haz clic en la flecha de arriba para ver el tour visual completo!*

---

## 🚀 Empezar

### 🖥️ App de Escritorio (Recomendado)
La forma más fácil de empezar. Descarga el instalador, ejecútalo y empieza a coleccionar en segundos.

[![Descargar para Windows](https://img.shields.io/badge/Windows-Descargar-blue?style=for-the-badge&logo=windows)](../../releases/latest)
[![Descargar para macOS](https://img.shields.io/badge/macOS-Descargar-white?style=for-the-badge&logo=apple)](../../releases/latest)
[![Descargar para Linux](https://img.shields.io/badge/Linux-Descargar-orange?style=for-the-badge&logo=linux)](../../releases/latest)

1. Ve a la **[Página de Lanzamientos](../../releases/latest)**.
2. Descarga el archivo para tu SO (`.exe`, `.dmg` o `.AppImage`).
3. ¡Instala e inicia!

### 🐳 Auto-Alojado (Docker)
Ideal para ejecutar en un NAS (Synology, Unraid) o servidor casero (Raspberry Pi/Linux).

```yaml
version: '3.8'
services:
  holostack:
    image: sgonzalezh/holostack:latest
    container_name: holostack
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

```bash
docker compose up -d
```

---

## 🛠️ Características Principales

*   ✅ **Integración TCGdex:** Base de datos completa de todos los sets en Inglés e Internacional.
*   ✅ **Generador de Proxies:** Crea hojas de impresión de alta calidad para probar mazos.
*   ✅ **Escanear e Importar:** Importa colecciones desde CSV o exportaciones de Cardmarket.
*   ✅ **Lista de Deseos:** Rastrea cartas que quieres comprar y establece precios objetivo.
*   ✅ **Soporte de Temas:** Modo Oscuro, Modo Claro y temas basados en Tipos (Fuego, Agua, Planta...).
*   ✅ **Multi-Idioma:** Interfaz disponible en Inglés y Español.

---

## 🤝 Soporte y Comunidad

HoloStack es un proyecto comunitario abierto donde tu opinión importa.

*   🐛 **¿Encontraste un bug?** [Abre una Incidencia](../../issues)
*   💡 **¿Tienes una idea?** [Inicia una Discusión](../../discussions)
*   ⭐ **¿Te gusta la app?** ¡Danos una estrella!

---

<p align="center">
  <sub>Desarrollado con ❤️ por <a href="https://github.com/SergioXp">SergioXp</a></sub><br>
  <sub><i>Pokémon y los nombres de personajes Pokémon son marcas comerciales de Nintendo. HoloStack no está afiliado con Nintendo, The Pokémon Company o GAME FREAK.</i></sub>
</p>

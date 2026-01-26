# HoloStack

<div align="center">
  <img src="public/icon.png" alt="Logo de HoloStack" width="120" />
  <h1>HoloStack</h1>
  <p><strong>El gestor de colecciones Pokémon TCG moderno y auto-alojado.</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
  [![Licencia](https://img.shields.io/badge/License-MIT-green)](LICENSE)
</div>

---

## 🌟 Sobre el Proyecto

**HoloStack** es una aplicación premium de código abierto diseñada para coleccionistas serios de Pokémon TCG que desean gestionar su colección con la elegancia que merece. A diferencia de las aplicaciones genéricas basadas en listas, HoloStack se centra en la **experiencia visual**, ofreciendo una "Vista de Carpeta" (Binder) que replica la sensación de hojear un álbum físico, junto con un **seguimiento financiero robusto** y gestión de datos **privada**.

### ✨ Características Principales

- **📖 Álbum Virtual**: Experimenta tu colección en una cuadrícula realista de 3x3 con huecos visuales para las cartas que faltan.
- **💰 Inteligencia de Mercado**: Seguimiento de precios en tiempo real con soporte multimoneda (EUR, USD, GBP) utilizando datos de Cardmarket y TCGPlayer.
- **🌍 Totalmente Internacionalizado**: Soporte nativo para **Español** e **Inglés**, incluyendo la traducción de datos de las cartas.
- **🎨 UI Premium**: Temas dinámicos basados en tipos de Pokémon (Fuego, Agua, Planta...) con diseño glassmorphism y animaciones fluidas.
- **🔒 Privacidad y Auto-alojamiento**: Tus datos son tuyos. Ejecútalo localmente con Docker y mantén tu base de datos privada. Incluye Backup/Restauración robusta vía JSON.
- **📊 Analíticas Avanzadas**: Visualiza la distribución de valor de tu colección, tasas de completado por set y desglose por rareza.
- **🏷️ Sistema de Etiquetas**: Organiza tus cartas con etiquetas globales personalizadas para filtrado y gestión simplificada.

---

## 🛠️ Stack Tecnológico

Construido con las últimas tecnologías web modernas para rendimiento y mantenibilidad:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos**: [SQLite](https://sqlite.org/) (vía [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes UI**: [Shadcn/UI](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Contenedores**: [Docker](https://www.docker.com/)

---

## 🚀 Comenzando

Puedes ejecutar HoloStack en minutos usando Docker o configurándolo manualmente.

### Opción A: Aplicación de Escritorio (Recomendada para Usuarios Únicos)

HoloStack ahora está disponible como una aplicación nativa de escritorio (Mac, Windows, Linux) para una experiencia más integrada:

1.  **Descargar**: Ve a la pestaña de [Releases](https://github.com/SergioXp/HoloStack/releases) y descarga el instalador para tu sistema operativo (`.dmg`, `.exe` o `.AppImage`).
2.  **Instalar**: Ejecuta el instalador y abre la aplicación.
3.  **Privacidad Directa**: La aplicación gestiona su propia base de datos SQLite localmente en tu carpeta de documentos de usuario.

### Opción B: Docker (Recomendada para Servidores/NAS)

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/holostack.git
    cd holostack
    ```

2.  **Iniciar el contenedor**:
    ```bash
    docker-compose up -d
    ```

3.  **Acceder a la app**:
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Los datos persistirán en la carpeta `./data`.

### Opción C: Instalación Manual (Desarrollo)

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Inicializar la base de datos**:
    ```bash
    npx drizzle-kit push
    ```

3.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```

---

## 📂 Documentación

Para información detallada sobre funcionalidades, roadmap y guías de usuario:

- [📖 Manual de Usuario](docs/USER_MANUAL.md) - Guía completa de uso de HoloStack.
- [🚀 Roadmap](docs/ROADMAP.md) - Planes futuros e hitos completados.
- [📝 Changelog](CHANGELOG.md) - Historial de cambios y actualizaciones.
- [🧪 Tests](docs/TESTS.md) - Estrategia de pruebas y automatización CI (Windows/Mac).

---

## 🛡️ Garantía de Calidad
HoloStack utiliza **Playwright** y **GitHub Actions** para realizar "Smoke Tests" automáticos en cada cambio. Esto asegura que la aplicación se compile y arranque correctamente tanto en **macOS** como en **Windows**, garantizando la estabilidad incluso en sistemas que no posees físicamente.

¡Las contribuciones son bienvenidas! Por favor revisa el [ROADMAP](docs/ROADMAP.md) para ver qué está planeado o envía un issue para bugs y sugerencias.

---

<div align="center">
  <p>Creado con ❤️ para la Comunidad Pokémon</p>
</div>

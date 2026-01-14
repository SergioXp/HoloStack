# Estudio de Viabilidad: Migración a Aplicación de Escritorio (Electron)

Este documento detalla los pasos, desafíos y beneficios de transformar la actual aplicación web de Pokémon TCG en una aplicación de escritorio multiplataforma (.exe, .app, .deb) utilizando **Electron**.

## 1. Motivación
El objetivo es ofrecer a la comunidad un único archivo descargable que funcione sin necesidad de instalar Docker, configurar bases de datos o abrir la terminal.

## 2. Requisitos Técnicos y Desafíos

### A. Ejecución de Next.js
Electron normalmente carga archivos HTML estáticos. Sin embargo, nuestra app usa funciones de servidor (API routes, Server Actions, Auth).
*   **Solución**: Utilizaremos el modo `standalone` de Next.js. Electron arrancará un mini-servidor Node.js interno en un puerto aleatorio y la ventana de Electron cargará esa URL local.

### B. Base de Datos (SQLite)
Usamos `better-sqlite3`, que es un módulo nativo (escrito en C++).
*   **Desafío**: Los módulos nativos deben compilarse específicamente para la versión de Node.js que incluye Electron.
*   **Solución**: Usar `electron-rebuild` para asegurar que la base de datos funcione correctamente dentro de la app empaquetada.

### C. Persistencia de Datos
En Docker usamos volúmenes. En Electron, los datos deben guardarse en la carpeta de datos de aplicación del usuario (AppData en Windows, Application Support en Mac).
*   **Cambio**: Ajustar el `DATABASE_FILE` para que use `app.getPath('userData')`.

## 3. Hoja de Ruta de Implementación

### Paso 1: Instalación de Dependencias
Añadir Electron y herramientas de empaquetado:
```bash
npm install --save-dev electron electron-builder electron-serve
```

### Paso 2: Creación del proceso Principal (`main.js`)
Crear un archivo que gestione la ventana de la aplicación:
1.  Arrancar el servidor Next.js standalone.
2.  Crear una ventana de navegador (BrowserWindow).
3.  Cargar `localhost:PORT`.
4.  Gestionar el cierre del servidor al cerrar la app.

### Paso 3: Ajustes en Next.js
Configurar la aplicación para que sea consciente de que está corriendo en Electron (por ejemplo, para desactivar cabeceras de seguridad que podrían interferir localmente).

### Paso 4: Empaquetado (Distribution)
Configurar `electron-builder` para generar los instaladores:
*   **Windows**: Archivo `.exe` o instalador MSI.
*   **Mac**: Archivo `.dmg` o `.app` (Requiere firma de Apple para evitar avisos de seguridad).
*   **Linux**: Archivo `.AppImage` o `.deb`.

## 4. Análisis de Ventajas y Desventajas

| Característica | Docker (Actual) | Electron (Propuesto) |
| :--- | :--- | :--- |
| **Facilidad de uso** | Media (Requiere Docker) | **Alta (Instalar y abrir)** |
| **Peso del archivo** | Muy bajo (Solo el .yml) | Alto (~150MB por el navegador integrado) |
| **Privacidad del código** | Alta (Imagen compilada) | **Muy Alta (Código empaquetado y oculto)** |
| **Rendimiento** | Excelente | Bueno (Consumo de RAM tipo Chrome) |
| **Actualizaciones** | `docker-compose pull` | Auto-updater integrado |

## 5. Conclusión
La migración a Electron es **viable y recomendada** si el público objetivo no tiene conocimientos técnicos. Aunque aumenta la complejidad del desarrollo inicial (especialmente por la compilación de módulos nativos), la experiencia de usuario final es infinitamente superior.

---
*Documento generado el 14 de enero de 2026 para el proyecto PokemonTCG Collection Manager.*

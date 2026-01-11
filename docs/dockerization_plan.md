# Plan de Dockerización - HoloStack

## 1. Estrategia de Build (Next.js Standalone)
Utilizaremos el modo `standalone` de Next.js. Esto reduce drásticamente el tamaño de la imagen final copiando solo los archivos necesarios para producción.

**Configuración requerida:**
Modificar `next.config.ts` para incluir `output: "standalone"`.

## 2. Definición del Dockerfile (Multi-stage)
Usaremos una construcción en múltiples etapas para optimizar caché y seguridad:
1.  **Deps**: Instala dependencias (cacheable).
2.  **Builder**: Construye la aplicación `npm run build`.
3.  **Runner**: Imagen ligera (Alpine) que solo ejecuta la app.

## 3. Persistencia de Datos (SQLite)
Dado que usamos SQLite (`sqlite.db`), el archivo de base de datos reside en el sistema de archivos.
-   **Volumen Docker**: Es CRÍTICO montar un volumen persistente en la ruta donde se guarde la DB.
-   **Ruta propuesta**: `/app/data` dentro del contenedor, mapeado a `./data` en el host (o un volumen nombrado).
-   Moveremos `sqlite.db` a una carpeta `data/` para facilitar este montaje, o configuraremos Drizzle para buscarla ahí.

## 4. Gestión de Variables de Entorno
Las variables sensibles (`NEXTAUTH_SECRET`, etc.) se inyectarán en tiempo de ejecución a través de `docker-compose.yml` o archivo `.env`.

## 5. Orquestación
`docker-compose.yml` simplificará el despliegue definiendo:
-   La construcción del servicio.
-   Mapeo de puertos (3000:3000).
-   Mapeo de volúmenes (Data persistence).
-   Políticas de reinicio.

---

### Pasos de Implementación
1. Actualizar `next.config.ts`.
2. Crear `Dockerfile`.
3. Crear `docker-compose.yml`.
4. Crear `.dockerignore`.
5. Validar build y persistencia.

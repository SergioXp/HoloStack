# HoloStack - Manual de Usuario y Despliegue

HoloStack es tu gestor personal para colecciones de Pokémon TCG, diseñado para ser rápido, privado y fácil de desplegar.

## 🚀 Despliegue con Docker (Recomendado)

### Prerrequisitos
- [Docker](https://www.docker.com/) y Docker Compose instalados.

### Instalación Rápida
1. Descarga el código fuente o clona el repositorio.
2. Crea un archivo `.env` basado en el ejemplo o configura las variables en `docker-compose.yml`.
   ```env
   NEXTAUTH_SECRET=tu_secreto_super_seguro
   NEXTAUTH_URL=http://localhost:3000
   APP_MODE=LOCAL  # o SERVER si prefieres login obligatorio
   ```
3. Ejecuta el comando de inicio:
   ```bash
   docker compose up -d
   ```
4. Accede a `http://localhost:3000`.

### Persistencia de Datos
La base de datos se guarda automáticamente en un volumen de Docker (o carpeta local `./data` si se configura así). Esto asegura que tus colecciones y presupuestos **no se pierdan** al actualizar o reiniciar el contenedor.

**Backup:**
Para hacer una copia de seguridad, simplemente copia el archivo `sqlite.db` (o la carpeta de datos montada) a una ubicación segura.

---

## 📖 Guía de Uso

### 1. Primeros Pasos
Al entrar por primera vez:
1. Ve a **Configuración** (icono de engranaje).
2. Define tu nombre de perfil y moneda preferida.
3. (Opcional) Si la base de datos de cartas está vacía, aparecerá un aviso para **Sincronizar**. Pulsa el botón y espera a que se descarguen los sets (esto funciona offline una vez descargado).

### 2. Explorador
Navega por todas las eras de Pokémon TCG.
- Entra en un set para ver sus cartas.
- Usa los filtros para encontrar cartas específicas.

### 3. Mis Colecciones
Aquí es donde ocurre la magia.
- **Crear Colección**: Puedes crear una colección manual (añadiendo carta a carta) o automática (ej: "Todas las cartas de Base Set").
- **Seguimiento**: Marca las variantes que tienes (Normal, Holo, Reverse) y la cantidad.
- **Progreso**: Visualiza barras de progreso para ver cuánto te falta para completar un set.

### 4. Colecciones Generacionales (National Dex)
Para los coleccionistas de eras completas:
1. Al crear colección, elige **"Por Generación"** en Top Picks.
2. Selecciona una generación específica (ej: Johto) o **"Todas las Generaciones"** para un National Dex completo.
3. El sistema creará automáticamente los huecos para todos los Pokémon de esa era (ej: 1-151 para Kanto, 152-251 para Johto).

### 5. Presupuestos
Controla tus gastos.
- Crea presupuestos mensuales o por colección.
- Añade gastos manualmente indicando descripción, precio y categoría.
- Visualiza si estás dentro del límite o te has excedido.

### 5. Configuración y Login
- **Modo LOCAL**: No requiere contraseña. Eres el único usuario (Admin).
- **Modo SERVER**: Requiere login. Diseñado para cuando despliegas la app en internet.

---

## 🛠 Solución de Problemas

**La sincronización se queda parada:**
Recarga la página. El sistema está diseñado para reanudar o reintentar descargas fallidas.

**No veo las imágenes:**
HoloStack descarga imágenes bajo demanda de servidores externos. Asegúrate de tener conexión a internet.

**He perdido mis datos al reiniciar Docker:**
Asegúrate de que el volumen de datos está correctamente montado en `docker-compose.yml`.

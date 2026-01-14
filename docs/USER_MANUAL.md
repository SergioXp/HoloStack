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

**Backup Avanzado:**
Además de copiar el archivo `sqlite.db`, puedes usar la herramienta de **Exportar Datos** integrada en la aplicación (Configuración -> Gestión de Datos) para descargar un archivo JSON con toda tu información.

---

## 📖 Guía de Uso

### 1. Primeros Pasos
Al entrar por primera vez:
1. Ve a **Configuración** (icono de engranaje).
2. Define tu nombre de perfil, moneda preferida y **idioma** de la aplicación.
3. (Opcional) Si la base de datos de cartas está vacía, aparecerá un aviso para **Sincronizar**. Pulsa el botón y espera a que se descarguen los sets (esto funciona offline una vez descargado).

### 2. Explorador
Navega por todas las eras de Pokémon TCG.
- Entra en un set para ver sus cartas.
- Usa los filtros para encontrar cartas específicas.
- Usa el icono del **Corazón** en cualquier carta para añadirla a tu Wishlist.

### 3. Mis Colecciones
Aquí es donde ocurre la magia.
- **Crear Colección**: Puedes crear una colección manual, automática (por filtros) o usar una **Predefinida** (ej: "Original 151").
- **Modo Binder**: Visualiza tu colección como un álbum físico realista.
- **Modo Tabla**: Gestión rápida de datos.
- **Entrada Masiva (Bulk)**: Usa la pestaña "Entrada Masiva" para añadir múltiples cartas rápidamente usando sus números (ej: "001, 002, 005 x4"). ideal para abrir sobres.

### 4. Gestión de Duplicados
Mantén tu inventario limpio.
- Ve a la sección **Bulk > Duplicados**.
- Define tu "Umbral de Copias" (por defecto 4).
- El sistema te mostrará automáticamente todas las cartas que superen ese límite para que decidas qué hacer con ellas (vender, cambiar, borrar).

### 5. Generador de Proxies (Impresión)
Crea hojas de prueba para jugar.
1. Ve a **Impresión** en el menú.
2. Busca cartas o impórtalas directamente desde una colección.
3. Ajusta los márgenes y selecciona "Ahorro de Tinta" si solo necesitas el texto.
4. Imprime directamente desde el navegador (se genera un PDF optimizado para A4).

### 6. Presupuestos y Estadísticas
Control financiero profesional.
- **Presupuestos**: Define límites de gasto mensual o global.
- **Portfolio**: Consulta en tiempo real el valor de mercado de tu colección (datos de Cardmarket/TCGPlayer).
- **Wishlist**: Organiza las cartas que buscas por prioridad.

### 7. Configuración y Login
- **Modo LOCAL**: No requiere contraseña. Eres el único usuario (Admin).
- **Modo SERVER**: Requiere login. Diseñado para cuando despliegas la app en internet.
- **Idioma**: Puedes cambiar entre Español e Inglés en cualquier momento.

---

## 🛠 Solución de Problemas

**La sincronización se queda parada:**
Recarga la página. El sistema está diseñado para reanudar o reintentar descargas fallidas.

**No veo las imágenes:**
HoloStack descarga imágenes bajo demanda de servidores externos. Asegúrate de tener conexión a internet inicial. Luego se cachean.

**He perdido mis datos al reiniciar Docker:**
Asegúrate de que el volumen de datos está correctamente montado en `docker-compose.yml`. Se recomienda usar la función de "Exportar Backup" regularmente.

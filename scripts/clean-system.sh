#!/bin/bash
echo "🧹 Limpiando instalación y datos de HoloStack..."

# Cerrar app si corre
pkill HoloStack

# Eliminar App
echo "🗑️  Eliminando /Applications/HoloStack.app..."
rm -rf /Applications/HoloStack.app

# Eliminar Datos de Usuario (Base de datos, etc)
echo "🗑️  Eliminando Application Support..."
rm -rf "$HOME/Library/Application Support/HoloStack"
rm -rf "$HOME/Library/Application Support/holostack"

# Eliminar Preferencias y Caché
echo "🗑️  Eliminando Cachés y Preferencias..."
rm -rf "$HOME/Library/Caches/com.sergiogonzalez.holostack"
rm -rf "$HOME/Library/Caches/HoloStack"
rm -rf "$HOME/Library/Preferences/com.sergiogonzalez.holostack.plist"
rm -rf "$HOME/Library/Saved Application State/com.sergiogonzalez.holostack.savedState"
rm -rf "$HOME/Library/Logs/HoloStack"

echo "✨ Sistema limpio. Listo para instalar desde cero."

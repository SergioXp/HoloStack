#!/bin/bash

# Configuración
IMAGE_NAME="sgonzalezh/holostack"
VERSION=$(date +%Y%m%d-%H%M) # Genera una versión por fecha: ej 20240114-1930

echo "🚀 Iniciando despliegue de la versión $VERSION..."

# 1. Construir la imagen con versión específica y como 'latest'
# El punto final indica que use el Dockerfile de la carpeta actual
docker build -t $IMAGE_NAME:$VERSION -t $IMAGE_NAME:latest .

# 2. Subir ambas a Docker Hub
echo "📦 Subiendo imágenes a Docker Hub..."
docker push $IMAGE_NAME:$VERSION
docker push $IMAGE_NAME:latest

echo "✅ ¡Listo! La imagen ha sido actualizada."
echo "📢 Avisa a tu comunidad que ya pueden actualizar con: docker-compose pull && docker-compose up -d"

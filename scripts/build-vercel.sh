#!/bin/bash

# Script de build para Vercel
echo "🚀 Iniciando build para Vercel..."

# Crear archivo .env con DATABASE_URL
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

# Verificar que el archivo se creó correctamente
echo "📄 Archivo .env creado:"
cat .env

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Build de Astro
echo "🏗️ Construyendo aplicación Astro..."
npm run astro build

echo "✅ Build completado!"

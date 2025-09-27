#!/bin/bash

# Script de deploy para Vercel
echo "🚀 Iniciando deploy..."

# Generar cliente Prisma
echo "📦 Generando cliente Prisma..."
npx prisma generate

# Aplicar cambios a la base de datos
echo "🗄️ Aplicando cambios a la base de datos..."
npx prisma db push

# Poblar con datos de ejemplo si es necesario
echo "🌱 Poblando base de datos..."
npm run seed

# Build de la aplicación
echo "🏗️ Construyendo aplicación..."
npm run build

echo "✅ Deploy completado!"










# Script para configurar variables de entorno en desarrollo
# Ejecutar: .\setup-dev-env.ps1

Write-Host "🔧 Configurando variables de entorno para desarrollo..." -ForegroundColor Green

# Solicitar variables al usuario
$WHATSAPP_TOKEN = Read-Host "Ingresa tu WHATSAPP_TOKEN de Vercel"
$WHATSAPP_PHONE_ID = Read-Host "Ingresa tu WHATSAPP_PHONE_ID de Vercel"

# Configurar variables de entorno para la sesión actual
$env:WHATSAPP_TOKEN = $WHATSAPP_TOKEN
$env:WHATSAPP_PHONE_ID = $WHATSAPP_PHONE_ID

Write-Host "✅ Variables configuradas para esta sesión" -ForegroundColor Green
Write-Host "📱 WHATSAPP_TOKEN: $($WHATSAPP_TOKEN.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host "📱 WHATSAPP_PHONE_ID: $WHATSAPP_PHONE_ID" -ForegroundColor Yellow

Write-Host "Ahora ejecuta: npm run dev" -ForegroundColor Cyan

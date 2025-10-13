# 🚚 Sistema de Delivery - Town

Sistema de delivery mínimo y desacoplado para Town, implementado como módulo opcional con feature flag.

## 🎯 Características

- ✅ **Feature Flag**: `DELIVERY_ENABLED=false` por defecto (no rompe nada existente)
- ✅ **Modo Mock**: Funciona sin Supabase para desarrollo local
- ✅ **PWA Repartidor**: `/delivery` - Panel simple para repartidores
- ✅ **Asignación Secuencial**: Round-robin con expiración de 60s
- ✅ **API Completa**: Endpoints bajo `/api/delivery/*`
- ✅ **Notificaciones Stub**: Placeholder para WhatsApp Cloud
- ✅ **Banner Condicional**: Solo muestra si no hay repartidores

## 🚀 Activación

### 1. Variables de Entorno

```bash
# En .env.local o Vercel
DELIVERY_ENABLED=true
```

### 2. Modo Mock (Desarrollo Local)

```bash
# No requiere configuración adicional
# Los datos se mantienen en memoria durante la sesión
```

### 3. Modo Supabase (Producción)

```bash
# Ejecutar SQL en Supabase SQL Editor:
# supabase/sql/2025-setup-delivery.sql

# Variables requeridas:
PUBLIC_SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

## 📱 Uso del Sistema

### Para Repartidores

1. **Acceder**: `https://tu-dominio.com/delivery`
2. **Login Mock**: Usar cualquier email/teléfono
3. **Conectarse**: Toggle "Conectarse" para estar disponible
4. **Recibir Ofertas**: Aparecen automáticamente
5. **Aceptar/Rechazar**: Botones en la interfaz
6. **Actualizar Estado**: Recogí → En camino → Entregado

### Para el Sistema

1. **Crear Delivery**: `POST /api/delivery/create`
2. **Asignación Automática**: Busca couriers disponibles
3. **Ofertas con Expiración**: 60 segundos por oferta
4. **Fallback**: Si nadie acepta → `no_courier`

## 🔧 API Endpoints

### Crear Delivery
```bash
POST /api/delivery/create
{
  "orderId": "order_123",
  "sellerId": "seller_456", 
  "pickup": {
    "address": "Calle 123, Santiago",
    "latlng": { "lat": -33.4489, "lng": -70.6693 }
  },
  "dropoff": {
    "address": "Av. Principal 456, Santiago",
    "latlng": { "lat": -33.4489, "lng": -70.6693 }
  }
}
```

### Gestionar Ofertas
```bash
POST /api/delivery-offers/{offerId}/accept
POST /api/delivery-offers/{offerId}/decline
```

### Actualizar Disponibilidad
```bash
POST /api/couriers/{courierId}/availability
{
  "isAvailable": true,
  "lat": -33.4489,
  "lng": -70.6693
}
```

### Actualizar Estado
```bash
POST /api/deliveries/{deliveryId}/status
{
  "status": "pickup_confirmed"
}
```

### Verificar Disponibilidad
```bash
GET /api/system/delivery-availability
# Respuesta: { "anyAvailable": true, "count": 2 }
```

## 🏗️ Arquitectura

### Repositorios
- **Mock**: `src/lib/delivery/repos/mockRepo.ts` (memoria)
- **Supabase**: `src/lib/delivery/repos/supabaseRepo.ts` (producción)
- **Factory**: `src/lib/delivery/repos/index.ts` (selección automática)

### Servicios
- **AssignmentService**: Lógica de asignación y ofertas
- **Notify**: Stubs para WhatsApp Cloud (futuro)

### Estados del Delivery
```
pending → offer_sent → assigned → pickup_confirmed → en_route → delivered
   ↓           ↓           ↓
no_courier  no_courier  cancelled
```

### Estados de Oferta
```
offered → accepted (primer accept gana)
   ↓
declined/expired → siguiente courier
```

## 🧪 Testing

### Flujo Completo
1. **Activar**: `DELIVERY_ENABLED=true`
2. **Crear Couriers**: Usar `/delivery` para registrarse
3. **Crear Delivery**: `POST /api/delivery/create`
4. **Verificar Asignación**: Oferta aparece en PWA
5. **Aceptar**: Botón en interfaz
6. **Actualizar Estados**: Recogí → En camino → Entregado

### Casos de Prueba
- ✅ Sin couriers → `no_courier`
- ✅ Doble accept → Solo uno gana
- ✅ Expiración → Siguiente courier
- ✅ Sin couriers disponibles → `no_courier`

## 🔒 Seguridad

- **Feature Flag**: Deshabilitado por defecto
- **RLS**: Políticas de Supabase para datos
- **Validaciones**: Estados y transiciones
- **Timeouts**: Expiración automática de ofertas

## 📊 Monitoreo

### Logs
```javascript
// En consola del navegador/servidor
📱 [WHATSAPP STUB] Oferta enviada a Juan (56912345678)
📱 [WHATSAPP STUB] Cliente notificado: María tomó el pedido
```

### Métricas
- Couriers disponibles: `GET /api/system/delivery-availability`
- Estados de delivery: En base de datos
- Ofertas expiradas: Logs automáticos

## 🚀 Despliegue

### Vercel
```bash
# Variables de entorno
DELIVERY_ENABLED=true
PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# SQL en Supabase (opcional)
# Ejecutar: supabase/sql/2025-setup-delivery.sql
```

### Local
```bash
# Solo activar flag
DELIVERY_ENABLED=true

# No requiere Supabase para modo mock
```

## 🔮 Futuro

### WhatsApp Cloud Integration
- Reemplazar stubs en `src/lib/delivery/services/notify.ts`
- Usar plantillas aprobadas por Meta
- Notificaciones reales a repartidores/clientes

### Mejoras
- Mapa con ubicaciones en tiempo real
- Algoritmo de distancia (no solo round-robin)
- Múltiples ofertas simultáneas
- Rating de repartidores
- Historial de deliveries

## 🐛 Troubleshooting

### Delivery no aparece
- Verificar `DELIVERY_ENABLED=true`
- Revisar logs de `/api/delivery/create`
- Verificar couriers disponibles

### Ofertas no llegan
- Verificar que courier esté `isAvailable=true`
- Revisar timeout de 60s
- Verificar logs de asignación

### Estados no cambian
- Verificar transiciones válidas
- Revisar logs de `/api/deliveries/{id}/status`
- Verificar permisos RLS (Supabase)

## 📝 Notas

- **No rompe nada**: Con `DELIVERY_ENABLED=false` todo funciona igual
- **Modo mock**: Perfecto para desarrollo y demos
- **Supabase opcional**: Solo si quieres persistencia real
- **PWA simple**: Sin dependencias pesadas
- **Código limpio**: Módulo completamente desacoplado






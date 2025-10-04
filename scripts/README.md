# Scripts de Configuración del Sistema de Órdenes

Este directorio contiene scripts para configurar el sistema completo de órdenes y checkout.

## 📋 Prerrequisitos

1. **Variables de entorno configuradas**:
   ```bash
   PUBLIC_SUPABASE_URL=tu_url_de_supabase
   PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

2. **Base de datos Supabase**:
   - Proyecto creado en Supabase
   - Tablas básicas configuradas (`profiles`, `products`, `seller_products`, `carts`, `cart_items`)

## 🚀 Configuración Paso a Paso

### 1. Configurar Tablas de Órdenes

```bash
node scripts/setup-orders-system.js
```

Este script:
- ✅ Crea las tablas `orders`, `order_items`, `user_points`
- ✅ Configura RLS (Row Level Security)
- ✅ Crea índices para optimización
- ✅ Crea la función `place_order`

### 2. Probar el Sistema

```bash
node scripts/test-checkout.js
```

Este script:
- ✅ Crea usuario de prueba
- ✅ Crea datos de prueba (vendedor, producto, carrito)
- ✅ Prueba el endpoint `/api/checkout`
- ✅ Verifica que la orden se creó correctamente

### 3. Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

1. **Ejecutar SQL en Supabase Dashboard**:
   ```sql
   -- Ejecutar: scripts/sql/orders_tables.sql
   -- Ejecutar: scripts/sql/place_order_function.sql
   ```

2. **Configurar variables de entorno**:
   ```bash
   # En tu archivo .env
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

## 📊 Estructura de la Base de Datos

### Tablas Creadas

#### `orders`
- `id` (UUID, PK)
- `user_id` (UUID, FK a auth.users)
- `seller_id` (UUID, FK a auth.users)
- `total_cents` (INTEGER)
- `payment_method` (TEXT: 'cash', 'card', 'transfer', 'points')
- `status` (TEXT: 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
- `created_at`, `updated_at` (TIMESTAMP)

#### `order_items`
- `id` (UUID, PK)
- `order_id` (UUID, FK a orders)
- `product_id` (TEXT)
- `title` (TEXT)
- `price_cents` (INTEGER)
- `qty` (INTEGER)
- `created_at` (TIMESTAMP)

#### `user_points`
- `user_id` (UUID, PK, FK a auth.users)
- `points` (INTEGER, default 0)
- `created_at`, `updated_at` (TIMESTAMP)

### Función RPC

#### `place_order(user_id, seller_id, payment_method)`
- ✅ Verifica que existe carrito para el vendedor
- ✅ Calcula total y verifica stock
- ✅ Crea orden y items
- ✅ Actualiza stock del vendedor
- ✅ Limpia el carrito
- ✅ Calcula y otorga puntos
- ✅ Retorna `{orderId, totalCents, pointsAdded}`

## 🔧 Endpoints Disponibles

### POST /api/checkout

**Request**:
```json
{
  "sellerId": "uuid-del-vendedor",
  "payment_method": "cash|card|transfer|points"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Orden procesada exitosamente",
  "orderId": "uuid-de-la-orden",
  "totalCents": 2000,
  "pointsAdded": 0
}
```

**Headers requeridos**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 🧪 Pruebas

### Prueba Manual

```bash
# 1. Obtener token de autenticación
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Probar checkout
curl -X POST http://localhost:4321/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sellerId":"uuid","payment_method":"cash"}'
```

### Prueba Automática

```bash
node scripts/test-checkout.js
```

## 🚨 Solución de Problemas

### Error: "Variables de entorno no configuradas"
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
- Verificar que `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` estén configuradas

### Error: "Función place_order no encontrada"
- Ejecutar `node scripts/setup-orders-system.js`
- Verificar que la función se creó en Supabase Dashboard

### Error: "No hay carrito para este vendedor"
- Verificar que el usuario tiene un carrito activo
- Verificar que el `sellerId` es correcto

### Error: "Stock insuficiente"
- Verificar que el vendedor tiene stock suficiente
- Verificar que `seller_products` tiene `stock > 0`

## 📝 Notas Importantes

1. **Seguridad**: La función `place_order` usa `SECURITY DEFINER` para ejecutar con permisos de administrador
2. **Transacciones**: La función maneja rollback automático en caso de error
3. **RLS**: Todas las tablas tienen Row Level Security configurado
4. **Puntos**: Se otorgan 1 punto por cada $100 gastados
5. **Stock**: Se actualiza automáticamente al procesar la orden

## 🔄 Próximos Pasos

1. **UI de Checkout**: Crear interfaz para el proceso de checkout
2. **Notificaciones**: Implementar notificaciones de orden
3. **Historial**: Página de historial de órdenes
4. **Estados**: Sistema de seguimiento de órdenes
5. **Pagos**: Integración con pasarelas de pago









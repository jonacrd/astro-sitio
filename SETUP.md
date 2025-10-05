# Configuración de la Tienda Web

## 1. Configurar Supabase

### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL y las claves de tu proyecto

### Configurar variables de entorno
1. Ejecuta el script de configuración:
```bash
node scripts/setup-env.js
```

2. Edita el archivo `.env` con tus credenciales de Supabase:
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

## 2. Configurar la base de datos

### Ejecutar el script SQL
1. Ve a tu proyecto de Supabase
2. Ve a "SQL Editor"
3. Copia y pega el contenido de `scripts/seed-database.sql`
4. Ejecuta el script

### Poblar con datos de prueba
```bash
node scripts/populate-database-direct.js
```

## 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

## 4. Verificar la configuración

Visita `http://localhost:4321/api/debug/env` para verificar que las variables de entorno estén configuradas correctamente.

## 5. Probar la búsqueda

Visita `http://localhost:4321/api/search/working?q=arepa` para probar la búsqueda de productos.

## Estructura de la base de datos

- `profiles`: Perfiles de usuarios
- `products`: Catálogo de productos
- `seller_products`: Productos de vendedores con precios y stock
- `seller_status`: Estado online/offline de vendedores
- `carts`: Carritos de compra
- `cart_items`: Items en el carrito
- `orders`: Órdenes de compra
- `order_items`: Items de las órdenes
- `user_points`: Puntos de usuarios










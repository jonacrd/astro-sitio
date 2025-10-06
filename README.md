# 🛍️ Tienda Online - Ecommerce Moderno

Ecommerce completo construido con **Astro**, **React**, **Tailwind CSS** y **Supabase**.

## 🚀 Características

- ✅ **Autenticación completa** con Supabase Auth
- ✅ **Catálogo de productos** con categorías y filtros
- ✅ **Carrito de compras** interactivo con persistencia
- ✅ **Control de stock** en tiempo real
- ✅ **Dashboard de vendedores** para gestión de productos
- ✅ **Búsqueda inteligente** con IA
- ✅ **Feed social** con productos en tiempo real
- ✅ **Sistema de delivery** con repartidores (opcional)
- ✅ **Notificaciones WhatsApp** para pedidos
- ✅ **Diseño responsive** con Tailwind CSS
- ✅ **Componentes React** como islas de Astro
- ✅ **API REST** para todas las operaciones
- ✅ **Base de datos PostgreSQL** con Supabase

## 🛠️ Stack Tecnológico

- **Framework**: Astro 5.x con SSR
- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: API Routes de Astro
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Deploy**: Vercel con adaptador oficial
- **Tipado**: TypeScript

## 📦 Instalación Local

### 1. Clonar y configurar

```bash
git clone <tu-repo>
cd astro-sitio
npm install
```

### 2. Configurar Supabase

#### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL y las claves de tu proyecto

#### Configurar variables de entorno
```bash
# Ejecutar script de configuración
node scripts/setup-env.js

# Editar .env con tus credenciales de Supabase
# PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
# SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

### 3. Configurar la base de datos

#### Ejecutar el script SQL
1. Ve a tu proyecto de Supabase
2. Ve a "SQL Editor"
3. Copia y pega el contenido de `scripts/seed-database.sql`
4. Ejecuta el script

#### Poblar con datos de prueba
```bash
node scripts/populate-database-direct.js
```

### 4. Verificar la configuración

```bash
node scripts/verify-setup.js
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 🔧 Scripts de Configuración

```bash
# Configurar variables de entorno
node scripts/setup-env.js

# Verificar configuración
node scripts/verify-setup.js

# Poblar base de datos
node scripts/populate-database-direct.js
```

## 🌐 Deploy en Vercel

### Configuración en Vercel

1. **Root Directory**: `astro-sitio`
2. **Framework Preset**: Astro
3. **Build Command**: `npm run build`
4. **Install Command**: `npm install`
5. **Output Directory**: `dist` (automático)

### Variables de entorno

Agregar en el panel de Vercel:

```
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

### Pasos del deploy

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Configurar directorio raíz como `astro-sitio`
4. Deploy automático

## 📂 Estructura del Proyecto

```
astro-sitio/
├── scripts/
│   ├── setup-env.js         # Configurar variables de entorno
│   ├── verify-setup.js      # Verificar configuración
│   ├── populate-database-direct.js # Poblar base de datos
│   └── seed-database.sql    # Script SQL para crear tablas
├── src/
│   ├── components/
│   │   └── react/            # Componentes React
│   │       ├── ProductCard.tsx
│   │       ├── ProductGrid.tsx
│   │       ├── AddToCartButton.tsx
│   │       ├── CartTable.tsx
│   │       ├── CartWidget.tsx
│   │       ├── CheckoutButton.tsx
│   │       ├── CompleteProfile.tsx
│   │       ├── UpgradeToSeller.tsx
│   │       ├── SellerStatusToggle.tsx
│   │       └── SellerGuard.tsx
│   ├── lib/                  # Librerías del servidor
│   │   ├── supabaseClient.ts # Cliente Supabase
│   │   ├── supabase-browser.ts # Cliente Supabase para browser
│   │   ├── session.ts       # Utilidades de sesión
│   │   └── money.ts         # Utilidades de precio
│   ├── layouts/
│   │   └── BaseLayout.astro  # Layout principal
│   ├── pages/
│   │   ├── api/             # Endpoints API
│   │   │   ├── cart/        # APIs del carrito
│   │   │   ├── products/    # APIs de productos
│   │   │   ├── search/      # APIs de búsqueda
│   │   │   └── debug/       # APIs de debug
│   │   ├── index.astro      # Página de inicio
│   │   ├── catalogo.astro   # Catálogo de productos
│   │   ├── carrito.astro    # Página del carrito
│   │   ├── complete-profile.astro # Completar perfil
│   │   ├── upgrade-seller.astro # Convertirse en vendedor
│   │   └── dashboard-supabase.astro # Dashboard vendedor
│   └── styles/
│       └── global.css       # Estilos globales
├── public/
│   └── images/              # Imágenes de productos
├── astro.config.mjs         # Configuración de Astro
├── package.json
├── tailwind.config.mjs      # Configuración de Tailwind
├── SETUP.md                 # Instrucciones de configuración
└── vercel.json             # Configuración de Vercel
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run preview         # Preview del build

# Configuración
node scripts/setup-env.js      # Configurar variables de entorno
node scripts/verify-setup.js  # Verificar configuración
node scripts/populate-database-direct.js # Poblar base de datos

# Supabase
# Ejecutar en SQL Editor de Supabase:
# scripts/seed-database.sql   # Crear tablas y RLS
```

## 🛒 Uso de Componentes

### Agregar productos al catálogo

Los productos se gestionan a través de Supabase. Puedes:

1. Usar el dashboard de Supabase para interfaz gráfica
2. Usar `node scripts/populate-database-direct.js` para datos de prueba
3. Usar las APIs para crear productos programáticamente

### Usar componentes React

```astro
---
// En páginas .astro
import ProductGrid from '@components/react/ProductGrid.tsx'
import { supabase } from '@lib/supabaseClient'

const { data: products } = await supabase.from('products').select('*')
---

<ProductGrid products={products} client:load />
```

### APIs disponibles

- `GET /api/products/list` - Listar productos
- `GET /api/cart/get` - Obtener carrito
- `POST /api/cart/add` - Agregar al carrito
- `POST /api/cart/update` - Actualizar cantidad
- `POST /api/cart/remove` - Remover producto
- `POST /api/cart/checkout` - Procesar pedido
- `GET /api/search/working` - Búsqueda de productos
- `GET /api/feed/real` - Feed de productos
- `GET /api/debug/env` - Debug de variables de entorno

## 🚚 Sistema de Delivery (Opcional)

El sistema de delivery está implementado como módulo opcional con feature flag:

### Activación
```bash
# En .env.local o Vercel
DELIVERY_ENABLED=true
```

### Características
- **PWA Repartidor**: `/delivery` - Panel para repartidores
- **Asignación Automática**: Round-robin con expiración 60s
- **API Completa**: Endpoints bajo `/api/delivery/*`
- **Modo Mock**: Funciona sin Supabase para desarrollo
- **Notificaciones**: Stubs para WhatsApp Cloud

### Uso
1. **Repartidor**: Va a `/delivery` → Login → Conectarse
2. **Sistema**: `POST /api/delivery/create` → Asignación automática
3. **Estados**: Recogí → En camino → Entregado

Ver [DELIVERY_README.md](./DELIVERY_README.md) para documentación completa.

## 📱 Notificaciones WhatsApp

Sistema de notificaciones automáticas para pedidos:

### Configuración
```bash
# Variables requeridas
WHATSAPP_TOKEN=tu_token_meta
WHATSAPP_PHONE_ID=tu_phone_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token
APP_BASE_URL=https://tu-dominio.com
```

### Flujo
- **Nuevo pedido** → Vendedor recibe WhatsApp
- **Confirmado** → Cliente recibe WhatsApp  
- **En camino** → Cliente recibe WhatsApp
- **Entregado** → Cliente recibe WhatsApp

Ver documentación en `supabase/sql/2025-setup-whatsapp.sql`.

## 🎨 Personalización

### Colores y estilos

Edita `tailwind.config.mjs` para personalizar colores, fuentes y animaciones.

### Componentes

Los componentes React en `src/components/react/` son completamente personalizables y usan Tailwind CSS.

### Base de datos

Modifica el esquema en Supabase para agregar campos o tablas, luego ejecuta:

```bash
# Actualizar script SQL
scripts/seed-database.sql

# Poblar con nuevos datos
node scripts/populate-database-direct.js
```

## 📧 Contacto y Soporte

Para preguntas o soporte, contacta a: info@tienda.com

---

**¡Tu tienda online está lista para vender! 🚀**

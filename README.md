# 🛍️ Tienda Online - Ecommerce Moderno

Ecommerce completo construido con **Astro**, **React**, **Tailwind CSS**, **Prisma** y **PostgreSQL**.

## 🚀 Características

- ✅ **Catálogo de productos** con categorías y filtros
- ✅ **Carrito de compras** interactivo con persistencia
- ✅ **Control de stock** en tiempo real
- ✅ **Checkout completo** con generación de órdenes
- ✅ **Páginas de confirmación** con detalles del pedido
- ✅ **Diseño responsive** con Tailwind CSS
- ✅ **Componentes React** como islas de Astro
- ✅ **API REST** para todas las operaciones
- ✅ **Base de datos PostgreSQL** con Prisma ORM

## 🛠️ Stack Tecnológico

- **Framework**: Astro 5.x con SSR
- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: API Routes de Astro
- **Base de datos**: PostgreSQL con Prisma ORM
- **Deploy**: Vercel con adaptador oficial
- **Tipado**: TypeScript

## 📦 Instalación Local

### 1. Clonar y configurar

```bash
git clone <tu-repo>
cd astro-sitio
npm install
```

### 2. Configurar base de datos

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tu URL de PostgreSQL
# DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"
```

### 3. Inicializar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones (o push para desarrollo)
npx prisma migrate deploy
# O alternativamente:
npx prisma db push

# Poblar con datos de ejemplo
npm run seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 🌐 Deploy en Vercel

### Configuración en Vercel

1. **Root Directory**: `astro-sitio`
2. **Framework Preset**: Astro
3. **Build Command**: `npx prisma migrate deploy || npx prisma db push && npm run build`
4. **Install Command**: `npm install`
5. **Output Directory**: `dist` (automático)

### Variables de entorno

Agregar en el panel de Vercel:

```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB?sslmode=require
```

### Pasos del deploy

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Configurar directorio raíz como `astro-sitio`
4. Deploy automático

## 📂 Estructura del Proyecto

```
astro-sitio/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.js               # Datos de ejemplo
├── src/
│   ├── components/
│   │   └── react/            # Componentes React
│   │       ├── ProductCard.tsx
│   │       ├── ProductGrid.tsx
│   │       ├── AddToCartButton.tsx
│   │       ├── CartTable.tsx
│   │       ├── CartWidget.tsx
│   │       └── CheckoutButton.tsx
│   ├── lib/                  # Librerías del servidor
│   │   ├── db.ts            # Cliente Prisma
│   │   ├── cart.server.ts   # Lógica del carrito
│   │   ├── products.server.ts # Queries de productos
│   │   └── money.ts         # Utilidades de precio
│   ├── layouts/
│   │   └── BaseLayout.astro  # Layout principal
│   ├── pages/
│   │   ├── api/             # Endpoints API
│   │   │   ├── cart/        # APIs del carrito
│   │   │   └── products/    # APIs de productos
│   │   ├── index.astro      # Página de inicio
│   │   ├── catalogo.astro   # Catálogo de productos
│   │   ├── carrito.astro    # Página del carrito
│   │   └── gracias.astro    # Confirmación de pedido
│   └── styles/
│       └── global.css       # Estilos globales
├── public/
│   └── images/              # Imágenes de productos
├── astro.config.mjs         # Configuración de Astro
├── package.json
├── tailwind.config.mjs      # Configuración de Tailwind
└── vercel.json             # Configuración de Vercel
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run preview         # Preview del build

# Base de datos
npm run seed            # Poblar con datos de ejemplo
npx prisma studio       # Interfaz web para la BD
npx prisma generate     # Generar cliente
npx prisma db push      # Sincronizar esquema (desarrollo)
npx prisma migrate deploy # Aplicar migraciones (producción)
```

## 🛒 Uso de Componentes

### Agregar productos al catálogo

Los productos se gestionan a través de Prisma. Puedes:

1. Usar `npx prisma studio` para interfaz gráfica
2. Modificar `prisma/seed.js` y ejecutar `npm run seed`
3. Usar las APIs para crear productos programáticamente

### Usar componentes React

```astro
---
// En páginas .astro
import ProductGrid from '@components/react/ProductGrid.tsx'
import { listProducts } from '@lib/products.server'

const products = await listProducts()
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

## 🎨 Personalización

### Colores y estilos

Edita `tailwind.config.mjs` para personalizar colores, fuentes y animaciones.

### Componentes

Los componentes React en `src/components/react/` son completamente personalizables y usan Tailwind CSS.

### Base de datos

Modifica `prisma/schema.prisma` para agregar campos o modelos, luego ejecuta:

```bash
npx prisma db push  # Para desarrollo
# o
npx prisma migrate dev --name tu-cambio  # Para crear migración
```

## 📧 Contacto y Soporte

Para preguntas o soporte, contacta a: info@tienda.com

---

**¡Tu tienda online está lista para vender! 🚀**

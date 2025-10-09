# 🛍️ Demo Funcional - Tienda Online

Este proyecto incluye un **demo funcional completo** para mostrar a clientes las capacidades de un e-commerce moderno.

## 🚀 Funcionalidades Implementadas

### ✅ Páginas Principales
- **`/demo`** - Página demo completa con productos, carrito y checkout
- **`/dashboard`** - Panel de control con métricas en tiempo real
- **`/catalogo`** - Catálogo de productos (ya existente)
- **`/contacto`** - Formulario de contacto (ya existente)
- **`/quienes-somos`** - Página sobre nosotros (ya existente)

### ✅ APIs Funcionales
- **`/api/inventory`** - Lista de productos desde la DB
- **`/api/order`** - Crear órdenes y descontar stock
- **`/api/lead`** - Capturar leads y enviar a Google Sheets
- **`/api/stats`** - Métricas en tiempo real para el dashboard

### ✅ Características del Demo
- 🛒 **Carrito de compras funcional** con checkout simulado
- 📊 **Dashboard en tiempo real** con métricas actualizadas cada 10s
- 📝 **Captura de leads** con validación y almacenamiento en DB
- 🤖 **Chatbot integrado** (Landbot o simulado)
- 📱 **Botón flotante de WhatsApp**
- 📧 **Notificaciones por email** (Resend o simulado)
- 📈 **Integración con Google Sheets** para leads
- 📱 **Diseño responsive** mobile-first

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# Base de datos (requerido)
DATABASE_URL="postgresql://username:password@localhost:5432/tienda_db"

# Chatbot (opcional)
PUBLIC_CHATBOT_EMBED_URL="https://your-landbot-url.com"

# WhatsApp (opcional)
PUBLIC_WHATSAPP_LINK="https://wa.me/1234567890"

# Google Sheets (opcional)
SHEETS_WEBAPP_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

# Email con Resend (opcional)
RESEND_API_KEY="re_your_api_key_here"
```

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma db push

# Poblar con datos de ejemplo
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

## 📊 Dashboard en Vivo

El dashboard (`/dashboard`) muestra:

### Métricas Principales
- **Leads Hoy** - Nuevos contactos del día
- **Órdenes Hoy** - Compras completadas
- **Revenue Hoy** - Ingresos del día
- **Stock Bajo** - Productos con menos de 10 unidades

### Datos en Tiempo Real
- **Últimas 10 órdenes** con detalles del cliente
- **Últimos 10 leads** con información de contacto
- **Actualización automática** cada 10 segundos

## 🛒 Flujo del Demo

### 1. Página Demo (`/demo`)
1. Usuario ve grid de productos
2. Agrega productos al carrito
3. Aparece botón flotante "Finalizar Compra"
4. Completa formulario de checkout
5. Se crea orden en DB y descuenta stock
6. Recibe número de orden

### 2. Captura de Leads
1. Usuario completa formulario de contacto
2. Lead se guarda en DB
3. Si `SHEETS_WEBAPP_URL` está configurado, se envía a Google Sheets
4. Si `RESEND_API_KEY` está configurado, se envía email de notificación

### 3. Dashboard
1. Métricas se actualizan automáticamente
2. Muestra datos reales de la base de datos
3. Tablas se refrescan cada 10 segundos

## 🎯 Personalización Rápida

### Cambiar Logo
```astro
<!-- En src/layouts/BaseLayout.astro -->
<a href="/" class="text-xl sm:text-2xl font-bold text-blue-600">
  🛍️ Tu Logo Aquí
</a>
```

### Cambiar Colores
```css
/* Buscar y reemplazar en los archivos CSS */
bg-blue-600 → bg-tu-color-600
text-blue-600 → text-tu-color-600
```

### Cambiar Textos
- Buscar "Tienda Online" en todos los archivos
- Reemplazar con el nombre de tu tienda

### Configurar WhatsApp
```bash
# En .env
PUBLIC_WHATSAPP_LINK="https://wa.me/tu_numero_aqui"
```

## 📱 Responsive Design

- **Mobile-first** - Optimizado para 320px+
- **Breakpoints** - sm (640px), md (768px), lg (1024px)
- **Touch-friendly** - Botones mínimo 44px
- **Sin scroll horizontal** - Diseño contenido

## ♿ Accesibilidad

- **Alt text** en todas las imágenes
- **Aria-labels** en botones interactivos
- **Focus visible** para navegación por teclado
- **Contraste adecuado** en todos los textos

## 🔒 Seguridad

- **Validación de datos** en todos los endpoints
- **Sanitización** de inputs de usuario
- **Rate limiting** implícito por validaciones
- **No autenticación** (demo público)

## 📈 Métricas Disponibles

```javascript
// Endpoint /api/stats retorna:
{
  leads_today: number,
  orders_today: number,
  revenue_today: number,
  low_stock: number,
  total_products: number,
  total_leads: number,
  total_orders: number,
  recent_orders: Order[],
  recent_leads: Lead[]
}
```

## 🚀 Deploy a Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
```

## 🎨 Comentarios en el Código

El código incluye comentarios detallados indicando:
- **Dónde cambiar logos**
- **Dónde modificar colores**
- **Dónde actualizar textos**
- **Dónde configurar enlaces**

## 📞 Soporte

Para personalizar el demo para un cliente específico:
1. Cambiar logos y colores
2. Actualizar textos y enlaces
3. Configurar variables de entorno
4. Personalizar chatbot si es necesario

---

**¡El demo está listo para mostrar a clientes!** 🎉














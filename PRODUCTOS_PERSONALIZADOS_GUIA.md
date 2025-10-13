# ✨ Sistema de Productos Personalizados - Guía Completa

## 🎉 **¡NUEVO! CREA TUS PROPIOS PRODUCTOS**

Ahora los vendedores pueden crear productos completamente personalizados:
- ✅ Subir imágenes propias
- ✅ Definir título, descripción y precio
- ✅ Elegir categoría
- ✅ Seleccionar modo de inventario (count/availability)
- ✅ Integración completa con WhatsApp, checkout, stock, etc.

---

## 🚀 **CASOS DE USO**

### **Vendedor de Comida Casera:**
```
Producto: "Almuerzo Ejecutivo del Día"
Imagen: Foto de tu comida
Categoría: Comida Rápida
Modo: Availability (menú del día)
Precio: $5.000
```

### **Peluquería:**
```
Producto: "Corte de Cabello Caballero"
Imagen: Foto de tu local
Categoría: Servicios
Modo: Availability (citas limitadas)
Precio: $8.000
```

### **Mecánico:**
```
Producto: "Cambio de Aceite"
Imagen: Logo de tu taller
Categoría: Servicios
Modo: Count (stock de servicios disponibles)
Precio: $15.000
```

---

## 📋 **CONFIGURACIÓN INICIAL (SOLO UNA VEZ)**

### **PASO 1: Ejecutar SQL en Supabase**

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega: `add-custom-products-support.sql`
4. Ejecuta (Run)

### **PASO 2: Crear Bucket de Storage**

1. En Supabase Dashboard, ve a **Storage**
2. Click en **"New bucket"**
3. Configuración:
   - **Name:** `product-images`
   - **Public:** ✅ **SÍ** (importante para URLs públicas)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/*`
4. Click **"Save"**

### **PASO 3: Configurar Políticas RLS del Bucket**

Dentro del bucket `product-images`, ve a **Policies** y agrega:

#### **a) Política INSERT (Subir imágenes):**
```
Policy name: Sellers can upload product images
Target roles: authenticated
Policy definition:
bucket_id = 'product-images' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

#### **b) Política SELECT (Ver imágenes):**
```
Policy name: Anyone can view product images
Target roles: public
Policy definition:
bucket_id = 'product-images'
```

#### **c) Política DELETE (Eliminar imágenes):**
```
Policy name: Sellers can delete their own images
Target roles: authenticated
Policy definition:
bucket_id = 'product-images' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

---

## 🎨 **CÓMO USAR (VENDEDOR)**

### **Crear un Producto Personalizado:**

1. **Ve a:** `/dashboard/mis-productos`

2. **Click en:** **"✨ Crear Producto Personalizado"** (botón morado)

3. **Completa el formulario:**

   **📸 Imagen:**
   - Click en "Subir imagen"
   - Selecciona una foto de tu producto/servicio
   - Formatos: JPEG, PNG, WEBP, GIF
   - Tamaño máximo: 5MB
   - Vista previa aparece al instante

   **📝 Título:**
   - Ej: "Almuerzo Ejecutivo", "Corte de Cabello", "Cambio de Aceite"
   - Máximo recomendado: 50 caracteres

   **📄 Descripción:**
   - Describe tu producto o servicio
   - Opcional pero recomendado
   - Ej: "Incluye: arroz, ensalada, proteína y jugo"

   **🏷️ Categoría:**
   - Selecciona la categoría más apropiada
   - 🥫 Abastos
   - 🥤 Bebidas
   - 🍔 Comida Rápida
   - 🛠️ Servicios
   - etc.

   **📦 Tipo de Inventario:**
   
   - **📊 Stock Numérico (count):**
     - Para productos físicos con cantidad
     - Ej: 50 unidades de arroz
     - Se descuenta automáticamente en cada venta
   
   - **📅 Disponibilidad (availability):**
     - Para menú del día o servicios
     - Ej: 20 almuerzos disponibles hoy
     - Gestión desde `/dashboard/menu`
     - Reseteo automático cada día

   **💰 Precio:**
   - Ingresa el precio en pesos
   - Ej: 1.500 o 15.000
   - Formato automático con separadores

   **📦 Stock Inicial (solo para Stock Numérico):**
   - Cantidad inicial de unidades
   - Ej: 10, 50, 100

   **✅ Activar inmediatamente:**
   - Marca para que aparezca en el feed de inmediato
   - O déjalo desactivado para configurarlo después

4. **Click en "Crear Producto"**

5. **¡Listo!** Tu producto ya está creado y visible para los compradores

---

## 🔄 **FLUJO COMPLETO**

### **1. Creación:**
```
Vendedor crea producto → 
Sube imagen a Supabase Storage → 
Producto se guarda en DB → 
Aparece en "Mis Productos"
```

### **2. Visibilidad:**
```
Si está activo → 
Aparece en feed categorizado → 
Compradores lo ven → 
Pueden agregarlo al carrito
```

### **3. Compartir:**
```
Vendedor click en "Compartir" → 
Genera link único → 
Mensaje pre-cargado con imagen → 
Comparte por WhatsApp
```

### **4. Compra:**
```
Cliente agrega al carrito → 
Procede a checkout → 
Paga → 
Stock se descuenta automáticamente → 
Notificaciones push enviadas
```

---

## 📦 **GESTIÓN DE INVENTARIO**

### **Modo: Stock Numérico (count)**

**Cuándo usar:**
- Productos físicos (arroz, bebidas, etc.)
- Inventario controlado por cantidad

**Gestión:**
- Desde `/dashboard/mis-productos`
- Click en "⚙️ Configurar"
- Modificar stock
- Click en "Guardar"

**Comportamiento:**
- Stock se descuenta en cada venta
- Badge "¡Últimos X!" cuando quedan < 5 unidades
- No aparece en feed si stock = 0

### **Modo: Disponibilidad (availability)**

**Cuándo usar:**
- Menú del día (comida)
- Servicios con citas limitadas
- Productos que se resetean diariamente

**Gestión:**
- Desde `/dashboard/menu`
- Toggle "Disponible hoy"
- Definir cupo opcional
- Marcar agotado manualmente

**Comportamiento:**
- Cada día se resetea el contador
- Badge "✨ Disponible hoy"
- Badge "⚠️ Quedan pocas" si faltan ≤ 3
- Badge "🚫 Agotado hoy" si se acaba

---

## 🌐 **INTEGRACIÓN CON TODO EL SISTEMA**

### **✅ Feed de Compradores:**
- Productos personalizados aparecen igual que los del catálogo
- Badges de disponibilidad funcionan
- Filtros por categoría funcionan
- Búsqueda funciona

### **✅ WhatsApp:**
- Botón "Compartir" genera link único
- Mensaje personalizable
- Imagen del producto en preview de WhatsApp (si URL es pública)
- Link lleva a `/producto/[id]`

### **✅ Checkout:**
- Flujo de pago idéntico
- Descuento de stock automático (count)
- Incremento de porciones (availability)
- Validación de disponibilidad

### **✅ Notificaciones Push:**
- OneSignal notifica al comprador
- Vendedor recibe notificación de nuevo pedido
- Notificaciones de estado (confirmado, en camino, etc.)

### **✅ Sistema de Puntos:**
- Comprador gana 10% del total en puntos
- Funciona igual que con productos del catálogo

---

## 🖼️ **MEJORES PRÁCTICAS PARA IMÁGENES**

### **Tamaño Recomendado:**
- **Resolución:** 800x800px o 1200x1200px
- **Proporción:** Cuadrada (1:1) preferentemente
- **Peso:** < 1MB para carga rápida

### **Formato:**
- **JPEG:** Para fotos (mejor compresión)
- **PNG:** Para logos con transparencia
- **WEBP:** Balance entre calidad y peso

### **Contenido:**
- ✅ Foto clara y bien iluminada
- ✅ Fondo neutro o contexto relevante
- ✅ Producto centrado
- ❌ Evitar textos superpuestos
- ❌ Evitar marcas de agua grandes

### **Herramientas Gratuitas:**
- **Redimensionar:** TinyPNG, Squoosh
- **Editar:** Canva, Photopea
- **Quitar fondo:** Remove.bg

---

## 🔒 **SEGURIDAD Y PRIVACIDAD**

### **Imágenes:**
- ✅ Cada vendedor solo ve sus propias imágenes en el dashboard
- ✅ Las URLs son públicas (para compartir)
- ✅ Solo el dueño puede eliminar sus imágenes
- ✅ Máximo 5MB por imagen (evita abuso)

### **Productos:**
- ✅ Solo el vendedor que creó el producto puede editarlo
- ✅ RLS de Supabase protege los datos
- ✅ API valida autenticación en cada request

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **"Error subiendo imagen"**
**Causas:**
1. Imagen demasiado grande (> 5MB)
2. Formato no permitido
3. Bucket no creado en Storage
4. Políticas RLS no configuradas

**Solución:**
- Comprimir imagen
- Convertir a JPEG/PNG
- Verificar bucket en Supabase Storage
- Revisar políticas RLS

### **"Error creando producto"**
**Causas:**
1. Campos requeridos vacíos
2. Precio inválido
3. No autenticado
4. Columna `created_by` no existe

**Solución:**
- Completar título, categoría y precio
- Ejecutar `add-custom-products-support.sql`
- Reloguearse
- Verificar columna en DB

### **"Producto no aparece en el feed"**
**Causas:**
1. Producto no está activado
2. Stock = 0 (modo count)
3. No disponible hoy (modo availability)
4. Vendedor inactivo

**Solución:**
- Activar desde "Mis Productos"
- Agregar stock
- Marcar "Disponible hoy" en `/dashboard/menu`
- Verificar estado del vendedor

---

## 📊 **ESTADÍSTICAS Y MONITOREO**

### **Desde el Dashboard:**
- Ver todos tus productos personalizados
- Filtrar por categoría
- Ver cuántos están activos
- Editar precio y stock

### **Reportes (futuro):**
- Productos más vendidos
- Ingresos por producto
- Stock crítico
- Historial de disponibilidad

---

## 🎯 **PRÓXIMOS PASOS**

### **Después de Crear tu Primer Producto:**

1. ✅ **Comparte por WhatsApp** con tus clientes
2. ✅ **Configura disponibilidad** (si es modo availability)
3. ✅ **Monitorea ventas** desde el dashboard
4. ✅ **Ajusta precios** según demanda
5. ✅ **Crea más productos** para ampliar tu catálogo

---

## 📝 **RESUMEN RÁPIDO**

```
1. Ejecutar SQL en Supabase ✅
2. Crear bucket "product-images" ✅
3. Configurar políticas RLS ✅
4. Esperar deploy (2-3 min) ✅
5. Ir a /dashboard/mis-productos ✅
6. Click en "✨ Crear Producto Personalizado" ✅
7. Completar formulario ✅
8. ¡Producto creado! 🎉
```

---

## 🆘 **SOPORTE**

**Si algo no funciona:**
1. Verifica que ejecutaste el SQL
2. Verifica que creaste el bucket
3. Verifica que configuraste las políticas RLS
4. Revisa la consola del navegador (F12)
5. Comparte el error para diagnóstico

---

**¡Ya puedes crear productos ilimitados y completamente personalizados!** 🚀








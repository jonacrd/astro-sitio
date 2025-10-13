# Sistema de Perfiles Públicos para Vendedores

## 📋 Resumen

Sistema completo que permite a los vendedores crear perfiles públicos personalizados donde pueden organizar sus productos por categorías y secciones personalizadas (como "Más vendidos", "Caseros", etc.). Los compradores pueden explorar el catálogo completo de cada tienda y comprar directamente.

## 🎯 Características Principales

### Para Vendedores
- **Perfil público personalizable** con información de la tienda
- **Secciones personalizadas** (Más vendidos, Caseros, Ofertas, etc.)
- **Organización por categorías** automática
- **Configuración de horarios y zona de entrega**
- **Vista previa del perfil público** antes de publicar

### Para Compradores
- **Exploración completa** del catálogo de cada vendedor
- **Navegación por categorías** y secciones especiales
- **Compra directa** desde el perfil público
- **Información del vendedor** (horarios, zona de entrega, estado)
- **Acceso desde el feed** de productos

## 🗂️ Estructura de Archivos

### Páginas
- **`/vendedor/[id]`** - Perfil público del vendedor
- **`/dashboard/perfil-publico`** - Configuración del perfil público

### Componentes
- **`SellerPublicProfile.tsx`** - Componente principal del perfil público
- **`SellerPublicProfileManager.tsx`** - Dashboard de configuración

### Base de Datos
- **`seller_custom_sections`** - Secciones personalizadas
- **`profiles`** - Campos adicionales para perfil público

## 🗄️ Base de Datos

### Tabla: `seller_custom_sections`

```sql
CREATE TABLE seller_custom_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,                    -- "Más vendidos", "Caseros", etc.
  description TEXT,                              -- Descripción opcional
  product_ids TEXT[] DEFAULT '{}',              -- Array de IDs de productos
  order_index INTEGER DEFAULT 0,                -- Orden de visualización
  is_active BOOLEAN DEFAULT true,               -- Activo/inactivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos Adicionales en `profiles`

```sql
ALTER TABLE profiles ADD COLUMN business_hours VARCHAR(200);    -- "Lun-Vie 8:00-18:00"
ALTER TABLE profiles ADD COLUMN delivery_zone VARCHAR(200);     -- "Barrio Centro, Zona Norte"
ALTER TABLE profiles ADD COLUMN minimum_order INTEGER DEFAULT 0; -- Pedido mínimo en centavos
ALTER TABLE profiles ADD COLUMN delivery_fee INTEGER DEFAULT 0;  -- Costo de entrega en centavos
```

## 🎨 Interfaz del Perfil Público

### Header del Vendedor
- **Avatar** (usando el sistema de avatares por género/tipo)
- **Nombre y descripción** de la tienda
- **Estado** (Abierto/Cerrado) con indicador visual
- **Horarios de atención** y zona de entrega
- **Botones de acción** (Volver, Ver Carrito)

### Secciones Personalizadas
- **Grid de productos** organizados por sección
- **Título y descripción** de cada sección
- **Contador de productos** por sección
- **Botones de compra** con validación de disponibilidad

### Productos por Categoría
- **Filtros de categoría** (Todos, Abastos, Bebidas, etc.)
- **Grid responsive** de productos
- **Información de stock/disponibilidad**
- **Precios formateados** en pesos colombianos

## ⚙️ Configuración del Perfil

### Información Básica
- **Descripción de la tienda** (textarea)
- **Horarios de atención** (texto libre)
- **Zona de entrega** (texto libre)
- **Pedido mínimo** (número en pesos)
- **Costo de entrega** (número en pesos)

### Secciones Personalizadas
- **Crear nuevas secciones** con nombre y descripción
- **Seleccionar productos** para cada sección
- **Reordenar secciones** por índice
- **Activar/desactivar** secciones
- **Eliminar secciones** existentes

### Vista Previa
- **Preview en tiempo real** del perfil público
- **Enlace directo** para ver el perfil público
- **Validación** de campos requeridos

## 🔗 Navegación y Enlaces

### Desde el Feed de Productos
- **Badge del vendedor** es clickeable
- **Hover effect** con escala y cambio de color
- **Enlace directo** a `/vendedor/[seller_id]`

### Desde el Dashboard
- **Botón "Perfil Público"** en acciones rápidas
- **Acceso directo** a la configuración
- **Vista previa** del perfil público

### Enlaces Internos
- **Botón "Volver"** en el perfil público
- **Enlace al carrito** desde el perfil
- **Navegación** entre secciones del dashboard

## 🛒 Funcionalidad de Compra

### Agregar al Carrito
- **Validación de disponibilidad** (stock/availability mode)
- **Verificación de estado** del vendedor (abierto/cerrado)
- **Notificación visual** de éxito
- **Actualización automática** del carrito
- **Persistencia** en localStorage

### Estados de Producto
- **Disponible** - Botón "Agregar" normal
- **Sin stock** - Botón "No disponible" deshabilitado
- **Vendedor cerrado** - Botón "Tienda cerrada" deshabilitado
- **Modo availability** - Validación de `available_today` y `sold_out`

## 📱 Diseño Responsive

### Breakpoints
- **Mobile** (< 640px): 2 columnas de productos
- **Tablet** (640px - 1024px): 3-4 columnas
- **Desktop** (> 1024px): 5-6 columnas

### Componentes Adaptativos
- **Header del vendedor** - Stack vertical en mobile
- **Filtros de categoría** - Scroll horizontal en mobile
- **Grid de productos** - Responsive automático
- **Formularios** - Layout adaptativo

## 🔒 Seguridad y Permisos

### Row Level Security (RLS)
```sql
-- Vendedores solo pueden gestionar sus propias secciones
CREATE POLICY "Vendedores pueden gestionar sus propias secciones" ON seller_custom_sections
  FOR ALL USING (auth.uid() = seller_id);

-- Cualquiera puede ver secciones activas (para perfil público)
CREATE POLICY "Cualquiera puede ver secciones activas" ON seller_custom_sections
  FOR SELECT USING (is_active = true);
```

### Validaciones
- **Autenticación requerida** para configuración
- **Verificación de vendedor** (is_seller = true)
- **Validación de campos** en frontend y backend
- **Sanitización** de inputs de usuario

## 🚀 Despliegue

### 1. Ejecutar Scripts SQL

```bash
# En Supabase SQL Editor
psql -f crear-secciones-personalizadas-vendedor.sql
```

### 2. Verificar Estructura

```sql
-- Verificar tabla creada
SELECT * FROM seller_custom_sections LIMIT 1;

-- Verificar campos agregados
SELECT business_hours, delivery_zone, minimum_order, delivery_fee 
FROM profiles WHERE is_seller = true LIMIT 1;
```

### 3. Desplegar Código

```bash
git add .
git commit -m "Implementar sistema de perfiles públicos para vendedores"
git push origin main
```

## 🧪 Casos de Uso

### Vendedor Configura su Perfil
1. **Accede** a `/dashboard/perfil-publico`
2. **Completa** información básica (descripción, horarios, etc.)
3. **Crea secciones** como "Más vendidos" y "Caseros"
4. **Selecciona productos** para cada sección
5. **Ve vista previa** del perfil público
6. **Guarda cambios** y publica

### Comprador Explora Tienda
1. **Ve producto** en el feed principal
2. **Hace click** en el badge del vendedor
3. **Explora** secciones especiales del vendedor
4. **Navega** por categorías de productos
5. **Agrega productos** al carrito
6. **Procede** al checkout

### Vendedor Gestiona Secciones
1. **Agrega nuevos productos** a su inventario
2. **Actualiza secciones** con productos nuevos
3. **Reordena secciones** por importancia
4. **Desactiva secciones** temporalmente
5. **Monitorea** el perfil público

## 📊 Métricas y Analytics

### Datos Disponibles
- **Productos por sección** (conteo automático)
- **Productos por categoría** (agrupación automática)
- **Estado del vendedor** (abierto/cerrado)
- **Información de entrega** (zona, costo mínimo)

### Posibles Extensiones
- **Contador de visitas** al perfil público
- **Productos más vistos** por sección
- **Conversión** de visitas a compras
- **Tiempo promedio** en el perfil

## 🔧 Mantenimiento

### Limpieza de Datos
```sql
-- Eliminar secciones inactivas antiguas
DELETE FROM seller_custom_sections 
WHERE is_active = false 
AND created_at < NOW() - INTERVAL '30 days';

-- Limpiar productos inexistentes de secciones
UPDATE seller_custom_sections 
SET product_ids = array_remove(product_ids, 'product-id-inexistente');
```

### Optimización
- **Índices** en `seller_id` y `is_active`
- **Cache** de productos por vendedor
- **Lazy loading** de imágenes de productos
- **Paginación** para vendedores con muchos productos

## 🐛 Troubleshooting

### Perfil Público No Carga
- **Verificar** que el vendedor existe y es activo
- **Revisar** permisos RLS en `seller_custom_sections`
- **Comprobar** que los productos están activos

### Secciones No Aparecen
- **Verificar** que `is_active = true`
- **Comprobar** que hay productos en `product_ids`
- **Revisar** que los productos existen y están activos

### Enlaces No Funcionan
- **Verificar** que la ruta `/vendedor/[id]` está configurada
- **Comprobar** que `getStaticPaths` está generando las rutas
- **Revisar** que el `seller_id` es válido

## 📚 Referencias

### Archivos Principales
- `src/pages/vendedor/[id].astro` - Página del perfil público
- `src/pages/dashboard/perfil-publico.astro` - Configuración
- `src/components/react/SellerPublicProfile.tsx` - Componente principal
- `src/components/react/SellerPublicProfileManager.tsx` - Dashboard
- `crear-secciones-personalizadas-vendedor.sql` - Script de base de datos

### Dependencias
- **Supabase** - Base de datos y autenticación
- **React** - Componentes interactivos
- **Tailwind CSS** - Estilos y responsive design
- **Astro** - Framework y routing

---

✅ **Sistema completo implementado y listo para producción**

El sistema permite a los vendedores crear perfiles públicos atractivos y organizados, mientras que los compradores pueden explorar fácilmente el catálogo completo de cada tienda y realizar compras directas.







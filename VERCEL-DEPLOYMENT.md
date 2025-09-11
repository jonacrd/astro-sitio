# 🚀 Guía de Deployment en Vercel

## ⚠️ Problemas Identificados y Soluciones

### Problema Principal: SQLite no funciona en Vercel

Vercel es serverless y no puede usar archivos SQLite. **Solución aplicada**: Cambio a PostgreSQL.

## 🔧 Cambios Realizados para Vercel

### 1. ✅ Configuración de Base de Datos

- Cambiado `prisma/schema.prisma` de SQLite a PostgreSQL
- Agregado soporte para `DATABASE_URL` environment variable

### 2. ✅ Scripts de Build Optimizados

```json
{
  "build": "prisma generate && prisma db push && astro build"
}
```

### 3. ✅ Configuración Vercel

Eliminado `vercel.json` - Vercel detecta automáticamente Astro con el adaptador oficial.

### 4. ✅ Variables de Entorno

Documentado en `env.example` las variables necesarias.

## 📋 Pasos para Deployment

### Paso 1: Crear Base de Datos PostgreSQL

**Opción A: Vercel Postgres (Recomendado)**

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a "Storage" → "Create Database" → "Postgres"
4. Copia la `DATABASE_URL` generada

**Opción B: Neon (Gratuito)**

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea una nueva base de datos
4. Copia la connection string

**Opción C: Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Crea proyecto
3. Ve a Settings → Database
4. Copia la connection string

### Paso 2: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   ```

### Paso 3: Configurar Proyecto en Vercel

1. **Framework Preset**: Astro (detectado automáticamente)
2. **Build Command**: `npm run build` (ya configurado)
3. **Install Command**: `npm install` (automático)
4. **Output Directory**: `dist` (automático)

**Nota**: No necesitas configurar manualmente estos valores, Vercel los detecta automáticamente gracias al adaptador `@astrojs/vercel`.

### Paso 4: Deploy

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel automáticamente detectará la configuración
3. El primer build ejecutará:
   - `npm install`
   - `prisma generate`
   - `prisma db push` (crea las tablas)
   - `astro build`

### Paso 5: Poblar Base de Datos (Opcional)

Después del primer deployment exitoso:

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Descargar variables de entorno
vercel env pull .env.local

# Poblar base de datos
npm run seed
```

## 🐛 Solución de Problemas Comunes

### Error: "Function Runtimes must have a valid version"

**Causa**: Configuración incorrecta en `vercel.json`
**Solución**:

1. Eliminar `vercel.json` (no es necesario con `@astrojs/vercel`)
2. Vercel detecta automáticamente la configuración de Astro

### Error: "Module '@prisma/client' not found"

**Solución**: Verificar que `postinstall: "prisma generate"` esté en package.json

### Error: "Database connection failed"

**Solución**:

1. Verificar que `DATABASE_URL` esté configurada en Vercel
2. Confirmar que la base de datos esté accesible públicamente
3. Verificar formato de connection string

### Error: "Table doesn't exist"

**Solución**:

1. El build command ejecuta `prisma db push` automáticamente
2. Si falla, ejecutar manualmente: `npx prisma db push`

### Error: "Build timeout"

**Solución**:

1. Verificar que la base de datos responda rápido
2. Considerar usar `prisma migrate deploy` en lugar de `db push`

### Error: "Function timeout"

**Solución**: Las funciones serverless de Vercel tienen límite de tiempo. Optimizar queries de base de datos.

## ✅ Checklist Pre-Deploy

- [ ] `DATABASE_URL` configurada en Vercel
- [ ] Base de datos PostgreSQL creada y accesible
- [ ] Root directory configurado como `astro-sitio`
- [ ] Variables de entorno configuradas
- [ ] Repositorio conectado a Vercel

## 🔍 Verificación Post-Deploy

1. **Página principal carga**: `https://tu-app.vercel.app/`
2. **Catálogo funciona**: `https://tu-app.vercel.app/catalogo`
3. **APIs responden**: `https://tu-app.vercel.app/api/cart/get`
4. **Base de datos conecta**: Sin errores en logs

## 📊 Monitoreo

- **Vercel Functions**: Revisar logs en Vercel Dashboard
- **Database**: Usar herramientas de tu proveedor de PostgreSQL
- **Performance**: Vercel Analytics (opcional)

---

**¡Tu tienda debería estar funcionando en Vercel ahora! 🎉**

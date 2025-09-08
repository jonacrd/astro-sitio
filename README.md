# 🚀 Tienda Web - Astro + Vercel

## 📋 Configuración para Vercel

### **Variables de entorno requeridas:**

En el dashboard de Vercel, configura estas variables:

- `DATABASE_URL`: URL de tu base de datos PostgreSQL
- `NODE_ENV`: `production`

### **Comandos de build:**

```bash
npm install
npm run build
```

### **Estructura del proyecto:**

- `src/pages/api/` - API routes
- `src/components/` - Componentes Astro
- `src/layouts/` - Layouts base
- `prisma/` - Configuración de base de datos

### **Despliegue:**

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Vercel detectará automáticamente que es un proyecto Astro
4. El build se ejecutará automáticamente

### **Notas importantes:**

- El proyecto usa `@astrojs/vercel` como adaptador
- Las API routes están en `src/pages/api/`
- La base de datos se configura con Prisma
- El output está configurado como `server` para SSR

## 🚀 Deploy en Vercel

### **Configuración en Vercel:**

1. **Variables de entorno** (Settings → Environment Variables):
   ```
   DATABASE_URL = "postgresql://USER:PASS@HOST:5432/DB?sslmode=require"
   ```

2. **Build Command:**
   ```
   npm run prisma:deploy && npm run build
   ```

3. **Install Command:**
   ```
   npm install
   ```

### **Configuración inicial (opcional - desde local):**

Antes del primer deploy, puedes configurar la base de datos localmente:

1. Crear archivo `.env` con:
   ```
   DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB?sslmode=require"
   ```

2. Ejecutar migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate dev -n init
   ```

### **Notas importantes:**

- Si usas **Vercel Postgres**, crea la base de datos en Storage y copia el `DATABASE_URL`
- El comando `prisma:deploy` ejecuta las migraciones en producción
- El `postinstall` script genera el cliente Prisma automáticamente
- Asegúrate de que Node.js >= 18 esté configurado en Vercel
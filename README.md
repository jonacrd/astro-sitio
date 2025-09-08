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
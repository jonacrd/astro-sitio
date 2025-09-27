# 🚀 Solución para Error de Vercel - DATABASE_URL

## ❌ **Problema Actual:**
```
Vercel - Deployment failed — Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.
```

## ✅ **Solución Paso a Paso:**

### **1. Configurar Variable de Entorno en Vercel:**

1. **Ve a tu dashboard de Vercel:** https://vercel.com/dashboard
2. **Selecciona tu proyecto:** `astro-sitio`
3. **Ve a Settings → Environment Variables**
4. **Agrega la variable:**
   - **Name:** `DATABASE_URL`
   - **Value:** Tu URL de base de datos PostgreSQL
   - **Environment:** Production, Preview, Development (todas)

### **2. Ejemplo de DATABASE_URL:**
```
postgresql://username:password@hostname:port/database_name?sslmode=require
```

### **3. Si usas Supabase (recomendado):**
1. Ve a tu proyecto en Supabase
2. Settings → Database
3. Copia la "Connection string" 
4. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real

### **4. Si usas Railway:**
1. Ve a tu proyecto en Railway
2. Variables tab
3. Copia el valor de `DATABASE_URL`

### **5. Si usas Neon:**
1. Ve a tu dashboard de Neon
2. Connection Details
3. Copia la connection string

## 🔧 **Comandos para Commit y Push:**

```bash
# En el directorio astro-sitio
git add .
git commit -m "perf: optimizar rendimiento - consultas DB, carrusel y carrito"
git push origin main
```

## 📋 **Verificación:**
1. ✅ Variable `DATABASE_URL` configurada en Vercel
2. ✅ Push realizado a GitHub
3. ✅ Vercel redeploy automático
4. ✅ Sitio funcionando en producción

## 🚨 **Notas Importantes:**
- La variable debe estar configurada en **TODOS** los ambientes
- Después de agregar la variable, Vercel redeployará automáticamente
- Si no funciona, puedes forzar un redeploy manual en Vercel










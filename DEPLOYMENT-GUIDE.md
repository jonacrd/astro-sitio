# 🚀 Guía de Deployment para Vercel con PostgreSQL

## 📋 Pasos para configurar la base de datos en Vercel

### 1. Crear Base de Datos PostgreSQL

#### Opción A: Neon (Recomendado - Gratuito)
1. Ve a [Neon](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la **Connection String** que se ve así:
   ```
   postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### Opción B: Supabase (Gratuito con extras)
1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings → Database
4. Copia la **Connection String**

#### Opción C: Railway ($5/mes)
1. Ve a [Railway](https://railway.app)
2. Crea un nuevo proyecto con PostgreSQL
3. Copia la **Connection String**

### 2. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

```
DATABASE_URL = postgresql://username:password@hostname:port/database?sslmode=require
SESSION_SECRET = tu-clave-secreta-super-segura-aqui
```

**IMPORTANTE:** 
- Reemplaza `tu-clave-secreta-super-segura-aqui` con una clave aleatoria
- Puedes generar una con: `openssl rand -base64 32`

### 3. Ejecutar Migraciones

Después de configurar las variables de entorno, Vercel ejecutará automáticamente:
- `prisma generate` - Genera el cliente
- `prisma db push` - Aplica el esquema a la base de datos

### 4. Verificar Deployment

1. Ve a tu sitio en Vercel
2. Prueba el registro de usuarios
3. Verifica que los datos se guarden en la base de datos

## 🔧 Solución de Problemas

### Error: "Cannot find module @prisma/client"
- Las migraciones se ejecutan automáticamente en el build
- Si persiste, verifica que `DATABASE_URL` esté configurada

### Error: "Invalid DATABASE_URL"
- Verifica que la URL de conexión sea correcta
- Asegúrate de que incluya `?sslmode=require`

### Error: "Session not working"
- Verifica que `SESSION_SECRET` esté configurada
- Debe ser la misma en todas las variables de entorno

## ✅ Checklist de Deployment

- [ ] Base de datos PostgreSQL creada
- [ ] `DATABASE_URL` configurada en Vercel
- [ ] `SESSION_SECRET` configurada en Vercel
- [ ] Deployment exitoso en Vercel
- [ ] Registro de usuarios funcionando
- [ ] Login funcionando
- [ ] Convertirse en vendedor funcionando
- [ ] Dashboard accesible

## 🎯 Resultado Final

Una vez completado, tendrás:
- ✅ Base de datos PostgreSQL persistente
- ✅ Sistema de autenticación completo
- ✅ Gestión de usuarios y vendedores
- ✅ Protección de rutas
- ✅ Sesiones seguras
- ✅ Todo funcionando en producción
















# 🔧 Solución a Errores 500 en Desarrollo

## ⚠️ Problema

Errores 500 en los endpoints de la API:
- `GET /api/feed/simple 500`
- `GET /api/feed/products 500`
- `GET /api/feed/products?category=... 500`

## 🎯 Causa

El servidor de desarrollo no detectó automáticamente los cambios en:
1. `src/pages/api/feed/products.ts` (agregamos filtro por categoría)
2. `src/lib/tour/TourManager.ts` (eliminamos carga de CSS obsoleto)

## ✅ Solución (3 Pasos)

### **Paso 1: Detener el Servidor**

En la terminal donde está corriendo el servidor:
```powershell
# Presiona Ctrl+C
```

### **Paso 2: Limpiar Caché**

```powershell
# Eliminar cache de Astro
rm -rf .astro
rm -rf node_modules/.vite

# O en Windows:
rmdir /s /q .astro
rmdir /s /q node_modules\.vite
```

### **Paso 3: Reiniciar el Servidor**

```powershell
npm run dev
```

## 🎉 Resultado Esperado

Después de reiniciar, deberías ver:
- ✅ Tour de onboarding funcionando
- ✅ Categorías con imágenes
- ✅ Feed de productos cargando
- ✅ Sin errores 500

## 🛠️ Si Sigue Sin Funcionar

### Opción A: Reinicio Completo

```powershell
# 1. Detener servidor (Ctrl+C)

# 2. Reinstalar dependencias
rm -rf node_modules
npm install

# 3. Limpiar todo
rm -rf .astro
rm -rf dist

# 4. Reiniciar
npm run dev
```

### Opción B: Verificar Variables de Entorno

```powershell
# Verificar que .env existe y tiene las claves correctas
cat .env

# Debe contener:
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📋 Cambios Aplicados

### 1. `api/feed/products.ts`
- ✅ Agregado filtro por categoría
- ✅ Corregida sintaxis de Supabase para JOIN

### 2. `TourManager.ts`
- ✅ Eliminada carga dinámica de CSS obsoleto
- ✅ Estilos ahora en `global.css`

### 3. `CategoryCards.tsx`
- ✅ Actualizadas rutas de imágenes reales
- ✅ Todas las categorías con imágenes existentes

## 🎓 Tour de Onboarding

Para probar el tour después del reinicio:

1. Abre la página principal (`/`)
2. Si no aparece automáticamente, limpia localStorage:
   ```javascript
   localStorage.removeItem('town_tour_v1_done')
   location.reload()
   ```
3. O ve a `/perfil` y haz click en "Ver guía de uso"

## 🌐 En Producción (Vercel)

Si funciona en producción pero no en desarrollo:
1. Los cambios están desplegados correctamente
2. Solo necesitas reiniciar tu servidor local
3. No es necesario hacer nada en Vercel

---

**💡 Tip**: Siempre que modifiques archivos en `src/pages/api/` o archivos importados por componentes del servidor, reinicia el servidor de desarrollo.

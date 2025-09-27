# 🚀 Instrucciones para Commit y Deploy

## 📋 **Comandos para Ejecutar:**

```bash
# 1. Agregar todos los cambios
git add .

# 2. Hacer commit con mensaje descriptivo
git commit -m "perf: optimizar rendimiento y solucionar carga infinita

- Corregido bucle infinito en ProductCarousel useEffect
- Optimizado consultas de base de datos (select vs include)
- Reducido cantidad de productos para mejor rendimiento
- Deshabilitado temporalmente getCategoryBannersData()
- Corregido class → className en SimpleCategoryBanners
- Eliminado polling innecesario en CartWidget
- Agregados archivos de documentación"

# 3. Push a GitHub
git push origin main
```

## ✅ **Cambios Incluidos:**

1. **Optimizaciones de Rendimiento:**
   - ProductCarousel: eliminado bucle infinito
   - Consultas DB: usando `select` en lugar de `include`
   - Reducido productos: 12→8 (index), 8→6 (catalogo)

2. **Correcciones de Bugs:**
   - class → className en SimpleCategoryBanners
   - Eliminado polling cada 30s en CartWidget
   - Deshabilitado getCategoryBannersData() temporalmente

3. **Archivos de Documentación:**
   - VERCEL-FIX.md (solución para DATABASE_URL)
   - DEBUG-LOADING.md (diagnóstico de problemas)
   - COMMIT-INSTRUCTIONS.md (este archivo)

## 🎯 **Resultado Esperado:**
- Vercel detectará el push y hará deploy automático
- La página cargará más rápido (sin carga infinita)
- Se solucionará el problema de rendimiento

## ⚠️ **Importante:**
Después del push, ve a Vercel y configura la variable `DATABASE_URL` si aún no lo has hecho.










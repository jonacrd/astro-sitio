# 🚀 Instrucciones para Probar el Color Rosa

## ⚡ Opción 1: Verificación Rápida (30 segundos)

### Abrir archivo de verificación:
```
📁 astro-sitio/verificar-color-rosa.html
```

**Cómo:**
1. Abre el archivo `verificar-color-rosa.html` en tu navegador
2. Verás todos los componentes con el nuevo color rosa
3. Si todo se ve rosa (#FF4D6A), ✅ **¡funciona perfecto!**

---

## 🌐 Opción 2: Ejecutar la Aplicación (2 minutos)

### Paso 1: Iniciar servidor de desarrollo

```bash
cd astro-sitio
npm run dev
```

### Paso 2: Abrir en navegador

```
http://localhost:4321
```

### Paso 3: Verificar en estas páginas

**Feed:**
- ✅ Botones "Agregar al carrito" → Rosa
- ✅ Botones "Ver tienda" → Rosa (si aplica)
- ✅ Hovers de botones → Rosa más oscuro

**Categorías:**
- ✅ Botones de categorías → Rosa
- ✅ Hovers → Rosa más oscuro

**Dashboard (si eres vendedor):**
- ✅ Botón "Crear producto" → Rosa
- ✅ Botón "Guardar" → Rosa
- ✅ Botones de acción → Rosa

**Perfil:**
- ✅ Botones de edición → Rosa
- ✅ Botones de acción → Rosa

---

## 🔍 Opción 3: Inspeccionar con DevTools (1 minuto)

### Paso 1: Abrir DevTools
- **Chrome/Edge:** F12 o Ctrl+Shift+I
- **Firefox:** F12 o Ctrl+Shift+C

### Paso 2: Seleccionar cualquier botón
1. Click derecho en un botón → Inspeccionar
2. En la pestaña "Computed" o "Estilos"
3. Buscar `background-color`
4. Verificar que sea: `rgb(255, 77, 106)` o `#FF4D6A`

### ✅ Si es así, ¡el color está aplicado correctamente!

---

## 📊 Qué Deberías Ver

### Antes (Azul):
```
Botones: 🔵 Azul #2563EB
Hovers: 🔵 Azul más oscuro
```

### Después (Rosa Towny):
```
Botones: 🌸 Rosa #FF4D6A
Hovers: 🌸 Rosa más oscuro #E6435D
Active: 🌸 Rosa oscuro #CC3952
```

---

## 🎨 Colores de Referencia

| Color | Hex | Cuándo se usa |
|-------|-----|---------------|
| Rosa Principal | `#FF4D6A` | Botones normales |
| Rosa Hover | `#E6435D` | Al pasar el mouse |
| Rosa Active | `#CC3952` | Al hacer click |
| Rosa Light | `#FF6B82` | Fondos suaves |
| Rosa Dark | `#B33449` | Gradientes |

---

## 🐛 Si Algo No Funciona

### El color no cambió:
1. **Limpia caché del navegador:**
   - Chrome: Ctrl+Shift+Delete
   - Selecciona "Imágenes y archivos en caché"
   - Click en "Borrar datos"

2. **Reinicia el servidor:**
   ```bash
   # Detener (Ctrl+C)
   # Iniciar de nuevo
   npm run dev
   ```

3. **Verifica que los archivos se guardaron:**
   - `src/styles/towny-pink-theme.css` debe existir
   - `src/styles/global.css` debe tener el import

### Solo algunos botones cambiaron:
Esto es normal si son botones personalizados. El archivo `towny-pink-theme.css` cubre la mayoría, pero algunos componentes pueden necesitar actualización manual.

### El color es diferente:
Verifica en DevTools el color exacto:
- Debería ser: `#FF4D6A` o `rgb(255, 77, 106)`
- Si es otro, revisa los archivos modificados

---

## 📁 Archivos a Revisar (si hay problemas)

```
astro-sitio/
├── src/
│   └── styles/
│       ├── towny-pink-theme.css    ← PRINCIPAL (debe existir)
│       ├── global.css              ← Debe importar towny-pink-theme
│       ├── town-theme.css          ← Variable --color-accent
│       └── towny-system.css        ← Botones Towny
└── tailwind.config.mjs             ← Color accent en config
```

---

## ✅ Checklist de Verificación

- [ ] Archivo `towny-pink-theme.css` existe
- [ ] `global.css` importa el tema rosa
- [ ] Servidor de desarrollo corriendo sin errores
- [ ] Botones del feed son rosa
- [ ] Botones de categorías son rosa
- [ ] Botones de dashboard son rosa
- [ ] Hovers funcionan (rosa más oscuro)
- [ ] No hay errores en consola del navegador

---

## 🎉 Si Todo Funciona

¡Felicidades! Todos los botones ahora usan el color rosa fuerte de Towny (#FF4D6A).

**Próximos pasos:**
1. Hacer commit de los cambios
2. Hacer deploy a producción
3. Disfrutar del nuevo diseño 🎨

---

## 📝 Comandos Útiles

```bash
# Iniciar desarrollo
npm run dev

# Build para producción
npm run build

# Ver archivos modificados
git status

# Ver diferencias
git diff src/styles/
```

---

## 📞 Ayuda Adicional

Si tienes problemas, revisa:
- `CAMBIOS_COLOR_ROSA_TOWNY.md` → Documentación completa
- `RESUMEN_CAMBIOS_ROSA.txt` → Resumen rápido
- `verificar-color-rosa.html` → Página de prueba visual

---

**Fecha de implementación:** ${new Date().toLocaleDateString('es-ES')}  
**Color aplicado:** #FF4D6A (Rosa Towny) 🌸


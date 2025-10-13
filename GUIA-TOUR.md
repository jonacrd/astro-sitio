# 🎓 Guía del Tour de Onboarding

## 🚀 ¿Por qué no se ve el tour?

### **Razón 1: Tour ya completado** ✅
El tour solo se muestra **una vez** por usuario. Si ya lo completaste o lo omitiste, no volverá a aparecer automáticamente.

### **Razón 2: Servidor no reiniciado** ⚠️
Los cambios en los estilos del tour requieren reiniciar el servidor de desarrollo.

### **Razón 3: Caché del navegador** 🔄
El navegador puede estar usando versiones antiguas de los archivos CSS.

---

## 🔧 Soluciones Rápidas

### **Opción 1: Página de Debug** 🛠️

1. Ve a: `http://localhost:4321/tour-debug`
2. Haz click en "🔄 Resetear Tour"
3. Serás redirigido a la página principal con el tour activado

### **Opción 2: Consola del Navegador** 💻

1. Abre la consola del navegador (F12)
2. Ejecuta:
   ```javascript
   localStorage.removeItem('town_tour_v1_done');
   location.reload();
   ```

### **Opción 3: Desde el Perfil** 👤

1. Ve a `/perfil`
2. Busca la sección "Ayuda y Configuración"
3. Haz click en "Ver guía de uso"

### **Opción 4: Forzar Inicio** ⚡

1. Abre la consola (F12)
2. Ejecuta:
   ```javascript
   import('../lib/tour/TourManager').then(({ startTour }) => startTour());
   ```

---

## 🎯 Verificar que el Tour Funciona

### **Paso 1: Verificar Estilos**

Abre la consola y ejecuta:
```javascript
// Verificar que los estilos están cargados
const hasStyles = getComputedStyle(document.documentElement).getPropertyValue('--spotlight-x');
console.log('Estilos del tour:', hasStyles ? 'Cargados ✅' : 'No cargados ❌');
```

### **Paso 2: Verificar TourManager**

```javascript
// Verificar que el TourManager está disponible
import('../lib/tour/TourManager').then(() => {
  console.log('✅ TourManager cargado correctamente');
}).catch(err => {
  console.error('❌ Error cargando TourManager:', err);
});
```

### **Paso 3: Verificar LocalStorage**

```javascript
// Ver si el tour está marcado como completado
const completed = localStorage.getItem('town_tour_v1_done');
console.log('Tour completado:', completed);
```

---

## 🎨 Estilos del Tour

Los estilos del tour están en:
- `src/styles/tour.css` - Estilos del tour y spotlight
- `src/styles/towny-system.css` - Estilos de Towny

**Se importan automáticamente** en `src/styles/global.css`:
```css
@import './tour.css';
@import './towny-system.css';
```

---

## 📋 Pasos del Tour

1. **Bienvenida** - Towny saludando
2. **Búsqueda** - Cómo buscar productos
3. **Categorías** - Explorar categorías
4. **Productos** - Ver productos
5. **Agregar al Carrito** - Agregar productos
6. **Icono del Carrito** - Abrir carrito
7. **Carrito** - Revisar carrito
8. **Checkout** - Finalizar compra
9. **Dirección** - Agregar dirección
10. **Pago** - Método de pago
11. **Perfil** - Opciones de perfil

---

## 🐛 Solución de Problemas

### **El modal de bienvenida no aparece**

**Causa**: El tour solo aparece en la página principal (`/`)

**Solución**:
1. Asegúrate de estar en `http://localhost:4321/`
2. No en `/index` o `/home`

### **Los estilos no se ven**

**Causa**: Servidor no reiniciado o caché

**Solución**:
1. Reinicia el servidor:
   ```powershell
   # Ctrl+C para detener
   npm run dev
   ```
2. Limpia caché del navegador (Ctrl+Shift+R)

### **Error en consola: "Cannot find module"**

**Causa**: Rutas de importación incorrectas

**Solución**:
1. Verifica que existen los archivos:
   - `src/lib/tour/TourManager.ts`
   - `src/lib/tour/createTour.ts`
   - `src/lib/tour/types.ts`
   - `src/lib/tour/spotlight.ts`

### **Towny no aparece (imagen invisible)**

**Causa**: Rutas de imágenes incorrectas

**Solución**:
1. Verifica que existen las imágenes en:
   - `public/towny/towny_saludando.png`
   - `public/towny/towny_consigue_objetivo.png`
   - etc.

---

## 🎭 Personalizar el Tour

### **Cambiar imágenes de Towny**

Edita `src/styles/tour.css`:
```css
.towny-slot--welcome {
  background-image: url('/towny/tu-imagen.png');
}
```

### **Agregar nuevos pasos**

Edita `src/lib/tour/TourManager.ts`:
```typescript
const tourSteps: TourStep[] = [
  // ... pasos existentes
  {
    id: 'nuevo-paso',
    selector: '.tu-selector',
    title: 'Título del paso',
    content: 'Descripción del paso',
    townySlotClass: 'towny-slot--nuevo'
  }
];
```

### **Cambiar posición de Towny**

Edita `src/lib/tour/createTour.ts`:
```typescript
const positionMap: Record<string, string> = {
  'nuevo-paso': 'towny--tl', // top-left
  // Opciones: towny--tl, towny--tr, towny--bl, towny--br
};
```

---

## 📱 Responsive

El tour funciona en:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

**Controles**:
- **Botones**: Siguiente, Atrás, Omitir paso, Omitir guía
- **Teclado**: Flechas para navegar, Escape para cerrar
- **Touch**: Tap para interactuar

---

## 🔗 Enlaces Útiles

- **Página de Debug**: `/tour-debug`
- **Página de Demo de Towny**: `/towny-demo`
- **Perfil (para relanzar)**: `/perfil`

---

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Servidor de desarrollo reiniciado
- [ ] Navegador con caché limpia (Ctrl+Shift+R)
- [ ] Estás en la página principal (`/`)
- [ ] LocalStorage limpio (`town_tour_v1_done` eliminado)
- [ ] Consola sin errores de JavaScript
- [ ] Archivos de tour existen en `src/lib/tour/`
- [ ] Imágenes de Towny existen en `public/towny/`
- [ ] Estilos importados en `global.css`

---

**¡Después de verificar todo esto, el tour debería funcionar perfectamente!** 🎉



# 🎯 Town Tour - Sistema de Onboarding

Sistema de guía interactiva para nuevos usuarios de Town, inspirado en las mejores prácticas de UX de apps como Uber Eats y Rappi.

## 📋 Características

- ✅ **Solo una vez por usuario** - Persistencia en localStorage
- ✅ **Spotlight dinámico** - Enfoque en elementos específicos
- ✅ **Navegación completa** - Siguiente, Atrás, Omitir paso, Omitir guía
- ✅ **Relanzar desde perfil** - Botón "Ver guía" en configuración
- ✅ **100% responsive** - Funciona en móvil y desktop
- ✅ **Accesible** - ARIA roles, navegación por teclado
- ✅ **No invasivo** - No modifica DOM existente
- ✅ **Placeholders para Towny** - Listos para imágenes PNG

## 🏗️ Arquitectura

```
src/lib/tour/
├── types.ts          # Interfaces TypeScript
├── createTour.ts     # Motor del tour (spotlight + navegación)
├── TourManager.ts    # Orquestador principal
├── tour.css          # Estilos aislados
└── README.md         # Esta documentación
```

## 🚀 Uso Básico

### Inicialización Automática
El tour se inicializa automáticamente en `BaseLayout.astro`:

```typescript
import { initTour } from '../lib/tour/TourManager';
initTour(); // Se ejecuta al cargar la página
```

### Relanzar desde Perfil
En `/perfil` hay un botón "Ver guía de uso" que ejecuta:

```typescript
import { restartTour } from '../lib/tour/TourManager';
restartTour(); // Fuerza el inicio del tour
```

## 🎨 Personalización

### Agregar/Quitar Pasos

Edita el array `tourSteps` en `TourManager.ts`:

```typescript
const tourSteps: TourStep[] = [
  {
    id: 'nuevo-paso',
    selector: '.mi-elemento',
    title: 'Mi Nuevo Paso',
    content: 'Descripción del paso',
    townySlotClass: 'towny-slot--nuevo'
  }
  // ... más pasos
];
```

### Selectores Seguros

El sistema usa selectores múltiples para mayor compatibilidad:

```typescript
{
  selector: '[data-test="search-bar"], input[type="search"], .search-input, [placeholder*="buscar"]'
}
```

Si un selector no existe, el paso se omite automáticamente.

### Posicionamiento del Panel

```typescript
{
  position: 'top' | 'bottom' | 'left' | 'right' | 'center',
  offset: 16 // píxeles de separación
}
```

## 🖼️ Imágenes de Towny

### Placeholders Actuales

Cada paso tiene un placeholder con emoji:

```css
.towny-slot--welcome::after { content: '👋' !important; }
.towny-slot--search::after { content: '🔍' !important; }
.towny-slot--categories::after { content: '📂' !important; }
.towny-slot--product::after { content: '📦' !important; }
.towny-slot--add::after { content: '➕' !important; }
.towny-slot--carticon::after { content: '🛒' !important; }
.towny-slot--cart::after { content: '📋' !important; }
.towny-slot--checkout::after { content: '💳' !important; }
.towny-slot--address::after { content: '📍' !important; }
.towny-slot--pay::after { content: '✅' !important; }
.towny-slot--profile::after { content: '👤' !important; }
.towny-slot--success::after { content: '🎉' !important; }
```

### Reemplazar con PNGs

Para usar imágenes reales de Towny, reemplaza en `tour.css`:

```css
.towny-slot--search {
  background-image: url('/assets/towny/search.png') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}

.towny-slot--search::after {
  display: none !important; /* Ocultar emoji */
}
```

### Tamaños Recomendados

- **Placeholder actual**: 60x60px
- **PNG recomendado**: 120x120px (2x para retina)
- **Formato**: PNG con transparencia
- **Estilo**: Ilustración plana, colores vibrantes

## 🎛️ Configuración Avanzada

### Opciones del Tour

```typescript
const tourInstance = createTour(steps, {
  overlayOpacity: 0.7,        // Opacidad del overlay
  spotlightPadding: 8,        // Padding del spotlight
  animationDuration: 300,     // Duración de animaciones
  allowKeyboardNavigation: true,  // Navegación por teclado
  allowClickOutside: false    // Click fuera para cerrar
}, callbacks);
```

### Callbacks Disponibles

```typescript
const callbacks = {
  onStart: () => console.log('Tour iniciado'),
  onStep: (step, index) => console.log(`Paso ${index}: ${step.title}`),
  onComplete: () => console.log('Tour completado'),
  onSkip: () => console.log('Tour omitido'),
  onError: (error) => console.error('Error:', error)
};
```

## 🔧 API Pública

### Funciones Principales

```typescript
import { 
  initTour, 
  startTour, 
  restartTour, 
  isTourCompleted 
} from '../lib/tour/TourManager';

// Inicializar (automático)
initTour();

// Iniciar si no se ha completado
startTour();

// Forzar inicio (desde perfil)
restartTour();

// Verificar estado
const completed = isTourCompleted();
```

### Persistencia

- **Clave**: `town_tour_v1_done`
- **Valor**: `'true'` cuando se completa
- **Reset**: `localStorage.removeItem('town_tour_v1_done')`

## 📱 Responsive

### Breakpoints

- **Móvil** (< 640px): Panel de ancho completo, botones apilados
- **Tablet** (640px - 1024px): Panel centrado, layout híbrido
- **Desktop** (> 1024px): Panel flotante, layout horizontal

### Safe Areas

```css
@supports (padding: max(0px)) {
  .town-tour-panel {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
```

## ♿ Accesibilidad

### ARIA

- `role="dialog"` en el panel
- `aria-live="polite"` para contenido dinámico
- `aria-label` en botones de acción

### Navegación por Teclado

- **Enter/→**: Siguiente paso
- **←**: Paso anterior
- **Escape**: Cerrar tour
- **Tab**: Navegación entre botones

### Focus Management

- Auto-focus en botón "Siguiente"
- Focus trap durante el tour
- Restauración de focus al cerrar

## 🐛 Debugging

### Logs de Consola

```typescript
// Habilitar logs detallados
console.log('🎯 Tour iniciado');
console.log('🎯 Paso 1: Busca lo que quieras');
console.log('🎯 Tour completado');
```

### Verificar Estado

```javascript
// En consola del navegador
localStorage.getItem('town_tour_v1_done'); // 'true' o null
```

### Reset Manual

```javascript
// Resetear tour para testing
localStorage.removeItem('town_tour_v1_done');
location.reload();
```

## 🚨 Troubleshooting

### Tour No Aparece

1. Verificar que `initTour()` se ejecute
2. Comprobar que no esté marcado como completado
3. Revisar errores en consola

### Elementos No Encontrados

1. Verificar selectores en `tourSteps`
2. Comprobar que los elementos existan en el DOM
3. Usar selectores más específicos

### Problemas de Estilo

1. Verificar que `tour.css` se cargue
2. Comprobar z-index (debe ser 9999+)
3. Revisar conflictos con estilos existentes

## 🔄 Actualizaciones

### Versión Actual: v1

- **Clave de persistencia**: `town_tour_v1_done`
- **Para v2**: Cambiar a `town_tour_v2_done`

### Migración de Versiones

```typescript
// Detectar versión anterior y migrar
const oldVersion = localStorage.getItem('town_tour_done');
if (oldVersion) {
  localStorage.setItem('town_tour_v1_done', 'true');
  localStorage.removeItem('town_tour_done');
}
```

## 📊 Métricas Sugeridas

Para analizar la efectividad del tour:

```typescript
// Eventos a trackear
- tour_started
- tour_step_viewed (con step_id)
- tour_completed
- tour_skipped
- tour_restarted_from_profile
```

## 🤝 Contribución

### Agregar Nuevo Paso

1. Añadir entrada en `tourSteps`
2. Crear placeholder en CSS
3. Probar en móvil y desktop
4. Verificar accesibilidad

### Modificar Estilos

1. Usar clase raíz `.town-tour-*`
2. Mantener `!important` para aislamiento
3. Probar en diferentes dispositivos
4. Verificar contraste de colores

---

**Nota**: Este sistema está diseñado para ser completamente no invasivo. No modifica el DOM existente ni interfiere con la funcionalidad de la aplicación.


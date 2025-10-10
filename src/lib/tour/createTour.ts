import type { TourStep, TourOptions, TourCallbacks, TourInstance } from './types';
import { setSpotlightAtRect, calculatePanelPosition, getElementRect, scrollToElement, applySafeAreas } from './spotlight';

export function createTour(
  steps: TourStep[],
  options: TourOptions = {},
  callbacks: TourCallbacks = {}
): TourInstance {
  const defaultOptions: Required<TourOptions> = {
    overlayOpacity: 0.7,
    spotlightPadding: 8,
    animationDuration: 300,
    allowKeyboardNavigation: true,
    allowClickOutside: false,
  };

  const opts = { ...defaultOptions, ...options };
  let currentStepIndex = 0;
  let isActive = false;
  let overlay: HTMLElement | null = null;
  let spotlight: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  let currentElement: HTMLElement | null = null;

  // Crear overlay y spotlight
  function createOverlay(): void {
    overlay = document.createElement('div');
    overlay.className = 'town-tour';
    
    // ESTILOS INLINE FORZADOS
    overlay.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      pointer-events: none !important;
    `;
    
    overlay.innerHTML = `
      <div class="town-tour__overlay" style="
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0, 0, 0, 0.6) !important;
        backdrop-filter: blur(4px) !important;
        pointer-events: auto !important;
        opacity: 1 !important;
      ">
        <div class="town-tour__mask" style="
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.6) !important;
          pointer-events: none !important;
        "></div>
      </div>
    `;

    spotlight = overlay.querySelector('.town-tour__mask') as HTMLElement;
    document.body.appendChild(overlay);
    
    console.log('✅ Overlay agregado con estilos inline');
  }

  // Crear panel de contenido
  function createPanel(): void {
    panel = document.createElement('div');
    panel.className = 'town-tour__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-live', 'polite');
    
    // ESTILOS INLINE FORZADOS - TEMA OSCURO
    panel.style.cssText = `
      position: absolute !important;
      max-width: 92vw !important;
      background: rgba(15, 23, 42, 0.95) !important;
      color: #f1f5f9 !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
      border-radius: 1rem !important;
      padding: 1.5rem !important;
      border: 1px solid rgba(59, 130, 246, 0.3) !important;
      backdrop-filter: blur(16px) !important;
      pointer-events: auto !important;
      z-index: 10000 !important;
      left: 16px !important;
      bottom: 100px !important;
    `;
    
    // Aplicar safe areas para dispositivos con notch
    applySafeAreas(panel);
    
    document.body.appendChild(panel);
    
    console.log('✅ Panel agregado con estilos inline');
  }


  // Determinar imagen de Towny según el paso
  function getTownyImage(step: TourStep): string {
    const imageMap: Record<string, string> = {
      'welcome': '/towny/towny_saludando.png',
      'search': '/towny/towny_consigue_objetivo.png',
      'categories': '/towny/towny_brazos_extendidos_feliz.png',
      'product-card': '/towny/towny_pulgar_arriba.png',
      'add-to-cart': '/towny/towny_operacion_exitosa.png',
      'cart-icon': '/towny/towny_logrado.png',
      'cart': '/towny/towny_estatico.png',
      'checkout': '/towny/towny_cara.png',
      'address': '/towny/towny_preocupado.png',
      'payment': '/towny/towny_operacion_exitosa.png',
      'profile': '/towny/towny_despedida.png'
    };
    
    return imageMap[step.id] || '/towny/towny_estatico.png';
  }

  // Renderizar contenido del panel
  function renderPanelContent(step: TourStep): void {
    if (!panel) return;

    const stepNumber = currentStepIndex + 1;
    const totalSteps = steps.length;

    panel.innerHTML = `
      <div class="town-tour__header" style="
        display: flex !important;
        align-items: center !important;
        gap: 1rem !important;
        margin-bottom: 1rem !important;
      ">
        ${step.townySlotClass ? `
          <div class="towny-slot ${step.townySlotClass}" style="
            width: 60px !important;
            height: 60px !important;
            background-image: url('${getTownyImage(step)}') !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            flex-shrink: 0 !important;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) !important;
          "></div>
        ` : ''}
        <h3 style="
          color: #f1f5f9 !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 0 !important;
        ">${step.title}</h3>
      </div>
      
      <div class="town-tour__content" style="
        color: #cbd5e1 !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        margin-bottom: 1.5rem !important;
      ">${step.content}</div>
      
      <div class="town-tour__actions" style="
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 0.5rem !important;
        justify-content: space-between !important;
      ">
        ${currentStepIndex > 0 ? `
          <button class="town-tour__btn town-tour__btn--ghost" data-action="previous" style="
            padding: 0.5rem 1rem !important;
            background: rgba(71, 85, 105, 0.8) !important;
            color: #e2e8f0 !important;
            border: 1px solid rgba(148, 163, 184, 0.3) !important;
            border-radius: 0.5rem !important;
            font-size: 0.875rem !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          ">← Atrás</button>
        ` : ''}
        <button class="town-tour__btn town-tour__btn--ghost" data-action="skip-step" style="
          padding: 0.5rem 1rem !important;
          background: rgba(71, 85, 105, 0.8) !important;
          color: #e2e8f0 !important;
          border: 1px solid rgba(148, 163, 184, 0.3) !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        ">Omitir paso</button>
        <button class="town-tour__btn town-tour__btn--ghost" data-action="skip" style="
          padding: 0.5rem 1rem !important;
          background: rgba(71, 85, 105, 0.8) !important;
          color: #e2e8f0 !important;
          border: 1px solid rgba(148, 163, 184, 0.3) !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        ">Omitir guía</button>
        <button class="town-tour__btn" data-action="next" autofocus style="
          padding: 0.5rem 1rem !important;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
          color: white !important;
          border: none !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
        ">
          ${currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>
    `;

    // Agregar event listeners
    panel.addEventListener('click', handlePanelClick);
  }

  // Manejar clicks en el panel
  function handlePanelClick(event: Event): void {
    const target = event.target as HTMLElement;
    const action = target.getAttribute('data-action');
    
    if (!action) return;

    switch (action) {
      case 'next':
        next();
        break;
      case 'previous':
        previous();
        break;
      case 'skip-step':
        skipStep();
        break;
      case 'skip':
        skip();
        break;
      default:
        if (target.classList.contains('town-tour-close')) {
          skip();
        }
    }
  }

  // Mostrar paso actual
  function showStep(index: number): void {
    if (index < 0 || index >= steps.length) return;

    currentStepIndex = index;
    const step = steps[currentStepIndex];

    // Buscar elemento con selectores más simples
    let foundElement = null;
    const selectors = step.selector.split(', ');
    
    for (const selector of selectors) {
      try {
        foundElement = document.querySelector(selector.trim());
        if (foundElement) break;
      } catch (e) {
        console.warn(`Tour: Selector inválido "${selector}"`);
        continue;
      }
    }
    
    currentElement = foundElement as HTMLElement;
    
    if (!currentElement && step.selector !== 'body') {
      console.warn(`Tour: Elemento no encontrado para selectores "${step.selector}", omitiendo paso`);
      if (index < steps.length - 1) {
        showStep(index + 1);
      } else {
        complete();
      }
      return;
    }

    // Si no hay elemento, usar body para spotlight centrado
    const targetElement = currentElement || document.body;

    // Scroll suave al elemento si es necesario
    if (currentElement && currentElement !== document.body) {
      scrollToElement(currentElement);
    }

    // Actualizar spotlight - SIEMPRE crear spotlight
    if (spotlight) {
      if (currentElement && currentElement !== document.body) {
        // Spotlight en elemento específico
        const rect = getElementRect(currentElement);
        setSpotlightAtRect(spotlight, rect, opts.spotlightPadding);
        console.log('🎯 Spotlight en elemento:', currentElement);
      } else {
        // Spotlight centrado para pasos generales
        spotlight.style.clipPath = 'circle(0px at 50% 50%)';
        spotlight.style.background = 'rgba(0, 0, 0, 0.6)';
        console.log('🎯 Spotlight centrado');
      }
    }

    // Calcular posición del panel - MÁS PEQUEÑO
    if (panel) {
      const rect = getElementRect(targetElement);
      const panelRect = panel.getBoundingClientRect();
      const position = calculatePanelPosition(
        rect,
        Math.min(panelRect.width || 320, 320), // Máximo 320px
        Math.min(panelRect.height || 200, 200), // Máximo 200px
        window.innerWidth,
        window.innerHeight
      );
      
      panel.style.left = `${position.left}px`;
      panel.style.top = `${position.top}px`;
      panel.style.maxWidth = '320px'; // Forzar tamaño máximo
    }

    // Renderizar contenido
    renderPanelContent(step);

    // Callback
    callbacks.onStep?.(step, index);
  }

  // Navegación
  function next(): void {
    if (currentStepIndex < steps.length - 1) {
      showStep(currentStepIndex + 1);
    } else {
      complete();
    }
  }

  function previous(): void {
    if (currentStepIndex > 0) {
      showStep(currentStepIndex - 1);
    }
  }

  function skipStep(): void {
    next();
  }

  function skip(): void {
    callbacks.onSkip?.();
    destroy();
  }

  function complete(): void {
    callbacks.onComplete?.();
    destroy();
  }

  // Iniciar tour
  function start(): void {
    console.log('🎬 createTour.start() llamado');
    
    if (isActive) {
      console.log('⚠️ Tour ya está activo');
      return;
    }
    
    isActive = true;
    console.log('✅ Tour marcado como activo');
    
    callbacks.onStart?.();
    console.log('✅ Callback onStart ejecutado');
    
    console.log('📦 Creando overlay...');
    createOverlay();
    console.log('✅ Overlay creado');
    
    console.log('📦 Creando panel...');
    createPanel();
    console.log('✅ Panel creado');
    
    console.log('📍 Mostrando paso 0...');
    showStep(0);

    // Keyboard navigation
    if (opts.allowKeyboardNavigation) {
      console.log('⌨️ Habilitando navegación por teclado');
      document.addEventListener('keydown', handleKeydown);
    }
    
    console.log('🎉 Tour completamente iniciado');
  }

  // Manejar teclado
  function handleKeydown(event: KeyboardEvent): void {
    if (!isActive) return;

    switch (event.key) {
      case 'Escape':
        skip();
        break;
      case 'ArrowRight':
      case 'Enter':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        previous();
        break;
    }
  }

  // Destruir tour
  function destroy(): void {
    isActive = false;
    
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    
    if (panel) {
      panel.remove();
      panel = null;
    }

    currentElement = null;
    document.removeEventListener('keydown', handleKeydown);
  }

  return {
    start,
    next,
    previous,
    skip,
    skipStep,
    destroy,
    getCurrentStep: () => currentStepIndex,
    getTotalSteps: () => steps.length,
  };
}

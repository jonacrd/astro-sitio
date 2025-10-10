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
    overlay.innerHTML = `
      <div class="town-tour__overlay">
        <div class="town-tour__mask"></div>
      </div>
    `;

    spotlight = overlay.querySelector('.town-tour__mask') as HTMLElement;
    document.body.appendChild(overlay);
  }

  // Crear panel de contenido
  function createPanel(): void {
    panel = document.createElement('div');
    panel.className = 'town-tour__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-live', 'polite');
    
    // Aplicar safe areas para dispositivos con notch
    applySafeAreas(panel);
    
    document.body.appendChild(panel);
  }


  // Determinar posición de Towny según el paso
  function getTownyPosition(step: TourStep): string {
    // Posiciones específicas para cada paso
    const positionMap: Record<string, string> = {
      'welcome': 'towny--br',
      'search': 'towny--bl',
      'categories': 'towny--tr',
      'product-card': 'towny--bl',
      'add-to-cart': 'towny--br',
      'cart-icon': 'towny--tl',
      'cart': 'towny--tr',
      'checkout': 'towny--br',
      'address': 'towny--bl',
      'payment': 'towny--tr',
      'profile': 'towny--br'
    };
    
    return positionMap[step.id] || 'towny--br';
  }

  // Renderizar contenido del panel
  function renderPanelContent(step: TourStep): void {
    if (!panel) return;

    const stepNumber = currentStepIndex + 1;
    const totalSteps = steps.length;

    panel.innerHTML = `
      <div class="town-tour__title">${step.title}</div>
      <div class="town-tour__content">${step.content}</div>
      
      ${step.townySlotClass ? `
        <div class="towny-slot ${step.townySlotClass} ${getTownyPosition(step)}"></div>
      ` : ''}
      
      <div class="town-tour__actions">
        ${currentStepIndex > 0 ? '<button class="town-tour__btn town-tour__btn--ghost" data-action="previous">Atrás</button>' : ''}
        <button class="town-tour__btn town-tour__btn--ghost" data-action="skip-step">Omitir paso</button>
        <button class="town-tour__btn town-tour__btn--ghost" data-action="skip">Omitir guía</button>
        <button class="town-tour__btn" data-action="next" autofocus>
          ${currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
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

    // Buscar elemento
    currentElement = document.querySelector(step.selector) as HTMLElement;
    
    if (!currentElement && step.selector !== 'body') {
      console.warn(`Tour: Elemento no encontrado para selector "${step.selector}", omitiendo paso`);
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

    // Actualizar spotlight usando las nuevas utilidades
    if (spotlight && currentElement) {
      const rect = getElementRect(currentElement);
      setSpotlightAtRect(spotlight, rect, opts.spotlightPadding);
    }

    // Calcular posición del panel
    if (panel) {
      const rect = getElementRect(targetElement);
      const panelRect = panel.getBoundingClientRect();
      const position = calculatePanelPosition(
        rect,
        panelRect.width || 400,
        panelRect.height || 200,
        window.innerWidth,
        window.innerHeight
      );
      
      panel.style.left = `${position.left}px`;
      panel.style.top = `${position.top}px`;
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
    if (isActive) return;
    
    isActive = true;
    callbacks.onStart?.();
    
    createOverlay();
    createPanel();
    showStep(0);

    // Keyboard navigation
    if (opts.allowKeyboardNavigation) {
      document.addEventListener('keydown', handleKeydown);
    }
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

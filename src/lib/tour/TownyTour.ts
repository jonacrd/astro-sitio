import type { TourStep, TourOptions, TourCallbacks, TourInstance } from './types';

export function createTownyTour(
  steps: TourStep[],
  options: TourOptions = {},
  callbacks: TourCallbacks = {}
): TourInstance {
  const defaultOptions: Required<TourOptions> = {
    overlayOpacity: 0.8,
    spotlightPadding: 12,
    animationDuration: 300,
    allowKeyboardNavigation: true,
    allowClickOutside: false,
  };

  const opts = { ...defaultOptions, ...options };
  let currentStepIndex = 0;
  let isActive = false;
  let overlay: HTMLElement | null = null;
  let spotlight: HTMLElement | null = null;
  let townyMessage: HTMLElement | null = null;
  let currentElement: HTMLElement | null = null;

  // Crear overlay con spotlight dinámico
  function createOverlay(): void {
    overlay = document.createElement('div');
    overlay.className = 'towny-tour-overlay';
    
    overlay.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      pointer-events: none !important;
    `;
    
    // Crear máscara que oscurece todo
    spotlight = document.createElement('div');
    spotlight.className = 'towny-tour-spotlight';
    spotlight.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.7) !important;
      pointer-events: none !important;
      transition: all 0.3s ease !important;
      backdrop-filter: blur(2px) !important;
    `;
    
    overlay.appendChild(spotlight);
    document.body.appendChild(overlay);
    
    console.log('✅ Overlay con spotlight dinámico creado');
  }

  // Crear mensaje de Towny integrado (Towny + mensaje en un solo componente)
  function createTownyMessage(): void {
    townyMessage = document.createElement('div');
    townyMessage.className = 'towny-tour-message';
    townyMessage.style.cssText = `
      position: fixed !important;
      z-index: 10001 !important;
      pointer-events: auto !important;
      max-width: calc(100vw - 2rem) !important;
      width: 90vw !important;
      background: rgba(255, 255, 255, 0.95) !important;
      color: #1f2937 !important;
      border-radius: 1.5rem !important;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      transition: all 0.3s ease !important;
      opacity: 0 !important;
      transform: scale(0.9) !important;
      overflow: hidden !important;
    `;
    
    document.body.appendChild(townyMessage);
    console.log('✅ Mensaje de Towny integrado creado');
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

  // Posicionar mensaje de Towny según el elemento objetivo
  function positionTownyMessage(step: TourStep, element: HTMLElement | null): { left: string; top: string } {
    const isMobile = window.innerWidth < 768;
    
    if (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      
      // Posicionamiento especial para elementos específicos
      if (step.id === 'search') {
        // Para la barra de búsqueda, mensaje arriba
        return {
          left: '50%',
          top: `${Math.max(rect.top - 200, 20)}px`
        };
      }
      
      // Posicionar el mensaje cerca del elemento
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      
      if (elementTop > window.innerHeight / 2) {
        // Elemento en la mitad inferior - mensaje arriba
        return {
          left: '50%',
          top: `${Math.max(elementTop - 250, 20)}px`
        };
      } else {
        // Elemento en la mitad superior - mensaje abajo
        return {
          left: '50%',
          top: `${Math.min(elementBottom + 20, window.innerHeight - 300)}px`
        };
      }
    }
    
    // Posiciones por defecto - centradas
    const defaultPositions: Record<string, { left: string; top: string }> = {
      'welcome': { left: '50%', top: '50%' },
      'search': { left: '50%', top: '40%' },
      'categories': { left: '50%', top: '50%' },
      'product-card': { left: '50%', top: '50%' },
      'add-to-cart': { left: '50%', top: '50%' },
      'cart-icon': { left: '50%', top: '30%' },
      'cart': { left: '50%', top: '50%' },
      'checkout': { left: '50%', top: '50%' },
      'address': { left: '50%', top: '50%' },
      'payment': { left: '50%', top: '50%' },
      'profile': { left: '50%', top: '50%' }
    };
    
    return defaultPositions[step.id] || { left: '50%', top: '50%' };
  }

  // Actualizar spotlight para enfocar elemento específico
  function updateSpotlight(element: HTMLElement | null): void {
    if (!spotlight || !element || element === document.body) {
      spotlight!.style.clipPath = 'none';
      spotlight!.style.background = 'rgba(0, 0, 0, 0.7)';
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = opts.spotlightPadding;
    
    // Crear máscara circular para el elemento
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 2 + padding;
    
    // Aplicar brillo al elemento
    element.style.filter = 'brightness(1.2) drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))';
    element.style.transform = 'scale(1.02)';
    element.style.transition = 'all 0.3s ease';
    element.style.zIndex = '9999';
    
    // Crear spotlight con máscara
    spotlight.style.clipPath = `circle(${radius}px at ${centerX}px ${centerY}px)`;
    spotlight.style.background = 'rgba(0, 0, 0, 0.5)';
  }

  // Limpiar efectos del elemento
  function clearElementEffects(): void {
    if (currentElement && currentElement !== document.body) {
      currentElement.style.filter = '';
      currentElement.style.transform = '';
      currentElement.style.transition = '';
      currentElement.style.zIndex = '';
    }
  }

  // Mostrar paso del tour
  function showStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    
    const step = steps[stepIndex];
    currentStepIndex = stepIndex;
    
    console.log(`🎯 Mostrando paso ${stepIndex + 1}/${steps.length}: ${step.id}`);
    
    // Limpiar efectos del elemento anterior
    clearElementEffects();
    
    // Encontrar elemento objetivo
    currentElement = step.target ? document.querySelector(step.target) as HTMLElement : null;
    
    // Actualizar spotlight
    updateSpotlight(currentElement);
    
    // Posicionar mensaje de Towny
    const messagePos = positionTownyMessage(step, currentElement);
    
    if (townyMessage) {
      townyMessage.style.left = messagePos.left;
      townyMessage.style.top = messagePos.top;
      townyMessage.style.transform = 'translateX(-50%) scale(1)';
      townyMessage.style.opacity = '1';
      
      // Ajustar para móvil
      if (window.innerWidth < 768) {
        townyMessage.style.left = '50%';
        townyMessage.style.width = 'calc(100vw - 2rem)';
        townyMessage.style.maxWidth = 'none';
      }

      // Crear contenido integrado (Towny + mensaje)
      townyMessage.innerHTML = `
        <!-- Header con Towny y título -->
        <div style="
          display: flex !important;
          align-items: center !important;
          gap: 1rem !important;
          padding: 1.5rem 1.5rem 1rem 1.5rem !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
        ">
          <!-- Towny Character -->
          <div style="
            width: 80px !important;
            height: 80px !important;
            background-image: url('${getTownyImage(step)}') !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            flex-shrink: 0 !important;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) !important;
          "></div>
          
          <!-- Título -->
          <div style="
            font-weight: 700 !important;
            font-size: 1.2rem !important;
            color: #1f2937 !important;
            line-height: 1.3 !important;
            flex: 1 !important;
          ">${step.title}</div>
        </div>
        
        <!-- Contenido del mensaje -->
        <div style="
          padding: 1rem 1.5rem !important;
          font-size: 0.95rem !important;
          line-height: 1.5 !important;
          color: #374151 !important;
          word-wrap: break-word !important;
        ">${step.content}</div>
        
        <!-- Botones de acción -->
        <div style="
          display: flex !important;
          gap: 0.5rem !important;
          justify-content: flex-end !important;
          padding: 1rem 1.5rem 1.5rem 1.5rem !important;
          border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
        ">
          ${currentStepIndex > 0 ? `
            <button data-action="previous" style="
              padding: 0.5rem 1rem !important;
              background: rgba(107, 114, 128, 0.1) !important;
              color: #6b7280 !important;
              border: 1px solid rgba(107, 114, 128, 0.2) !important;
              border-radius: 0.5rem !important;
              font-size: 0.875rem !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
              flex-shrink: 0 !important;
            ">← Atrás</button>
          ` : ''}
          <button data-action="skip" style="
            padding: 0.5rem 1rem !important;
            background: rgba(107, 114, 128, 0.1) !important;
            color: #6b7280 !important;
            border: 1px solid rgba(107, 114, 128, 0.2) !important;
            border-radius: 0.5rem !important;
            font-size: 0.875rem !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            flex-shrink: 0 !important;
          ">Omitir</button>
          <button data-action="next" style="
            padding: 0.5rem 1.5rem !important;
            background: linear-gradient(135deg, #ec4899, #be185d) !important;
            color: white !important;
            border: none !important;
            border-radius: 0.5rem !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            flex-shrink: 0 !important;
            box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3) !important;
          ">Siguiente →</button>
        </div>
      `;

      // Agregar event listeners a los botones
      townyMessage.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');
        
        if (action === 'next') {
          nextStep();
        } else if (action === 'previous') {
          previousStep();
        } else if (action === 'skip') {
          skipTour();
        }
      });
    }
    
    // Llamar callback
    if (callbacks.onStepChange) {
      callbacks.onStepChange(currentStepIndex, step);
    }
  }

  // Siguiente paso
  function nextStep(): void {
    if (currentStepIndex < steps.length - 1) {
      showStep(currentStepIndex + 1);
    } else {
      completeTour();
    }
  }

  // Paso anterior
  function previousStep(): void {
    if (currentStepIndex > 0) {
      showStep(currentStepIndex - 1);
    }
  }

  // Omitir tour
  function skipTour(): void {
    completeTour();
    if (callbacks.onSkip) {
      callbacks.onSkip();
    }
  }

  // Completar tour
  function completeTour(): void {
    if (callbacks.onComplete) {
      callbacks.onComplete();
    }
    destroy();
  }

  // Destruir tour
  function destroy(): void {
    clearElementEffects();
    
    if (overlay) {
      document.body.removeChild(overlay);
      overlay = null;
    }
    
    if (townyMessage) {
      document.body.removeChild(townyMessage);
      townyMessage = null;
    }
    
    spotlight = null;
    currentElement = null;
    isActive = false;
    
    console.log('✅ Tour destruido');
  }

  // Iniciar tour
  function start(): void {
    if (isActive) return;
    
    isActive = true;
    createOverlay();
    createTownyMessage();
    showStep(0);
    
    console.log('🚀 Tour iniciado');
  }

  // API pública
  return {
    start,
    next: nextStep,
    previous: previousStep,
    skip: skipTour,
    destroy,
    isActive: () => isActive,
    currentStep: () => currentStepIndex,
    totalSteps: () => steps.length
  };
}

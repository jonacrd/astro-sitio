import type { TourStep, TourOptions, TourCallbacks, TourInstance } from './types';

export function createTour(
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
  let speechBubble: HTMLElement | null = null;
  let townyCharacter: HTMLElement | null = null;
  let currentElement: HTMLElement | null = null;

  // Crear overlay con spotlight dinámico
  function createOverlay(): void {
    overlay = document.createElement('div');
    overlay.className = 'town-tour-overlay';
    
    overlay.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      pointer-events: none !important;
    `;
    
    // Crear máscara que oscurece todo SIN blur
    spotlight = document.createElement('div');
    spotlight.className = 'town-tour-spotlight';
    spotlight.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.6) !important;
      pointer-events: none !important;
      transition: all 0.3s ease !important;
      backdrop-filter: none !important;
    `;
    
    overlay.appendChild(spotlight);
    document.body.appendChild(overlay);
    
    console.log('✅ Overlay con spotlight dinámico creado');
  }

  // Crear burbuja de diálogo
  function createSpeechBubble(): void {
    speechBubble = document.createElement('div');
    speechBubble.className = 'town-tour-speech-bubble';
    speechBubble.style.cssText = `
      position: fixed !important;
      z-index: 10001 !important;
      pointer-events: auto !important;
      max-width: calc(100vw - 2rem) !important;
      width: 90vw !important;
      background: rgba(255, 255, 255, 0.95) !important;
      color: #1f2937 !important;
      padding: 1rem 1.25rem !important;
      border-radius: 1rem 1rem 0.5rem 1rem !important;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      transition: all 0.3s ease !important;
      opacity: 0 !important;
      transform: scale(0.9) !important;
      font-size: 0.9rem !important;
      line-height: 1.4 !important;
    `;
    
    document.body.appendChild(speechBubble);
    console.log('✅ Burbuja de diálogo creada');
  }

  // Crear personaje Towny independiente
  function createTownyCharacter(): void {
    townyCharacter = document.createElement('div');
    townyCharacter.className = 'town-tour-towny';
    townyCharacter.style.cssText = `
      position: fixed !important;
      z-index: 10002 !important;
      width: 100px !important;
      height: 100px !important;
      background-image: url('/towny/towny_saludando.png') !important;
      background-size: contain !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      pointer-events: none !important;
      transition: all 0.3s ease !important;
      opacity: 0 !important;
      transform: scale(0.8) !important;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) !important;
    `;
    
    document.body.appendChild(townyCharacter);
    console.log('✅ Personaje Towny creado');
  }

  // Determinar imagen de Towny según el paso
  function getTownyImage(step: TourStep): string {
    const imageMap: Record<string, string> = {
      'welcome': '/towny/towny_saludando.png',
      'home': '/towny/towny_brazos_extendidos_feliz.png',
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

  // Posicionar Towny cerca de la burbuja del tour
  function positionTowny(step: TourStep, bubblePos: { left: string; top: string }): { left: string; top: string } {
    // Posicionar Towny cerca de la burbuja, no abajo
    const bubbleTop = parseInt(bubblePos.top) || 300;
    
    return {
      left: '50%',
      top: `${bubbleTop + 180}px` // Towny debajo de la burbuja
    };
  }

  // Posicionar burbuja según el elemento objetivo
  function positionSpeechBubble(step: TourStep, element: HTMLElement | null): { left: string; top: string } {
    if (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      
      // Posicionar la burbuja cerca del elemento
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      const elementLeft = rect.left;
      const elementRight = rect.right;
      
      // Determinar posición según el elemento
      if (elementTop > window.innerHeight / 2) {
        // Elemento en la mitad inferior - burbuja arriba
        return {
          left: '50%',
          top: `${Math.max(elementTop - 200, 20)}px`
        };
      } else {
        // Elemento en la mitad superior - burbuja abajo
        return {
          left: '50%',
          top: `${Math.min(elementBottom + 20, window.innerHeight - 250)}px`
        };
      }
    }
    
    // Posiciones por defecto
    const defaultPositions: Record<string, { left: string; top: string }> = {
      'welcome': { left: '50%', top: '50%' },
      'home': { left: '50%', top: '60%' },
      'search': { left: '50%', top: '60%' },
      'categories': { left: '50%', top: '60%' },
      'product-card': { left: '50%', top: '60%' },
      'add-to-cart': { left: '50%', top: '60%' },
      'cart-icon': { left: '50%', top: '30%' }, // Cerca del carrito
      'cart': { left: '50%', top: '60%' },
      'checkout': { left: '50%', top: '60%' },
      'address': { left: '50%', top: '60%' },
      'payment': { left: '50%', top: '60%' },
      'profile': { left: '50%', top: '60%' }
    };
    
    return defaultPositions[step.id] || { left: '50%', top: '60%' };
  }

  // Actualizar spotlight para enfocar elemento específico
  function updateSpotlight(element: HTMLElement | null): void {
    if (!spotlight) return;
    
    if (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      
      // Crear spotlight usando 4 elementos que cubren todo excepto el área del elemento
      spotlight.innerHTML = '';
      
      // Elemento superior - SIN backdrop-filter
      const top = document.createElement('div');
      top.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: ${rect.top - opts.spotlightPadding}px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        pointer-events: none !important;
        z-index: 9999 !important;
      `;
      
      // Elemento inferior - SIN backdrop-filter
      const bottom = document.createElement('div');
      bottom.style.cssText = `
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: ${window.innerHeight - rect.bottom - opts.spotlightPadding}px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        pointer-events: none !important;
        z-index: 9999 !important;
      `;
      
      // Elemento izquierdo - SIN backdrop-filter
      const left = document.createElement('div');
      left.style.cssText = `
        position: fixed !important;
        top: ${rect.top - opts.spotlightPadding}px !important;
        left: 0 !important;
        width: ${rect.left - opts.spotlightPadding}px !important;
        height: ${rect.height + (opts.spotlightPadding * 2)}px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        pointer-events: none !important;
        z-index: 9999 !important;
      `;
      
      // Elemento derecho - SIN backdrop-filter
      const right = document.createElement('div');
      right.style.cssText = `
        position: fixed !important;
        top: ${rect.top - opts.spotlightPadding}px !important;
        right: 0 !important;
        width: ${window.innerWidth - rect.right - opts.spotlightPadding}px !important;
        height: ${rect.height + (opts.spotlightPadding * 2)}px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        pointer-events: none !important;
        z-index: 9999 !important;
      `;
      
      spotlight.appendChild(top);
      spotlight.appendChild(bottom);
      spotlight.appendChild(left);
      spotlight.appendChild(right);
      
      console.log(`🎯 Spotlight enfocando elemento: ${element.tagName} con overlay de 4 partes`);
      
      // Agregar efecto de brillo MUY VISIBLE al elemento - SIN BLUR
      element.style.filter = 'brightness(2) drop-shadow(0 0 30px rgba(59, 130, 246, 1)) contrast(1.3) saturate(1.2)';
      element.style.transition = 'all 0.3s ease';
      element.style.transform = 'scale(1.05)';
      element.style.zIndex = '10002';
      element.style.position = 'relative';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
      
      // CRÍTICO: Asegurar que el elemento NO tenga blur
      element.style.backdropFilter = 'none';
      element.style.webkitBackdropFilter = 'none';
      
      // También asegurar que el elemento padre no tenga blur
      if (element.parentElement) {
        element.parentElement.style.backdropFilter = 'none';
        element.parentElement.style.webkitBackdropFilter = 'none';
      }
      
      console.log(`✨ Efectos aplicados al elemento:`, {
        filter: element.style.filter,
        transform: element.style.transform,
        zIndex: element.style.zIndex,
        boxShadow: element.style.boxShadow,
        backdropFilter: element.style.backdropFilter
      });
      
      // Efecto especial para barra de búsqueda
      if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
        addSearchBarGlow(element);
      }
      
      // Asegurar que el elemento esté visible
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
    } else {
      // Para pasos generales, oscurecer todo SIN blur
      spotlight.innerHTML = '';
      spotlight.style.background = 'rgba(0, 0, 0, 0.6)';
      spotlight.style.backdropFilter = 'none';
      console.log('🎯 Fondo oscuro para paso general');
    }
  }

  // Efecto de brillo para barra de búsqueda
  function addSearchBarGlow(input: HTMLElement): void {
    // Crear animación de placeholder MUY brillante
    const style = document.createElement('style');
    style.textContent = `
      @keyframes placeholderGlow {
        0%, 100% { 
          opacity: 0.7; 
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          color: #3b82f6 !important;
        }
        50% { 
          opacity: 1; 
          text-shadow: 0 0 25px rgba(59, 130, 246, 1);
          color: #1d4ed8 !important;
        }
      }
      
      .towny-tour-glow {
        border: 2px solid rgba(59, 130, 246, 0.8) !important;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.6) !important;
        background: rgba(59, 130, 246, 0.1) !important;
      }
      
      .towny-tour-glow::placeholder {
        animation: placeholderGlow 1.5s ease-in-out infinite;
        color: #3b82f6 !important;
        font-weight: 600 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Agregar clase de brillo
    input.classList.add('towny-tour-glow');
    
    // Remover después del tour
    setTimeout(() => {
      input.classList.remove('towny-tour-glow');
      style.remove();
    }, 10000);
  }

  // Limpiar efectos del elemento anterior
  function clearElementEffects(): void {
    if (currentElement) {
      currentElement.style.filter = '';
      currentElement.style.transition = '';
      currentElement.style.transform = '';
      currentElement.style.zIndex = '';
      
      // Limpiar efecto de brillo de barra de búsqueda
      if (currentElement.classList.contains('towny-tour-glow')) {
        currentElement.classList.remove('towny-tour-glow');
      }
    }
  }

  // Renderizar contenido de la burbuja
  function renderSpeechBubble(step: TourStep): void {
    if (!speechBubble) return;

    const bubblePos = positionSpeechBubble(step, currentElement);
    const townyPos = positionTowny(step, bubblePos);

    // Posicionar Towny cerca de la burbuja con brillo
    if (townyCharacter) {
      townyCharacter.style.left = townyPos.left;
      townyCharacter.style.top = townyPos.top;
      townyCharacter.style.bottom = 'auto'; // Usar top en lugar de bottom
      townyCharacter.style.backgroundImage = `url('${getTownyImage(step)}')`;
      townyCharacter.style.transform = 'translateX(-50%) scale(1)';
      townyCharacter.style.opacity = '1';
      
      // Agregar brillo sutil a Towny
      townyCharacter.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))';
      townyCharacter.style.transition = 'all 0.3s ease';
    }

    // Posicionar y configurar burbuja - RESPONSIVE
    speechBubble.style.left = bubblePos.left;
    speechBubble.style.top = bubblePos.top;
    speechBubble.style.bottom = 'auto'; // Usar top en lugar de bottom
    speechBubble.style.transform = 'translateX(-50%) scale(1)';
    speechBubble.style.opacity = '1';
    
    // Ajustar para móvil
    if (window.innerWidth < 768) {
      speechBubble.style.left = '50%';
      speechBubble.style.width = 'calc(100vw - 2rem)';
      speechBubble.style.maxWidth = 'none';
    }

    speechBubble.innerHTML = `
      <div style="
        font-weight: 600 !important;
        font-size: ${window.innerWidth < 768 ? '1rem' : '1.1rem'} !important;
        margin-bottom: 0.5rem !important;
        color: #1f2937 !important;
        line-height: 1.2 !important;
      ">${step.title}</div>
      
      <div style="
        font-size: ${window.innerWidth < 768 ? '0.85rem' : '0.95rem'} !important;
        line-height: 1.4 !important;
        color: #374151 !important;
        margin-bottom: 1rem !important;
        word-wrap: break-word !important;
      ">${step.content}</div>
      
      <div style="
        display: flex !important;
        gap: 0.4rem !important;
        justify-content: flex-end !important;
        flex-wrap: wrap !important;
      ">
        ${currentStepIndex > 0 ? `
          <button data-action="previous" style="
            padding: 0.4rem 0.8rem !important;
            background: rgba(107, 114, 128, 0.1) !important;
            color: #6b7280 !important;
            border: 1px solid rgba(107, 114, 128, 0.2) !important;
            border-radius: 0.5rem !important;
            font-size: 0.75rem !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            flex-shrink: 0 !important;
          ">← Atrás</button>
        ` : ''}
        <button data-action="skip" style="
          padding: 0.4rem 0.8rem !important;
          background: rgba(107, 114, 128, 0.1) !important;
          color: #6b7280 !important;
          border: 1px solid rgba(107, 114, 128, 0.2) !important;
          border-radius: 0.5rem !important;
          font-size: 0.75rem !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          flex-shrink: 0 !important;
        ">Omitir</button>
        <button data-action="next" style="
          padding: 0.4rem 0.8rem !important;
          background: linear-gradient(135deg, #ec4899, #be185d) !important;
          color: white !important;
          border: none !important;
          border-radius: 0.5rem !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3) !important;
          flex-shrink: 0 !important;
        ">
          ${currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>
    `;

    // Agregar event listeners
    speechBubble.addEventListener('click', handleBubbleClick);
  }

  // Manejar clicks en la burbuja
  function handleBubbleClick(event: Event): void {
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
      case 'skip':
        skip();
        break;
    }
  }

  // Mostrar paso actual
  function showStep(index: number): void {
    if (index < 0 || index >= steps.length) return;

    currentStepIndex = index;
    const step = steps[currentStepIndex];

    console.log(`🎬 Mostrando paso ${index + 1}/${steps.length}: ${step.id}`);

    // Limpiar efectos del elemento anterior
    clearElementEffects();

    // Buscar elemento con selectores más simples
    let foundElement = null;
    const selectors = step.selector.split(', ');
    
    console.log(`🔍 Buscando elemento para paso "${step.id}" con selectores:`, selectors);
    
    for (const selector of selectors) {
      try {
        foundElement = document.querySelector(selector.trim());
        if (foundElement) {
          console.log(`✅ Elemento encontrado con selector "${selector.trim()}":`, foundElement);
          break;
        } else {
          console.log(`❌ No encontrado con selector "${selector.trim()}"`);
        }
      } catch (e) {
        console.warn(`Tour: Selector inválido "${selector}"`);
        continue;
      }
    }
    
    currentElement = foundElement as HTMLElement;
    
    if (!currentElement && step.selector !== 'body') {
      console.warn(`Tour: Elemento no encontrado para selectores "${step.selector}"`);
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
      currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Actualizar spotlight para enfocar el elemento
    updateSpotlight(currentElement);

    // Renderizar burbuja y Towny
    renderSpeechBubble(step);

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
    console.log('🎬 Iniciando tour rediseñado');
    
    if (isActive) {
      console.log('⚠️ Tour ya está activo');
      return;
    }
    
    isActive = true;
    callbacks.onStart?.();
    
    // Crear elementos del tour
    createOverlay();
    createSpeechBubble();
    createTownyCharacter();
    
    // Mostrar primer paso
    showStep(0);

    // Keyboard navigation
    if (opts.allowKeyboardNavigation) {
      document.addEventListener('keydown', handleKeydown);
    }
    
    console.log('🎉 Tour rediseñado iniciado');
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
    
    // Limpiar efectos
    clearElementEffects();
    
    // Remover elementos
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    
    if (speechBubble) {
      speechBubble.remove();
      speechBubble = null;
    }

    if (townyCharacter) {
      townyCharacter.remove();
      townyCharacter = null;
    }

    currentElement = null;
    document.removeEventListener('keydown', handleKeydown);
    
    console.log('🗑️ Tour destruido');
  }

  return {
    start,
    next,
    previous,
    skip,
    skipStep: next,
    destroy,
    getCurrentStep: () => currentStepIndex,
    getTotalSteps: () => steps.length,
  };
}
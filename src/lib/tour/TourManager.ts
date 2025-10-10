import { createTour } from './createTour';
import type { TourStep, TourCallbacks } from './types';

const TOUR_STORAGE_KEY = 'town_tour_v1_done';

// Definir pasos del tour
const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    selector: 'body',
    title: '¡Bienvenido a Town!',
    content: 'Soy Towny 🛍️. Te guiaré por tu primera compra. ¡Vamos juntos!',
    townySlotClass: 'towny-slot--welcome',
    position: 'center'
  },
  {
    id: 'search',
    selector: '[data-test="search-bar"], input[type="search"], .search-input, [placeholder*="buscar"], [placeholder*="¿Qué"]',
    title: 'Busca lo que quieras',
    content: 'Aquí puedes buscar productos, tiendas o servicios de tu comunidad 🔍',
    townySlotClass: 'towny-slot--search'
  },
  {
    id: 'categories',
    selector: '[data-test="category-chips"], .category-chips, .chips, .CategoryCards, [class*="category"]',
    title: 'Explora por categorías',
    content: 'Toca una categoría para descubrir opciones cercanas 🍔🛠️🐶',
    townySlotClass: 'towny-slot--categories'
  },
  {
    id: 'product-card',
    selector: '[data-test="product-card"]:first-child, .product-card:first-of-type, [class*="product"]:first-of-type, [class*="feed"] [class*="card"]:first-of-type',
    title: 'Elige un producto',
    content: 'Toca un producto para ver detalles o usa el carrito para agregarlo 🛒',
    townySlotClass: 'towny-slot--product'
  },
  {
    id: 'add-to-cart',
    selector: '[data-test="add-to-cart"], .btn-add-to-cart, [aria-label*="Agregar"], [aria-label*="carrito"], button:has(> span:contains("Agregar"))',
    title: 'Agrega al carrito',
    content: 'Pulsa aquí para agregar tu primer producto. Puedes ajustar cantidad después.',
    townySlotClass: 'towny-slot--add'
  },
  {
    id: 'cart-icon',
    selector: '[data-test="cart-icon"], .nav-cart, [aria-label*="Carrito"], [id="cart-button"], [class*="cart"] [class*="icon"]',
    title: 'Abre tu carrito',
    content: 'Cuando tengas productos, revisa tu carrito desde aquí.',
    townySlotClass: 'towny-slot--carticon'
  },
  {
    id: 'cart-modal',
    selector: '[data-test="cart-modal"], .cart-modal, [role="dialog"].cart, [class*="CartSheet"], [class*="cart-modal"]',
    title: 'Revisa tu pedido',
    content: 'Ajusta cantidades o elimina productos antes de pagar.',
    townySlotClass: 'towny-slot--cart'
  },
  {
    id: 'checkout',
    selector: '[data-test="checkout-button"], button:has(> span:contains("Pagar")), .btn-checkout, [href*="checkout"], [class*="checkout"]',
    title: 'Ir al checkout',
    content: 'Cuando estés listo, continúa al pago 💳',
    townySlotClass: 'towny-slot--checkout'
  },
  {
    id: 'address',
    selector: '[data-test="address-section"], .address-form, [aria-label*="Dirección"], [class*="delivery"], [class*="address"]',
    title: 'Agrega tu dirección',
    content: 'Indica dónde quieres recibir tu pedido 🚚',
    townySlotClass: 'towny-slot--address'
  },
  {
    id: 'pay-now',
    selector: '[data-test="pay-now"], .btn-pay, button:has(> span:contains("Pagar ahora")), button:has(> span:contains("Confirmar"))',
    title: 'Confirma tu compra',
    content: 'Revisa todo y confirma tu pago para finalizar 🏁',
    townySlotClass: 'towny-slot--pay'
  },
  {
    id: 'profile',
    selector: '[data-test="tab-profile"], .tab-profile, [aria-label*="Perfil"], [href*="perfil"], [class*="profile"]',
    title: 'Tu perfil',
    content: 'Aquí verás tus pedidos, recompensas y podrás re-lanzar la guía.',
    townySlotClass: 'towny-slot--profile'
  }
];

class TourManager {
  private tourInstance: ReturnType<typeof createTour> | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Cargar estilos del tour
    this.loadTourStyles();

    // Verificar si debe mostrar el tour al cargar la página
    this.checkAndShowWelcomeModal();
  }

  private loadTourStyles(): void {
    // Los estilos del tour ya están en global.css (tour.css y towny-system.css)
    // No es necesario cargar estilos adicionales
  }

  private checkAndShowWelcomeModal(): void {
    // Solo mostrar en la página principal
    if (window.location.pathname !== '/' && !window.location.pathname.includes('index')) {
      return;
    }

    // Verificar si el tour ya se completó
    if (this.isTourCompleted()) {
      return;
    }

    // Mostrar modal de bienvenida después de un pequeño delay
    setTimeout(() => {
      this.showWelcomeModal();
    }, 1000);
  }

  private showWelcomeModal(): void {
    const modal = document.createElement('div');
    modal.className = 'town-tour-welcome-modal';
    modal.innerHTML = `
      <div class="town-tour-welcome-content">
        <div class="town-tour-welcome-header">
          <div class="towny-slot towny-slot--welcome"></div>
          <h2>¡Bienvenido a Town! 🛍️</h2>
        </div>
        <p>¿Te gustaría ver una guía rápida para tu primera compra?</p>
        <div class="town-tour-welcome-actions">
          <button class="town-tour-btn town-tour-btn--primary" data-action="start">
            ¡Sí, guíame!
          </button>
          <button class="town-tour-btn town-tour-btn--secondary" data-action="skip">
            No, gracias
          </button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      
      if (action === 'start') {
        this.startTour();
      } else if (action === 'skip') {
        this.markTourAsCompleted();
      }
      
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  private createTourCallbacks(): TourCallbacks {
    return {
      onStart: () => {
        console.log('🎯 Tour iniciado');
        // Agregar clase al body para estilos específicos
        document.body.classList.add('tour-active');
      },
      onStep: (step, index) => {
        console.log(`🎯 Paso ${index + 1}: ${step.title}`);
      },
      onComplete: () => {
        console.log('🎯 Tour completado');
        this.markTourAsCompleted();
        this.showCompletionMessage();
        document.body.classList.remove('tour-active');
      },
      onSkip: () => {
        console.log('🎯 Tour omitido');
        this.markTourAsCompleted();
        document.body.classList.remove('tour-active');
      },
      onError: (error) => {
        console.error('🎯 Error en tour:', error);
        document.body.classList.remove('tour-active');
      }
    };
  }

  private showCompletionMessage(): void {
    const toast = document.createElement('div');
    toast.className = 'town-tour-completion-toast';
    toast.innerHTML = `
      <div class="town-tour-completion-content">
        <div class="towny-slot towny-slot--success"></div>
        <span>¡Perfecto! Ya sabes cómo usar Town 🎉</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  public startTour(): void {
    if (this.tourInstance) {
      this.tourInstance.destroy();
    }

    this.tourInstance = createTour(
      tourSteps,
      {
        overlayOpacity: 0.7,
        spotlightPadding: 8,
        animationDuration: 300,
        allowKeyboardNavigation: true,
        allowClickOutside: false
      },
      this.createTourCallbacks()
    );

    this.tourInstance.start();
  }

  public restartTour(): void {
    // No cambiar el flag de localStorage, solo reiniciar
    this.startTour();
  }

  public isTourCompleted(): boolean {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }

  public markTourAsCompleted(): void {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }

  public resetTour(): void {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }

  public destroy(): void {
    if (this.tourInstance) {
      this.tourInstance.destroy();
      this.tourInstance = null;
    }
    document.body.classList.remove('tour-active');
  }
}

// Crear instancia global
let tourManager: TourManager | null = null;

export function initTour(): TourManager {
  if (!tourManager) {
    tourManager = new TourManager();
  }
  return tourManager;
}

export function startTour(): void {
  const manager = initTour();
  manager.startTour();
}

export function restartTour(): void {
  const manager = initTour();
  manager.restartTour();
}

export function isTourCompleted(): boolean {
  const manager = initTour();
  return manager.isTourCompleted();
}

// Exportar instancia para uso directo
export { tourManager };

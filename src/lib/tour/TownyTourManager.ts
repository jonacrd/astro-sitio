import { createTownyTour } from './TownyTour';
import type { TourStep, TourCallbacks } from './types';

const TOUR_STORAGE_KEY = 'towny_tour_v2_redesigned_done';

// Definir pasos del tour rediseñado
const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Town!',
    content: 'Soy Towny 🛍️. Como es tu primera vez por aquí, te voy a dar un tour por Town para que sepas cómo encontrar artículos cerca de tu zona.',
    target: null
  },
  {
    id: 'search',
    title: 'Busca fácilmente',
    content: 'En la barra de búsqueda puedes encontrar de manera más fácil los productos y servicios que están disponibles en este momento en tu comunidad. Sugiero que escribas de la misma manera que haces preguntas en un grupo de WhatsApp: "¿quién tiene comida?" o simplemente "comida" o "¿alguien hace fletes?". Como si hicieras una pregunta o simplemente pones palabras clave.',
    target: 'input[type="search"], .search-input, #search-input, [placeholder*="buscar"], [placeholder*="Buscar"]'
  }
];

// Callbacks del tour
const tourCallbacks: TourCallbacks = {
  onStepChange: (stepIndex: number, step: TourStep) => {
    console.log(`🎯 Paso ${stepIndex + 1}/${tourSteps.length}: ${step.id}`);
  },
  
  onComplete: () => {
    console.log('✅ Tour completado');
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    
    // Mostrar mensaje final de Towny
    setTimeout(() => {
      showFinalMessage();
    }, 500);
  },
  
  onSkip: () => {
    console.log('⏭️ Tour omitido');
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    
    // Mostrar mensaje final de Towny
    setTimeout(() => {
      showFinalMessage();
    }, 500);
  }
};

// Mostrar mensaje final de Towny
function showFinalMessage(): void {
  const finalMessage = document.createElement('div');
  finalMessage.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 10002 !important;
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 1.5rem !important;
    padding: 1.5rem !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    max-width: 90vw !important;
    width: 400px !important;
    text-align: center !important;
  `;
  
  finalMessage.innerHTML = `
    <div style="
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 1rem !important;
      margin-bottom: 1rem !important;
    ">
      <div style="
        width: 60px !important;
        height: 60px !important;
        background-image: url('/towny/towny_logrado.png') !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) !important;
      "></div>
      <div style="
        font-weight: 700 !important;
        font-size: 1.1rem !important;
        color: #1f2937 !important;
      ">¡Genial!</div>
    </div>
    
    <div style="
      font-size: 0.9rem !important;
      line-height: 1.5 !important;
      color: #374151 !important;
      margin-bottom: 1.5rem !important;
    ">
      Estaré en la barra de búsqueda si me necesitas. ¡Disfruta explorando Town!
    </div>
    
    <button id="close-final-message" style="
      padding: 0.5rem 1.5rem !important;
      background: linear-gradient(135deg, #ec4899, #be185d) !important;
      color: white !important;
      border: none !important;
      border-radius: 0.5rem !important;
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3) !important;
    ">¡Perfecto!</button>
  `;
  
  document.body.appendChild(finalMessage);
  
  // Cerrar mensaje final
  const closeBtn = finalMessage.querySelector('#close-final-message');
  closeBtn?.addEventListener('click', () => {
    document.body.removeChild(finalMessage);
  });
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    if (document.body.contains(finalMessage)) {
      document.body.removeChild(finalMessage);
    }
  }, 5000);
}

// Crear instancia del tour
let tourInstance: ReturnType<typeof createTownyTour> | null = null;

// Inicializar tour
export function initTour(): ReturnType<typeof createTownyTour> {
  console.log('🚀 Inicializando TownyTourManager...');
  
  // Verificar si el tour ya se completó
  const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
  
  if (tourCompleted === 'true') {
    console.log('ℹ️ Tour ya completado, no se mostrará');
    return {
      start: () => console.log('Tour ya completado'),
      next: () => {},
      previous: () => {},
      skip: () => {},
      destroy: () => {},
      isActive: () => false,
      currentStep: () => 0,
      totalSteps: () => tourSteps.length
    };
  }
  
  // Crear instancia del tour
  tourInstance = createTownyTour(tourSteps, {}, tourCallbacks);
  
  console.log('✅ TownyTourManager inicializado');
  return tourInstance;
}

// Función para resetear el tour (útil para testing)
export function resetTour(): void {
  // Limpiar todas las versiones anteriores del tour
  localStorage.removeItem('town_tour_v1_done');
  localStorage.removeItem('town_tour_v2_done');
  localStorage.removeItem('town_tour_v3_responsive_done');
  localStorage.removeItem('towny_tour_v1_done');
  localStorage.removeItem('towny_tour_v2_redesigned_done');
  console.log('🔄 Todos los tours reseteados');
}

// Función para obtener el estado del tour
export function isTourCompleted(): boolean {
  return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
}

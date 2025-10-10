// src/lib/tour/spotlight.ts

/**
 * Actualiza la posición del spotlight basado en el rectángulo de un elemento
 * @param maskEl Elemento de la máscara del spotlight
 * @param rect Rectángulo del elemento objetivo
 * @param padding Padding adicional alrededor del elemento
 */
export function setSpotlightAtRect(maskEl: HTMLElement, rect: DOMRect, padding = 12) {
  const r = Math.round(Math.max(rect.width, rect.height) / 2) + padding;
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);
  
  maskEl.style.setProperty('--spotlight-x', `${x}px`);
  maskEl.style.setProperty('--spotlight-y', `${y}px`);
  maskEl.style.setProperty('--spotlight-r', `${r}px`);
}

/**
 * Calcula la posición óptima del panel para evitar que tape el elemento objetivo
 * @param targetRect Rectángulo del elemento objetivo
 * @param panelWidth Ancho del panel
 * @param panelHeight Alto del panel
 * @param viewportWidth Ancho del viewport
 * @param viewportHeight Alto del viewport
 * @param margin Margen mínimo del panel
 */
export function calculatePanelPosition(
  targetRect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = 16
) {
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  
  // Posición inicial: centrada horizontalmente, debajo del elemento
  let left = targetCenterX - panelWidth / 2;
  let top = targetRect.bottom + margin;
  
  // Ajustar si se sale del viewport horizontalmente
  if (left < margin) {
    left = margin;
  } else if (left + panelWidth > viewportWidth - margin) {
    left = viewportWidth - panelWidth - margin;
  }
  
  // Si el panel se sale por abajo, ponerlo arriba del elemento
  if (top + panelHeight > viewportHeight - margin) {
    top = targetRect.top - panelHeight - margin;
  }
  
  // Si aún se sale por arriba, centrarlo verticalmente
  if (top < margin) {
    top = (viewportHeight - panelHeight) / 2;
  }
  
  return { left, top };
}

/**
 * Obtiene el rectángulo de un elemento considerando el scroll
 * @param element Elemento objetivo
 */
export function getElementRect(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  return new DOMRect(
    rect.left + scrollX,
    rect.top + scrollY,
    rect.width,
    rect.height
  );
}

/**
 * Scroll suave hacia un elemento si está fuera del viewport
 * @param element Elemento objetivo
 * @param offset Offset adicional para el scroll
 */
export function scrollToElement(element: HTMLElement, offset = 100) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Verificar si el elemento está fuera del viewport
  const isOutOfView = 
    rect.top < 0 || 
    rect.bottom > viewportHeight || 
    rect.left < 0 || 
    rect.right > viewportWidth;
  
  if (isOutOfView) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
  }
}

/**
 * Aplica safe areas para dispositivos con notch
 * @param element Elemento del panel
 */
export function applySafeAreas(element: HTMLElement) {
  // Aplicar safe areas usando CSS custom properties
  element.style.paddingLeft = 'max(16px, env(safe-area-inset-left))';
  element.style.paddingRight = 'max(16px, env(safe-area-inset-right))';
  element.style.paddingBottom = 'max(16px, env(safe-area-inset-bottom))';
  element.style.paddingTop = 'max(16px, env(safe-area-inset-top))';
}


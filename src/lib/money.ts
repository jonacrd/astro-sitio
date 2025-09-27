/**
 * Formatear precio en centavos a string con formato de moneda
 */
export function formatPrice(cents: number): string {
  // Verificar si el precio es válido
  if (isNaN(cents) || cents === null || cents === undefined) {
    return '$0';
  }
  
  // Si el precio es muy grande, probablemente ya está en pesos, no centavos
  if (cents > 1000) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(cents / 100);
}

/**
 * Convertir precio en dólares a centavos
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Calcular total de items del carrito
 */
export function calculateCartTotal(
  items: Array<{ quantity: number; priceCents: number }>,
): number {
  return items.reduce(
    (total, item) => total + item.quantity * item.priceCents,
    0,
  );
}

/**
 * Formatear precio en centavos a string con formato de moneda
 */
export function formatPrice(cents: number): string {
  // Verificar si el precio es válido
  if (isNaN(cents) || cents === null || cents === undefined) {
    return '$0';
  }
  
  // SIEMPRE tratar como centavos y dividir por 100 para obtener pesos
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
 * Convertir precio en pesos chilenos a centavos
 */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Convertir centavos a pesos chilenos
 */
export function centsToPesos(cents: number): number {
  return cents / 100;
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

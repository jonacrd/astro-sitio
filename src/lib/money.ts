/**
 * Formatear precio en centavos a string con formato de moneda
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Convertir precio en dólares a centavos
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Calcular total de items del carrito
 */
export function calculateCartTotal(items: Array<{ quantity: number; priceCents: number }>): number {
  return items.reduce((total, item) => total + (item.quantity * item.priceCents), 0)
}

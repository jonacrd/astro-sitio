// Feature flag para delivery
export function isDeliveryEnabled(): boolean {
  return process.env.DELIVERY_ENABLED === 'true';
}

// Verificar si estamos en modo mock (sin Supabase)
export function isMockMode(): boolean {
  return !process.env.PUBLIC_SUPABASE_URL || !process.env.PUBLIC_SUPABASE_ANON_KEY;
}

// Configuración de delivery
export const DELIVERY_CONFIG = {
  OFFER_TIMEOUT_MS: 60 * 1000, // 60 segundos
  MAX_RETRIES: 3,
  ASSIGNMENT_STRATEGY: 'round_robin' as const, // 'round_robin' | 'distance'
} as const;

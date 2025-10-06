// Feature flag para delivery
export function isDeliveryEnabled(): boolean {
  // Siempre usar import.meta.env ya que está definido en astro.config.mjs
  return import.meta.env.DELIVERY_ENABLED === 'true';
}

// Verificar si estamos en modo mock (sin Supabase)
export function isMockMode(): boolean {
  // En el cliente, usar import.meta.env
  if (typeof window !== 'undefined') {
    return !import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  }
  // En el servidor, usar process.env
  return !process.env.PUBLIC_SUPABASE_URL || !process.env.PUBLIC_SUPABASE_ANON_KEY;
}

// Configuración de delivery
export const DELIVERY_CONFIG = {
  OFFER_TIMEOUT_MS: 60 * 1000, // 60 segundos
  MAX_RETRIES: 3,
  ASSIGNMENT_STRATEGY: 'round_robin' as const, // 'round_robin' | 'distance'
} as const;

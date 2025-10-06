// Factory para seleccionar el repositorio correcto
import { isMockMode } from '../getEnv';
import { mockRepo } from './mockRepo';
import { supabaseRepo } from './supabaseRepo';

export function getDeliveryRepo() {
  // Por ahora siempre usar mock para evitar errores de BD
  return mockRepo;
}

export { mockRepo, supabaseRepo };

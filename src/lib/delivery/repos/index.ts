// Factory para seleccionar el repositorio correcto
import { isMockMode } from '../getEnv';
import { mockRepo } from './mockRepo';
import { supabaseRepo } from './supabaseRepo';

export function getDeliveryRepo() {
  if (isMockMode()) {
    return mockRepo;
  }
  return supabaseRepo;
}

export { mockRepo, supabaseRepo };

// Sistema de cache para autenticación
interface AuthCache {
  user: any | null;
  profile: any | null;
  lastUpdated: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let authCache: AuthCache | null = null;

export const getCachedAuth = (): AuthCache | null => {
  if (!authCache) return null;
  
  const now = Date.now();
  if (now > authCache.expiresAt) {
    authCache = null;
    return null;
  }
  
  return authCache;
};

export const setCachedAuth = (user: any, profile: any) => {
  const now = Date.now();
  authCache = {
    user,
    profile,
    lastUpdated: now,
    expiresAt: now + CACHE_DURATION
  };
  
  console.log('💾 Auth cache actualizado');
};

export const clearAuthCache = () => {
  authCache = null;
  console.log('🗑️ Auth cache limpiado');
};

export const isAuthCacheValid = (): boolean => {
  if (!authCache) return false;
  return Date.now() < authCache.expiresAt;
};







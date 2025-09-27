// =============================================
// RATE LIMITING UTILITIES - MÓDULO SOCIAL
// =============================================

import { createClient } from '@supabase/supabase-js';
import type { RateLimitInfo, RateLimitResponse } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://prizpqahcluomioxnmex.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXpxcWFoY2x1b21pb3hubWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NDgwMCwiZXhwIjoyMDUwODQwODAwfQ.ServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKey'
);

// =============================================
// CONFIGURACIÓN DE RATE LIMITS
// =============================================

const RATE_LIMITS = {
  express_posts: {
    max_per_day: 3,
    window_hours: 24,
    key_prefix: 'express_posts_daily'
  },
  questions: {
    max_per_hour: 3,
    window_hours: 1,
    key_prefix: 'questions_hourly'
  },
  answers: {
    max_per_hour: 10,
    window_hours: 1,
    key_prefix: 'answers_hourly'
  },
  reactions: {
    max_per_hour: 50,
    window_hours: 1,
    key_prefix: 'reactions_hourly'
  }
} as const;

// =============================================
// FUNCIONES DE RATE LIMITING
// =============================================

export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<RateLimitResponse> {
  const config = RATE_LIMITS[action];
  const now = new Date();
  const windowStart = new Date(now.getTime() - (config.window_hours * 60 * 60 * 1000));
  
  const key = `${config.key_prefix}:${userId}`;
  
  try {
    // Obtener conteo actual desde Redis o base de datos
    const { data: currentCount, error } = await supabase
      .from('rate_limit_tracking')
      .select('count')
      .eq('key', key)
      .eq('window_start', windowStart.toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking rate limit:', error);
      // En caso de error, permitir la acción (fail open)
      return {
        success: true,
        rate_limit: {
          limit: config.max_per_day,
          remaining: config.max_per_day,
          reset_time: now.getTime() + (config.window_hours * 60 * 60 * 1000),
          window_start: windowStart.getTime()
        }
      };
    }
    
    const count = currentCount?.count || 0;
    const remaining = Math.max(0, config.max_per_day - count);
    const resetTime = now.getTime() + (config.window_hours * 60 * 60 * 1000);
    
    if (count >= config.max_per_day) {
      return {
        success: false,
        rate_limit: {
          limit: config.max_per_day,
          remaining: 0,
          reset_time: resetTime,
          window_start: windowStart.getTime()
        },
        message: `Rate limit exceeded. Maximum ${config.max_per_day} ${action} per ${config.window_hours} hours.`
      };
    }
    
    return {
      success: true,
      rate_limit: {
        limit: config.max_per_day,
        remaining,
        reset_time: resetTime,
        window_start: windowStart.getTime()
      }
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - permitir la acción en caso de error
    return {
      success: true,
      rate_limit: {
        limit: config.max_per_day,
        remaining: config.max_per_day,
        reset_time: now.getTime() + (config.window_hours * 60 * 60 * 1000),
        window_start: windowStart.getTime()
      }
    };
  }
}

export async function incrementRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<void> {
  const config = RATE_LIMITS[action];
  const now = new Date();
  const windowStart = new Date(now.getTime() - (config.window_hours * 60 * 60 * 1000));
  
  const key = `${config.key_prefix}:${userId}`;
  
  try {
    // Incrementar contador o crear nuevo registro
    const { error } = await supabase
      .from('rate_limit_tracking')
      .upsert({
        key,
        user_id: userId,
        action,
        count: 1,
        window_start: windowStart.toISOString(),
        last_updated: now.toISOString()
      }, {
        onConflict: 'key,window_start',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error incrementing rate limit:', error);
    }
    
  } catch (error) {
    console.error('Rate limit increment failed:', error);
  }
}

// =============================================
// FUNCIÓN DE LIMPIEZA DE RATE LIMITS
// =============================================

export async function cleanupExpiredRateLimits(): Promise<void> {
  const now = new Date();
  const maxAge = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 horas
  
  try {
    const { error } = await supabase
      .from('rate_limit_tracking')
      .delete()
      .lt('window_start', maxAge.toISOString());
    
    if (error) {
      console.error('Error cleaning up rate limits:', error);
    }
    
  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
  }
}

// =============================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS DE RATE LIMIT
// =============================================

export async function getRateLimitStats(userId: string): Promise<Record<string, RateLimitInfo>> {
  const stats: Record<string, RateLimitInfo> = {};
  
  for (const action of Object.keys(RATE_LIMITS) as Array<keyof typeof RATE_LIMITS>) {
    const response = await checkRateLimit(userId, action);
    if (response.success) {
      stats[action] = response.rate_limit;
    }
  }
  
  return stats;
}

// =============================================
// MIDDLEWARE PARA RATE LIMITING
// =============================================

export function createRateLimitMiddleware(action: keyof typeof RATE_LIMITS) {
  return async (req: Request, userId: string): Promise<RateLimitResponse> => {
    // Verificar rate limit
    const rateLimitResponse = await checkRateLimit(userId, action);
    
    if (!rateLimitResponse.success) {
      return rateLimitResponse;
    }
    
    // Incrementar contador
    await incrementRateLimit(userId, action);
    
    return rateLimitResponse;
  };
}

// =============================================
// FUNCIÓN PARA VALIDAR CONSENTIMIENTOS
// =============================================

export async function checkUserConsent(
  userId: string,
  consentKey: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', userId)
      .eq('consent_key', consentKey)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user consent:', error);
      return false;
    }
    
    return !!data;
    
  } catch (error) {
    console.error('User consent check failed:', error);
    return false;
  }
}

// =============================================
// FUNCIÓN PARA REGISTRAR CONSENTIMIENTO
// =============================================

export async function recordUserConsent(
  userId: string,
  consentKey: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        consent_key: consentKey,
        metadata,
        accepted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,consent_key'
      });
    
    if (error) {
      console.error('Error recording user consent:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('User consent recording failed:', error);
    return false;
  }
}

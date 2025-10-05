// =============================================
// API ENDPOINT - EXPIRACIÓN DE EXPRESS POSTS
// =============================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// POST /api/social/expire-posts - Ejecutar Expiración
// =============================================

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autorización (opcional - para webhooks externos)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'UNAUTHORIZED',
          message: 'Invalid authorization token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ejecutar función de expiración
    const { data, error } = await supabase.rpc('expire_express_posts');
    
    if (error) {
      console.error('Error executing expiration:', error);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to execute expiration',
          code: 'EXPIRATION_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const expiredCount = data || 0;
    
    // Obtener estadísticas adicionales
    const { data: stats } = await supabase
      .from('express_posts')
      .select('status')
      .then(({ data }) => {
        const statusCounts = data?.reduce((acc, post) => {
          acc[post.status] = (acc[post.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        return { data: statusCounts };
      });
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        expired_count: expiredCount,
        executed_at: new Date().toISOString(),
        status_summary: stats,
        message: `Successfully expired ${expiredCount} express posts`
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Expiration endpoint error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// =============================================
// GET /api/social/expire-posts - Estado de Expiración
// =============================================

export const GET: APIRoute = async () => {
  try {
    // Obtener estadísticas de posts
    const { data: statusStats, error: statusError } = await supabase
      .from('express_posts')
      .select('status, count(*)')
      .group('status');
    
    if (statusError) {
      console.error('Error fetching status stats:', statusError);
      return new Response(JSON.stringify({
        success: false,
        error: {
          error: 'DATABASE_ERROR',
          message: 'Failed to fetch status statistics',
          code: 'FETCH_FAILED',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener posts que expiran pronto
    const { data: expiringSoon, error: expiringError } = await supabase
      .from('express_posts')
      .select('id, title, expires_at')
      .eq('status', 'active')
      .lte('expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString()) // Próxima hora
      .order('expires_at', { ascending: true })
      .limit(10);
    
    if (expiringError) {
      console.error('Error fetching expiring posts:', expiringError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        status_summary: statusStats,
        expiring_soon: expiringSoon || [],
        next_expiration_check: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Próximos 10 minutos
        message: 'Expiration system status'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Expiration status error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};










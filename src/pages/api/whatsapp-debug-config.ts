// Endpoint para diagnosticar configuración de WhatsApp
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 DEBUG: Verificando configuración de WhatsApp');
    
    // Verificar variables de entorno
    const token = process.env.WHATSAPP_TOKEN || import.meta.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID || import.meta.env.WHATSAPP_PHONE_ID;
    
    console.log('🔍 Token presente:', !!token);
    console.log('🔍 Phone ID presente:', !!phoneId);
    console.log('🔍 Token length:', token ? token.length : 0);
    console.log('🔍 Phone ID:', phoneId);
    
    // Verificar si el token es válido (empieza con EAA)
    const isValidToken = token && token.startsWith('EAA');
    console.log('🔍 Token válido:', isValidToken);
    
    // Verificar si el phone ID es válido (solo números)
    const isValidPhoneId = phoneId && /^\d+$/.test(phoneId);
    console.log('🔍 Phone ID válido:', isValidPhoneId);
    
    return new Response(JSON.stringify({
      success: true,
      config: {
        hasToken: !!token,
        hasPhoneId: !!phoneId,
        tokenLength: token ? token.length : 0,
        phoneId: phoneId,
        isValidToken: isValidToken,
        isValidPhoneId: isValidPhoneId,
        tokenStart: token ? token.substring(0, 10) + '...' : 'No token',
        environment: process.env.NODE_ENV || 'development'
      },
      message: isValidToken && isValidPhoneId ? 'WhatsApp configurado correctamente' : 'WhatsApp no configurado correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};






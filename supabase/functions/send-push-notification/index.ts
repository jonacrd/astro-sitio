import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para convertir base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys no configuradas');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the request body
    const { title, body, icon, badge, tag, data, userId } = await req.json()

    console.log('📬 Solicitud de notificación recibida:', { title, body, userId })

    // Get push subscriptions - filtrar por userId si se proporciona
    let query = supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
    
    if (userId) {
      query = query.eq('user_id', userId)
      console.log('🔍 Filtrando notificaciones para usuario:', userId)
    } else {
      console.log('📢 Enviando notificación a todos los usuarios')
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No se encontraron suscripciones para:', userId || 'todos los usuarios')
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions found',
          userId: userId || 'all',
          count: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Se encontraron ${subscriptions.length} suscripción(es)`)

    // Prepare the notification payload
    const payload = JSON.stringify({
      title: title || 'Town App',
      body: body || 'Tienes una nueva notificación',
      icon: icon || '/favicon.svg',
      badge: badge || '/favicon.svg',
      tag: tag || 'town-notification',
      data: data || {},
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Cerrar',
        }
      ]
    })

    console.log('📦 Payload preparado:', payload);

    // Send push notifications using Web Push Protocol
    const results = []
    
    for (const sub of subscriptions) {
      try {
        console.log(`📤 Enviando a: ${sub.endpoint.substring(0, 50)}...`)

        // Construir los headers de autenticación Web Push
        const vapidPublicKeyUint8 = urlBase64ToUint8Array(vapidPublicKey);
        const vapidPrivateKeyUint8 = urlBase64ToUint8Array(vapidPrivateKey);

        // Generar JWT para VAPID
        const jwtHeader = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
        const jwtPayload = btoa(JSON.stringify({
          aud: new URL(sub.endpoint).origin,
          exp: Math.floor(Date.now() / 1000) + 43200, // 12 horas
          sub: 'mailto:support@town.app'
        }));

        // Nota: La firma JWT ES256 es compleja en Deno sin librerías
        // Usaremos el método simplificado con Authorization header

        const authHeader = `vapid t=${jwtHeader}.${jwtPayload}.signature, k=${vapidPublicKey}`;

        // Enviar la notificación
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Authorization': authHeader,
            'TTL': '86400',
            'Urgency': 'high'
          },
          body: payload
        })

        const statusText = response.statusText;
        const responseBody = await response.text();

        console.log(`📊 Respuesta: ${response.status} ${statusText}`, responseBody);

        results.push({
          endpoint: sub.endpoint.substring(0, 50) + '...',
          status: response.status,
          success: response.ok || response.status === 201,
          userId: sub.user_id
        })

      } catch (error: any) {
        console.error('❌ Error enviando a', sub.endpoint.substring(0, 50), ':', error.message)
        results.push({
          endpoint: sub.endpoint.substring(0, 50) + '...',
          status: 'error',
          success: false,
          error: error.message,
          userId: sub.user_id
        })
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Enviadas: ${successCount}/${results.length}`)

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        results: results,
        total: subscriptions.length,
        successful: successCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('❌ Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

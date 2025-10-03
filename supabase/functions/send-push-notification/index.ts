import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      console.error('Error fetching subscriptions:', error)
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

    // Send push notifications
    const results = []
    for (const sub of subscriptions) {
      try {
        // Reconstruir objeto subscription desde la BD
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }
        
        // Prepare the notification payload
        const payload = JSON.stringify({
          title: title || 'Town App',
          body: body || 'Tienes una nueva notificación',
          icon: icon || '/favicon.svg',
          badge: badge || '/favicon.svg',
          tag: tag || 'town-notification',
          requireInteraction: true,
          actions: [
            {
              action: 'open',
              title: 'Abrir App',
              icon: '/favicon.svg'
            },
            {
              action: 'close',
              title: 'Cerrar',
              icon: '/favicon.svg'
            }
          ],
          data: data || {}
        })

        // Send the push notification
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `vapid t=${subscription.keys.p256dh}, k=${subscription.keys.auth}`,
            'TTL': '86400'
          },
          body: payload
        })

        results.push({
          subscription: subscription.endpoint,
          status: response.status,
          success: response.ok
        })

        console.log(`Notification sent to ${subscription.endpoint}: ${response.status}`)
      } catch (error) {
        console.error('Error sending notification:', error)
        results.push({
          subscription: sub.endpoint,
          status: 'error',
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        results: results,
        total: subscriptions.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

import type { APIRoute } from "astro";
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint para notificar a usuarios no suscritos
 * Crea notificaciones in-app para usuarios que no tienen push notifications
 */
export const POST: APIRoute = async (context) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener todos los usuarios registrados
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('is_seller', false); // Solo compradores

    if (usersError) {
      throw new Error('Error obteniendo usuarios: ' + usersError.message);
    }

    console.log(`📊 Total de usuarios compradores: ${allUsers?.length || 0}`);

    // 2. Obtener lista de usuarios que YA tienen OneSignal configurado
    const onesignalAppId = '270896d8-ba2e-40bc-8f3b-c1e6efd258a1';
    const onesignalRestKey = import.meta.env.ONESIGNAL_REST_API_KEY || '';

    if (!onesignalRestKey) {
      throw new Error('ONESIGNAL_REST_API_KEY no configurada');
    }

    // Obtener usuarios suscritos de OneSignal
    const onesignalResponse = await fetch(
      `https://onesignal.com/api/v1/players?app_id=${onesignalAppId}&limit=300`,
      {
        headers: {
          'Authorization': `Basic ${onesignalRestKey}`
        }
      }
    );

    const onesignalData = await onesignalResponse.json();
    const subscribedUserIds = new Set(
      onesignalData.players
        ?.filter((p: any) => p.external_user_id)
        ?.map((p: any) => p.external_user_id) || []
    );

    console.log(`🔔 Usuarios con OneSignal activo: ${subscribedUserIds.size}`);

    // 3. Filtrar usuarios NO suscritos
    const unsubscribedUsers = allUsers?.filter(user => !subscribedUserIds.has(user.id)) || [];
    
    console.log(`❌ Usuarios SIN notificaciones: ${unsubscribedUsers.length}`);

    // 4. Crear notificaciones in-app para usuarios no suscritos
    const notificationsToCreate = unsubscribedUsers.map(user => ({
      user_id: user.id,
      type: 'system',
      title: '🔔 Activa las Notificaciones',
      message: '¡No te pierdas las actualizaciones de tus pedidos! Activa las notificaciones para recibir avisos cuando tu pedido sea confirmado, esté en camino y sea entregado.',
      read: false,
      created_at: new Date().toISOString()
    }));

    // 5. Insertar notificaciones (si la tabla existe)
    let notificationsCreated = 0;
    try {
      const { data: insertedNotifications, error: notifError } = await supabase
        .from('notifications')
        .insert(notificationsToCreate)
        .select();

      if (notifError) {
        console.warn('⚠️ Error creando notificaciones in-app:', notifError.message);
      } else {
        notificationsCreated = insertedNotifications?.length || 0;
        console.log(`✅ Notificaciones in-app creadas: ${notificationsCreated}`);
      }
    } catch (notifError) {
      console.warn('⚠️ Tabla notifications no existe o tiene estructura diferente');
    }

    // 6. Respuesta con estadísticas
    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers: allUsers?.length || 0,
        subscribedUsers: subscribedUserIds.size,
        unsubscribedUsers: unsubscribedUsers.length,
        notificationsCreated
      },
      unsubscribedUsers: unsubscribedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      })),
      message: `Se crearon ${notificationsCreated} notificaciones in-app para usuarios sin push notifications activadas`
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};







// Script para verificar notificaciones del comprador
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotifications() {
  try {
    console.log('🔔 Verificando notificaciones del comprador...');
    
    const buyerUuid = '98e2217c-5c17-4970-a7d1-ae1bea6d3027'; // UUID del comprador
    
    // Obtener todas las notificaciones del comprador
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', buyerUuid)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error consultando notificaciones:', error.message);
      return;
    }

    console.log(`📊 Notificaciones del comprador: ${notifications.length}`);
    
    if (notifications.length === 0) {
      console.log('❌ No hay notificaciones para este comprador');
      console.log('💡 Esto explica por qué no se ven en el perfil');
    } else {
      console.log('\n📋 Notificaciones encontradas:');
      notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title}`);
        console.log(`     Mensaje: ${notif.message}`);
        console.log(`     Tipo: ${notif.type}`);
        console.log(`     Fecha: ${new Date(notif.created_at).toLocaleString('es-ES')}`);
        console.log(`     Datos: ${JSON.stringify(notif.data)}`);
        console.log('');
      });
    }

    // Verificar si la tabla notifications existe
    console.log('\n🔍 Verificando estructura de la tabla notifications...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error accediendo a la tabla notifications:', tableError.message);
      console.log('💡 La tabla notifications puede no existir');
    } else {
      console.log('✅ Tabla notifications existe y es accesible');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNotifications();


// Script para probar creación de notificaciones
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

async function testNotificationCreation() {
  try {
    console.log('🧪 Probando creación de notificación...');
    
    const buyerUuid = '98e2217c-5c17-4970-a7d1-ae1bea6d3027';
    const orderId = '4e4e9d6d-9a31-4096-b6b2-bfa3f2cabb53';
    const status = 'confirmed';
    
    const notificationTitle = '¡Pedido Confirmado!';
    const notificationMessage = `Tu pedido #${orderId.substring(0, 8)} ha sido confirmado por el vendedor. ¡Pronto será preparado!`;

    console.log('📝 Datos de la notificación:');
    console.log(`  user_id: ${buyerUuid}`);
    console.log(`  type: order_status_update`);
    console.log(`  title: ${notificationTitle}`);
    console.log(`  message: ${notificationMessage}`);

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: buyerUuid,
        type: 'order_status_update',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          orderId: orderId,
          status: status,
          orderCode: orderId.substring(0, 8)
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando notificación:', error);
      console.log('🔍 Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Notificación creada exitosamente:', notification);
    }

    // Verificar que se creó
    console.log('\n🔍 Verificando notificación creada...');
    const { data: createdNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', buyerUuid)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.log('❌ Error consultando notificación:', fetchError.message);
    } else if (createdNotification && createdNotification.length > 0) {
      console.log('✅ Notificación encontrada:', createdNotification[0]);
    } else {
      console.log('❌ No se encontró la notificación creada');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNotificationCreation();


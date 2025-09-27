// Script para verificar pedidos existentes en la base de datos
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

async function checkExistingOrders() {
  try {
    console.log('🔍 Verificando pedidos existentes en la base de datos...');
    
    // Obtener todos los pedidos
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error consultando pedidos:', allError.message);
      return;
    }

    console.log(`📊 Total de pedidos en la base de datos: ${allOrders.length}`);
    
    if (allOrders.length === 0) {
      console.log('❌ No hay pedidos en la base de datos');
      return;
    }

    // Mostrar todos los pedidos
    console.log('\n📋 Todos los pedidos:');
    allOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ID: ${order.id}`);
      console.log(`     Vendedor: ${order.seller_id}`);
      console.log(`     Cliente: ${order.user_id}`);
      console.log(`     Total: $${order.total_cents}`);
      console.log(`     Estado: ${order.status}`);
      console.log(`     Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}`);
      console.log(`     Dirección: ${order.delivery_address ? 'Sí' : 'No'}`);
      console.log('');
    });

    // Filtrar por vendedor específico
    const sellerUuid = 'df33248a-5462-452b-a4f1-5d17c8c05a51';
    const vendorOrders = allOrders.filter(order => order.seller_id === sellerUuid);
    
    console.log(`\n🏪 Pedidos del vendedor ${sellerUuid}: ${vendorOrders.length}`);
    
    if (vendorOrders.length === 0) {
      console.log('❌ No hay pedidos para este vendedor');
      console.log('💡 Esto explica por qué no se ven pedidos en el dashboard');
    } else {
      console.log('\n📋 Pedidos del vendedor:');
      vendorOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ID: ${order.id}`);
        console.log(`     Total: $${order.total_cents}`);
        console.log(`     Estado: ${order.status}`);
        console.log(`     Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    // Verificar notificaciones
    console.log('\n🔔 Verificando notificaciones...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', sellerUuid)
      .order('created_at', { ascending: false });

    if (notifError) {
      console.log('⚠️ Error consultando notificaciones:', notifError.message);
    } else {
      console.log(`📊 Notificaciones del vendedor: ${notifications.length}`);
      if (notifications.length > 0) {
        notifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title} - ${notif.message}`);
          console.log(`     Fecha: ${new Date(notif.created_at).toLocaleString('es-ES')}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExistingOrders();


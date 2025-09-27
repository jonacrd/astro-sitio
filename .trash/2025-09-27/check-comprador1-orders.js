import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkComprador1Orders() {
  try {
    console.log('🔍 VERIFICANDO PEDIDOS DE COMPRADOR1');
    console.log('=' .repeat(80));
    
    // 1. Buscar comprador1 en auth.users
    console.log('\n👤 1. BUSCANDO COMPRADOR1');
    console.log('-'.repeat(50));
    
    const { data: comprador1User, error: comprador1UserError } = await supabase.auth.admin.listUsers();
    
    if (comprador1UserError) {
      console.log('❌ Error buscando usuarios:', comprador1UserError.message);
      return;
    }
    
    const comprador1Auth = comprador1User.users.find(u => u.email === 'comprador1@gmail.com');
    
    if (!comprador1Auth) {
      console.log('❌ Comprador1 no encontrado en auth.users');
      return;
    }
    
    console.log(`✅ Comprador1 encontrado en auth: ${comprador1Auth.email} (${comprador1Auth.id})`);
    
    // Buscar perfil de comprador1
    const { data: comprador1, error: comprador1Error } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller')
      .eq('id', comprador1Auth.id)
      .single();
    
    if (comprador1Error) {
      console.log('❌ Error buscando perfil de comprador1:', comprador1Error.message);
      return;
    }
    
    console.log(`✅ Perfil de comprador1: ${comprador1.name} (${comprador1.id})`);
    
    // 2. Buscar TechStore en auth.users
    console.log('\n🏪 2. BUSCANDO TECHSTORE');
    console.log('-'.repeat(50));
    
    const techstoreAuth = comprador1User.users.find(u => u.email === 'techstore.digital@gmail.com');
    
    if (!techstoreAuth) {
      console.log('❌ TechStore no encontrado en auth.users');
      return;
    }
    
    console.log(`✅ TechStore encontrado en auth: ${techstoreAuth.email} (${techstoreAuth.id})`);
    
    // Buscar perfil de TechStore
    const { data: techstore, error: techstoreError } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller')
      .eq('id', techstoreAuth.id)
      .single();
    
    if (techstoreError) {
      console.log('❌ Error buscando perfil de TechStore:', techstoreError.message);
      return;
    }
    
    console.log(`✅ Perfil de TechStore: ${techstore.name} (${techstore.id})`);
    
    // 3. Buscar pedidos de comprador1
    console.log('\n📦 3. PEDIDOS DE COMPRADOR1');
    console.log('-'.repeat(50));
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        seller_id,
        total_cents,
        status,
        payment_method,
        delivery_address,
        delivery_notes,
        created_at,
        updated_at,
        seller:profiles!orders_seller_id_fkey(name, phone),
        order_items(
          id,
          product_id,
          title,
          price_cents,
          qty
        )
      `)
      .eq('user_id', comprador1.id)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.log('❌ Error buscando pedidos:', ordersError.message);
      return;
    }
    
    console.log(`📊 Total de pedidos encontrados: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\n   📋 PEDIDO ${index + 1}:`);
        console.log(`      ID: ${order.id}`);
        console.log(`      Vendedor: ${order.seller?.name || 'Desconocido'}`);
        console.log(`      Estado: ${order.status}`);
        console.log(`      Total: $${(order.total_cents / 100).toFixed(2)}`);
        console.log(`      Creado: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`      Actualizado: ${new Date(order.updated_at).toLocaleString()}`);
        console.log(`      Items: ${order.order_items?.length || 0}`);
        
        if (order.order_items && order.order_items.length > 0) {
          console.log(`      Productos:`);
          order.order_items.forEach(item => {
            console.log(`        - ${item.title} ($${(item.price_cents / 100).toFixed(2)} x ${item.qty})`);
          });
        }
      });
    }
    
    // 4. Buscar pedidos específicos de TechStore
    console.log('\n🏪 4. PEDIDOS DE COMPRADOR1 CON TECHSTORE');
    console.log('-'.repeat(50));
    
    const { data: techstoreOrders, error: techstoreOrdersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        seller_id,
        total_cents,
        status,
        payment_method,
        delivery_address,
        delivery_notes,
        created_at,
        updated_at,
        order_items(
          id,
          product_id,
          title,
          price_cents,
          qty
        )
      `)
      .eq('user_id', comprador1.id)
      .eq('seller_id', techstore.id)
      .order('created_at', { ascending: false });
    
    if (techstoreOrdersError) {
      console.log('❌ Error buscando pedidos de TechStore:', techstoreOrdersError.message);
    } else {
      console.log(`📊 Pedidos con TechStore: ${techstoreOrders?.length || 0}`);
      
      if (techstoreOrders && techstoreOrders.length > 0) {
        techstoreOrders.forEach((order, index) => {
          console.log(`\n   🏪 PEDIDO TECHSTORE ${index + 1}:`);
          console.log(`      ID: ${order.id}`);
          console.log(`      Estado: ${order.status}`);
          console.log(`      Total: $${(order.total_cents / 100).toFixed(2)}`);
          console.log(`      Creado: ${new Date(order.created_at).toLocaleString()}`);
          console.log(`      Actualizado: ${new Date(order.updated_at).toLocaleString()}`);
          console.log(`      Items: ${order.order_items?.length || 0}`);
          
          if (order.order_items && order.order_items.length > 0) {
            console.log(`      Productos:`);
            order.order_items.forEach(item => {
              console.log(`        - ${item.title} ($${(item.price_cents / 100).toFixed(2)} x ${item.qty})`);
            });
          }
        });
      }
    }
    
    // 5. Verificar notificaciones
    console.log('\n🔔 5. NOTIFICACIONES DE COMPRADOR1');
    console.log('-'.repeat(50));
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, type, title, message, order_id, is_read, created_at')
      .eq('user_id', comprador1.id)
      .order('created_at', { ascending: false });
    
    if (notificationsError) {
      console.log('❌ Error buscando notificaciones:', notificationsError.message);
    } else {
      console.log(`📊 Notificaciones encontradas: ${notifications?.length || 0}`);
      
      if (notifications && notifications.length > 0) {
        notifications.forEach((notification, index) => {
          console.log(`\n   🔔 NOTIFICACIÓN ${index + 1}:`);
          console.log(`      Tipo: ${notification.type}`);
          console.log(`      Título: ${notification.title}`);
          console.log(`      Mensaje: ${notification.message}`);
          console.log(`      Pedido: ${notification.order_id}`);
          console.log(`      Leída: ${notification.is_read ? 'Sí' : 'No'}`);
          console.log(`      Creada: ${new Date(notification.created_at).toLocaleString()}`);
        });
      }
    }
    
    // 6. Verificar funciones de confirmación
    console.log('\n🔧 6. VERIFICANDO FUNCIONES DE CONFIRMACIÓN');
    console.log('-'.repeat(50));
    
    try {
      // Verificar confirm_delivery_by_seller
      const { data: deliveryTest, error: deliveryError } = await supabase.rpc('confirm_delivery_by_seller', {
        p_order_id: 'test-order',
        p_seller_id: techstore.id
      });
      
      if (deliveryError) {
        if (deliveryError.message.includes('Pedido no encontrado')) {
          console.log('✅ confirm_delivery_by_seller() - Función existe');
        } else {
          console.log('⚠️ confirm_delivery_by_seller() - Función con errores:', deliveryError.message);
        }
      } else {
        console.log('✅ confirm_delivery_by_seller() - Función funciona');
      }
    } catch (err) {
      console.log('❌ confirm_delivery_by_seller() - Función NO EXISTE - CRÍTICO');
    }
    
    try {
      // Verificar confirm_receipt_by_buyer
      const { data: receiptTest, error: receiptError } = await supabase.rpc('confirm_receipt_by_buyer', {
        p_order_id: 'test-order',
        p_buyer_id: comprador1.id
      });
      
      if (receiptError) {
        if (receiptError.message.includes('Pedido no encontrado')) {
          console.log('✅ confirm_receipt_by_buyer() - Función existe');
        } else {
          console.log('⚠️ confirm_receipt_by_buyer() - Función con errores:', receiptError.message);
        }
      } else {
        console.log('✅ confirm_receipt_by_buyer() - Función funciona');
      }
    } catch (err) {
      console.log('❌ confirm_receipt_by_buyer() - Función NO EXISTE - CRÍTICO');
    }
    
    // 7. Recomendaciones
    console.log('\n\n💡 7. RECOMENDACIONES PARA ARREGLAR');
    console.log('-'.repeat(50));
    
    if (techstoreOrders && techstoreOrders.length > 0) {
      console.log('🔧 ACCIONES REQUERIDAS:');
      console.log('   1. Verificar estado real de cada pedido');
      console.log('   2. Actualizar estados si es necesario');
      console.log('   3. Crear notificaciones faltantes');
      console.log('   4. Sincronizar interfaz del comprador');
      
      console.log('\n📋 PEDIDOS QUE NECESITAN REVISIÓN:');
      techstoreOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Pedido ${order.id} - Estado: ${order.status}`);
      });
    } else {
      console.log('✅ No hay pedidos de TechStore para comprador1');
    }
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar script de corrección de estados');
    console.log('   2. Verificar que las funciones SQL estén implementadas');
    console.log('   3. Probar flujo completo de confirmación');
    console.log('   4. Verificar sincronización en la interfaz');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

checkComprador1Orders();

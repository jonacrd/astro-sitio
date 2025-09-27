import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

// Cliente con service role para consultar datos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSpecificUsers() {
  try {
    console.log('🔍 Verificando usuarios específicos...');
    
    // IDs de los usuarios específicos
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1@gmail.com
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore.digital@gmail.com
    
    console.log(`👤 Comprador1 ID: ${comprador1Id}`);
    console.log(`🏪 TechStore ID: ${techstoreId}`);
    
    // Verificar perfiles
    console.log('\n👤 Verificando perfiles...');
    
    const { data: comprador1Profile, error: comprador1Error } = await supabase
      .from('profiles')
      .select('name, is_seller')
      .eq('id', comprador1Id)
      .single();

    if (comprador1Error) {
      console.error('❌ Error obteniendo perfil comprador1:', comprador1Error.message);
    } else {
      console.log('✅ Comprador1:', comprador1Profile);
    }

    const { data: techstoreProfile, error: techstoreError } = await supabase
      .from('profiles')
      .select('name, is_seller')
      .eq('id', techstoreId)
      .single();

    if (techstoreError) {
      console.error('❌ Error obteniendo perfil techstore:', techstoreError.message);
    } else {
      console.log('✅ TechStore:', techstoreProfile);
    }
    
    // Verificar pedidos de comprador1
    console.log('\n📋 Verificando pedidos de comprador1...');
    
    const { data: comprador1Orders, error: comprador1OrdersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at, seller_id')
      .eq('user_id', comprador1Id)
      .order('created_at', { ascending: false });

    if (comprador1OrdersError) {
      console.error('❌ Error obteniendo pedidos de comprador1:', comprador1OrdersError.message);
    } else {
      console.log(`📊 Pedidos de comprador1: ${comprador1Orders.length}`);
      comprador1Orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: ${order.id.substring(0, 8)}... Vendedor: ${order.seller_id.substring(0, 8)}... Estado: ${order.status} Total: $${(order.total_cents / 100).toFixed(2)}`);
      });
    }
    
    // Verificar pedidos del techstore
    console.log('\n🏪 Verificando pedidos del techstore...');
    
    const { data: techstoreOrders, error: techstoreOrdersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at, user_id')
      .eq('seller_id', techstoreId)
      .order('created_at', { ascending: false });

    if (techstoreOrdersError) {
      console.error('❌ Error obteniendo pedidos del techstore:', techstoreOrdersError.message);
    } else {
      console.log(`📊 Pedidos del techstore: ${techstoreOrders.length}`);
      techstoreOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: ${order.id.substring(0, 8)}... Cliente: ${order.user_id.substring(0, 8)}... Estado: ${order.status} Total: $${(order.total_cents / 100).toFixed(2)}`);
      });
    }
    
    // Verificar pedidos específicos entre comprador1 y techstore
    console.log('\n🔍 Verificando pedidos específicos entre comprador1 y techstore...');
    
    const { data: specificOrders, error: specificOrdersError } = await supabase
      .from('orders')
      .select('id, total_cents, status, created_at, user_id, seller_id')
      .eq('user_id', comprador1Id)
      .eq('seller_id', techstoreId)
      .order('created_at', { ascending: false });

    if (specificOrdersError) {
      console.error('❌ Error obteniendo pedidos específicos:', specificOrdersError.message);
    } else {
      console.log(`📊 Pedidos entre comprador1 y techstore: ${specificOrders.length}`);
      specificOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: ${order.id.substring(0, 8)}... Estado: ${order.status} Total: $${(order.total_cents / 100).toFixed(2)} Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}`);
      });
    }
    
    // Verificar items de los pedidos
    if (specificOrders && specificOrders.length > 0) {
      console.log('\n📦 Verificando items de los pedidos...');
      
      for (const order of specificOrders) {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, price_cents')
          .eq('order_id', order.id);

        if (orderItemsError) {
          console.error(`❌ Error obteniendo items del pedido ${order.id}:`, orderItemsError.message);
        } else {
          console.log(`📦 Items del pedido ${order.id.substring(0, 8)}:`);
          orderItems.forEach((item, index) => {
            console.log(`   ${index + 1}. Producto: ${item.product_id} Cantidad: ${item.quantity} Precio: $${(item.price_cents / 100).toFixed(2)}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkSpecificUsers();


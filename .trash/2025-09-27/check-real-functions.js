import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRealFunctions() {
  try {
    console.log('🔍 Verificando funciones reales del sistema...');
    
    // 1. Verificar funciones RPC disponibles
    console.log('\n🔧 Probando función place_order...');
    
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1@gmail.com
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore.digital@gmail.com
    
    // 2. Verificar si existe la función place_order
    console.log('📋 Verificando función place_order...');
    
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_user_id: comprador1Id,
        p_seller_id: techstoreId,
        p_payment_method: 'efectivo'
      });
      
      if (error) {
        console.log('⚠️ Función place_order no funciona:', error.message);
      } else {
        console.log('✅ Función place_order existe y funciona:', data);
      }
    } catch (err) {
      console.log('❌ Error probando place_order:', err.message);
    }
    
    // 3. Verificar funciones de confirmación
    console.log('\n🔧 Probando función confirm_delivery_by_seller...');
    
    try {
      const { data, error } = await supabase.rpc('confirm_delivery_by_seller', {
        p_order_id: 'test-uuid',
        p_seller_id: techstoreId
      });
      
      if (error) {
        if (error.message.includes('Pedido no encontrado')) {
          console.log('✅ Función confirm_delivery_by_seller existe (error esperado: pedido no encontrado)');
        } else {
          console.log('⚠️ Función confirm_delivery_by_seller error:', error.message);
        }
      } else {
        console.log('✅ Función confirm_delivery_by_seller funciona:', data);
      }
    } catch (err) {
      console.log('❌ Error probando confirm_delivery_by_seller:', err.message);
    }
    
    // 4. Verificar función de recepción
    console.log('\n🔧 Probando función confirm_receipt_by_buyer...');
    
    try {
      const { data, error } = await supabase.rpc('confirm_receipt_by_buyer', {
        p_order_id: 'test-uuid',
        p_buyer_id: comprador1Id
      });
      
      if (error) {
        if (error.message.includes('Pedido no encontrado')) {
          console.log('✅ Función confirm_receipt_by_buyer existe (error esperado: pedido no encontrado)');
        } else {
          console.log('⚠️ Función confirm_receipt_by_buyer error:', error.message);
        }
      } else {
        console.log('✅ Función confirm_receipt_by_buyer funciona:', data);
      }
    } catch (err) {
      console.log('❌ Error probando confirm_receipt_by_buyer:', err.message);
    }
    
    // 5. Verificar tablas del sistema de recompensas
    console.log('\n📊 Verificando tablas del sistema de recompensas...');
    
    // Verificar seller_rewards_config
    try {
      const { data: rewardsConfig, error: rewardsError } = await supabase
        .from('seller_rewards_config')
        .select('*')
        .eq('seller_id', techstoreId)
        .eq('is_active', true);
      
      if (rewardsError) {
        console.log('❌ Error verificando seller_rewards_config:', rewardsError.message);
      } else {
        console.log('📋 Sistema de recompensas para techstore:', rewardsConfig);
      }
    } catch (err) {
      console.log('❌ Error verificando sistema de recompensas:', err.message);
    }
    
    // Verificar user_points
    try {
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', comprador1Id);
      
      if (pointsError) {
        console.log('❌ Error verificando user_points:', pointsError.message);
      } else {
        console.log('🎯 Puntos de comprador1:', userPoints);
      }
    } catch (err) {
      console.log('❌ Error verificando puntos:', err.message);
    }
    
    // 6. Verificar carrito existente
    console.log('\n🛒 Verificando carrito existente...');
    
    try {
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('*, cart_items(*)')
        .eq('user_id', comprador1Id)
        .eq('seller_id', techstoreId);
      
      if (cartError) {
        console.log('❌ Error verificando carrito:', cartError.message);
      } else {
        console.log('🛒 Carrito existente:', cart);
      }
    } catch (err) {
      console.log('❌ Error verificando carrito:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkRealFunctions();


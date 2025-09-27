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

async function createRealOrder() {
  try {
    console.log('🛒 Creando pedido REAL usando el flujo completo...');
    
    const comprador1Id = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1@gmail.com
    const techstoreId = '8f0a8848-8647-41e7-b9d0-323ee000d379'; // techstore.digital@gmail.com
    
    console.log(`👤 Comprador: ${comprador1Id}`);
    console.log(`🏪 Vendedor: ${techstoreId}`);
    
    // 1. Limpiar carrito existente si tiene items
    console.log('\n🧹 Limpiando carrito existente...');
    
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', comprador1Id)
      .eq('seller_id', techstoreId)
      .single();
    
    if (existingCart) {
      await supabase.from('cart_items').delete().eq('cart_id', existingCart.id);
      console.log('✅ Carrito limpiado');
    }
    
    // 2. Agregar productos al carrito para hacer pedido de >$5000
    console.log('\n🛒 Agregando productos al carrito...');
    
    // Obtener algunos productos reales o crear productos de ejemplo
    let products;
    
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id, title, price_cents')
      .limit(3);
    
    if (productsError || !existingProducts || existingProducts.length === 0) {
      console.log('⚠️ No hay productos, creando productos de ejemplo...');
      
      // Crear productos de ejemplo con UUIDs válidos
      const exampleProducts = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          title: 'Cable USB-C Premium',
          price_cents: 250000, // $2,500
          description: 'Cable USB-C de alta velocidad',
          image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Cable+USB-C'
        },
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 
          title: 'Power Bank 20000mAh',
          price_cents: 350000, // $3,500
          description: 'Batería portátil de alta capacidad',
          image_url: 'https://via.placeholder.com/300x200/059669/ffffff?text=Power+Bank'
        }
      ];
      
      for (const product of exampleProducts) {
        await supabase.from('products').upsert(product, { onConflict: 'id' });
      }
      
      console.log('✅ Productos de ejemplo creados');
      
      // Usar los productos creados
      products = exampleProducts.map(p => ({ 
        id: p.id, 
        title: p.title, 
        price_cents: p.price_cents 
      }));
    } else {
      products = existingProducts;
    }
    
    // 3. Agregar items al carrito
    let cartId = existingCart?.id;
    
    if (!cartId) {
      // Crear carrito si no existe
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert({
          user_id: comprador1Id,
          seller_id: techstoreId
        })
        .select()
        .single();
      
      if (cartError) {
        console.error('❌ Error creando carrito:', cartError);
        return;
      }
      
      cartId = newCart.id;
    }
    
    console.log(`📦 Carrito ID: ${cartId}`);
    
    // Agregar items que sumen >$5000 para activar puntos
    const cartItems = [
      {
        cart_id: cartId,
        product_id: products[0].id,
        title: products[0].title,
        price_cents: products[0].price_cents,
        qty: 2 // 2x $2,500 = $5,000
      },
      {
        cart_id: cartId,
        product_id: products[1]?.id || products[0].id,
        title: products[1]?.title || products[0].title + ' Extra',
        price_cents: products[1]?.price_cents || 150000,
        qty: 1 // 1x $3,500 = $3,500
      }
    ];
    
    const { error: itemsError } = await supabase
      .from('cart_items')
      .insert(cartItems);
    
    if (itemsError) {
      console.error('❌ Error agregando items al carrito:', itemsError);
      return;
    }
    
    const totalCents = cartItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
    console.log(`✅ Items agregados al carrito - Total: $${(totalCents / 100).toFixed(2)}`);
    
    // 4. Crear pedido usando función place_order
    console.log('\n📋 Creando pedido usando función place_order...');
    
    const { data: orderResult, error: orderError } = await supabase.rpc('place_order', {
      p_user_id: comprador1Id,
      p_seller_id: techstoreId,
      p_payment_method: 'efectivo'
    });
    
    if (orderError) {
      console.error('❌ Error creando pedido:', orderError);
      return;
    }
    
    if (!orderResult.success) {
      console.error('❌ Error en place_order:', orderResult.error);
      return;
    }
    
    console.log('✅ Pedido creado exitosamente!');
    console.log('📋 Resultado:', {
      orderId: orderResult.orderId,
      totalCents: orderResult.totalCents,
      total: `$${(orderResult.totalCents / 100).toFixed(2)}`,
      pointsAdded: orderResult.pointsAdded
    });
    
    // 5. Actualizar estado a confirmed para simular que el vendedor confirmó
    console.log('\n🔄 Confirmando pedido automáticamente...');
    
    const { error: confirmError } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderResult.orderId);
    
    if (confirmError) {
      console.error('❌ Error confirmando pedido:', confirmError);
    } else {
      console.log('✅ Pedido confirmado (estado: confirmed)');
      
      // Crear notificación para el comprador
      await supabase.from('notifications').insert({
        user_id: comprador1Id,
        type: 'order_confirmed',
        title: '¡Pedido Confirmado!',
        message: `Tu pedido por $${(orderResult.totalCents / 100).toFixed(2)} ha sido confirmado por TechStore`,
        order_id: orderResult.orderId,
        is_read: false
      });
    }
    
    console.log('\n🎯 PEDIDO REAL CREADO EXITOSAMENTE!');
    console.log('📊 Resumen:');
    console.log(`   - Pedido ID: ${orderResult.orderId}`);
    console.log(`   - Total: $${(orderResult.totalCents / 100).toFixed(2)}`);
    console.log(`   - Estado: confirmed (en preparación)`);
    console.log(`   - Puntos al confirmar entrega: Se calculan automáticamente`);
    console.log(`   - Sistema de recompensas: ACTIVO (>$5,000)`);
    
    console.log('\n🌐 Ahora puedes:');
    console.log('1. Ver el pedido en el dashboard del vendedor (/dashboard/pedidos)');
    console.log('2. Ver el pedido en Mis Pedidos del comprador (/mis-pedidos)');
    console.log('3. El vendedor puede marcar como "entregado" usando confirm_delivery_by_seller');
    console.log('4. El comprador recibirá puntos automáticamente al confirmarse la entrega');
    
    return orderResult.orderId;
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createRealOrder();

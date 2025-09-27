// Script para probar el flujo completo: búsqueda → carrito → checkout
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

async function testCompleteFlow() {
  try {
    console.log('🧪 Probando flujo completo: búsqueda → carrito → checkout...');
    
    // 1. Simular producto de búsqueda (como lo hace SearchBarAI)
    const searchProduct = {
      id: 'hotdog-fallback',
      title: 'Perro Caliente',
      description: 'Hot dog con todos los ingredientes',
      price: 2500,
      image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&h=300&q=80',
      category: 'Comida',
      vendor: 'Max Snack'
    };
    
    console.log('🔍 Producto de búsqueda:', searchProduct);
    
    // 2. Simular item del carrito (como lo crea SearchBarAI)
    const cartItem = {
      id: searchProduct.id,
      title: searchProduct.title,
      price: searchProduct.price,
      image: searchProduct.image_url,
      vendor: searchProduct.vendor,
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    
    console.log('🛒 Item del carrito:', cartItem);
    
    // 3. Simular conversión del checkout (como lo hace Checkout.tsx)
    const formattedItem = {
      id: cartItem.id,
      cartId: 'local',
      productId: cartItem.id,
      title: cartItem.title,
      priceCents: cartItem.price, // Ya está en pesos
      quantity: cartItem.quantity,
      sellerId: 'df33248a-5462-452b-a4f1-5d17c8c05a51', // UUID existente
      sellerName: cartItem.vendor,
      totalCents: cartItem.price * cartItem.quantity
    };
    
    console.log('📋 Item formateado para checkout:', formattedItem);
    
    // 4. Simular envío al backend
    const cartItems = [formattedItem];
    const totalCents = cartItems.reduce((sum, item) => {
      const price = Number(item.priceCents) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    
    console.log('💰 Total calculado:', totalCents);
    
    // 5. Crear orden en la base de datos
    const clientUuid = '98e2217c-5c17-4970-a7d1-ae1bea6d3027';
    const sellerUuid = 'df33248a-5462-452b-a4f1-5d17c8c05a51';
    
    console.log('🔧 Creando orden...');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: clientUuid,
        seller_id: sellerUuid,
        total_cents: totalCents,
        status: 'pending',
        payment_method: 'cash',
        delivery_cents: 0,
        delivery_address: JSON.stringify({
          fullName: 'Cliente de Prueba',
          phone: '+56 9 1234 5678',
          address: 'Dirección de Prueba 123',
          city: 'Santiago',
          state: 'Región Metropolitana',
          zipCode: '12345'
        }),
        delivery_notes: 'Pedido desde búsqueda con IA',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creando orden:', orderError);
      return;
    }

    console.log('✅ Orden creada exitosamente:', {
      id: order.id,
      total_cents: order.total_cents,
      status: order.status,
      delivery_address: order.delivery_address
    });
    
    // 6. Verificar que el vendedor puede ver la orden
    console.log('🔍 Verificando que el vendedor puede ver la orden...');
    
    const { data: vendorOrders, error: vendorError } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerUuid)
      .order('created_at', { ascending: false })
      .limit(5);

    if (vendorError) {
      console.log('⚠️ Error consultando órdenes del vendedor:', vendorError.message);
    } else {
      console.log('✅ Órdenes del vendedor encontradas:', vendorOrders.length);
      vendorOrders.forEach((order, index) => {
        console.log(`📋 Orden ${index + 1}:`, {
          id: order.id,
          total_cents: order.total_cents,
          status: order.status,
          created_at: order.created_at
        });
      });
    }
    
    console.log('🎉 ¡Flujo completo probado exitosamente!');
    console.log('📋 Orden ID:', order.id);
    console.log('💰 Total:', totalCents);
    console.log('🏪 Vendedor:', sellerUuid);
    
    // Limpiar datos de prueba
    console.log('🧹 Limpiando datos de prueba...');
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testCompleteFlow();


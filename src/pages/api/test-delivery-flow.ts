// Endpoint para probar el flujo completo de delivery
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { notifySellerNewOrder, notifyCourierNewOffer, notifyDeliveryConfirmed, notifyPickupConfirmed, notifyDeliveryCompleted } from '../../server/whatsapp-simple';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { 
      sellerPhone, 
      courierPhone, 
      buyerPhone, 
      testStep 
    } = await request.json();

    if (!sellerPhone || !courierPhone || !buyerPhone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Se requieren los 3 números de teléfono'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orderId = `TEST_${Date.now()}`;
    const deliveryId = `DELIVERY_${Date.now()}`;

    switch (testStep) {
      case 'new_order':
        await notifySellerNewOrder(sellerPhone, orderId);
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Notificación enviada al vendedor (${sellerPhone})`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'courier_offer':
        await notifyCourierNewOffer(courierPhone, deliveryId, 'Calle Test 123, Santiago');
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Oferta enviada al repartidor (${courierPhone})`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'delivery_confirmed':
        await notifyDeliveryConfirmed(sellerPhone, buyerPhone, deliveryId);
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Confirmación enviada a vendedor y comprador`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'pickup_confirmed':
        await notifyPickupConfirmed(sellerPhone, buyerPhone, deliveryId);
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Recogida confirmada a vendedor y comprador`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'delivery_completed':
        await notifyDeliveryCompleted(sellerPhone, buyerPhone, deliveryId);
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Entrega completada a vendedor y comprador`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'full_flow':
        // Probar flujo completo
        await notifySellerNewOrder(sellerPhone, orderId);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        
        await notifyCourierNewOffer(courierPhone, deliveryId, 'Calle Test 123, Santiago');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryConfirmed(sellerPhone, buyerPhone, deliveryId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyPickupConfirmed(sellerPhone, buyerPhone, deliveryId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await notifyDeliveryCompleted(sellerPhone, buyerPhone, deliveryId);
        
        return new Response(JSON.stringify({
          success: true,
          message: `✅ Flujo completo probado - Revisa los WhatsApp`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'testStep inválido. Usa: new_order, courier_offer, delivery_confirmed, pickup_confirmed, delivery_completed, full_flow'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};



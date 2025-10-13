import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración de Supabase faltante'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { paymentId, approved, rejectionReason } = body;

    if (!paymentId || typeof approved !== 'boolean') {
      return new Response(JSON.stringify({
        success: false,
        error: 'paymentId y approved son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('🔍 Validando comprobante:', { paymentId, approved, rejectionReason });

    // Obtener información del pago y verificar que el vendedor tenga permisos
    const { data: paymentInfo, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        order_id,
        status,
        amount_cents,
        transfer_receipt_url,
        transfer_details,
        orders!inner(
          id,
          user_id,
          seller_id,
          status,
          payment_status,
          total_cents
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !paymentInfo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pago no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    const order = paymentInfo.orders;

    // Verificar que el pago esté pendiente de revisión
    if (paymentInfo.status !== 'pending_review') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pago no está pendiente de revisión'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el pedido pertenezca al vendedor (esto se haría con autenticación en producción)
    // Por ahora permitimos cualquier validación, pero en producción se validaría con auth.uid()

    console.log('✅ Validando pago:', {
      paymentId,
      orderId: order.id,
      sellerId: order.seller_id,
      buyerId: order.user_id,
      amount: paymentInfo.amount_cents
    });

    // Llamar a la función SQL para validar el comprobante
    const { data, error } = await supabase.rpc('validate_transfer_receipt', {
      p_payment_id: paymentId,
      p_reviewer_id: order.seller_id, // En producción sería el ID del usuario autenticado
      p_approved: approved,
      p_rejection_reason: rejectionReason || null
    });

    if (error) {
      console.error('❌ Error validando comprobante:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error validando comprobante: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!data.success) {
      return new Response(JSON.stringify({
        success: false,
        error: data.error || 'Error validando comprobante'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const action = approved ? 'aprobado' : 'rechazado';
    console.log(`✅ Comprobante ${action}:`, paymentId);

    return new Response(JSON.stringify({
      success: true,
      payment_id: paymentId,
      approved,
      message: `Comprobante ${action} exitosamente`,
      order_id: order.id
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en validate-receipt:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Endpoint para obtener pagos pendientes de revisión
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const sellerId = url.searchParams.get('sellerId');

    if (!sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'sellerId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener pagos pendientes de revisión para el vendedor
    const { data: pendingPayments, error } = await supabase
      .from('pending_payments_view')
      .select('*')
      .eq('seller_id', sellerId)
      .order('payment_created_at', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo pagos pendientes:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo pagos pendientes'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payments: pendingPayments || [],
      count: pendingPayments?.length || 0
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en GET validate-receipt:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};











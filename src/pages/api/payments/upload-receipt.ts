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

    // Parsear el cuerpo de la petición
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const transferDetails = formData.get('transferDetails') as string;
    const file = formData.get('receipt') as File;

    if (!orderId || !file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId y archivo de comprobante son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('📤 Subiendo comprobante para pedido:', orderId);

    // Verificar que el pedido existe y pertenece al usuario
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status, payment_status, expires_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Pedido no encontrado'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el pedido no haya expirado
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pedido ha expirado'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el estado del pedido permita subir comprobante
    if (order.status !== 'placed' || order.payment_status !== 'pending') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El pedido no está en estado válido para subir comprobante'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `receipts/${orderId}/${Date.now()}.${fileExt}`;

    // Convertir archivo a buffer
    const fileBuffer = await file.arrayBuffer();

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error subiendo comprobante: ' + uploadError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    const receiptUrl = urlData.publicUrl;

    // Parsear detalles de transferencia
    let transferDetailsJson = {};
    try {
      transferDetailsJson = transferDetails ? JSON.parse(transferDetails) : {};
    } catch (e) {
      console.warn('⚠️ Error parseando transferDetails:', e);
    }

    // Actualizar el pago con el comprobante
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        transfer_receipt_url: receiptUrl,
        transfer_details: transferDetailsJson,
        status: 'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select('id')
      .single();

    if (paymentError) {
      console.error('❌ Error actualizando pago:', paymentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando información del pago'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Actualizar estado del pedido
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('❌ Error actualizando pedido:', orderUpdateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando estado del pedido'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Crear notificación para el vendedor
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: order.seller_id,
        type: 'payment_receipt_uploaded',
        title: 'Comprobante de pago subido',
        message: `El comprador ha subido un comprobante de transferencia para el pedido #${orderId}. Revisa y confirma el pago.`,
        order_id: orderId
      });

    if (notificationError) {
      console.warn('⚠️ Error creando notificación:', notificationError);
    }

    console.log('✅ Comprobante subido exitosamente:', receiptUrl);

    return new Response(JSON.stringify({
      success: true,
      receipt_url: receiptUrl,
      payment_id: payment.id,
      message: 'Comprobante subido exitosamente. El vendedor revisará tu pago.'
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en upload-receipt:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Endpoint para obtener URL presignada (opcional, para subida directa desde el cliente)
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'orderId es requerido'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generar nombre único para el archivo
    const fileName = `receipts/${orderId}/${Date.now()}`;

    // Generar URL presignada para subida
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUploadUrl(fileName, 3600); // 1 hora de validez

    if (error) {
      console.error('❌ Error generando URL presignada:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error generando URL de subida'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      signed_url: data.signedUrl,
      path: data.path,
      expires_in: 3600
    }), { 
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en GET upload-receipt:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};






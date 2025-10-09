import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Verificando comprobantes de transferencia...');
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar todas las órdenes con método de pago 'transfer'
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, payment_method, transfer_proof, created_at, total_cents')
      .eq('payment_method', 'transfer')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error consultando órdenes:', ordersError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error consultando órdenes: ' + ordersError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`📊 Órdenes con transferencia encontradas: ${orders?.length || 0}`);
    
    // Analizar cada orden
    const ordersWithProof = orders?.filter(order => order.transfer_proof) || [];
    const ordersWithoutProof = orders?.filter(order => !order.transfer_proof) || [];
    
    console.log(`✅ Órdenes con comprobante: ${ordersWithProof.length}`);
    console.log(`❌ Órdenes sin comprobante: ${ordersWithoutProof.length}`);
    
    // Log de órdenes sin comprobante para debugging
    if (ordersWithoutProof.length > 0) {
      console.log('⚠️ Órdenes sin comprobante:');
      ordersWithoutProof.forEach(order => {
        console.log(`  - ${order.id.substring(0, 8)}: ${order.created_at} - Total: $${(order.total_cents / 100).toFixed(2)}`);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        ordersWithTransfer: orders?.length || 0,
        ordersWithProof: ordersWithProof.length,
        ordersWithoutProof: ordersWithoutProof.length,
        orders: orders?.map(order => ({
          id: order.id,
          payment_method: order.payment_method,
          has_transfer_proof: !!order.transfer_proof,
          transfer_proof_length: order.transfer_proof ? order.transfer_proof.length : 0,
          created_at: order.created_at,
          total_cents: order.total_cents
        })) || []
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en check-transfer-proofs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

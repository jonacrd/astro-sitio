import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
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
    
    const body = await request.json();
    const { productId, category } = body;

    if (!productId || !category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'productId y category son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`🔄 Actualizando categoría del producto ${productId} a: ${category}`);

    // Actualizar la categoría del producto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        category: category,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando categoría:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando categoría: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('✅ Categoría actualizada:', updatedProduct);

    return new Response(JSON.stringify({
      success: true,
      data: {
        product: updatedProduct,
        message: `Categoría actualizada a ${category}`
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/products/update-category:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};









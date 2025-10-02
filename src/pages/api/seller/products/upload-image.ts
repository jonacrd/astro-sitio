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

    // Usar service role key para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no autenticado'
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que es vendedor
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single();

    if (!profile?.is_seller) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos de vendedor'
      }), { 
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Archivo y productId son requeridos'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Verificar que el producto pertenece al vendedor
    const { data: existingProduct, error: fetchError } = await supabase
      .from('seller_products')
      .select('id, product:products!inner(id)')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single();

    if (fetchError || !existingProduct) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Producto no encontrado o no tienes permisos'
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${existingProduct.product.id}/${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error subiendo imagen: ' + uploadError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Actualizar producto con la nueva imagen
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', existingProduct.product.id);

    if (updateError) {
      console.error('Error actualizando imagen del producto:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando imagen del producto: ' + updateError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        imageUrl: publicUrl,
        fileName: fileName
      },
      message: 'Imagen subida exitosamente'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/seller/products/upload-image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};








import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Supabase environment variables not configured.'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Verificar autenticación
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const sellerId = formData.get('sellerId') as string;

    if (!file || !productId || !sellerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'file, productId y sellerId son requeridos'
      }), { status: 400 });
    }

    // Verificar que el vendedor tiene acceso al producto
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: sellerProduct, error: sellerProductError } = await supabaseAdmin
      .from('seller_products')
      .select('id')
      .eq('seller_id', user.id)
      .eq('product_id', productId)
      .single();

    if (sellerProductError || !sellerProduct) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para modificar este producto'
      }), { status: 403 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG y WebP'
      }), { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB'
      }), { status: 400 });
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${productId}/${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error subiendo archivo: ' + uploadError.message
      }), { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Actualizar la imagen del producto en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ image_url: urlData.publicUrl })
      .eq('id', productId);

    if (updateError) {
      console.error('Error actualizando producto:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando producto: ' + updateError.message
      }), { status: 500 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        url: urlData.publicUrl,
        fileName: fileName,
        productId: productId
      }
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en /api/upload/image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};









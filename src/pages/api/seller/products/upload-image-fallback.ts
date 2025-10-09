import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }), 
        { status: 401 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó ningún archivo' }), 
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de archivo no permitido. Solo: JPEG, PNG, WEBP, GIF' }), 
        { status: 400 }
      );
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'El archivo es demasiado grande. Máximo 5MB' }), 
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log('📤 Subiendo imagen (fallback):', fileName);

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Intentar subir a diferentes buckets
    const buckets = ['product-images', 'images', 'public'];
    let uploadSuccess = false;
    let finalUrl = '';
    let errorMessage = '';

    for (const bucketName of buckets) {
      try {
        console.log(`🔄 Intentando bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.log(`❌ Error en bucket ${bucketName}:`, error.message);
          errorMessage = error.message;
          continue;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        console.log(`✅ Imagen subida exitosamente en bucket: ${bucketName}`);
        finalUrl = urlData.publicUrl;
        uploadSuccess = true;
        break;

      } catch (bucketError: any) {
        console.log(`❌ Error con bucket ${bucketName}:`, bucketError.message);
        errorMessage = bucketError.message;
        continue;
      }
    }

    if (!uploadSuccess) {
      // Si no se pudo subir a ningún bucket, usar imagen placeholder
      console.log('⚠️ No se pudo subir a ningún bucket, usando placeholder');
      finalUrl = '/images/placeholder.jpg';
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: finalUrl,
        fileName: fileName,
        bucket: uploadSuccess ? 'success' : 'fallback',
        message: uploadSuccess ? 'Imagen subida exitosamente' : 'Usando imagen placeholder'
      }), 
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error en /api/seller/products/upload-image-fallback:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }), 
      { status: 500 }
    );
  }
};



import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      title,
      description,
      category,
      imageUrl,
      price,
      stock,
      inventoryMode = 'count',
      active = true
    } = body;

    // Validar datos requeridos
    if (!title || !category || !price) {
      return new Response(
        JSON.stringify({ error: 'Título, categoría y precio son requeridos' }), 
        { status: 400 }
      );
    }

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

    const sellerId = user.id;

    console.log('🆕 Creando producto personalizado:', {
      sellerId,
      title,
      category,
      price,
      inventoryMode
    });

    // 1. Crear el producto en la tabla `products`
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        category: category,
        image_url: imageUrl || '/images/placeholder.jpg',
        created_by: sellerId // Marcar quién creó este producto
      })
      .select()
      .single();

    if (productError) {
      console.error('❌ Error creando producto:', productError);
      return new Response(
        JSON.stringify({ error: 'Error creando producto: ' + productError.message }), 
        { status: 400 }
      );
    }

    console.log('✅ Producto creado:', newProduct.id);

    // 2. Crear la relación en `seller_products`
    const priceCents = Math.round(parseFloat(price) * 100);
    const stockValue = inventoryMode === 'count' ? parseInt(stock || 0) : 0;

    const { data: sellerProduct, error: sellerProductError } = await supabase
      .from('seller_products')
      .insert({
        seller_id: sellerId,
        product_id: newProduct.id,
        price_cents: priceCents,
        stock: stockValue,
        active: active,
        inventory_mode: inventoryMode,
        available_today: inventoryMode === 'availability' ? false : null,
        portion_limit: null,
        portion_used: 0,
        sold_out: inventoryMode === 'availability' ? false : null
      })
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (sellerProductError) {
      console.error('❌ Error vinculando producto al vendedor:', sellerProductError);
      
      // Rollback: eliminar el producto creado
      await supabase
        .from('products')
        .delete()
        .eq('id', newProduct.id);

      return new Response(
        JSON.stringify({ error: 'Error vinculando producto: ' + sellerProductError.message }), 
        { status: 400 }
      );
    }

    console.log('✅ Producto vinculado al vendedor');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Producto creado exitosamente',
        product: sellerProduct
      }), 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Error en /api/seller/products/create-custom:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }), 
      { status: 500 }
    );
  }
};


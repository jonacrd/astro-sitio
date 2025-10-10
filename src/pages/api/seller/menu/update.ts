import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      productId, 
      availableToday, 
      portionLimit, 
      soldOut, 
      prepMinutes,
      batchUpdate // Array de productos para actualización en lote
    } = body;

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

    // Actualización en lote
    if (batchUpdate && Array.isArray(batchUpdate)) {
      const updates = [];
      
      for (const item of batchUpdate) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (item.availableToday !== undefined) {
          updateData.available_today = item.availableToday;
          
          // Si se activa y es un nuevo día, resetear porciones
          if (item.availableToday) {
            updateData.portion_used = 0;
            updateData.sold_out = false;
            updateData.last_available_on = new Date().toISOString().split('T')[0];
          }
        }
        
        if (item.portionLimit !== undefined) {
          updateData.portion_limit = item.portionLimit === '' || item.portionLimit === null 
            ? null 
            : parseInt(item.portionLimit);
        }
        
        if (item.soldOut !== undefined) {
          updateData.sold_out = item.soldOut;
        }
        
        if (item.prepMinutes !== undefined) {
          updateData.prep_minutes = item.prepMinutes === '' || item.prepMinutes === null 
            ? null 
            : parseInt(item.prepMinutes);
        }

        const { error } = await supabase
          .from('seller_products')
          .update(updateData)
          .eq('seller_id', sellerId)
          .eq('product_id', item.productId)
          .eq('inventory_mode', 'availability');

        if (error) {
          updates.push({ productId: item.productId, success: false, error: error.message });
        } else {
          updates.push({ productId: item.productId, success: true });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Actualización en lote completada',
          results: updates
        }), 
        { status: 200 }
      );
    }

    // Actualización individual
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId es requerido' }), 
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (availableToday !== undefined) {
      updateData.available_today = availableToday;
      
      // Si se activa y es un nuevo día, resetear porciones
      if (availableToday) {
        updateData.portion_used = 0;
        updateData.sold_out = false;
        updateData.last_available_on = new Date().toISOString().split('T')[0];
      }
    }
    
    if (portionLimit !== undefined) {
      updateData.portion_limit = portionLimit === '' || portionLimit === null 
        ? null 
        : parseInt(portionLimit);
    }
    
    if (soldOut !== undefined) {
      updateData.sold_out = soldOut;
    }
    
    if (prepMinutes !== undefined) {
      updateData.prep_minutes = prepMinutes === '' || prepMinutes === null 
        ? null 
        : parseInt(prepMinutes);
    }

    const { data, error } = await supabase
      .from('seller_products')
      .update(updateData)
      .eq('seller_id', sellerId)
      .eq('product_id', productId)
      .eq('inventory_mode', 'availability')
      .select()
      .single();

    if (error) {
      console.error('Error actualizando menú:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Producto actualizado correctamente',
        data 
      }), 
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error en /api/seller/menu/update:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }), 
      { status: 500 }
    );
  }
};






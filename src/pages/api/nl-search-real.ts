import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Función mejorada para procesamiento de lenguaje natural
async function parseQueryWithAI(userText: string) {
  const text = userText.toLowerCase();
  
  // Mapeo de sinónimos y variaciones
  const synonymMap = {
    // Comida
    'perro': ['perro caliente', 'hot dog', 'perro'],
    'perros': ['perro caliente', 'hot dog', 'perro'],
    'empanada': ['empanada', 'empanadas'],
    'empanadas': ['empanada', 'empanadas'],
    'hamburguesa': ['hamburguesa', 'hamburguesas', 'burger'],
    'hamburguesas': ['hamburguesa', 'hamburguesas', 'burger'],
    'pizza': ['pizza', 'pizzas'],
    'pizzas': ['pizza', 'pizzas'],
    'arepa': ['arepa', 'arepas'],
    'arepas': ['arepa', 'arepas'],
    'cachapa': ['cachapa', 'cachapas'],
    'cachapas': ['cachapa', 'cachapas'],
    'lasaña': ['lasaña', 'lasagna', 'pasta'],
    'lasagna': ['lasaña', 'lasagna', 'pasta'],
    
    // Bebidas
    'malta': ['malta', 'maltas'],
    'maltas': ['malta', 'maltas'],
    'coca': ['coca cola', 'coca', 'refresco'],
    'cerveza': ['cerveza', 'cervezas', 'beer'],
    'cervezas': ['cerveza', 'cervezas', 'beer'],
    'agua': ['agua', 'aguas'],
    'aguas': ['agua', 'aguas'],
    
    // Alcohol
    'ron': ['ron', 'cacique'],
    'whisky': ['whisky', 'whiskey'],
    'vodka': ['vodka'],
    
    // Postres
    'torta': ['torta', 'tortas', 'cake'],
    'tortas': ['torta', 'tortas', 'cake'],
    'quesillo': ['quesillo', 'flan'],
    'flan': ['flan', 'quesillo'],
    
    // Servicios
    'corte': ['corte de cabello', 'corte', 'peluquería'],
    'manicure': ['manicure', 'manicura'],
    'mecánica': ['mecánica', 'taller', 'revisión'],
    
    // Minimarket
    'pan': ['pan', 'panes'],
    'leche': ['leche', 'lácteos'],
    'huevos': ['huevos', 'huevo'],
    'arroz': ['arroz'],
    'aceite': ['aceite'],
    'azúcar': ['azúcar', 'azucar'],
    'sal': ['sal'],
    'pasta': ['pasta', 'fideos', 'tallarín'],
    'harina': ['harina', 'pan'],
    
    // Ropa
    'polera': ['polera', 'camiseta', 'playera'],
    'jeans': ['jeans', 'pantalón', 'pantalones'],
    'zapatos': ['zapatos', 'zapato', 'calzado'],
    
    // Tecnología
    'audífonos': ['audífonos', 'audifonos', 'auriculares'],
    'cargador': ['cargador', 'cargador usb'],
    'cable': ['cable', 'cable usb'],
    
    // Palabras de entrega
    'delivery': ['delivery', 'domicilio', 'a domicilio'],
    'domicilio': ['delivery', 'domicilio', 'a domicilio'],
    'envío': ['delivery', 'domicilio', 'envío'],
    'entrega': ['delivery', 'domicilio', 'entrega'],
    
    // Palabras de precio
    'barato': ['barato', 'económico', 'económico', 'barata', 'baratos', 'baratas'],
    'caro': ['caro', 'costoso', 'cara', 'caros', 'caras'],
    'oferta': ['oferta', 'ofertas', 'descuento', 'descuentos'],
    'promoción': ['promoción', 'promociones', 'promocion', 'promociones'],
    
    // Palabras de cantidad
    'mucho': ['mucho', 'muchos', 'mucha', 'muchas'],
    'poco': ['poco', 'pocos', 'poca', 'pocas'],
    'varios': ['varios', 'varias', 'diferentes', 'diversos'],
    
    // Palabras de tiempo
    'nuevo': ['nuevo', 'nueva', 'nuevos', 'nuevas', 'reciente', 'recientes'],
    'viejo': ['viejo', 'vieja', 'viejos', 'viejas', 'antiguo', 'antigua'],
    
    // Palabras de calidad
    'bueno': ['bueno', 'buena', 'buenos', 'buenas', 'buen', 'buena'],
    'malo': ['malo', 'mala', 'malos', 'malas', 'mal'],
    
    // Palabras de disponibilidad
    'disponible': ['disponible', 'disponibles', 'stock', 'inventario'],
    'agotado': ['agotado', 'agotada', 'agotados', 'agotadas', 'sin stock'],
    
    // Palabras de ubicación
    'cerca': ['cerca', 'cercano', 'cercana', 'cercanos', 'cercanas'],
    'lejos': ['lejos', 'lejano', 'lejana', 'lejanos', 'lejanas'],
    
    // Palabras de categoría
    'comida': ['comida', 'alimento', 'alimentos', 'comestible', 'comestibles'],
    'bebida': ['bebida', 'bebidas', 'líquido', 'líquidos', 'liquido', 'liquidos'],
    'ropa': ['ropa', 'vestimenta', 'vestido', 'vestidos', 'prenda', 'prendas'],
    'servicio': ['servicio', 'servicios', 'atención', 'atencion'],
    'producto': ['producto', 'productos', 'artículo', 'articulo', 'artículos', 'articulos']
  };

  // Extraer términos de búsqueda
  const words = text.split(/\s+/);
  const terms = [];
  
  for (const word of words) {
    if (synonymMap[word]) {
      terms.push(...synonymMap[word]);
    } else {
      terms.push(word);
    }
  }

  // Detectar categoría
  let category = null;
  const categoryKeywords = {
    'comida': ['comida', 'alimento', 'comestible', 'cocina', 'cocinar'],
    'bebidas': ['bebida', 'líquido', 'beber', 'tomar'],
    'ropa': ['ropa', 'vestir', 'prenda', 'moda'],
    'servicios': ['servicio', 'atención', 'ayuda', 'trabajo'],
    'minimarket': ['supermercado', 'tienda', 'mercado', 'compras'],
    'tecnologia': ['tecnología', 'tecnologia', 'electrónico', 'electronico', 'digital'],
    'alcohol': ['alcohol', 'licor', 'bebida alcohólica', 'bebida alcoholica'],
    'postres': ['postre', 'dulce', 'torta', 'pastel']
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      category = cat;
      break;
    }
  }

  // Detectar delivery
  const delivery = text.includes('delivery') || text.includes('domicilio') || text.includes('envío') || text.includes('entrega');

  // Detectar solo online
  const onlineOnly = text.includes('online') || text.includes('en línea') || text.includes('en linea');

  // Detectar presupuesto
  let budgetMax = null;
  const budgetMatch = text.match(/(\d+)\s*(pesos?|bs|bolívares?|bolivares?)/i);
  if (budgetMatch) {
    budgetMax = parseInt(budgetMatch[1]) * 100; // Convertir a centavos
  }

  // Detectar cantidad de resultados
  let topK = null;
  const limitMatch = text.match(/(\d+)\s*(resultados?|items?|productos?)/i);
  if (limitMatch) {
    topK = parseInt(limitMatch[1]);
  }

  // Detectar múltiples productos
  const hasMultipleProducts = text.includes('varios') || text.includes('diferentes') || text.includes('diversos') || text.includes('muchos');

  // Detectar búsqueda múltiple
  const isMultipleSearch = text.includes('y') || text.includes('o') || text.includes('también') || text.includes('además');

  return {
    terms,
    category,
    delivery,
    onlineOnly,
    budgetMax,
    topK,
    hasMultipleProducts,
    isMultipleSearch
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const qRaw = (url.searchParams.get('q') || '').trim();
    
    if (!qRaw) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('Text analyzed:', qRaw);
    
    // Procesar query con IA
    const aiResult = await parseQueryWithAI(qRaw);
    console.log('IA parsed query:', aiResult);
    
    // Conectar a Supabase
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas'
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Construir query para buscar productos
    let query = supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          description,
          category,
          image_url
        ),
        seller:profiles!inner(
          id,
          name,
          phone
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    // Aplicar filtros basados en análisis de IA
    if (aiResult.category) {
      query = query.eq('product.category', aiResult.category);
    }

    // Buscar por términos en título y descripción
    if (aiResult.terms.length > 0) {
      const searchTerms = aiResult.terms.join(' | ');
      query = query.or(`product.title.ilike.%${searchTerms}%,product.description.ilike.%${searchTerms}%`);
    }

    // Filtrar por presupuesto si se especifica
    if (aiResult.budgetMax) {
      query = query.lte('price_cents', aiResult.budgetMax);
    }

    // Ordenar por stock
    query = query.order('stock', { ascending: false });

    // Aplicar límite
    const limit = aiResult.topK || 10;
    query = query.limit(limit);

    const { data: products, error } = await query;

    if (error) {
      console.error('Error obteniendo productos:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + error.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('Inventory count:', products?.length || 0);
    console.log('Filtered results count:', products?.length || 0);

    // Obtener estados online de los vendedores
    const sellerIds = products?.map(item => item.seller_id) || [];
    let sellerStatuses = {};
    
    if (sellerIds.length > 0) {
      const { data: statuses } = await supabase
        .from('seller_status')
        .select('seller_id, online')
        .in('seller_id', sellerIds);
      
      sellerStatuses = statuses?.reduce((acc, status) => {
        acc[status.seller_id] = status.online;
        return acc;
      }, {}) || {};
    }

    // Formatear resultados
    const results = products?.map(item => ({
      productId: item.product_id,
      productTitle: item.product.title,
      category: item.product.category,
      priceCents: item.price_cents,
      price: `$${(item.price_cents / 100).toFixed(2)}`,
      imageUrl: item.product.image_url,
      sellerId: item.seller_id,
      sellerName: item.seller.name,
      online: sellerStatuses[item.seller_id] || false,
      delivery: sellerStatuses[item.seller_id] || false, // Asumimos que vendedores online hacen delivery
      stock: item.stock,
      sellerProductId: `${item.seller_id}::${item.product_id}`,
      productUrl: `/producto/${item.product_id}?seller=${item.seller_id}`,
      addToCartUrl: `/api/cart/add?sellerProductId=${item.seller_id}::${item.product_id}&qty=1`
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        query: qRaw,
        aiAnalysis: aiResult,
        results: results,
        total: results.length
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

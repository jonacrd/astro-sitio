import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Función mejorada para procesamiento de lenguaje natural
async function parseQueryWithAI(userText: string) {
  const text = userText.toLowerCase();
  
  // Mapeo de sinónimos y variaciones MEJORADO
  const synonymMap = {
    // Comida - Lenguaje natural chileno
    'perro': ['perro caliente', 'hot dog', 'perro', 'completo', 'completos'],
    'perros': ['perro caliente', 'hot dog', 'perro', 'completo', 'completos'],
    'completo': ['perro caliente', 'hot dog', 'perro', 'completo', 'completos'],
    'completos': ['perro caliente', 'hot dog', 'perro', 'completo', 'completos'],
    'empanada': ['empanada', 'empanadas', 'empanadita', 'empanaditas'],
    'empanadas': ['empanada', 'empanadas', 'empanadita', 'empanaditas'],
    'hamburguesa': ['hamburguesa', 'hamburguesas', 'burger', 'hamburguesita'],
    'hamburguesas': ['hamburguesa', 'hamburguesas', 'burger', 'hamburguesita'],
    'pizza': ['pizza', 'pizzas', 'pizzita', 'pizzitas'],
    'pizzas': ['pizza', 'pizzas', 'pizzita', 'pizzitas'],
    'arepa': ['arepa', 'arepas', 'arepita', 'arepitas'],
    'arepas': ['arepa', 'arepas', 'arepita', 'arepitas'],
    'cachapa': ['cachapa', 'cachapas', 'cachapita', 'cachapitas'],
    'cachapas': ['cachapa', 'cachapas', 'cachapita', 'cachapitas'],
    'lasaña': ['lasaña', 'lasagna', 'pasta', 'pastas'],
    'lasagna': ['lasaña', 'lasagna', 'pasta', 'pastas'],
    'pasta': ['pasta', 'pastas', 'fideos', 'fideo'],
    'pastas': ['pasta', 'pastas', 'fideos', 'fideo'],
    'fideos': ['fideos', 'fideo', 'pasta', 'pastas', 'spaghetti', 'espagueti'],
    'fideo': ['fideos', 'fideo', 'pasta', 'pastas', 'spaghetti', 'espagueti'],
    'spaghetti': ['spaghetti', 'espagueti', 'fideos', 'fideo', 'pasta larga'],
    'espagueti': ['spaghetti', 'espagueti', 'fideos', 'fideo', 'pasta larga'],
    'pasta larga': ['spaghetti', 'espagueti', 'fideos', 'fideo', 'pasta larga'],
    'tequeños': ['tequeños', 'tequeño', 'tequeñitos'],
    'tequeño': ['tequeños', 'tequeño', 'tequeñitos'],
    
    // Bebidas - Lenguaje natural chileno
    'malta': ['malta', 'maltas', 'maltita', 'maltitas'],
    'maltas': ['malta', 'maltas', 'maltita', 'maltitas'],
    'coca': ['coca cola', 'coca', 'refresco', 'cola', 'col cola', 'cocacola'],
    'cola': ['coca cola', 'coca', 'refresco', 'cola', 'col cola', 'cocacola'],
    'col cola': ['coca cola', 'coca', 'refresco', 'cola', 'col cola', 'cocacola'],
    'cocacola': ['coca cola', 'coca', 'refresco', 'cola', 'col cola', 'cocacola'],
    'cerveza': ['cerveza', 'cervezas', 'chela', 'chelas', 'birra', 'birras'],
    'cervezas': ['cerveza', 'cervezas', 'chela', 'chelas', 'birra', 'birras'],
    'chela': ['cerveza', 'cervezas', 'chela', 'chelas', 'birra', 'birras'],
    'chelas': ['cerveza', 'cervezas', 'chela', 'chelas', 'birra', 'birras'],
    'agua': ['agua', 'aguas', 'aguita', 'aguas'],
    'aguas': ['agua', 'aguas', 'aguita', 'aguas'],
    
    // Alcohol - Lenguaje natural chileno
    'ron': ['ron', 'cacique', 'roncito'],
    'whisky': ['whisky', 'whiskey', 'wisky', 'wiskey'],
    'wisky': ['whisky', 'whiskey', 'wisky', 'wiskey'],
    'vodka': ['vodka', 'vodkita'],
    
    // Postres - Lenguaje natural chileno
    'torta': ['torta', 'tortas', 'tortita', 'tortitas', 'cake', 'queque'],
    'tortas': ['torta', 'tortas', 'tortita', 'tortitas', 'cake', 'queque'],
    'queque': ['torta', 'tortas', 'tortita', 'tortitas', 'cake', 'queque'],
    'quesillo': ['quesillo', 'flan', 'quesillito'],
    'flan': ['flan', 'quesillo', 'quesillito'],
    
    // Servicios - Lenguaje natural chileno
    'corte': ['corte de cabello', 'corte', 'peluquería', 'peluquero', 'peluquera'],
    'peluquero': ['corte de cabello', 'corte', 'peluquería', 'peluquero', 'peluquera'],
    'peluquera': ['corte de cabello', 'corte', 'peluquería', 'peluquero', 'peluquera'],
    'manicure': ['manicure', 'manicura', 'manicurista'],
    'manicura': ['manicure', 'manicura', 'manicurista'],
    'mecánica': ['mecánica', 'taller', 'revisión', 'mecánico', 'mecanico'],
    'mecánico': ['mecánica', 'taller', 'revisión', 'mecánico', 'mecanico'],
    'mecanico': ['mecánica', 'taller', 'revisión', 'mecánico', 'mecanico'],
    
    // Adjetivos de precio - Lenguaje natural chileno
    'barato': ['barato', 'económico', 'cheap', 'baratito', 'económico'],
    'barata': ['barata', 'económica', 'cheap', 'baratita', 'económica'],
    'baratos': ['baratos', 'económicos', 'cheap', 'baratitos', 'económicos'],
    'baratas': ['baratas', 'económicas', 'cheap', 'baratitas', 'económicas'],
    'baratito': ['barato', 'económico', 'cheap', 'baratito', 'económico'],
    'baratita': ['barata', 'económica', 'cheap', 'baratita', 'económica'],
    'baratitos': ['baratos', 'económicos', 'cheap', 'baratitos', 'económicos'],
    'baratitas': ['baratas', 'económicas', 'cheap', 'baratitas', 'económicas'],
    'caro': ['caro', 'costoso', 'expensive'],
    'cara': ['cara', 'costosa', 'expensive'],
    'caros': ['caros', 'costosos', 'expensive'],
    'caras': ['caras', 'costosas', 'expensive']
  };

  // Detectar categorías - Lenguaje natural chileno
  const categoryKeywords = {
    'comida': [
      'comida', 'alimento', 'alimentos', 'comer', 'cenar', 'almorzar', 'desayunar',
      'empanada', 'hamburguesa', 'pizza', 'arepa', 'cachapa', 'perro', 'lasaña',
      'completo', 'completos', 'fideos', 'pasta', 'spaghetti', 'espagueti', 'tequeños',
      'empanadita', 'empanaditas', 'hamburguesita', 'pizzita', 'arepita', 'cachapita',
      'tequeñitos', 'pastas', 'fideo', 'pasta larga'
    ],
    'bebidas': [
      'bebida', 'bebidas', 'tomar', 'beber', 'refresco', 'refrescos', 'malta', 'coca',
      'cerveza', 'agua', 'cola', 'col cola', 'cocacola', 'chela', 'birra', 'maltita',
      'aguita', 'refresquita'
    ],
    'alcohol': [
      'alcohol', 'ron', 'whisky', 'vodka', 'licor', 'trago', 'cacique', 'roncito',
      'wisky', 'wiskey', 'vodkita', 'birra', 'chela'
    ],
    'postres': [
      'postre', 'torta', 'quesillo', 'flan', 'dulce', 'azúcar', 'chocolate', 'tortita',
      'quesillito', 'queque', 'postrecito'
    ],
    'servicios': [
      'servicio', 'servicios', 'trabajo', 'trabajos', 'oficio', 'oficios', 'corte',
      'manicure', 'mecánica', 'taller', 'peluquería', 'peluquero', 'peluquera',
      'manicura', 'manicurista', 'mecánico', 'mecanico'
    ],
    'minimarket': [
      'minimarket', 'supermercado', 'tienda', 'comestibles', 'abastos', 'pan', 'leche',
      'huevo', 'abarrotes', 'panecito', 'lechecita', 'huevito', 'abarrotito'
    ]
  };

  // Detectar términos de entrega
  const deliveryKeywords = ['delivery', 'domicilio', 'a domicilio', 'entrega', 'llevar'];
  const onlineKeywords = ['online', 'disponible', 'activo', 'abierto'];

  // Detectar presupuesto
  const budgetPattern = /(\d+)\s*(pesos?|bs|bolívares?|dólares?|usd|\$)/i;
  const budgetMatch = text.match(budgetPattern);

  // Procesar texto
  const words = text.split(/\s+/);
  const terms = [];
  let category = null;
  let delivery = null;
  let onlineOnly = null;
  let budgetMax = null;

  for (const word of words) {
    // Buscar en sinónimos
    let found = false;
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (synonyms.some(syn => syn.includes(word) || word.includes(syn))) {
        terms.push(key);
        found = true;
        break;
      }
    }
    
    if (!found && word.length > 2) {
      terms.push(word);
    }

    // Detectar categoría
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
        category = cat;
        break;
      }
    }

    // Detectar entrega
    if (deliveryKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      delivery = true;
    }

    // Detectar online
    if (onlineKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      onlineOnly = true;
    }
  }

  // Procesar presupuesto
  if (budgetMatch) {
    budgetMax = parseInt(budgetMatch[1]) * 100; // Convertir a centavos
  }

  return {
    terms,
    category,
    delivery,
    onlineOnly,
    budgetMax,
    topK: 10,
    hasMultipleProducts: terms.length > 1,
    isMultipleSearch: terms.some(term => term.includes('y') || term.includes('con'))
  };
}

export const GET: APIRoute = async ({ url, request }) => {
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
    
    const qRaw = (url.searchParams.get('q') || '').trim();
    
    if (!qRaw) {
      return new Response(JSON.stringify({
        success: true,
        items: [],
        message: 'Ingresa un término de búsqueda'
      }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    // Procesar consulta con IA
    const aiResult = await parseQueryWithAI(qRaw);

    // Obtener todos los productos activos
    const { data: allProducts, error } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        updated_at,
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

    // Filtrar productos por categoría y presupuesto
    let products = allProducts || [];
    
    if (aiResult.category) {
      products = products.filter(item => item.product.category === aiResult.category);
    }

    if (aiResult.budgetMax) {
      products = products.filter(item => item.price_cents <= aiResult.budgetMax);
    }

    // Filtrar por términos de búsqueda
    let filteredProducts = products || [];
    
    if (aiResult.terms.length > 0) {
      filteredProducts = products?.filter(item => {
        const title = item.product.title.toLowerCase();
        const description = item.product.description?.toLowerCase() || '';
        
        // Búsqueda simple: si el término está en el título o descripción
        return aiResult.terms.some(term => {
          const normalizedTerm = term.toLowerCase().trim();
          return title.includes(normalizedTerm) || description.includes(normalizedTerm);
        });
      }) || [];
    }

    // Obtener estados online de los vendedores
    const sellerIds = filteredProducts.map(item => item.seller_id);
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
    const items = filteredProducts.map(item => ({
      productId: item.product_id,
      productTitle: item.product.title,
      category: item.product.category,
      priceCents: item.price_cents,
      price: `$${(item.price_cents / 100).toFixed(2)}`,
      imageUrl: item.product.image_url,
      sellerId: item.seller_id,
      sellerName: item.seller.name,
      online: sellerStatuses[item.seller_id] || false,
      delivery: true, // Por ahora asumimos que todos tienen delivery
      stock: item.stock,
      sellerProductId: `${item.seller_id}::${item.product_id}`,
      productUrl: `/producto/${item.product_id}?seller=${item.seller_id}`,
      addToCartUrl: `/api/cart/add?sellerProductId=${item.seller_id}::${item.product_id}&qty=1`
    }));

    // Generar mensaje para Landbot
    const lines = [];
    if (items.length > 0) {
      lines.push(`Encontré ${items.length} producto(s) para "${qRaw}":\n`);
      for (const item of items.slice(0, 5)) { // Mostrar máximo 5
        const onlineDot = item.online ? '🟢' : '⚪';
        const del = item.delivery ? ' · delivery' : '';
        lines.push(`${onlineDot} *${item.productTitle}* — ${item.price}`);
        lines.push(`    Vendedor: ${item.sellerName}${del} · stock: ${item.stock}`);
        lines.push(`    👉 Ver: ${item.productUrl}`);
        lines.push(`    🛒 Añadir: ${item.addToCartUrl}`);
        lines.push('');
      }
      if (items.length > 5) {
        lines.push(`... y ${items.length - 5} productos más.`);
      }
      lines.push('¿Te paso el link al vendedor o agrego al carrito?');
    } else {
      lines.push(`No encontré productos para "${qRaw}". ¿Intentas con otra palabra o categoría?`);
    }

    const message = lines.join('\n');

    return new Response(JSON.stringify({
      success: true,
      items,
      message,
      query: {
        original: qRaw,
        parsed: aiResult
      }
    }), {
      headers: { 
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Error en /api/nl-search-real:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
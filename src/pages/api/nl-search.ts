import type { APIRoute } from 'astro';

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
    'panes': ['pan', 'panes'],
    'leche': ['leche'],
    'huevo': ['huevo', 'huevos'],
    'huevos': ['huevo', 'huevos']
  };
  
  // Detectar múltiples productos en la consulta
  const multipleProductKeywords = [
    'y', 'con', 'mas', 'más', 'ademas', 'además', 'tambien', 'también', 
    'mas', 'más', 'unos', 'unas', 'varios', 'varias', 'algunos', 'algunas'
  ];
  
  // Detectar si es una búsqueda múltiple
  const hasMultipleProducts = multipleProductKeywords.some(keyword => text.includes(keyword));
  
  // Detectar categorías con más flexibilidad
  let category = null;
  const categoryKeywords = {
    'comida': ['comida', 'empanada', 'hamburguesa', 'pizza', 'arepa', 'cachapa', 'perro', 'lasaña', 'alimento', 'alimentar', 'comer', 'almuerzo', 'cena', 'desayuno'],
    'bebidas': ['bebida', 'malta', 'coca', 'cerveza', 'agua', 'refresco', 'soda', 'tomar', 'hidratar'],
    'alcohol': ['alcohol', 'ron', 'whisky', 'vodka', 'licor', 'trago', 'beber'],
    'postres': ['postre', 'torta', 'quesillo', 'flan', 'dulce', 'azúcar', 'chocolate'],
    'servicios': ['servicio', 'corte', 'manicure', 'mecánica', 'taller', 'peluquería', 'reparar', 'arreglar'],
    'minimarket': ['minimarket', 'pan', 'leche', 'huevo', 'abarrotes', 'supermercado', 'tienda']
  };
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  // Detectar delivery con más variaciones
  let delivery = null;
  const deliveryKeywords = ['delivery', 'envío', 'domicilio', 'llevar', 'traer', 'entrega', 'a domicilio'];
  if (deliveryKeywords.some(keyword => text.includes(keyword))) {
    delivery = true;
  }
  
  // Detectar online con más variaciones
  let onlineOnly = null;
  const onlineKeywords = ['online', 'disponible ahora', 'abierto', 'activo', 'funcionando', 'trabajando'];
  if (onlineKeywords.some(keyword => text.includes(keyword))) {
    onlineOnly = true;
  }
  
  // Detectar presupuesto mejorado
  let budgetMax = null;
  const budgetMatch = text.match(/(\d+)\s*(pesos?|dolares?|\$)/);
  if (budgetMatch) {
    budgetMax = parseInt(budgetMatch[1]);
  } else if (text.includes('barato') || text.includes('económico') || text.includes('bajo precio') || text.includes('cheap')) {
    budgetMax = 20; // $20 para "barato"
  } else if (text.includes('caro') || text.includes('costoso') || text.includes('expensive')) {
    budgetMax = 100; // $100 para "caro"
  }
  
  // Extraer términos de búsqueda mejorados
  let terms = text.split(/\s+/).filter(term => 
    term.length > 2 && 
    !['con', 'para', 'que', 'del', 'los', 'las', 'una', 'uno', 'algo', 'quiero', 'necesito', 'busco', 'quien', 'donde', 'como', 'tiene', 'vende', 'hay', 'comer', 'beber', 'y', 'mas', 'más', 'ademas', 'además', 'tambien', 'también', 'unos', 'unas', 'varios', 'varias', 'algunos', 'algunas'].includes(term)
  );
  
  // Expandir términos usando sinónimos
  const expandedTerms = [];
  for (const term of terms) {
    if (synonymMap[term]) {
      expandedTerms.push(...synonymMap[term]);
    } else {
      expandedTerms.push(term);
    }
  }
  
  // Si es una búsqueda múltiple, expandir términos automáticamente
  if (hasMultipleProducts && expandedTerms.length > 0) {
    // Agregar términos relacionados para búsqueda múltiple
    const relatedTerms = [];
    for (const term of expandedTerms) {
      if (term.includes('empanada')) {
        relatedTerms.push('hamburguesa', 'arepa', 'pizza');
      } else if (term.includes('hamburguesa')) {
        relatedTerms.push('empanada', 'perro', 'pizza');
      } else if (term.includes('bebida') || term.includes('malta')) {
        relatedTerms.push('cerveza', 'coca', 'agua');
      } else if (term.includes('comida')) {
        relatedTerms.push('empanada', 'hamburguesa', 'arepa', 'pizza', 'perro');
      }
    }
    expandedTerms.push(...relatedTerms);
  }
  
  // Si no hay términos específicos, usar palabras clave generales
  if (expandedTerms.length === 0) {
    if (text.includes('comida') || text.includes('algo') || text.includes('que comer') || text.includes('que hay') || text.includes('para comer') || (text.includes('necesito') && text.includes('algo'))) {
      expandedTerms.push('comida');
    } else if (text.includes('bebida') || text.includes('tomar') || text.includes('para beber') || (text.includes('necesito') && text.includes('beber'))) {
      expandedTerms.push('bebida', 'malta', 'coca', 'cerveza', 'agua'); // Incluir bebidas específicas
    } else if (text.includes('que') && (text.includes('hay') || text.includes('tiene') || text.includes('vende'))) {
      // Consultas generales como "que hay", "que tiene", "que vende"
      expandedTerms.push('comida'); // Por defecto buscar comida
    } else if (text.includes('para comer') || text.includes('que comer')) {
      expandedTerms.push('comida');
    }
  }
  
  // Si la consulta es muy general, expandir términos
  if (expandedTerms.length === 1 && expandedTerms[0] === 'comida') {
    expandedTerms.push('empanada', 'hamburguesa', 'pizza', 'arepa', 'perro'); // Términos de comida comunes
  }
  
  const result = {
    terms: expandedTerms,
    category,
    delivery,
    onlineOnly,
    budgetMax,
    topK: null,
    hasMultipleProducts,
    isMultipleSearch: hasMultipleProducts
  };
  
  console.log('parseQueryWithAI result:', result);
  console.log('Text analyzed:', text);
  console.log('Category detected:', category);
  console.log('Terms extracted:', expandedTerms);
  return result;
}

export const GET: APIRoute = async ({ url }) => {
  const qRaw = (url.searchParams.get('q') || '').trim();
  
  // Base de datos mock expandida
  const PRODUCTS = [
    // Comida
    { id: 'p_emp_queso', title: 'Empanada de queso', category: 'comida', priceCents: 1500, imageUrl: null },
    { id: 'p_emp_carne', title: 'Empanada de carne', category: 'comida', priceCents: 1800, imageUrl: null },
    { id: 'p_emp_pollo', title: 'Empanada de pollo', category: 'comida', priceCents: 1700, imageUrl: null },
    { id: 'p_hamburguesa', title: 'Hamburguesa Clásica', category: 'comida', priceCents: 3500, imageUrl: null },
    { id: 'p_hamburguesa_queso', title: 'Hamburguesa con Queso', category: 'comida', priceCents: 3800, imageUrl: null },
    { id: 'p_perro_caliente', title: 'Perro Caliente', category: 'comida', priceCents: 2000, imageUrl: null },
    { id: 'p_arepa', title: 'Arepa reina pepiada', category: 'comida', priceCents: 2500, imageUrl: null },
    { id: 'p_arepa_huevo', title: 'Arepa de huevo', category: 'comida', priceCents: 2000, imageUrl: null },
    { id: 'p_cachapa', title: 'Cachapa', category: 'comida', priceCents: 2500, imageUrl: null },
    { id: 'p_pizza', title: 'Pizza Margarita', category: 'comida', priceCents: 4500, imageUrl: null },
    { id: 'p_lasagna', title: 'Lasaña', category: 'comida', priceCents: 4200, imageUrl: null },
    
    // Bebidas
    { id: 'p_malta', title: 'Malta 355ml', category: 'bebidas', priceCents: 2200, imageUrl: null },
    { id: 'p_coca_cola', title: 'Coca Cola 500ml', category: 'bebidas', priceCents: 1800, imageUrl: null },
    { id: 'p_cerveza', title: 'Cerveza 355ml', category: 'bebidas', priceCents: 2500, imageUrl: null },
    { id: 'p_agua', title: 'Agua 600ml', category: 'bebidas', priceCents: 800, imageUrl: null },
    
    // Alcohol
    { id: 'p_ron', title: 'Ron Cacique 500ml', category: 'alcohol', priceCents: 4500, imageUrl: null },
    { id: 'p_whisky', title: 'Whisky Johnnie Walker 750ml', category: 'alcohol', priceCents: 25000, imageUrl: null },
    { id: 'p_vodka', title: 'Vodka Absolut 750ml', category: 'alcohol', priceCents: 18000, imageUrl: null },
    
    // Postres
    { id: 'p_tres_leches', title: 'Torta Tres Leches', category: 'postres', priceCents: 3500, imageUrl: null },
    { id: 'p_quesillo', title: 'Quesillo Venezolano', category: 'postres', priceCents: 2800, imageUrl: null },
    { id: 'p_flan', title: 'Flan de Caramelo', category: 'postres', priceCents: 2000, imageUrl: null },
    
    // Servicios
    { id: 'p_corte', title: 'Corte de Cabello', category: 'servicios', priceCents: 8000, imageUrl: null },
    { id: 'p_manicure', title: 'Manicure Completa', category: 'servicios', priceCents: 5000, imageUrl: null },
    { id: 'p_revision_motor', title: 'Revisión de Motor', category: 'servicios', priceCents: 25000, imageUrl: null },
    
    // Minimarket
    { id: 'p_pan', title: 'Pan de Molde', category: 'minimarket', priceCents: 1200, imageUrl: null },
    { id: 'p_leche', title: 'Leche 1L', category: 'minimarket', priceCents: 1500, imageUrl: null },
    { id: 'p_huevos', title: 'Huevos x12', category: 'minimarket', priceCents: 2000, imageUrl: null }
  ];

  const SELLERS = [
    { id: 's1', name: 'Carnes del Zulia', online: true, delivery: true },
    { id: 's2', name: 'Postres y Dulces', online: true, delivery: true },
    { id: 's3', name: 'Licores Premium', online: false, delivery: false },
    { id: 's4', name: 'Belleza y Estilo', online: true, delivery: true },
    { id: 's5', name: 'AutoMecánica Pro', online: true, delivery: false },
    { id: 's6', name: 'Sabores Tradicionales', online: true, delivery: true }
  ];

  const STOCKS = [
    // Carnes del Zulia (s1) - carnes y fiambres
    { sellerId: 's1', productId: 'p_emp_queso', stock: 12, active: true },
    { sellerId: 's1', productId: 'p_emp_carne', stock: 8, active: true },
    { sellerId: 's1', productId: 'p_arepa', stock: 15, active: true },
    { sellerId: 's1', productId: 'p_cachapa', stock: 10, active: true },
    { sellerId: 's1', productId: 'p_malta', stock: 24, active: true },
    { sellerId: 's1', productId: 'p_tres_leches', stock: 6, active: true },
    { sellerId: 's1', productId: 'p_quesillo', stock: 8, active: true },
    
    // Postres y Dulces (s2) - postres y bebidas
    { sellerId: 's2', productId: 'p_hamburguesa', stock: 8, active: true },
    { sellerId: 's2', productId: 'p_hamburguesa_queso', stock: 6, active: true },
    { sellerId: 's2', productId: 'p_perro_caliente', stock: 12, active: true },
    { sellerId: 's2', productId: 'p_pizza', stock: 4, active: true },
    { sellerId: 's2', productId: 'p_coca_cola', stock: 30, active: true },
    { sellerId: 's2', productId: 'p_cerveza', stock: 20, active: true },
    { sellerId: 's2', productId: 'p_corte', stock: 3, active: true },
    
    // La Esquina (s3) - offline
    { sellerId: 's3', productId: 'p_lasagna', stock: 2, active: true },
    { sellerId: 's3', productId: 'p_ron', stock: 5, active: true },
    { sellerId: 's3', productId: 'p_whisky', stock: 2, active: true },
    
    // Express Food (s4) - delivery rápido
    { sellerId: 's4', productId: 'p_emp_pollo', stock: 10, active: true },
    { sellerId: 's4', productId: 'p_arepa_huevo', stock: 12, active: true },
    { sellerId: 's4', productId: 'p_agua', stock: 50, active: true },
    { sellerId: 's4', productId: 'p_flan', stock: 8, active: true },
    
    // Bodega Central (s5) - minimarket
    { sellerId: 's5', productId: 'p_pan', stock: 15, active: true },
    { sellerId: 's5', productId: 'p_leche', stock: 20, active: true },
    { sellerId: 's5', productId: 'p_huevos', stock: 25, active: true },
    { sellerId: 's5', productId: 'p_vodka', stock: 3, active: true },
    
    // Salón Bella (s6) - servicios offline
    { sellerId: 's6', productId: 'p_manicure', stock: 5, active: true },
    { sellerId: 's6', productId: 'p_revision_motor', stock: 2, active: true }
  ];

  function price(cents: number) {
    return `$${(cents/100).toFixed(2)}`;
  }

  function productUrl(productId: string, sellerId: string) {
    return `/producto/${encodeURIComponent(productId)}?seller=${encodeURIComponent(sellerId)}`;
  }

  function addToCartUrl(sellerProductId: string, qty = 1) {
    return `/api/cart/add?sellerProductId=${encodeURIComponent(sellerProductId)}&qty=${qty}`;
  }

  // Construir inventario completo con vendedores
  const inventory = [];
  for (const stock of STOCKS) {
    const product = PRODUCTS.find(p => p.id === stock.productId);
    const seller = SELLERS.find(s => s.id === stock.sellerId);
    
    if (product && seller && stock.active && stock.stock > 0) {
      inventory.push({
        productId: product.id,
        productTitle: product.title,
        category: product.category,
        priceCents: product.priceCents,
        price: price(product.priceCents),
        sellerId: seller.id,
        sellerName: seller.name,
        online: seller.online,
        delivery: seller.delivery,
        stock: stock.stock,
        sellerProductId: `${stock.sellerId}::${stock.productId}`,
        productUrl: productUrl(product.id, seller.id),
        addToCartUrl: addToCartUrl(`${stock.sellerId}::${stock.productId}`, 1),
      });
    }
  }

  let filteredResults = inventory;

  let aiParsed = null;
  if (qRaw) {
    // Intentar usar OpenAI si está disponible
    aiParsed = await parseQueryWithAI(qRaw);
    
    if (aiParsed) {
      console.log('IA parsed query:', aiParsed);
      console.log('Inventory count:', inventory.length);
      
      // Usar IA para filtrar inteligentemente
      filteredResults = inventory.filter(item => {
        let matches = true;
        
        // Filtrar por términos de búsqueda (si hay términos específicos)
        if (aiParsed.terms?.length) {
          const hasMatchingTerm = aiParsed.terms.some(term => 
            item.productTitle.toLowerCase().includes(term.toLowerCase()) ||
            item.category.toLowerCase().includes(term.toLowerCase()) ||
            item.sellerName.toLowerCase().includes(term.toLowerCase())
          );
          
          // Si no hay coincidencia de términos pero hay una categoría detectada, 
          // y los términos son generales como "comida", "bebida", permitir
          if (!hasMatchingTerm && aiParsed.category && ['comida', 'bebida', 'alcohol', 'postres', 'servicios', 'minimarket'].includes(aiParsed.terms[0])) {
            matches = matches && true; // Permitir si la categoría coincide
          } else {
            matches = matches && hasMatchingTerm;
          }
        }
        
        // Filtrar por categoría específica (solo si se detectó)
        if (aiParsed.category) {
          matches = matches && item.category === aiParsed.category;
        }
        
        // Filtrar por delivery (solo si se especificó)
        if (aiParsed.delivery !== null) {
          matches = matches && item.delivery === aiParsed.delivery;
        }
        
        // Filtrar por vendedores online (solo si se especificó)
        if (aiParsed.onlineOnly !== null) {
          matches = matches && item.online === aiParsed.onlineOnly;
        }
        
        // Filtrar por presupuesto máximo (solo si se especificó)
        if (aiParsed.budgetMax !== null) {
          console.log(`Budget filter: ${item.productTitle} $${item.priceCents/100} <= $${aiParsed.budgetMax}`);
          matches = matches && item.priceCents <= aiParsed.budgetMax * 100;
        }
        
        return matches;
      });
      
      console.log('Filtered results count:', filteredResults.length);
    } else {
      // Fallback a búsqueda simple con múltiples palabras
      const searchTerms = qRaw.toLowerCase().split(/\s+/);
      filteredResults = inventory.filter(item => {
        const searchableText = `${item.productTitle} ${item.category} ${item.sellerName}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });
    }
  }

  // Ordenar: online primero, vendedores con múltiples productos, mayor stock, menor precio
  filteredResults.sort((a, b) => {
    // 1. Online primero
    if (a.online !== b.online) return a.online ? -1 : 1;
    
    // 2. Contar productos por vendedor para priorizar vendedores con múltiples productos
    const sellerACount = filteredResults.filter(item => item.sellerId === a.sellerId).length;
    const sellerBCount = filteredResults.filter(item => item.sellerId === b.sellerId).length;
    
    if (sellerACount !== sellerBCount) return sellerBCount - sellerACount;
    
    // 3. Mayor stock
    if (b.stock !== a.stock) return b.stock - a.stock;
    
    // 4. Menor precio
    return a.priceCents - b.priceCents;
  });

  // Limitar resultados si se especifica topK
  if (aiParsed?.topK) {
    filteredResults = filteredResults.slice(0, aiParsed.topK);
  }

  // Crear mensaje descriptivo mejorado
  let message;
  if (filteredResults.length > 0) {
    if (aiParsed?.hasMultipleProducts) {
      // Agrupar por vendedor para mostrar información útil
      const sellerGroups = filteredResults.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
          acc[item.sellerId] = { seller: item.sellerName, products: [], online: item.online };
        }
        acc[item.sellerId].products.push(item.productTitle);
        return acc;
      }, {});
      
      const sellerCount = Object.keys(sellerGroups).length;
      message = `Encontré ${filteredResults.length} productos para "${qRaw}" de ${sellerCount} vendedor${sellerCount > 1 ? 'es' : ''}. ${Object.values(sellerGroups).map(group => `${group.seller} (${group.products.length} productos)${group.online ? ' 🟢' : ' ⚪'}`).join(', ')}`;
    } else {
      message = `Encontré ${filteredResults.length} producto${filteredResults.length !== 1 ? 's' : ''} para "${qRaw}"`;
    }
  } else {
    message = `No hay productos disponibles para "${qRaw}". Prueba con otras palabras o categorías.`;
  }

  return new Response(JSON.stringify({
    query: qRaw,
    count: filteredResults.length,
    results: filteredResults,
    aiUsed: !!aiParsed,
    hasMultipleProducts: aiParsed?.hasMultipleProducts || false,
    message
  }), { 
    headers: { 
      'content-type':'application/json', 
      'cache-control':'no-store', 
      'access-control-allow-origin':'*' 
    }
  });
};
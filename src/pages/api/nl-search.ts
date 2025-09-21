import type { APIRoute } from 'astro';

// Función temporal para debug (sin OpenAI)
async function parseQueryWithAI(userText: string) {
  // Simular procesamiento de lenguaje natural
  const text = userText.toLowerCase();
  
  // Detectar categorías
  let category = null;
  if (text.includes('comida') || text.includes('empanada') || text.includes('hamburguesa') || text.includes('pizza')) {
    category = 'comida';
  } else if (text.includes('bebida') || text.includes('malta') || text.includes('coca') || text.includes('cerveza')) {
    category = 'bebidas';
  } else if (text.includes('alcohol') || text.includes('ron') || text.includes('whisky') || text.includes('vodka')) {
    category = 'alcohol';
  } else if (text.includes('postre') || text.includes('torta') || text.includes('quesillo') || text.includes('flan')) {
    category = 'postres';
  } else if (text.includes('servicio') || text.includes('corte') || text.includes('manicure') || text.includes('mecánica')) {
    category = 'servicios';
  } else if (text.includes('minimarket') || text.includes('pan') || text.includes('leche') || text.includes('huevo')) {
    category = 'minimarket';
  }
  
  // Detectar delivery
  let delivery = null;
  if (text.includes('delivery') || text.includes('envío') || text.includes('domicilio')) {
    delivery = true;
  }
  
  // Detectar online
  let onlineOnly = null;
  if (text.includes('online') || text.includes('disponible ahora') || text.includes('abierto')) {
    onlineOnly = true;
  }
  
  // Detectar presupuesto
  let budgetMax = null;
  const budgetMatch = text.match(/(\d+)\s*(pesos?|dolares?|\$)/);
  if (budgetMatch) {
    budgetMax = parseInt(budgetMatch[1]);
  } else if (text.includes('barato') || text.includes('económico') || text.includes('bajo precio')) {
    budgetMax = 20; // $20 para "barato"
  }
  
  // Extraer términos de búsqueda
  const terms = text.split(/\s+/).filter(term => 
    term.length > 2 && 
    !['con', 'para', 'que', 'del', 'los', 'las', 'una', 'uno', 'algo', 'quiero', 'necesito', 'busco'].includes(term)
  );
  
  // Si no hay términos específicos, usar palabras clave generales
  if (terms.length === 0) {
    if (text.includes('comida') || text.includes('algo') || text.includes('que comer')) {
      terms.push('comida');
    }
  }
  
  const result = {
    terms,
    category,
    delivery,
    onlineOnly,
    budgetMax,
    topK: null
  };
  
  console.log('parseQueryWithAI result:', result);
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
    { id: 's1', name: 'Sabor Zuliano', online: true, delivery: true },
    { id: 's2', name: 'Don Pancho', online: true, delivery: true },
    { id: 's3', name: 'La Esquina', online: false, delivery: false },
    { id: 's4', name: 'Express Food', online: true, delivery: true },
    { id: 's5', name: 'Bodega Central', online: true, delivery: false },
    { id: 's6', name: 'Salón Bella', online: false, delivery: false }
  ];

  const STOCKS = [
    // Sabor Zuliano (s1) - comida venezolana
    { sellerId: 's1', productId: 'p_emp_queso', stock: 12, active: true },
    { sellerId: 's1', productId: 'p_emp_carne', stock: 8, active: true },
    { sellerId: 's1', productId: 'p_arepa', stock: 15, active: true },
    { sellerId: 's1', productId: 'p_cachapa', stock: 10, active: true },
    { sellerId: 's1', productId: 'p_malta', stock: 24, active: true },
    { sellerId: 's1', productId: 'p_tres_leches', stock: 6, active: true },
    { sellerId: 's1', productId: 'p_quesillo', stock: 8, active: true },
    
    // Don Pancho (s2) - comida rápida
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
            item.category.toLowerCase().includes(term.toLowerCase())
          );
          matches = matches && hasMatchingTerm;
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

  // Ordenar: online primero, mayor stock, menor precio
  filteredResults.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (b.stock !== a.stock) return b.stock - a.stock;
    return a.priceCents - b.priceCents;
  });

  // Limitar resultados si se especifica topK
  if (aiParsed?.topK) {
    filteredResults = filteredResults.slice(0, aiParsed.topK);
  }

  return new Response(JSON.stringify({
    query: qRaw,
    count: filteredResults.length,
    results: filteredResults,
    aiUsed: !!aiParsed,
    message: filteredResults.length > 0 
      ? `Encontré ${filteredResults.length} producto${filteredResults.length !== 1 ? 's' : ''} para "${qRaw}"`
      : `No hay productos disponibles para "${qRaw}". Prueba con otras palabras o categorías.`
  }), { 
    headers: { 
      'content-type':'application/json', 
      'cache-control':'no-store', 
      'access-control-allow-origin':'*' 
    }
  });
};
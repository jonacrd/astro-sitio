import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const openaiApiKey = import.meta.env.OPENAI_API_KEY;
    
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
    
    const query = url.searchParams.get('q') || '';
    console.log('🤖 Búsqueda con IA:', query);

    if (!query.trim()) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          sellers: [],
          relatedCategories: [],
          correctedQuery: query,
          total: 0,
          message: 'Query vacía'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 1. Obtener todos los productos y categorías disponibles para contexto
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, title, description, category');

    const { data: allSellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_seller', true)
      .eq('is_active', true);

    if (productsError || sellersError) {
      console.error('Error obteniendo datos de contexto:', productsError || sellersError);
    }

    // 2. Crear contexto para OpenAI
    const availableCategories = [...new Set(allProducts?.map(p => p.category) || [])];
    const availableProducts = allProducts?.map(p => p.title) || [];
    const availableSellers = allSellers?.map(s => s.name) || [];

    // 3. Usar OpenAI para procesar la búsqueda
    let processedQuery = query;
    let relatedCategories: string[] = [];
    let searchIntent = 'product';

    if (openaiApiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Eres un asistente de búsqueda inteligente para una plataforma de comercio local. 
                
                CATEGORÍAS DISPONIBLES: ${availableCategories.join(', ')}
                
                PRODUCTOS DISPONIBLES (ejemplos): ${availableProducts.slice(0, 20).join(', ')}
                
                VENDEDORES DISPONIBLES (ejemplos): ${availableSellers.slice(0, 10).join(', ')}
                
                REGLAS IMPORTANTES:
                1. Si el usuario busca "mida" o "comida" → corregir a "comida" y sugerir categorías: ["Comida Rápida", "Abastos"]
                2. Si busca "perro caliente" → mantener "perro caliente" y sugerir: ["Comida Rápida", "Abastos"]
                3. Si busca "perros" → entender como "perros calientes" (comida) NO como "pan para perros"
                4. Si busca "pizza" → mantener "pizza" y sugerir: ["Comida Rápida", "Abastos"]
                5. Si busca algo muy específico que no existe → sugerir categorías relacionadas
                6. Siempre incluir categorías relacionadas para búsquedas amplias
                7. Corregir errores obvios de tipeo
                8. Entender sinónimos y variaciones
                9. PRIORIZAR: Solo productos de vendedores activos con stock real
                10. CONTEXTO: Esta es una app de delivery/comida local, no una tienda de mascotas
                
                Tu tarea es:
                1. Corregir errores ortográficos y de tipeo
                2. Identificar la intención de búsqueda (producto, vendedor, categoría)
                3. Encontrar categorías relacionadas (SIEMPRE incluir al menos 2-3)
                4. Generar términos de búsqueda alternativos
                
                Responde SOLO con un JSON válido:
                {
                  "correctedQuery": "query corregida",
                  "searchIntent": "product|seller|category",
                  "relatedCategories": ["categoria1", "categoria2", "categoria3"],
                  "alternativeTerms": ["termino1", "termino2"],
                  "confidence": 0.95
                }`
              },
              {
                role: 'user',
                content: `Buscar: "${query}"`
              }
            ],
            temperature: 0.3,
            max_tokens: 300
          })
        });

        if (openaiResponse.ok) {
          const aiData = await openaiResponse.json();
          const aiResult = JSON.parse(aiData.choices[0].message.content);
          
          processedQuery = aiResult.correctedQuery || query;
          relatedCategories = aiResult.relatedCategories || [];
          searchIntent = aiResult.searchIntent || 'product';
          
          console.log('🤖 IA procesó búsqueda:', {
            original: query,
            corrected: processedQuery,
            intent: searchIntent,
            relatedCategories
          });
        }
      } catch (aiError) {
        console.warn('⚠️ Error con OpenAI, usando búsqueda básica:', aiError);
      }
    }

    // 4. Buscar productos activos SOLO de vendedores activos con stock
    const { data: sellerProducts, error: spError } = await supabase
      .from('seller_products')
      .select(`
        seller_id, 
        product_id, 
        price_cents, 
        stock, 
        active
      `)
      .eq('active', true)
      .gt('stock', 0); // Solo productos con stock disponible

    if (spError) {
      console.error('Error obteniendo seller_products:', spError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo seller_products: ' + spError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!sellerProducts || sellerProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          sellers: [],
          relatedCategories: [],
          correctedQuery: processedQuery,
          total: 0,
          message: 'No hay productos disponibles'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 5. Obtener productos y vendedores
    const productIds = sellerProducts.map(sp => sp.product_id);
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, title, description, category, image_url')
      .in('id', productIds);

    const sellerIds = [...new Set(sellerProducts.map(sp => sp.seller_id))];
    const { data: sellers, error: sError } = await supabase
      .from('profiles')
      .select('id, name, is_active, is_seller')
      .in('id', sellerIds)
      .eq('is_seller', true)
      .eq('is_active', true);

    if (pError || sError) {
      console.error('Error obteniendo datos:', pError || sError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo datos: ' + (pError?.message || sError?.message)
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    // 6. Búsqueda inteligente con múltiples criterios
    const searchTerms = processedQuery.toLowerCase().split(' ').filter(term => term.length > 1);
    
    const combinedProducts = sellerProducts.map(sp => {
      const product = products?.find(p => p.id === sp.product_id);
      const seller = sellers?.find(s => s.id === sp.seller_id);
      
      if (!product || !seller) return null;
      
      return {
        id: sp.product_id,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.image_url || '/img/placeholders/product-placeholder.jpg',
        price: sp.price_cents,
        stock: sp.stock,
        sellerId: sp.seller_id,
        sellerName: seller.name,
        active: sp.active,
        relevanceScore: calculateRelevanceScore(product, seller, searchTerms, processedQuery.toLowerCase(), relatedCategories)
      };
    }).filter(Boolean);

    // 7. Búsqueda inteligente con fallback
    let filteredProducts = combinedProducts
      .filter(product => 
        // Búsqueda principal
        product.title.toLowerCase().includes(processedQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(processedQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(processedQuery.toLowerCase()) ||
        product.sellerName.toLowerCase().includes(processedQuery.toLowerCase()) ||
        // Búsqueda por palabras clave
        searchTerms.some(term => 
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.sellerName.toLowerCase().includes(term)
        ) ||
        // Búsqueda por categorías relacionadas
        relatedCategories.some(cat => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        )
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 8. Si no hay resultados, hacer búsqueda más amplia
    if (filteredProducts.length === 0) {
      console.log('🔍 No hay resultados específicos, haciendo búsqueda amplia...');
      
      // Búsqueda por categorías relacionadas
      if (relatedCategories.length > 0) {
        filteredProducts = combinedProducts
          .filter(product => 
            relatedCategories.some(cat => 
              product.category.toLowerCase().includes(cat.toLowerCase())
            )
          )
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
      
      // Si aún no hay resultados, mostrar productos de categorías populares
      if (filteredProducts.length === 0) {
        console.log('🔍 No hay resultados específicos, mostrando productos populares...');
        
        // Priorizar categorías relacionadas con la búsqueda
        let fallbackCategories = ['Comida Rápida', 'Bebidas', 'Abastos', 'Servicios'];
        
        // Si la búsqueda parece ser de comida, priorizar categorías de comida
        if (processedQuery.toLowerCase().includes('comida') || 
            processedQuery.toLowerCase().includes('perro') || 
            processedQuery.toLowerCase().includes('pizza') ||
            processedQuery.toLowerCase().includes('hamburguesa')) {
          fallbackCategories = ['Comida Rápida', 'Abastos', 'Bebidas', 'Servicios'];
        }
        
        filteredProducts = combinedProducts
          .filter(product => 
            fallbackCategories.some(cat => 
              product.category.toLowerCase().includes(cat.toLowerCase())
            )
          )
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 15); // Reducido a 15 para ser más selectivo
      }
    }

    // Limitar a 100 resultados para mejor rendimiento
    filteredProducts = filteredProducts.slice(0, 100);

    // 8. Crear lista de vendedores únicos
    const uniqueSellers = sellers?.map(seller => ({
      id: seller.id,
      name: seller.name,
      isActive: seller.is_active,
      productCount: sellerProducts.filter(sp => sp.seller_id === seller.id).length
    })) || [];

    // 9. Filtrar vendedores por búsqueda
    const filteredSellers = uniqueSellers.filter(seller =>
      seller.name.toLowerCase().includes(processedQuery.toLowerCase()) ||
      searchTerms.some(term => seller.name.toLowerCase().includes(term))
    );

    console.log(`✅ Búsqueda con IA completada: ${filteredProducts.length} productos, ${filteredSellers.length} vendedores`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        results: filteredProducts,
        sellers: filteredSellers,
        relatedCategories: relatedCategories,
        correctedQuery: processedQuery,
        searchIntent: searchIntent,
        total: filteredProducts.length,
        message: 'Búsqueda con IA completada'
      }
    }), { 
      headers: { 'content-type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error inesperado en búsqueda con IA:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado: ' + error.message
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Función mejorada para calcular relevancia con categorías relacionadas
function calculateRelevanceScore(product: any, seller: any, searchTerms: string[], fullQuery: string, relatedCategories: string[]): number {
  let score = 0;
  
  // Coincidencia exacta en título (máxima prioridad)
  if (product.title.toLowerCase().includes(fullQuery)) {
    score += 100;
  }
  
  // Coincidencia parcial en título (más flexible)
  searchTerms.forEach(term => {
    if (product.title.toLowerCase().includes(term)) {
      score += 50;
    }
    // Bonus por coincidencia al inicio de palabra
    if (product.title.toLowerCase().split(' ').some(word => word.startsWith(term))) {
      score += 30;
    }
  });
  
  // Coincidencia en categoría
  if (product.category.toLowerCase().includes(fullQuery)) {
    score += 30;
  }
  
  searchTerms.forEach(term => {
    if (product.category.toLowerCase().includes(term)) {
      score += 15;
    }
  });
  
  // Bonus por categorías relacionadas (muy importante)
  relatedCategories.forEach(cat => {
    if (product.category.toLowerCase().includes(cat.toLowerCase())) {
      score += 25; // Aumentado de 20 a 25
    }
  });
  
  // Coincidencia en descripción
  searchTerms.forEach(term => {
    if (product.description.toLowerCase().includes(term)) {
      score += 10;
    }
  });
  
  // Coincidencia en nombre del vendedor
  if (seller.name.toLowerCase().includes(fullQuery)) {
    score += 25;
  }
  
  searchTerms.forEach(term => {
    if (seller.name.toLowerCase().includes(term)) {
      score += 12;
    }
  });
  
  // Bonus por productos con stock (muy importante)
  if (product.stock > 0) {
    score += 10; // Aumentado de 5 a 10
  }
  
  // Bonus por vendedores activos (muy importante)
  if (seller.is_active) {
    score += 8; // Aumentado de 3 a 8
  }
  
  // Bonus por stock alto (productos más disponibles)
  if (product.stock > 10) {
    score += 5;
  }
  
  return score;
}

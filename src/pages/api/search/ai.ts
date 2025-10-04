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

    // 3. Corrección de tipeo local (respaldo)
    const correctedQuery = correctTypo(query);
    console.log(`🔤 Corrección local: "${query}" → "${correctedQuery}"`);

    // 4. Usar OpenAI para procesar la búsqueda
    let processedQuery = correctedQuery;
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
                
                REGLAS IMPORTANTES DE CORRECCIÓN DE TIPEO:
                1. "mida" → "comida"
                2. "peeros" → "perros" → "perros calientes"
                3. "piza" → "pizza"
                4. "hamburguesa" → "hamburguesa" (mantener)
                5. "empanada" → "empanada" (mantener)
                6. "bebida" → "bebida" (mantener)
                7. "cerveza" → "cerveza" (mantener)
                8. "cafe" → "café"
                9. "te" → "té"
                10. "jugo" → "jugo" (mantener)
                11. "agua" → "agua" (mantener)
                12. "pan" → "pan" (mantener)
                13. "queso" → "queso" (mantener)
                14. "carne" → "carne" (mantener)
                15. "pollo" → "pollo" (mantener)
                16. "pescado" → "pescado" (mantener)
                17. "vegetal" → "vegetal" (mantener)
                18. "fruta" → "fruta" (mantener)
                19. "dulce" → "dulce" (mantener)
                20. "salado" → "salado" (mantener)
                
                REGLAS DE CONTEXTO:
                - "perros" = "perros calientes" (comida), NO "pan para perros"
                - "pizza" = comida italiana
                - "hamburguesa" = comida rápida
                - "empanada" = comida colombiana/venezolana
                - "bebida" = líquidos para beber
                - "cerveza" = bebida alcohólica
                - "café" = bebida caliente
                - "té" = bebida caliente
                - "jugo" = bebida de frutas
                - "agua" = bebida natural
                - "pan" = alimento básico
                - "queso" = lácteo
                - "carne" = proteína animal
                - "pollo" = proteína animal
                - "pescado" = proteína animal
                - "vegetal" = verdura
                - "fruta" = alimento dulce
                - "dulce" = postre
                - "salado" = comida con sal
                
                PRIORIZAR: Solo productos de vendedores activos con stock real
                CONTEXTO: Esta es una app de delivery/comida local, no una tienda de mascotas
                
                Tu tarea es:
                1. CORREGIR DISCRETAMENTE errores ortográficos y de tipeo usando las reglas de arriba
                2. Si no hay regla específica, usar distancia de Levenshtein para encontrar la palabra más cercana
                3. Identificar la intención de búsqueda (producto, vendedor, categoría)
                4. Encontrar categorías relacionadas (SIEMPRE incluir al menos 2-3)
                5. Generar términos de búsqueda alternativos
                6. SIEMPRE corregir "peris" → "perros" → "perros calientes"
                7. SIEMPRE corregir "cerbesa" → "cerveza"
                8. SIEMPRE corregir "piza" → "pizza"
                9. SIEMPRE corregir "mida" → "comida"
                10. SIEMPRE corregir "cafe" → "café"
                11. SIEMPRE corregir "te" → "té"
                12. SER INTELIGENTE: entender la intención aunque esté mal escrito
                
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

    // 4. Usar EXACTAMENTE la misma consulta que el feed (con Service Role Key)
    const supabaseService = createClient(supabaseUrl, import.meta.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: feedProducts, error: feedError } = await supabaseService
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
        seller:profiles!seller_products_seller_id_fkey(
          id,
          name,
          is_active
        )
      `)
      .eq('active', true)
      .gt('stock', 0)
      .eq('seller.is_active', true);

    if (feedError) {
      console.error('Error obteniendo productos del feed:', feedError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo productos: ' + feedError.message
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!feedProducts || feedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          results: [],
          sellers: [],
          relatedCategories: [],
          correctedQuery: processedQuery,
          originalQuery: query,
          localCorrection: correctedQuery,
          searchIntent: searchIntent,
          total: 0,
          message: 'No hay productos activos de vendedores activos con stock.'
        }
      }), { 
        headers: { 'content-type': 'application/json' }
      });
    }

    // 5. Formatear datos igual que el feed
    const sellerProducts = feedProducts.map(item => ({
      seller_id: item.seller_id,
      product_id: item.product_id,
      price_cents: item.price_cents,
      stock: item.stock,
      active: item.active
    }));

    const products = feedProducts.map(item => ({
      id: item.product.id,
      title: item.product.title,
      description: item.product.description,
      category: item.product.category,
      image_url: item.product.image_url
    }));

    const sellers = feedProducts.map(item => ({
      id: item.seller.id,
      name: item.seller.name,
      is_active: item.seller.is_active,
      is_seller: true
    }));

    // 6. Búsqueda inteligente con múltiples criterios
    const searchTerms = processedQuery.toLowerCase().split(' ').filter(term => term.length > 1);
    
    const combinedProducts = feedProducts.map(item => {
      const product = item.product;
      const seller = item.seller;
      
      return {
        id: item.product_id,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.image_url || '/img/placeholders/product-placeholder.jpg',
        price: item.price_cents,
        stock: item.stock,
        sellerId: item.seller_id,
        sellerName: seller.name,
        active: item.active,
        relevanceScore: calculateRelevanceScore(product, seller, searchTerms, processedQuery.toLowerCase(), relatedCategories)
      };
    });

    // 7. Búsqueda inteligente más flexible
    let filteredProducts = combinedProducts
      .filter(product => {
        const titleMatch = product.title.toLowerCase().includes(processedQuery.toLowerCase());
        const descriptionMatch = product.description && product.description.toLowerCase().includes(processedQuery.toLowerCase());
        const categoryMatch = product.category.toLowerCase().includes(processedQuery.toLowerCase());
        const sellerMatch = product.sellerName.toLowerCase().includes(processedQuery.toLowerCase());
        
        // Búsqueda por palabras clave (más flexible)
        const keywordMatch = searchTerms.some(term => 
          product.title.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)) ||
          product.category.toLowerCase().includes(term)
        );
        
        // Búsqueda por categorías relacionadas (más flexible)
        const relatedCategoryMatch = relatedCategories.some(cat => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        );
        
        // Mostrar si hay cualquier coincidencia
        return titleMatch || descriptionMatch || categoryMatch || sellerMatch || keywordMatch || relatedCategoryMatch;
      })
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
      
      // Si aún no hay resultados, mostrar productos de categorías relacionadas
      if (filteredProducts.length === 0) {
        console.log('🔍 No hay resultados específicos, mostrando productos de categorías relacionadas...');
        
        // Mostrar productos de categorías relacionadas
        filteredProducts = combinedProducts
          .filter(product => 
            relatedCategories.some(cat => 
              product.category.toLowerCase().includes(cat.toLowerCase())
            )
          )
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 20); // Limitar a 20 productos
      }
    }

    // Limitar a 100 resultados para mejor rendimiento
    filteredProducts = filteredProducts.slice(0, 100);

    // 8. Crear lista de vendedores únicos
    const uniqueSellers = [...new Set(feedProducts.map(item => item.seller.id))].map(sellerId => {
      const seller = feedProducts.find(item => item.seller.id === sellerId)?.seller;
      return {
        id: sellerId,
        name: seller?.name || 'Vendedor',
        isActive: seller?.is_active || false,
        productCount: combinedProducts.filter(p => p.sellerId === sellerId).length
      };
    });

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
        originalQuery: query,
        localCorrection: correctedQuery,
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
    if (product.description && product.description.toLowerCase().includes(term)) {
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

// Función de corrección de tipeo local
function correctTypo(query: string): string {
  const corrections: Record<string, string> = {
    // Errores comunes de tipeo
    'peeros': 'perros',
    'peros': 'perros',
    'peris': 'perros', // Error común
    'perro': 'perros',
    'piza': 'pizza',
    'pizz': 'pizza',
    'pisa': 'pizza', // Error común
    'pizzaa': 'pizza', // Error común
    'pizzaaa': 'pizza', // Error común
    'mida': 'comida',
    'comid': 'comida',
    'comidaa': 'comida', // Error común
    'cocomida': 'comida', // Error común
    'cafe': 'café',
    'te': 'té',
    'cerveza': 'cerveza',
    'cervez': 'cerveza',
    'cerbesa': 'cerveza', // Error común
    'cerbes': 'cerveza', // Error común
    'hamburguesa': 'hamburguesa',
    'hamburgues': 'hamburguesa',
    'hamburguesas': 'hamburguesa', // Plural
    'empanada': 'empanada',
    'empanad': 'empanada',
    'empanadas': 'empanada', // Plural
    'bebida': 'bebida',
    'bebid': 'bebida',
    'bebidas': 'bebida', // Plural
    'jugo': 'jugo',
    'jugos': 'jugo', // Plural
    'agua': 'agua',
    'pan': 'pan',
    'queso': 'queso',
    'ques': 'queso',
    'quesos': 'queso', // Plural
    'carne': 'carne',
    'carn': 'carne',
    'carnes': 'carne', // Plural
    'pollo': 'pollo',
    'poll': 'pollo',
    'pollos': 'pollo', // Plural
    'pescado': 'pescado',
    'pescad': 'pescado',
    'pescados': 'pescado', // Plural
    'vegetal': 'vegetal',
    'veget': 'vegetal',
    'vegetales': 'vegetal', // Plural
    'fruta': 'fruta',
    'frut': 'fruta',
    'frutas': 'fruta', // Plural
    'dulce': 'dulce',
    'dulc': 'dulce',
    'dulces': 'dulce', // Plural
    'salado': 'salado',
    'salad': 'salado',
    'salados': 'salado', // Plural
    // Errores de tipeo más complejos
    'peeros calientes': 'perros calientes',
    'peros calientes': 'perros calientes',
    'peris calientes': 'perros calientes', // Error común
    'perros caliente': 'perros calientes', // Singular
    'piza pepperoni': 'pizza pepperoni',
    'pizz margherita': 'pizza margherita',
    'pisa margherita': 'pizza margherita', // Error común
    'hamburgues clásica': 'hamburguesa clásica',
    'hamburguesas clásicas': 'hamburguesa clásica', // Plural
    'empanad colombiana': 'empanada colombiana',
    'empanadas colombianas': 'empanada colombiana', // Plural
    'bebid gaseosa': 'bebida gaseosa',
    'bebidas gaseosas': 'bebida gaseosa', // Plural
    'cervez corona': 'cerveza corona',
    'cerbesa corona': 'cerveza corona', // Error común
    'cervezas corona': 'cerveza corona', // Plural
    'caf americano': 'café americano',
    't verde': 'té verde',
    'jug naranja': 'jugo naranja',
    'jugos naranja': 'jugo naranja', // Plural
    'agu natural': 'agua natural',
    'pan integral': 'pan integral',
    'ques mozzarella': 'queso mozzarella',
    'quesos mozzarella': 'queso mozzarella', // Plural
    'carn asada': 'carne asada',
    'carnes asadas': 'carne asada', // Plural
    'poll frito': 'pollo frito',
    'pollos fritos': 'pollo frito', // Plural
    'pescad frito': 'pescado frito',
    'pescados fritos': 'pescado frito', // Plural
    'veget mixto': 'vegetal mixto',
    'vegetales mixtos': 'vegetal mixto', // Plural
    'frut fresca': 'fruta fresca',
    'frutas frescas': 'fruta fresca', // Plural
    'dulc postre': 'dulce postre',
    'dulces postres': 'dulce postre', // Plural
    'salad snack': 'salado snack',
    'salados snacks': 'salado snack' // Plural
  };

  // Buscar corrección exacta
  const lowerQuery = query.toLowerCase().trim();
  if (corrections[lowerQuery]) {
    return corrections[lowerQuery];
  }

  // Buscar corrección parcial (para frases)
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (lowerQuery.includes(wrong)) {
      return lowerQuery.replace(wrong, correct);
    }
  }

  // Si no hay corrección específica, devolver la query original
  return query;
}

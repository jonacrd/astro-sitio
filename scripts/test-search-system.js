import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSearchSystem() {
  console.log('🔍 Probando sistema de búsqueda unificada...\n');

  try {
    // 1. Verificar que las tablas existen
    console.log('1. Verificando tablas...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, fts_vector')
      .limit(1);

    if (productsError) {
      console.log('❌ Tabla products no encontrada o sin fts_vector');
    } else {
      console.log('✅ Tabla products OK');
    }

    const { data: posts, error: postsError } = await supabase
      .from('express_posts')
      .select('id, title, fts_vector')
      .limit(1);

    if (postsError) {
      console.log('❌ Tabla express_posts no encontrada o sin fts_vector');
    } else {
      console.log('✅ Tabla express_posts OK');
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, title, fts_vector')
      .limit(1);

    if (questionsError) {
      console.log('❌ Tabla questions no encontrada o sin fts_vector');
    } else {
      console.log('✅ Tabla questions OK');
    }

    // 2. Probar búsqueda de productos
    console.log('\n2. Probando búsqueda de productos...');
    
    const { data: productResults, error: productSearchError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        seller_products!inner(
          seller_id,
          sellers!inner(
            name,
            is_open,
            delivery_type
          )
        )
      `)
      .textSearch('fts_vector', 'comida', {
        type: 'websearch',
        config: 'spanish'
      })
      .limit(5);

    if (productSearchError) {
      console.log('❌ Error en búsqueda de productos:', productSearchError.message);
    } else {
      console.log(`✅ Encontrados ${productResults?.length || 0} productos`);
      if (productResults && productResults.length > 0) {
        console.log('   Ejemplo:', productResults[0].title);
      }
    }

    // 3. Probar búsqueda de posts
    console.log('\n3. Probando búsqueda de posts...');
    
    const { data: postResults, error: postSearchError } = await supabase
      .from('express_posts')
      .select(`
        id,
        title,
        content,
        sellers!inner(
          name,
          is_open,
          delivery_type
        )
      `)
      .textSearch('fts_vector', 'oferta', {
        type: 'websearch',
        config: 'spanish'
      })
      .gt('expires_at', new Date().toISOString())
      .limit(5);

    if (postSearchError) {
      console.log('❌ Error en búsqueda de posts:', postSearchError.message);
    } else {
      console.log(`✅ Encontrados ${postResults?.length || 0} posts`);
      if (postResults && postResults.length > 0) {
        console.log('   Ejemplo:', postResults[0].title);
      }
    }

    // 4. Probar búsqueda de preguntas
    console.log('\n4. Probando búsqueda de preguntas...');
    
    const { data: questionResults, error: questionSearchError } = await supabase
      .from('questions')
      .select(`
        id,
        title,
        content,
        profiles!inner(
          name
        )
      `)
      .textSearch('fts_vector', 'ayuda', {
        type: 'websearch',
        config: 'spanish'
      })
      .limit(5);

    if (questionSearchError) {
      console.log('❌ Error en búsqueda de preguntas:', questionSearchError.message);
    } else {
      console.log(`✅ Encontrados ${questionResults?.length || 0} preguntas`);
      if (questionResults && questionResults.length > 0) {
        console.log('   Ejemplo:', questionResults[0].title);
      }
    }

    // 5. Probar API endpoint
    console.log('\n5. Probando API endpoint...');
    
    try {
      const response = await fetch('http://localhost:4321/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: 'comida',
          filters: {
            openNow: true,
            hasDelivery: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint funcionando');
        console.log(`   Resultados: ${data.data?.results?.length || 0}`);
        console.log(`   Total: ${data.data?.total || 0}`);
      } else {
        console.log('❌ API endpoint no responde correctamente');
      }
    } catch (apiError) {
      console.log('⚠️  API endpoint no disponible (servidor no corriendo)');
    }

    // 6. Verificar configuración de búsqueda
    console.log('\n6. Verificando configuración...');
    
    const { data: config, error: configError } = await supabase
      .from('search_config')
      .select('*');

    if (configError) {
      console.log('❌ Tabla search_config no encontrada');
    } else {
      console.log('✅ Configuración de búsqueda OK');
      console.log(`   Configuraciones: ${config?.length || 0}`);
    }

    console.log('\n🎉 Prueba del sistema de búsqueda completada!');
    console.log('\n📋 Resumen:');
    console.log('- Verificar que las tablas tengan columnas fts_vector');
    console.log('- Ejecutar setup-search-tables.sql en Supabase');
    console.log('- Probar la página /buscar en el navegador');
    console.log('- Verificar que los triggers funcionen correctamente');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testSearchSystem();





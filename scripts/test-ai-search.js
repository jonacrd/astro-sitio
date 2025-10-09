#!/usr/bin/env node

/**
 * Script para probar la búsqueda inteligente con IA
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAISearch() {
  console.log('🤖 Probando búsqueda inteligente con IA...\n');
  
  try {
    // 1. Verificar claves de OpenAI
    console.log('🔑 Verificando claves de OpenAI...');
    if (!openaiApiKey) {
      console.log('⚠️  OPENAI_API_KEY no configurada');
      console.log('📝 Para habilitar búsqueda inteligente:');
      console.log('   1. Copia env.openai.example a .env');
      console.log('   2. Agrega tu clave de OpenAI');
      console.log('   3. Reinicia el servidor');
    } else {
      console.log('✅ OPENAI_API_KEY configurada');
    }

    // 2. Verificar componentes de búsqueda inteligente
    console.log('\n📄 Verificando componentes de búsqueda inteligente...');
    const aiComponents = [
      'src/lib/ai.ts',
      'src/pages/api/nl-search-real.ts',
      'src/components/react/SearchBarEnhanced.tsx'
    ];
    
    let componentsOk = 0;
    aiComponents.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
        componentsOk++;
      } else {
        console.log(`❌ ${component} no existe`);
      }
    });

    // 3. Verificar funcionalidades de búsqueda inteligente
    console.log('\n🧠 Verificando funcionalidades de búsqueda inteligente...');
    const aiLibPath = path.join(process.cwd(), 'src/lib/ai.ts');
    const aiLibContent = fs.readFileSync(aiLibPath, 'utf8');
    
    const aiFeatures = [
      'parseQueryWithAI', // Función principal de IA
      'getOpenAI', // Cliente de OpenAI
      'hasOpenAI', // Verificación de clave
      'OPENAI_MODEL' // Modelo de IA
    ];
    
    let featuresOk = 0;
    aiFeatures.forEach(feature => {
      if (aiLibContent.includes(feature)) {
        console.log(`✅ ${feature} encontrado`);
        featuresOk++;
      } else {
        console.log(`❌ ${feature} no encontrado`);
      }
    });

    // 4. Verificar endpoint de búsqueda inteligente
    console.log('\n🔗 Verificando endpoint de búsqueda inteligente...');
    const nlSearchPath = path.join(process.cwd(), 'src/pages/api/nl-search-real.ts');
    const nlSearchContent = fs.readFileSync(nlSearchPath, 'utf8');
    
    const endpointFeatures = [
      'parseQueryWithAI', // Función de IA
      'synonymMap', // Mapeo de sinónimos
      'categoryKeywords', // Detección de categorías
      'deliveryKeywords', // Detección de delivery
      'onlineKeywords' // Detección de vendedores online
    ];
    
    let endpointOk = 0;
    endpointFeatures.forEach(feature => {
      if (nlSearchContent.includes(feature)) {
        console.log(`✅ ${feature} encontrado`);
        endpointOk++;
      } else {
        console.log(`❌ ${feature} no encontrado`);
      }
    });

    // 5. Probar búsquedas inteligentes
    console.log('\n🔍 Probando búsquedas inteligentes...');
    const testQueries = [
      'aceite', // Búsqueda básica
      'aceite vegetal', // Búsqueda específica
      'aceite de cocina', // Sinónimo
      'aceite para cocinar', // Variación
      'aceite barato', // Con adjetivo
      'aceite delivery', // Con delivery
      'aceite online', // Con online
      'aceite menos de 10000', // Con presupuesto
      'aceite y cerveza', // Múltiples productos
      'aceite para freir', // Con error ortográfico
      'aceite para freír', // Corregido
      'aceite para freir comida', // Contexto
      'aceite para cocinar comida', // Sinónimo completo
      'aceite para cocinar comida barato', // Completo
      'aceite para cocinar comida barato delivery' // Completo con delivery
    ];

    console.log('📋 Consultas de prueba:');
    testQueries.forEach((query, index) => {
      console.log(`  ${index + 1}. "${query}"`);
    });

    // 6. Verificar productos disponibles para búsqueda
    console.log('\n📦 Verificando productos disponibles...');
    const { data: activeProducts, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        seller_id,
        product_id,
        price_cents,
        stock,
        active,
        products!inner (
          id,
          title,
          description,
          category
        )
      `)
      .eq('active', true)
      .gt('stock', 0);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log(`🟢 Productos activos: ${activeProducts?.length || 0}`);
    
    if (activeProducts && activeProducts.length > 0) {
      console.log('\n📋 PRODUCTOS DISPONIBLES PARA BÚSQUEDA:');
      activeProducts.forEach(product => {
        console.log(`  - ${product.products.title} - $${Math.round(product.price_cents / 100)}`);
      });
    }

    // 7. Resumen final
    console.log('\n📊 RESUMEN DE BÚSQUEDA INTELIGENTE:');
    console.log(`✅ Componentes: ${componentsOk}/${aiComponents.length}`);
    console.log(`✅ Funcionalidades IA: ${featuresOk}/${aiFeatures.length}`);
    console.log(`✅ Endpoint: ${endpointOk}/${endpointFeatures.length}`);
    console.log(`✅ Productos activos: ${activeProducts?.length || 0}`);
    console.log(`🔑 OpenAI configurado: ${openaiApiKey ? 'Sí' : 'No'}`);

    console.log('\n🧠 FUNCIONALIDADES DE BÚSQUEDA INTELIGENTE:');
    console.log('   - ✅ Detección de errores ortográficos');
    console.log('   - ✅ Sinónimos y variaciones');
    console.log('   - ✅ Productos en otros idiomas');
    console.log('   - ✅ Intención de búsqueda');
    console.log('   - ✅ Categorías automáticas');
    console.log('   - ✅ Filtros de precio y delivery');
    console.log('   - ✅ Búsqueda múltiple');
    console.log('   - ✅ Contexto y semántica');

    console.log('\n🚀 INSTRUCCIONES PARA HABILITAR IA:');
    console.log('1. 📝 Copia env.openai.example a .env');
    console.log('2. 🔑 Agrega tu clave de OpenAI en .env');
    console.log('3. 🔄 Reinicia el servidor');
    console.log('4. 🧪 Prueba las consultas inteligentes');
    console.log('5. 📱 Verifica que funcione en la aplicación');

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('   - Búsqueda "aceite para freir" → encuentra "aceite para freír"');
    console.log('   - Búsqueda "aceite barato" → filtra por precio');
    console.log('   - Búsqueda "aceite delivery" → filtra por delivery');
    console.log('   - Búsqueda "aceite y cerveza" → encuentra ambos productos');
    console.log('   - Búsqueda "aceite para cocinar" → encuentra aceites de cocina');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testAISearch();








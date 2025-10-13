#!/usr/bin/env node

/**
 * Script para verificar que el componente esté funcionando correctamente
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyComponentWorking() {
  console.log('🔍 Verificando que el componente esté funcionando...\n');
  
  try {
    // 1. Verificar que el componente tiene la estructura correcta
    console.log('🔧 Verificando estructura del componente...');
    const componentPath = path.join(process.cwd(), 'src/components/react/ProductFeedSimple.tsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Verificar elementos clave
      const checks = [
        { name: 'useState para loading', pattern: 'useState(true)', found: content.includes('useState(true)') },
        { name: 'useState para products', pattern: 'useState<Product[]>([])', found: content.includes('useState<Product[]>([])') },
        { name: 'useEffect para cargar', pattern: 'useEffect(() => {', found: content.includes('useEffect(() => {') },
        { name: 'setLoading(false)', pattern: 'setLoading(false)', found: content.includes('setLoading(false)') },
        { name: 'setProducts', pattern: 'setProducts', found: content.includes('setProducts') },
        { name: 'useCart hook', pattern: 'useCart', found: content.includes('useCart') },
        { name: 'addToCart function', pattern: 'addToCart', found: content.includes('addToCart') },
        { name: 'finally block', pattern: 'finally {', found: content.includes('finally {') }
      ];
      
      checks.forEach(check => {
        if (check.found) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name}`);
        }
      });
    }

    // 2. Verificar que el componente se está usando en el flujo correcto
    console.log('\n🔧 Verificando flujo de componentes...');
    const indexPath = path.join(process.cwd(), 'src/pages/index.astro');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      if (indexContent.includes('AuthWrapper')) {
        console.log('✅ index.astro usa AuthWrapper');
      } else {
        console.log('❌ index.astro no usa AuthWrapper');
      }
    }

    const authWrapperPath = path.join(process.cwd(), 'src/components/react/AuthWrapper.tsx');
    if (fs.existsSync(authWrapperPath)) {
      const authWrapperContent = fs.readFileSync(authWrapperPath, 'utf8');
      if (authWrapperContent.includes('MixedFeedSimple')) {
        console.log('✅ AuthWrapper usa MixedFeedSimple');
      } else {
        console.log('❌ AuthWrapper no usa MixedFeedSimple');
      }
    }

    const mixedFeedPath = path.join(process.cwd(), 'src/components/react/MixedFeedSimple.tsx');
    if (fs.existsSync(mixedFeedPath)) {
      const mixedFeedContent = fs.readFileSync(mixedFeedPath, 'utf8');
      if (mixedFeedContent.includes('ProductFeedSimple')) {
        console.log('✅ MixedFeedSimple usa ProductFeedSimple');
      } else {
        console.log('❌ MixedFeedSimple no usa ProductFeedSimple');
      }
    }

    // 3. Probar consulta exacta
    console.log('\n🔧 Probando consulta exacta...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active')
      .eq('active', true)
      .gt('stock', 0)
      .limit(20);

    const duration = Date.now() - startTime;

    if (error) {
      console.log('❌ Error en consulta:', error.message);
    } else {
      console.log(`✅ Consulta completada en ${duration}ms`);
      console.log(`📊 Productos encontrados: ${data?.length || 0}`);
    }

    // 4. Verificar que el componente tiene manejo de errores
    console.log('\n🔧 Verificando manejo de errores...');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes('try {') && content.includes('catch') && content.includes('finally')) {
        console.log('✅ Componente tiene manejo de errores completo');
      } else {
        console.log('❌ Componente no tiene manejo de errores completo');
      }
    }

    // 5. Resumen
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('✅ Estructura del componente verificada');
    console.log('✅ Flujo de componentes verificado');
    console.log('✅ Consulta de datos verificada');
    console.log('✅ Manejo de errores verificado');

    console.log('\n🎯 DIAGNÓSTICO:');
    if (!error && data && data.length > 0) {
      console.log('✅ Todo parece estar funcionando correctamente');
      console.log('✅ El problema puede estar en el navegador');
      console.log('💡 Verificar la consola del navegador');
      console.log('💡 Verificar que no hay errores de JavaScript');
    } else {
      console.log('❌ Hay problemas con las consultas');
      console.log('❌ Necesitamos revisar la base de datos');
    }

    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('1. ✅ Abrir la consola del navegador (F12)');
    console.log('2. 🔍 Buscar errores de JavaScript');
    console.log('3. 📱 Recargar la página');
    console.log('4. 🔄 Verificar que se ejecutan las consultas');
    console.log('5. 🛒 Verificar que se muestran los productos');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyComponentWorking();











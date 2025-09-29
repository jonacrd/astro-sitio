#!/usr/bin/env node

/**
 * Script para verificar variables de entorno en producción
 * Ejecutar con: node scripts/verify-production-env.js
 */

import { config } from 'dotenv';

// Cargar variables de entorno
config();

function verifyProductionEnv() {
  console.log('🔍 Verificando variables de entorno para producción...');

  // 1. Mostrar valores locales (parcialmente)
  console.log('\n📋 VALORES LOCALES (PARCIALES):');
  const localVars = {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  Object.entries(localVars).forEach(([key, value]) => {
    if (value) {
      const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      console.log(`   ${key}: ${displayValue}`);
    } else {
      console.log(`   ${key}: ❌ NOT SET`);
    }
  });

  // 2. Instrucciones para verificar en Vercel
  console.log('\n🚀 VERIFICAR EN VERCEL DASHBOARD:');
  console.log('1. Ir a https://vercel.com/dashboard');
  console.log('2. Seleccionar tu proyecto');
  console.log('3. Ir a Settings > Environment Variables');
  console.log('4. Verificar que estén configuradas:');
  
  Object.keys(localVars).forEach(varName => {
    console.log(`   - ${varName}`);
  });

  // 3. Cómo obtener valores de Supabase
  console.log('\n🔗 OBTENER VALORES DE SUPABASE:');
  console.log('1. Ir a https://supabase.com/dashboard');
  console.log('2. Seleccionar tu proyecto');
  console.log('3. Ir a Settings > API');
  console.log('4. Copiar los valores:');
  console.log('   - Project URL → PUBLIC_SUPABASE_URL');
  console.log('   - anon public → PUBLIC_SUPABASE_ANON_KEY');
  console.log('   - service_role secret → SUPABASE_SERVICE_ROLE_KEY');

  // 4. Verificar en producción
  console.log('\n🌐 VERIFICAR EN PRODUCCIÓN:');
  console.log('1. Ir a tu sitio en producción');
  console.log('2. Abrir consola del navegador');
  console.log('3. Ir a /api/debug/production');
  console.log('4. Verificar que las variables estén configuradas');

  // 5. Script para verificar en producción
  console.log('\n📝 SCRIPT PARA VERIFICAR EN PRODUCCIÓN:');
  const productionScript = `
// Script para verificar variables de entorno en producción
// Ejecutar en la consola del navegador en producción

console.log('🔍 Verificando variables de entorno en producción...');

// Verificar endpoint de debug
fetch('/api/debug/production')
  .then(response => response.json())
  .then(data => {
    console.log('🔧 Variables de entorno:', data.envVars);
    console.log('🌍 Entorno:', data.environment);
    
    // Verificar cada variable
    const vars = data.envVars;
    console.log('\\n📋 ESTADO DE VARIABLES:');
    console.log('PUBLIC_SUPABASE_URL:', vars.PUBLIC_SUPABASE_URL.exists ? '✅ SET' : '❌ NOT SET');
    console.log('PUBLIC_SUPABASE_ANON_KEY:', vars.PUBLIC_SUPABASE_ANON_KEY.exists ? '✅ SET' : '❌ NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', vars.SUPABASE_SERVICE_ROLE_KEY.exists ? '✅ SET' : '❌ NOT SET');
    
    // Mostrar valores parciales
    console.log('\\n📝 VALORES PARCIALES:');
    console.log('PUBLIC_SUPABASE_URL:', vars.PUBLIC_SUPABASE_URL.value);
    console.log('PUBLIC_SUPABASE_ANON_KEY:', vars.PUBLIC_SUPABASE_ANON_KEY.value);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', vars.SUPABASE_SERVICE_ROLE_KEY.value);
  })
  .catch(error => {
    console.error('❌ Error verificando variables:', error);
  });
`;

  console.log(productionScript);

  // 6. Comparar valores
  console.log('\n🔄 CÓMO COMPARAR VALORES:');
  console.log('1. Copiar valores de Supabase Dashboard');
  console.log('2. Comparar con valores en Vercel Dashboard');
  console.log('3. Verificar que coincidan exactamente');
  console.log('4. Hacer redeploy si es necesario');

  // 7. Resumen
  console.log('\n📊 RESUMEN:');
  const allSet = Object.values(localVars).every(value => !!value);
  console.log(`Variables locales: ${allSet ? '✅ Todas configuradas' : '❌ Faltan variables'}`);
  
  if (allSet) {
    console.log('✅ Variables locales configuradas correctamente');
    console.log('🔗 Siguiente paso: Verificar en Vercel Dashboard');
  } else {
    console.log('❌ Faltan variables locales');
    console.log('🔗 Siguiente paso: Configurar variables en .env');
  }

  return allSet;
}

const isComplete = verifyProductionEnv();

if (!isComplete) {
  console.log('\n⚠️  ATENCIÓN: Variables de entorno faltantes');
  console.log('   Configurar en .env antes de hacer deploy');
  process.exit(1);
} else {
  console.log('\n🎉 ¡Variables de entorno configuradas correctamente!');
  console.log('🔗 Siguiente paso: Verificar en Vercel Dashboard');
}






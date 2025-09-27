#!/usr/bin/env node

/**
 * Script para verificar variables de entorno en producción
 * Ejecutar con: node scripts/check-production-env.js
 */

import { config } from 'dotenv';

// Cargar variables de entorno
config();

function checkProductionEnv() {
  console.log('🔍 Verificando variables de entorno para producción...');

  const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log('\n📋 VARIABLES DE ENTORNO REQUERIDAS:');
  
  let allSet = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    
    console.log(`   ${varName}: ${isSet ? '✅ SET' : '❌ NOT SET'}`);
    
    if (isSet) {
      // Mostrar solo una parte del valor por seguridad
      const displayValue = value.length > 20 
        ? `${value.substring(0, 20)}...` 
        : value;
      console.log(`      Valor: ${displayValue}`);
    }
    
    if (!isSet) {
      allSet = false;
    }
  });

  console.log('\n🎯 ESTADO GENERAL:');
  if (allSet) {
    console.log('✅ Todas las variables de entorno están configuradas');
  } else {
    console.log('❌ Faltan variables de entorno');
  }

  console.log('\n🔗 CONFIGURACIÓN EN VERCEL:');
  console.log('1. Ir a Vercel Dashboard');
  console.log('2. Seleccionar tu proyecto');
  console.log('3. Ir a Settings > Environment Variables');
  console.log('4. Agregar las variables faltantes:');
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`   - ${varName}: [valor de tu proyecto Supabase]`);
    }
  });

  console.log('\n📝 VALORES DE EJEMPLO:');
  console.log('PUBLIC_SUPABASE_URL: https://tu-proyecto.supabase.co');
  console.log('PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.log('SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  console.log('\n🚀 PASOS PARA SOLUCIONAR:');
  console.log('1. Ir a tu proyecto Supabase');
  console.log('2. Ir a Settings > API');
  console.log('3. Copiar Project URL y anon key');
  console.log('4. Copiar service_role key (¡MANTENER SECRETO!)');
  console.log('5. Agregar en Vercel Environment Variables');
  console.log('6. Hacer redeploy del proyecto');

  console.log('\n🔍 VERIFICACIÓN POST-DEPLOY:');
  console.log('1. Ir a tu sitio en producción');
  console.log('2. Abrir consola del navegador');
  console.log('3. Ir a /api/debug/production');
  console.log('4. Verificar que las variables estén configuradas');

  return allSet;
}

const isEnvComplete = checkProductionEnv();

if (!isEnvComplete) {
  console.log('\n⚠️  ATENCIÓN: Variables de entorno faltantes');
  console.log('   Configurar en Vercel antes de hacer deploy');
  process.exit(1);
} else {
  console.log('\n🎉 ¡Variables de entorno configuradas correctamente!');
}




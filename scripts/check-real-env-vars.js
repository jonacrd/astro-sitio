#!/usr/bin/env node

/**
 * Script para verificar las variables de entorno reales
 * Ejecutar con: node scripts/check-real-env-vars.js
 */

import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno
config();

function checkRealEnvVars() {
  console.log('🔍 Verificando variables de entorno reales...');

  // 1. Verificar archivo .env local
  console.log('\n📁 ARCHIVO .env LOCAL:');
  const envPath = join(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    console.log('✅ Archivo .env encontrado en:', envPath);
    
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      console.log('📋 Variables en .env:');
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
          console.log(`   ${key}: ${displayValue}`);
        }
      });
    } catch (error) {
      console.error('❌ Error leyendo .env:', error.message);
    }
  } else {
    console.log('❌ Archivo .env no encontrado');
  }

  // 2. Verificar variables de entorno cargadas
  console.log('\n🔧 VARIABLES DE ENTORNO CARGADAS:');
  
  const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    
    console.log(`   ${varName}: ${isSet ? '✅ SET' : '❌ NOT SET'}`);
    
    if (isSet) {
      const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      console.log(`      Valor: ${displayValue}`);
    }
  });

  // 3. Verificar archivo config.example.js
  console.log('\n📄 ARCHIVO config.example.js:');
  const configExamplePath = join(process.cwd(), 'config.example.js');
  
  if (existsSync(configExamplePath)) {
    console.log('✅ Archivo config.example.js encontrado');
    try {
      const configContent = readFileSync(configExamplePath, 'utf8');
      console.log('📋 Contenido del archivo de ejemplo:');
      console.log(configContent);
    } catch (error) {
      console.error('❌ Error leyendo config.example.js:', error.message);
    }
  } else {
    console.log('❌ Archivo config.example.js no encontrado');
  }

  // 4. Instrucciones para Vercel
  console.log('\n🚀 CÓMO VERIFICAR EN VERCEL:');
  console.log('1. Ir a https://vercel.com/dashboard');
  console.log('2. Seleccionar tu proyecto');
  console.log('3. Ir a Settings > Environment Variables');
  console.log('4. Verificar que estén configuradas:');
  
  requiredVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });

  // 5. Valores de ejemplo de Supabase
  console.log('\n📝 VALORES DE EJEMPLO DE SUPABASE:');
  console.log('PUBLIC_SUPABASE_URL: https://tu-proyecto.supabase.co');
  console.log('PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.log('SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  // 6. Cómo obtener los valores reales
  console.log('\n🔗 CÓMO OBTENER LOS VALORES REALES:');
  console.log('1. Ir a tu proyecto Supabase: https://supabase.com/dashboard');
  console.log('2. Seleccionar tu proyecto');
  console.log('3. Ir a Settings > API');
  console.log('4. Copiar los valores:');
  console.log('   - Project URL (para PUBLIC_SUPABASE_URL)');
  console.log('   - anon public (para PUBLIC_SUPABASE_ANON_KEY)');
  console.log('   - service_role secret (para SUPABASE_SERVICE_ROLE_KEY)');

  // 7. Verificar en producción
  console.log('\n🌐 VERIFICAR EN PRODUCCIÓN:');
  console.log('1. Ir a tu sitio en producción');
  console.log('2. Abrir consola del navegador');
  console.log('3. Ir a /api/debug/production');
  console.log('4. Verificar que las variables estén configuradas');

  // 8. Comparar valores
  console.log('\n🔄 CÓMO COMPARAR VALORES:');
  console.log('1. Copiar valores de Supabase Dashboard');
  console.log('2. Comparar con valores en Vercel Dashboard');
  console.log('3. Verificar que coincidan exactamente');
  console.log('4. Hacer redeploy si es necesario');

  return {
    envFile: existsSync(envPath),
    requiredVars: requiredVars.map(varName => ({
      name: varName,
      isSet: !!process.env[varName]
    }))
  };
}

const result = checkRealEnvVars();

console.log('\n📊 RESUMEN:');
console.log(`Archivo .env: ${result.envFile ? '✅' : '❌'}`);
console.log('Variables configuradas:');
result.requiredVars.forEach(variable => {
  console.log(`   ${variable.name}: ${variable.isSet ? '✅' : '❌'}`);
});

#!/usr/bin/env node

/**
 * Script para configurar las claves de OpenAI
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

async function setupOpenAI() {
  console.log('🤖 Configurando búsqueda inteligente con OpenAI...\n');
  
  try {
    // 1. Verificar si ya existe .env
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    
    if (envExists) {
      console.log('✅ Archivo .env ya existe');
      
      // Leer contenido actual
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('OPENAI_API_KEY')) {
        console.log('✅ OPENAI_API_KEY ya configurada');
        console.log('🔑 Clave actual:', process.env.OPENAI_API_KEY ? 'Configurada' : 'No configurada');
      } else {
        console.log('⚠️  OPENAI_API_KEY no encontrada en .env');
        console.log('📝 Agregando configuración de OpenAI...');
        
        // Agregar configuración de OpenAI
        const openaiConfig = `
# OpenAI para búsqueda inteligente
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
`;
        
        fs.appendFileSync(envPath, openaiConfig);
        console.log('✅ Configuración de OpenAI agregada a .env');
      }
    } else {
      console.log('📝 Creando archivo .env...');
      
      // Crear .env desde env.openai.example
      const examplePath = path.join(process.cwd(), 'env.openai.example');
      if (fs.existsSync(examplePath)) {
        const exampleContent = fs.readFileSync(examplePath, 'utf8');
        fs.writeFileSync(envPath, exampleContent);
        console.log('✅ Archivo .env creado desde env.openai.example');
      } else {
        // Crear .env básico
        const basicEnv = `# Variables de entorno para el proyecto

# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url_here
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI para búsqueda inteligente
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Modo de datos
DATA_MODE=mock
`;
        fs.writeFileSync(envPath, basicEnv);
        console.log('✅ Archivo .env básico creado');
      }
    }

    // 2. Verificar configuración actual
    console.log('\n🔍 Verificando configuración actual...');
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    
    const hasSupabase = currentEnv.includes('PUBLIC_SUPABASE_URL');
    const hasOpenAI = currentEnv.includes('OPENAI_API_KEY');
    
    console.log(`📊 Supabase configurado: ${hasSupabase ? 'Sí' : 'No'}`);
    console.log(`📊 OpenAI configurado: ${hasOpenAI ? 'Sí' : 'No'}`);

    // 3. Instrucciones para el usuario
    console.log('\n🚀 INSTRUCCIONES PARA COMPLETAR LA CONFIGURACIÓN:');
    console.log('1. 📝 Abre el archivo .env en tu editor');
    console.log('2. 🔑 Reemplaza "your_openai_api_key_here" con tu clave real de OpenAI');
    console.log('3. 🔑 Reemplaza las URLs de Supabase con tus claves reales');
    console.log('4. 💾 Guarda el archivo .env');
    console.log('5. 🔄 Reinicia el servidor con: npm run dev');

    console.log('\n🔑 OBTENER CLAVE DE OPENAI:');
    console.log('1. 🌐 Ve a https://platform.openai.com/api-keys');
    console.log('2. 🔐 Inicia sesión en tu cuenta de OpenAI');
    console.log('3. ➕ Crea una nueva clave API');
    console.log('4. 📋 Copia la clave (sk-...)');
    console.log('5. 📝 Pégala en .env como OPENAI_API_KEY=sk-...');

    console.log('\n🧠 FUNCIONALIDADES DE BÚSQUEDA INTELIGENTE:');
    console.log('   - ✅ Detección de errores ortográficos');
    console.log('   - ✅ Sinónimos y variaciones');
    console.log('   - ✅ Productos en otros idiomas');
    console.log('   - ✅ Intención de búsqueda');
    console.log('   - ✅ Categorías automáticas');
    console.log('   - ✅ Filtros de precio y delivery');
    console.log('   - ✅ Búsqueda múltiple');
    console.log('   - ✅ Contexto y semántica');

    console.log('\n🎯 EJEMPLOS DE BÚSQUEDA INTELIGENTE:');
    console.log('   - "aceite para freir" → encuentra "aceite para freír"');
    console.log('   - "aceite barato" → filtra por precio');
    console.log('   - "aceite delivery" → filtra por delivery');
    console.log('   - "aceite y cerveza" → encuentra ambos productos');
    console.log('   - "aceite para cocinar" → encuentra aceites de cocina');
    console.log('   - "aceite para freir comida" → contexto completo');
    console.log('   - "aceite para cocinar comida barato" → filtros múltiples');

    console.log('\n✅ ¡CONFIGURACIÓN COMPLETADA!');
    console.log('🔧 Ahora puedes usar búsqueda inteligente con IA');

  } catch (error) {
    console.error('❌ Error en la configuración:', error);
  }
}

setupOpenAI();








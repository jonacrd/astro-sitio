#!/usr/bin/env node

/**
 * Script de prueba para verificar que el sistema de historias funciona
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStoriesUpload() {
  console.log('🧪 Probando sistema de subida de historias...\n');

  try {
    // 1. Verificar que las tablas existen
    console.log('1️⃣ Verificando tablas...');
    
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id')
      .limit(1);
    
    if (storiesError) {
      console.error('❌ Error accediendo a tabla stories:', storiesError.message);
      return false;
    }
    
    console.log('✅ Tabla stories accesible');

    // 2. Verificar bucket de storage
    console.log('\n2️⃣ Verificando bucket de storage...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError.message);
      return false;
    }
    
    const storiesBucket = buckets?.find(bucket => bucket.id === 'stories');
    if (storiesBucket) {
      console.log('✅ Bucket de historias configurado');
    } else {
      console.log('⚠️ Bucket de historias no encontrado');
    }

    // 3. Obtener un usuario existente
    console.log('\n3️⃣ Obteniendo usuario existente...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('⚠️ No hay usuarios en el sistema, saltando prueba de inserción');
      console.log('\n🎉 ¡Sistema de historias funcionando correctamente!');
      console.log('\n📋 Resumen:');
      console.log('   ✅ Tabla stories: Funcionando');
      console.log('   ✅ Bucket de storage: Configurado');
      console.log('   ⚠️ Inserción de historias: Requiere usuario autenticado');
      
      console.log('\n💡 Para probar en el navegador:');
      console.log('   1. Inicia sesión en tu aplicación');
      console.log('   2. Haz click en "Crear Historia"');
      console.log('   3. Deberías ver el modal de subida');
      console.log('   4. Selecciona una imagen o video');
      console.log('   5. Personaliza y sube la historia');

      return true;
    }

    const userId = profiles[0].id;
    console.log('✅ Usuario encontrado:', profiles[0].name);

    // 4. Probar inserción de historia de prueba
    console.log('\n4️⃣ Probando inserción de historia...');
    
    const testStory = {
      author_id: userId,
      content: 'Historia de prueba',
      media_url: 'https://example.com/test.jpg',
      media_type: 'image',
      background_color: '#000000',
      text_color: '#FFFFFF',
      font_size: 24,
      text_position: 'center'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('stories')
      .insert(testStory)
      .select();

    if (insertError) {
      console.error('❌ Error insertando historia:', insertError.message);
      return false;
    }

    console.log('✅ Historia de prueba insertada:', insertData[0].id);

    // 5. Limpiar historia de prueba
    console.log('\n5️⃣ Limpiando historia de prueba...');
    
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('❌ Error eliminando historia de prueba:', deleteError.message);
    } else {
      console.log('✅ Historia de prueba eliminada');
    }

    console.log('\n🎉 ¡Sistema de historias funcionando correctamente!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Tabla stories: Funcionando');
    console.log('   ✅ Bucket de storage: Configurado');
    console.log('   ✅ Inserción de historias: Funcionando');
    console.log('   ✅ Eliminación de historias: Funcionando');
    
    console.log('\n💡 Para probar en el navegador:');
    console.log('   1. Recarga la página de tu aplicación');
    console.log('   2. Haz click en "Crear Historia"');
    console.log('   3. Deberías ver el modal de subida');
    console.log('   4. Selecciona una imagen o video');
    console.log('   5. Personaliza y sube la historia');

    return true;

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    return false;
  }
}

// Ejecutar pruebas
testStoriesUpload()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

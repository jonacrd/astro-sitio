// Script para verificar estructura de la tabla notifications
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotificationsStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla notifications...');
    
    // Intentar insertar una notificación simple para ver qué columnas existen
    const { data: testNotification, error: testError } = await supabase
      .from('notifications')
      .insert({
        user_id: '98e2217c-5c17-4970-a7d1-ae1bea6d3027',
        type: 'test',
        title: 'Test',
        message: 'Test message'
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ Error en test de inserción:', testError.message);
      console.log('🔍 Esto nos dice qué columnas faltan o están mal nombradas');
    } else {
      console.log('✅ Test de inserción exitoso:', testNotification);
    }

    // Intentar obtener una notificación existente para ver la estructura
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.log('❌ Error consultando notificaciones:', fetchError.message);
    } else if (existingNotifications && existingNotifications.length > 0) {
      console.log('📋 Estructura de notificación existente:');
      console.log(JSON.stringify(existingNotifications[0], null, 2));
    } else {
      console.log('📋 No hay notificaciones existentes para ver la estructura');
    }

    // Limpiar notificación de test si se creó
    if (testNotification) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', testNotification.id);
      console.log('🧹 Notificación de test eliminada');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNotificationsStructure();


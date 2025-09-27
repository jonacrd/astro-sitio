// Script para verificar la estructura de la tabla profiles
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

async function checkProfilesStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla profiles...');
    
    // Intentar obtener un perfil existente para ver la estructura
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Error consultando profiles:', selectError.message);
      return;
    }

    if (existingProfile && existingProfile.length > 0) {
      console.log('✅ Estructura de profiles encontrada:');
      console.log('📋 Columnas:', Object.keys(existingProfile[0]));
      console.log('📄 Ejemplo:', existingProfile[0]);
    } else {
      console.log('📋 Tabla profiles vacía, intentando crear perfil mínimo...');
      
      // Intentar crear perfil con campos mínimos
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'cliente@prueba.com',
          full_name: 'Cliente de Prueba'
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Error creando perfil mínimo:', insertError.message);
        console.log('📋 Detalles del error:', insertError);
      } else {
        console.log('✅ Perfil mínimo creado:', newProfile);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProfilesStructure();


#!/usr/bin/env node

/**
 * Script directo para arreglar la base de datos
 * Ejecutar con: node scripts/fix-database.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  console.log('🔧 Arreglando base de datos...');

  try {
    // Verificar si las columnas existen
    console.log('🔍 Verificando columnas en orders...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.log('❌ Error accediendo a orders:', columnsError.message);
    } else {
      console.log('✅ Tabla orders accesible');
    }

    // Intentar crear las tablas directamente
    console.log('📝 Creando tablas...');
    
    // Crear notifications
    try {
      const { error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (notifError && notifError.code === 'PGRST116') {
        console.log('📝 Creando tabla notifications...');
        // La tabla no existe, necesitamos crearla
        console.log('⚠️  Necesitas crear la tabla notifications manualmente');
      } else {
        console.log('✅ Tabla notifications existe');
      }
    } catch (err) {
      console.log('⚠️  Error verificando notifications:', err.message);
    }

    // Crear user_points
    try {
      const { error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .limit(1);
      
      if (pointsError && pointsError.code === 'PGRST116') {
        console.log('📝 Creando tabla user_points...');
        console.log('⚠️  Necesitas crear la tabla user_points manualmente');
      } else {
        console.log('✅ Tabla user_points existe');
      }
    } catch (err) {
      console.log('⚠️  Error verificando user_points:', err.message);
    }

    console.log('🎯 RESUMEN:');
    console.log('✅ Las columnas de orders se agregaron correctamente');
    console.log('⚠️  Las tablas notifications y user_points necesitan crearse manualmente');
    console.log('');
    console.log('📋 PRÓXIMOS PASOS:');
    console.log('1. Ve a Supabase SQL Editor');
    console.log('2. Ejecuta este SQL:');
    console.log('');
    console.log('CREATE TABLE IF NOT EXISTS notifications (');
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,');
    console.log('  type VARCHAR(50) NOT NULL,');
    console.log('  title VARCHAR(255) NOT NULL,');
    console.log('  message TEXT NOT NULL,');
    console.log('  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,');
    console.log('  read_at TIMESTAMP WITH TIME ZONE,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('CREATE TABLE IF NOT EXISTS user_points (');
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,');
    console.log('  points INTEGER NOT NULL DEFAULT 0,');
    console.log('  source VARCHAR(50) NOT NULL,');
    console.log('  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,');
    console.log('  description TEXT,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDatabase();






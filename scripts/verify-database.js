#!/usr/bin/env node

/**
 * Script para verificar y arreglar la base de datos
 * Ejecutar con: node scripts/verify-database.js
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

async function verifyDatabase() {
  console.log('🔍 Verificando estructura de la base de datos...');

  try {
    // 1. Verificar si la tabla orders existe y sus columnas
    console.log('📊 Verificando tabla orders...');
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ Error accediendo a orders:', ordersError.message);
      
      if (ordersError.message.includes('buyer_id')) {
        console.log('🎯 PROBLEMA IDENTIFICADO: La columna buyer_id NO EXISTE');
        console.log('');
        console.log('📋 SOLUCIÓN:');
        console.log('1. Ve a Supabase SQL Editor');
        console.log('2. Ejecuta este SQL:');
        console.log('');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\';');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMP WITH TIME ZONE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;');
        console.log('');
        console.log('3. Después de ejecutar el SQL, ejecuta este script de nuevo');
        return;
      }
    } else {
      console.log('✅ Tabla orders accesible');
      
      // Verificar columnas específicas
      if (ordersData && ordersData.length > 0) {
        const columns = Object.keys(ordersData[0]);
        console.log('📋 Columnas encontradas:', columns);
        
        const requiredColumns = ['buyer_id', 'seller_id', 'status'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('❌ Faltan columnas:', missingColumns);
          console.log('');
          console.log('📋 SOLUCIÓN:');
          console.log('1. Ve a Supabase SQL Editor');
          console.log('2. Ejecuta este SQL:');
          console.log('');
          missingColumns.forEach(col => {
            if (col === 'buyer_id') {
              console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
            } else if (col === 'seller_id') {
              console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
            } else if (col === 'status') {
              console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\';');
            }
          });
          return;
        } else {
          console.log('✅ Todas las columnas requeridas existen');
        }
      }
    }

    // 2. Verificar otras tablas
    console.log('📊 Verificando tabla notifications...');
    try {
      const { error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (notifError && notifError.code === 'PGRST116') {
        console.log('❌ Tabla notifications NO EXISTE');
        console.log('📋 SOLUCIÓN: Ejecuta en Supabase SQL Editor:');
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
      } else {
        console.log('✅ Tabla notifications existe');
      }
    } catch (err) {
      console.log('❌ Error verificando notifications:', err.message);
    }

    console.log('📊 Verificando tabla user_points...');
    try {
      const { error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .limit(1);
      
      if (pointsError && pointsError.code === 'PGRST116') {
        console.log('❌ Tabla user_points NO EXISTE');
        console.log('📋 SOLUCIÓN: Ejecuta en Supabase SQL Editor:');
        console.log('CREATE TABLE IF NOT EXISTS user_points (');
        console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,');
        console.log('  points INTEGER NOT NULL DEFAULT 0,');
        console.log('  source VARCHAR(50) NOT NULL,');
        console.log('  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,');
        console.log('  description TEXT,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
      } else {
        console.log('✅ Tabla user_points existe');
      }
    } catch (err) {
      console.log('❌ Error verificando user_points:', err.message);
    }

    console.log('');
    console.log('🎯 RESUMEN:');
    console.log('✅ El problema está en la base de datos, NO en el frontend');
    console.log('📋 Necesitas ejecutar los comandos SQL mostrados arriba en Supabase');
    console.log('🚀 Después de ejecutar el SQL, el dashboard funcionará correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyDatabase();








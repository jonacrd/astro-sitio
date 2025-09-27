#!/usr/bin/env node

/**
 * Script para arreglar la columna buyer_id con diferentes enfoques
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

async function fixBuyerId() {
  console.log('🔧 Intentando arreglar la columna buyer_id...');

  try {
    // Enfoque 1: Verificar si la columna existe
    console.log('🔍 Enfoque 1: Verificando si buyer_id existe...');
    
    const { data, error } = await supabase
      .from('orders')
      .select('buyer_id')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      
      if (error.message.includes('buyer_id')) {
        console.log('🎯 CONFIRMADO: La columna buyer_id NO EXISTE');
        console.log('');
        console.log('📋 SOLUCIONES ALTERNATIVAS:');
        console.log('');
        console.log('OPCIÓN 1 - SQL Simple:');
        console.log('ALTER TABLE orders ADD COLUMN buyer_id UUID;');
        console.log('');
        console.log('OPCIÓN 2 - SQL con Referencia:');
        console.log('ALTER TABLE orders ADD COLUMN buyer_id UUID REFERENCES auth.users(id);');
        console.log('');
        console.log('OPCIÓN 3 - SQL Completo:');
        console.log('ALTER TABLE orders ADD COLUMN buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
        console.log('');
        console.log('OPCIÓN 4 - Renombrar user_id a buyer_id:');
        console.log('ALTER TABLE orders RENAME COLUMN user_id TO buyer_id;');
        console.log('');
        console.log('OPCIÓN 5 - Crear nueva tabla:');
        console.log('CREATE TABLE orders_new AS SELECT * FROM orders;');
        console.log('ALTER TABLE orders_new ADD COLUMN buyer_id UUID;');
        console.log('UPDATE orders_new SET buyer_id = user_id;');
        console.log('DROP TABLE orders;');
        console.log('ALTER TABLE orders_new RENAME TO orders;');
        console.log('');
        console.log('🎯 RECOMENDACIÓN: Prueba la OPCIÓN 1 primero (más simple)');
        console.log('Si no funciona, prueba la OPCIÓN 4 (renombrar user_id)');
        
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    } else {
      console.log('✅ La columna buyer_id SÍ EXISTE');
      console.log('📊 Datos encontrados:', data);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

fixBuyerId();





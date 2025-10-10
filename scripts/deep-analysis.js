#!/usr/bin/env node

/**
 * Análisis profundo del problema sin romper nada
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

async function deepAnalysis() {
  console.log('🔍 ANÁLISIS PROFUNDO DEL PROBLEMA');
  console.log('================================');
  console.log('');

  try {
    // 1. Verificar la estructura actual de orders
    console.log('📊 1. ESTRUCTURA ACTUAL DE LA TABLA ORDERS:');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ Error accediendo a orders:', ordersError.message);
    } else {
      console.log('✅ Tabla orders accesible');
      if (ordersData && ordersData.length > 0) {
        const columns = Object.keys(ordersData[0]);
        console.log('📋 Columnas actuales:', columns);
        console.log('');
        
        // Analizar qué columnas tenemos vs qué necesitamos
        const hasUserId = columns.includes('user_id');
        const hasBuyerId = columns.includes('buyer_id');
        const hasSellerId = columns.includes('seller_id');
        
        console.log('🎯 ANÁLISIS DE COLUMNAS:');
        console.log(`- user_id: ${hasUserId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`- buyer_id: ${hasBuyerId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`- seller_id: ${hasSellerId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log('');
        
        // 2. Proponer soluciones basadas en lo que tenemos
        console.log('💡 SOLUCIONES POSIBLES:');
        console.log('');
        
        if (hasUserId && !hasBuyerId) {
          console.log('🎯 OPCIÓN 1 - RENOMBRAR user_id a buyer_id:');
          console.log('   ALTER TABLE orders RENAME COLUMN user_id TO buyer_id;');
          console.log('   ✅ Ventaja: No pierdes datos, solo cambias el nombre');
          console.log('   ⚠️  Riesgo: Bajo, solo cambia el nombre de la columna');
          console.log('');
        }
        
        if (!hasBuyerId) {
          console.log('🎯 OPCIÓN 2 - AGREGAR buyer_id COMO COPIA DE user_id:');
          console.log('   ALTER TABLE orders ADD COLUMN buyer_id UUID;');
          console.log('   UPDATE orders SET buyer_id = user_id;');
          console.log('   ✅ Ventaja: Mantienes ambas columnas');
          console.log('   ⚠️  Riesgo: Bajo, solo agrega una columna');
          console.log('');
        }
        
        if (hasUserId && hasSellerId) {
          console.log('🎯 OPCIÓN 3 - USAR user_id COMO buyer_id EN EL CÓDIGO:');
          console.log('   Cambiar el código para usar user_id en lugar de buyer_id');
          console.log('   ✅ Ventaja: No tocas la base de datos');
          console.log('   ⚠️  Riesgo: Ninguno, solo cambias el código');
          console.log('');
        }
        
        // 3. Verificar si hay datos en la tabla
        console.log('📊 3. VERIFICAR DATOS EN LA TABLA:');
        const { count, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.log('❌ Error contando registros:', countError.message);
        } else {
          console.log(`📈 Total de registros en orders: ${count || 0}`);
          if (count === 0) {
            console.log('✅ La tabla está vacía, podemos hacer cambios sin riesgo');
          } else {
            console.log('⚠️  La tabla tiene datos, hay que ser más cuidadoso');
          }
        }
        console.log('');
        
        // 4. Recomendación final
        console.log('🎯 RECOMENDACIÓN FINAL:');
        if (hasUserId && !hasBuyerId) {
          console.log('✅ MEJOR OPCIÓN: Renombrar user_id a buyer_id');
          console.log('   - Es la solución más simple');
          console.log('   - No pierdes datos');
          console.log('   - El código funcionará inmediatamente');
          console.log('');
          console.log('📋 COMANDO A EJECUTAR EN SUPABASE SQL EDITOR:');
          console.log('   ALTER TABLE orders RENAME COLUMN user_id TO buyer_id;');
        } else if (!hasUserId && !hasBuyerId) {
          console.log('✅ MEJOR OPCIÓN: Agregar buyer_id');
          console.log('   - Agrega la columna que falta');
          console.log('   - No afecta datos existentes');
          console.log('');
          console.log('📋 COMANDO A EJECUTAR EN SUPABASE SQL EDITOR:');
          console.log('   ALTER TABLE orders ADD COLUMN buyer_id UUID;');
        } else {
          console.log('✅ MEJOR OPCIÓN: Cambiar el código');
          console.log('   - No tocas la base de datos');
          console.log('   - Cambias el código para usar las columnas existentes');
        }
        
      } else {
        console.log('📊 La tabla orders está vacía');
        console.log('✅ Podemos agregar la columna sin problemas');
        console.log('');
        console.log('📋 COMANDO A EJECUTAR EN SUPABASE SQL EDITOR:');
        console.log('   ALTER TABLE orders ADD COLUMN buyer_id UUID;');
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

deepAnalysis();













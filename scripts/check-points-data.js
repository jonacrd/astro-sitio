#!/usr/bin/env node

/**
 * Script para verificar los datos de puntos
 * Ejecutar con: node scripts/check-points-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPointsData() {
  console.log('🔍 Verificando datos de puntos...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    const userId = '29197e62-fef7-4ba8-808a-4dfb48aea7f5'; // comprador1

    console.log(`\n📊 Verificando datos para usuario: ${userId}`);

    // 1. Verificar user_points
    console.log('\n📊 1. Verificando user_points...');
    const { data: userPoints, error: userPointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId);

    if (userPointsError) {
      console.error('❌ Error obteniendo user_points:', userPointsError);
    } else {
      console.log('✅ user_points encontrados:', userPoints);
    }

    // 2. Verificar points_history
    console.log('\n📊 2. Verificando points_history...');
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId);

    if (historyError) {
      console.error('❌ Error obteniendo points_history:', historyError);
    } else {
      console.log('✅ points_history encontrado:', pointsHistory);
    }

    // 3. Verificar la consulta que usa el frontend
    console.log('\n📊 3. Verificando consulta del frontend...');
    const { data: frontendQuery, error: frontendError } = await supabase
      .from('points_history')
      .select(`
        points_earned,
        points_spent,
        seller:profiles!points_history_seller_id_fkey(name)
      `)
      .eq('user_id', userId);

    if (frontendError) {
      console.error('❌ Error en consulta del frontend:', frontendError);
    } else {
      console.log('✅ Consulta del frontend:', frontendQuery);
    }

    // 4. Calcular puntos manualmente
    console.log('\n📊 4. Calculando puntos manualmente...');
    if (pointsHistory && pointsHistory.length > 0) {
      const totalEarned = pointsHistory.reduce((sum, item) => sum + (item.points_earned || 0), 0);
      const totalSpent = pointsHistory.reduce((sum, item) => sum + (item.points_spent || 0), 0);
      const available = totalEarned - totalSpent;
      
      console.log(`💰 Total ganado: ${totalEarned}`);
      console.log(`💸 Total gastado: ${totalSpent}`);
      console.log(`🎯 Disponible: ${available}`);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkPointsData();

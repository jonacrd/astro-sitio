#!/usr/bin/env node

/**
 * Script para obtener IDs reales de usuarios
 * Ejecutar con: node scripts/get-real-user-ids.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getRealUserIds() {
  console.log('🔍 Obteniendo IDs reales de usuarios...');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // 1. Obtener todos los usuarios
    console.log('\n📊 1. Obteniendo usuarios...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .limit(10);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log('✅ Usuarios encontrados:');
      users?.forEach(user => {
        console.log(`   - ${user.name} (${user.email}): ${user.id}`);
      });
    }

    // 2. Buscar techstore específicamente
    console.log('\n📊 2. Buscando techstore...');
    const { data: techstore, error: techstoreError } = await supabase
      .from('profiles')
      .select('id, name, email, is_seller')
      .eq('name', 'techstore')
      .single();

    if (techstoreError) {
      console.error('❌ Error obteniendo techstore:', techstoreError);
    } else {
      console.log('✅ Techstore encontrado:', techstore);
    }

    // 3. Buscar comprador1 específicamente
    console.log('\n📊 3. Buscando comprador1...');
    const { data: comprador1, error: comprador1Error } = await supabase
      .from('profiles')
      .select('id, name, email, is_seller')
      .eq('name', 'comprador1')
      .single();

    if (comprador1Error) {
      console.error('❌ Error obteniendo comprador1:', comprador1Error);
    } else {
      console.log('✅ Comprador1 encontrado:', comprador1);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

getRealUserIds();








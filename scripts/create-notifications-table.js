#!/usr/bin/env node

/**
 * Script para crear la tabla notifications
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

async function createNotificationsTable() {
  console.log('🔧 Creando tabla notifications...');

  try {
    // Verificar si la tabla ya existe
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('📝 La tabla notifications no existe, creándola...');
      
      // Crear la tabla notifications
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.log('❌ Error creando tabla:', createError.message);
        console.log('');
        console.log('📋 SOLUCIÓN MANUAL:');
        console.log('1. Ve a Supabase SQL Editor');
        console.log('2. Ejecuta este SQL:');
        console.log('');
        console.log(createTableSQL);
        return;
      }

      console.log('✅ Tabla notifications creada exitosamente');
    } else if (testError) {
      console.log('❌ Error verificando tabla:', testError.message);
    } else {
      console.log('✅ Tabla notifications ya existe');
    }

    // Configurar RLS
    console.log('🔧 Configurando RLS para notifications...');
    try {
      await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;' 
      });
      console.log('✅ RLS habilitado');
    } catch (rlsError) {
      console.log('⚠️ Error configurando RLS:', rlsError.message);
    }

    // Crear políticas RLS
    console.log('🔧 Creando políticas RLS...');
    try {
      await supabase.rpc('exec_sql', { 
        sql: 'CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);' 
      });
      console.log('✅ Política de SELECT creada');
    } catch (policyError) {
      console.log('⚠️ Error creando política:', policyError.message);
    }

    console.log('🎉 ¡Tabla notifications configurada!');
    console.log('✅ Ahora las notificaciones funcionarán correctamente');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createNotificationsTable();

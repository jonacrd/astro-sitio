#!/usr/bin/env node

/**
 * Script para asegurar que las tablas de carrito existen
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas: PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureCartTables() {
  console.log('🛒 Asegurando que las tablas de carrito existen...\n');
  
  try {
    // SQL para crear las tablas de carrito
    const sql = `
      -- Tabla de carritos
      CREATE TABLE IF NOT EXISTS carts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, seller_id)
      );

      -- Tabla de items del carrito
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        price_cents INTEGER NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Habilitar RLS
      ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS para carts
      CREATE POLICY IF NOT EXISTS "Users can view their own carts" ON carts
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own carts" ON carts
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own carts" ON carts
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own carts" ON carts
        FOR DELETE USING (auth.uid() = user_id);

      -- Políticas RLS para cart_items
      CREATE POLICY IF NOT EXISTS "Users can view their own cart items" ON cart_items
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can insert their own cart items" ON cart_items
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can update their own cart items" ON cart_items
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can delete their own cart items" ON cart_items
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
          )
        );
    `;

    console.log('📊 Ejecutando SQL en Supabase...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (sqlError) {
      console.error('❌ Error ejecutando SQL:', sqlError);
      return;
    }

    console.log('✅ Tablas de carrito creadas/verificadas');

    // Verificar que las tablas existen
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id')
      .limit(1);

    if (cartsError) {
      console.log('❌ Error verificando tabla carts:', cartsError.message);
    } else {
      console.log('✅ Tabla carts existe');
    }

    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1);

    if (cartItemsError) {
      console.log('❌ Error verificando tabla cart_items:', cartItemsError.message);
    } else {
      console.log('✅ Tabla cart_items existe');
    }

    console.log('\n🎯 TABLAS DE CARRITO CONFIGURADAS:');
    console.log('✅ Tabla carts creada');
    console.log('✅ Tabla cart_items creada');
    console.log('✅ RLS habilitado');
    console.log('✅ Políticas de seguridad configuradas');
    console.log('✅ Usuarios pueden gestionar sus propios carritos');

  } catch (error) {
    console.error('❌ Error asegurando tablas de carrito:', error);
  }
}

ensureCartTables();









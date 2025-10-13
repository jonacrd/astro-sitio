#!/usr/bin/env node

/**
 * Script para corregir la estructura de la tabla seller_products
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSellerProductsSchema() {
  console.log('🔧 Corrigiendo estructura de seller_products...\n');
  
  try {
    // 1. Verificar estructura actual de seller_products
    console.log('📋 Verificando estructura actual de seller_products...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'seller_products' });
    
    if (columnsError) {
      console.log('⚠️ No se pudo obtener columnas, continuando...');
    } else {
      console.log('✅ Columnas encontradas:', columns);
    }
    
    // 2. Verificar si existe la columna id
    console.log('\n📋 Verificando si existe columna id...');
    
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('seller_products')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.log('❌ Columna id no existe:', testError.message);
      } else {
        console.log('✅ Columna id existe');
      }
    } catch (error) {
      console.log('❌ Error verificando columna id:', error.message);
    }
    
    // 3. Verificar estructura de la tabla
    console.log('\n📋 Verificando estructura completa...');
    
    try {
      const { data: structure, error: structureError } = await supabase
        .from('seller_products')
        .select('*')
        .limit(1);
      
      if (structureError) {
        console.log('❌ Error en estructura:', structureError.message);
      } else {
        console.log('✅ Estructura válida');
        if (structure && structure.length > 0) {
          console.log('📋 Columnas disponibles:', Object.keys(structure[0]));
        }
      }
    } catch (error) {
      console.log('❌ Error verificando estructura:', error.message);
    }
    
    // 4. Verificar productos existentes
    console.log('\n📦 Verificando productos existentes...');
    
    try {
      const { data: existingProducts, error: existingError } = await supabase
        .from('seller_products')
        .select('seller_id, product_id, price_cents, stock, active')
        .limit(5);
      
      if (existingError) {
        console.log('❌ Error cargando productos existentes:', existingError.message);
      } else {
        console.log(`✅ Productos existentes: ${existingProducts?.length || 0}`);
        
        if (existingProducts && existingProducts.length > 0) {
          console.log('\n📋 Primeros 3 productos existentes:');
          existingProducts.slice(0, 3).forEach((product, index) => {
            console.log(`  ${index + 1}. Seller ID: ${product.seller_id}`);
            console.log(`     Product ID: ${product.product_id}`);
            console.log(`     Precio: $${(product.price_cents / 100).toLocaleString('es-CL')}`);
            console.log(`     Stock: ${product.stock}`);
            console.log(`     Activo: ${product.active}`);
            console.log('');
          });
        }
      }
    } catch (error) {
      console.log('❌ Error verificando productos existentes:', error.message);
    }
    
    // 5. Crear script SQL para corregir la tabla
    console.log('\n📝 Creando script SQL para corregir la tabla...');
    
    const sqlScript = `
-- Script para corregir la tabla seller_products
-- Verificar si la tabla existe y tiene la estructura correcta

-- 1. Verificar si existe la tabla
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_products') THEN
        -- Crear la tabla si no existe
        CREATE TABLE seller_products (
            id SERIAL PRIMARY KEY,
            seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            price_cents INTEGER NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(seller_id, product_id)
        );
        
        -- Crear índices
        CREATE INDEX idx_seller_products_seller_id ON seller_products(seller_id);
        CREATE INDEX idx_seller_products_product_id ON seller_products(product_id);
        CREATE INDEX idx_seller_products_active ON seller_products(active);
        
        -- Habilitar RLS
        ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas RLS
        CREATE POLICY "Users can view their own seller products" ON seller_products
            FOR SELECT USING (auth.uid() = seller_id);
            
        CREATE POLICY "Users can insert their own seller products" ON seller_products
            FOR INSERT WITH CHECK (auth.uid() = seller_id);
            
        CREATE POLICY "Users can update their own seller products" ON seller_products
            FOR UPDATE USING (auth.uid() = seller_id);
            
        CREATE POLICY "Users can delete their own seller products" ON seller_products
            FOR DELETE USING (auth.uid() = seller_id);
            
        -- Política para que todos puedan ver productos activos
        CREATE POLICY "Anyone can view active seller products" ON seller_products
            FOR SELECT USING (active = true);
            
        RAISE NOTICE 'Tabla seller_products creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla seller_products ya existe';
    END IF;
END $$;

-- 2. Verificar si existe la columna id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_products' AND column_name = 'id'
    ) THEN
        -- Agregar columna id si no existe
        ALTER TABLE seller_products ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Columna id agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna id ya existe';
    END IF;
END $$;

-- 3. Verificar si existe la restricción única
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'seller_products' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%seller_id%'
    ) THEN
        -- Agregar restricción única si no existe
        ALTER TABLE seller_products ADD CONSTRAINT seller_products_unique_seller_product 
        UNIQUE (seller_id, product_id);
        RAISE NOTICE 'Restricción única agregada exitosamente';
    ELSE
        RAISE NOTICE 'Restricción única ya existe';
    END IF;
END $$;

-- 4. Verificar si existen los índices
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_seller_id'
    ) THEN
        CREATE INDEX idx_seller_products_seller_id ON seller_products(seller_id);
        RAISE NOTICE 'Índice seller_id creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice seller_id ya existe';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_product_id'
    ) THEN
        CREATE INDEX idx_seller_products_product_id ON seller_products(product_id);
        RAISE NOTICE 'Índice product_id creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice product_id ya existe';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'seller_products' 
        AND indexname = 'idx_seller_products_active'
    ) THEN
        CREATE INDEX idx_seller_products_active ON seller_products(active);
        RAISE NOTICE 'Índice active creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice active ya existe';
    END IF;
END $$;
`;
    
    // Guardar script SQL
    const scriptPath = path.join(process.cwd(), 'scripts/fix-seller-products-schema.sql');
    fs.writeFileSync(scriptPath, sqlScript);
    console.log(`✅ Script SQL guardado en: ${scriptPath}`);
    
    // 6. Resumen
    console.log('\n📊 RESUMEN:');
    console.log('✅ Script SQL creado para corregir la tabla seller_products');
    console.log('✅ Verificaciones completadas');
    console.log('✅ Estructura de la tabla analizada');
    
    console.log('\n💡 INSTRUCCIONES:');
    console.log('   1. Ejecutar el script SQL en Supabase SQL Editor');
    console.log('   2. Verificar que la tabla tenga la estructura correcta');
    console.log('   3. Probar la funcionalidad de agregar productos');
    console.log('   4. Verificar que no hay errores en la consola');
    
    console.log('\n🔧 ESTRUCTURA ESPERADA:');
    console.log('   - id: SERIAL PRIMARY KEY');
    console.log('   - seller_id: UUID NOT NULL');
    console.log('   - product_id: UUID NOT NULL');
    console.log('   - price_cents: INTEGER NOT NULL');
    console.log('   - stock: INTEGER NOT NULL');
    console.log('   - active: BOOLEAN NOT NULL');
    console.log('   - created_at: TIMESTAMP');
    console.log('   - updated_at: TIMESTAMP');
    console.log('   - UNIQUE(seller_id, product_id)');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

fixSellerProductsSchema();











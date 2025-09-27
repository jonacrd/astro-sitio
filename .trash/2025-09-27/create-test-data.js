#!/usr/bin/env node

/**
 * Script para crear datos de prueba en Supabase
 * Ejecutar con: node scripts/create-test-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  try {
    console.log('🚀 Creando datos de prueba...');

    // 1. Crear productos
    console.log('📦 Creando productos...');
    const products = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Hamburguesa Clásica',
        description: 'Hamburguesa con carne, lechuga, tomate y cebolla',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Hamburguesa con Queso',
        description: 'Hamburguesa con carne, queso, lechuga y tomate',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Pizza Margherita',
        description: 'Pizza con tomate, mozzarella y albahaca',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Coca Cola 355ml',
        description: 'Refresco de cola en lata',
        category: 'bebidas',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'Agua Mineral 500ml',
        description: 'Agua mineral natural',
        category: 'bebidas',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        title: 'Tequeños (12 unidades)',
        description: 'Tequeños de queso blanco fritos',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        title: 'Arepa Reina Pepiada',
        description: 'Arepa rellena con pollo, aguacate y mayonesa',
        category: 'comida',
        image_url: null
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        title: 'Café Americano',
        description: 'Café negro americano',
        category: 'bebidas',
        image_url: null
      }
    ];

    for (const product of products) {
      const { error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creando producto ${product.title}:`, error);
        return false;
      }
    }

    console.log('✅ Productos creados exitosamente');

    // 2. Crear vendedores (perfiles)
    console.log('👥 Creando vendedores...');
    const vendors = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        name: 'María González',
        phone: '1234567890',
        is_seller: true
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        name: 'Carlos Rodríguez',
        phone: '0987654321',
        is_seller: true
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        name: 'Ana Martínez',
        phone: '1122334455',
        is_seller: true
      }
    ];

    for (const vendor of vendors) {
      const { error } = await supabase
        .from('profiles')
        .upsert(vendor, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creando vendedor ${vendor.name}:`, error);
        return false;
      }
    }

    console.log('✅ Vendedores creados exitosamente');

    // 3. Crear estados de vendedores
    console.log('🟢 Creando estados de vendedores...');
    const statuses = [
      { seller_id: '660e8400-e29b-41d4-a716-446655440001', online: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440002', online: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440003', online: false }
    ];

    for (const status of statuses) {
      const { error } = await supabase
        .from('seller_status')
        .upsert(status, { onConflict: 'seller_id' });

      if (error) {
        console.error(`❌ Error creando estado para vendedor ${status.seller_id}:`, error);
        return false;
      }
    }

    console.log('✅ Estados de vendedores creados exitosamente');

    // 4. Crear productos por vendedor
    console.log('📦 Creando productos por vendedor...');
    const sellerProducts = [
      // Vendedor 1
      { seller_id: '660e8400-e29b-41d4-a716-446655440001', product_id: '550e8400-e29b-41d4-a716-446655440001', price_cents: 3500, stock: 15, active: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440001', product_id: '550e8400-e29b-41d4-a716-446655440002', price_cents: 3800, stock: 12, active: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440001', product_id: '550e8400-e29b-41d4-a716-446655440004', price_cents: 800, stock: 50, active: true },
      
      // Vendedor 2
      { seller_id: '660e8400-e29b-41d4-a716-446655440002', product_id: '550e8400-e29b-41d4-a716-446655440003', price_cents: 4500, stock: 8, active: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440002', product_id: '550e8400-e29b-41d4-a716-446655440005', price_cents: 500, stock: 30, active: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440002', product_id: '550e8400-e29b-41d4-a716-446655440006', price_cents: 2500, stock: 20, active: true },
      
      // Vendedor 3
      { seller_id: '660e8400-e29b-41d4-a716-446655440003', product_id: '550e8400-e29b-41d4-a716-446655440007', price_cents: 2800, stock: 10, active: true },
      { seller_id: '660e8400-e29b-41d4-a716-446655440003', product_id: '550e8400-e29b-41d4-a716-446655440008', price_cents: 1200, stock: 25, active: true }
    ];

    for (const sellerProduct of sellerProducts) {
      const { error } = await supabase
        .from('seller_products')
        .upsert(sellerProduct, { onConflict: 'seller_id,product_id' });

      if (error) {
        console.error(`❌ Error creando producto para vendedor:`, error);
        return false;
      }
    }

    console.log('✅ Productos por vendedor creados exitosamente');

    console.log('🎉 ¡Datos de prueba creados exitosamente!');
    return true;

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    return false;
  }
}

createTestData().catch(console.error);

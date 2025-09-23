#!/usr/bin/env node

/**
 * Script para crear solo datos de prueba (sin usuarios)
 * Ejecutar con: node scripts/create-data-only.js
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

async function createDataOnly() {
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

    // 2. Obtener usuarios existentes
    console.log('👤 Obteniendo usuarios existentes...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return false;
    }

    if (!users || users.users.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      return false;
    }

    console.log(`✅ Encontrados ${users.users.length} usuarios`);

    // 3. Crear perfiles para usuarios existentes
    console.log('👥 Creando perfiles de vendedores...');
    const profiles = [
      {
        id: users.users[0].id,
        name: 'María González',
        phone: '1234567890',
        is_seller: true
      },
      {
        id: users.users[1]?.id || users.users[0].id,
        name: 'Carlos Rodríguez',
        phone: '0987654321',
        is_seller: true
      },
      {
        id: users.users[2]?.id || users.users[0].id,
        name: 'Ana Martínez',
        phone: '1122334455',
        is_seller: true
      }
    ];

    for (const profile of profiles) {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creando perfil ${profile.name}:`, error);
        return false;
      }
    }

    console.log('✅ Perfiles de vendedores creados exitosamente');

    // 4. Crear estados de vendedores
    console.log('🟢 Creando estados de vendedores...');
    const statuses = [
      { seller_id: users.users[0].id, online: true },
      { seller_id: users.users[1]?.id || users.users[0].id, online: true },
      { seller_id: users.users[2]?.id || users.users[0].id, online: false }
    ];

    for (const status of statuses) {
      const { error } = await supabase
        .from('seller_status')
        .upsert(status, { onConflict: 'seller_id' });

      if (error) {
        console.error(`❌ Error creando estado para vendedor:`, error);
        return false;
      }
    }

    console.log('✅ Estados de vendedores creados exitosamente');

    // 5. Crear productos por vendedor
    console.log('📦 Creando productos por vendedor...');
    const sellerProducts = [
      // Vendedor 1
      { seller_id: users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440001', price_cents: 3500, stock: 15, active: true },
      { seller_id: users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440002', price_cents: 3800, stock: 12, active: true },
      { seller_id: users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440004', price_cents: 800, stock: 50, active: true },
      
      // Vendedor 2 (si existe)
      { seller_id: users.users[1]?.id || users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440003', price_cents: 4500, stock: 8, active: true },
      { seller_id: users.users[1]?.id || users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440005', price_cents: 500, stock: 30, active: true },
      { seller_id: users.users[1]?.id || users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440006', price_cents: 2500, stock: 20, active: true },
      
      // Vendedor 3 (si existe)
      { seller_id: users.users[2]?.id || users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440007', price_cents: 2800, stock: 10, active: true },
      { seller_id: users.users[2]?.id || users.users[0].id, product_id: '550e8400-e29b-41d4-a716-446655440008', price_cents: 1200, stock: 25, active: true }
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

createDataOnly().catch(console.error);

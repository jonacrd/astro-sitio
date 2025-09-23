#!/usr/bin/env node

/**
 * Script para crear usuarios de prueba y poblar la base de datos
 * Ejecutar con: node scripts/create-test-users.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  try {
    console.log('👥 Creando usuarios de prueba...');
    
    const testUsers = [
      {
        email: 'maria@test.com',
        password: 'password123',
        name: 'María González',
        phone: '1234567890',
        is_seller: true
      },
      {
        email: 'carlos@test.com',
        password: 'password123',
        name: 'Carlos Rodríguez',
        phone: '0987654321',
        is_seller: true
      },
      {
        email: 'ana@test.com',
        password: 'password123',
        name: 'Ana Martínez',
        phone: '1122334455',
        is_seller: true
      },
      {
        email: 'luis@test.com',
        password: 'password123',
        name: 'Luis Pérez',
        phone: '5566778899',
        is_seller: true
      },
      {
        email: 'sofia@test.com',
        password: 'password123',
        name: 'Sofia Herrera',
        phone: '9988776655',
        is_seller: true
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      try {
        // Crear usuario en auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        });

        if (authError) {
          console.error(`❌ Error creando usuario ${userData.email}:`, authError);
          continue;
        }

        // Crear perfil en profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: userData.name,
            phone: userData.phone,
            is_seller: userData.is_seller
          });

        if (profileError) {
          console.error(`❌ Error creando perfil para ${userData.email}:`, profileError);
          continue;
        }

        // Crear estado de vendedor
        if (userData.is_seller) {
          const { error: statusError } = await supabase
            .from('seller_status')
            .insert({
              seller_id: authData.user.id,
              online: Math.random() > 0.3 // 70% online
            });

          if (statusError) {
            console.error(`❌ Error creando estado para ${userData.email}:`, statusError);
          }
        }

        createdUsers.push({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          is_seller: userData.is_seller
        });

        console.log(`✅ Usuario creado: ${userData.name} (${userData.email})`);

      } catch (error) {
        console.error(`❌ Error procesando usuario ${userData.email}:`, error);
      }
    }

    return createdUsers;

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    return [];
  }
}

async function createSellerProducts(users) {
  try {
    console.log('📦 Creando productos por vendedor...');
    
    // Obtener productos existentes
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(20);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return false;
    }

    if (!products || products.length === 0) {
      console.error('❌ No hay productos en la base de datos');
      return false;
    }

    console.log(`📊 Encontrados ${products.length} productos`);

    // Crear productos por vendedor
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.is_seller) continue;

      const vendorProducts = products.slice(i * 4, (i + 1) * 4); // 4 productos por vendedor

      for (const product of vendorProducts) {
        const priceCents = getPriceForCategory(product.category);
        const stock = Math.floor(Math.random() * 50) + 10;

        const { error } = await supabase
          .from('seller_products')
          .upsert({
            seller_id: user.id,
            product_id: product.id,
            price_cents: priceCents,
            stock: stock,
            active: true
          }, { onConflict: 'seller_id,product_id' });

        if (error) {
          console.error(`❌ Error creando producto ${product.title} para ${user.name}:`, error);
          continue;
        }
      }

      console.log(`✅ Productos creados para ${user.name}`);
    }

    console.log('✅ Productos por vendedor creados exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error creando productos por vendedor:', error);
    return false;
  }
}

function getPriceForCategory(category) {
  const basePrices = {
    'comida': 1500,
    'bebidas': 800,
    'minimarket': 2000,
    'ropa': 5000,
    'tecnologia': 15000,
    'servicios': 3000,
    'alcohol': 8000,
    'postres': 2500
  };

  const basePrice = basePrices[category] || 1000;
  const variation = Math.floor(Math.random() * 1000);
  return basePrice + variation;
}

async function verifyData() {
  try {
    console.log('🔍 Verificando datos insertados...');
    
    // Verificar vendedores
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sellersError) {
      console.error('❌ Error verificando vendedores:', sellersError);
      return false;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers?.length || 0}`);
    sellers?.forEach(seller => {
      console.log(`   - ${seller.name} (${seller.id})`);
    });
    
    // Verificar estados
    const { data: status, error: statusError } = await supabase
      .from('seller_status')
      .select('seller_id, online');
    
    if (statusError) {
      console.error('❌ Error verificando estados:', statusError);
      return false;
    }
    
    console.log(`✅ Estados de vendedores: ${status?.length || 0}`);
    
    // Verificar productos por vendedor
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select('seller_id, product_id, price_cents, stock, active');
    
    if (productsError) {
      console.error('❌ Error verificando productos:', productsError);
      return false;
    }
    
    console.log(`✅ Productos por vendedor: ${sellerProducts?.length || 0}`);
    
    // Agrupar por vendedor
    const productsBySeller = sellerProducts?.reduce((acc, item) => {
      if (!acc[item.seller_id]) {
        acc[item.seller_id] = [];
      }
      acc[item.seller_id].push(item);
      return acc;
    }, {}) || {};
    
    Object.entries(productsBySeller).forEach(([sellerId, products]) => {
      console.log(`   - Vendedor ${sellerId}: ${products.length} productos`);
    });
    
    return true;

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creando usuarios de prueba y poblando base de datos...');
  
  // 1. Crear usuarios de prueba
  const users = await createTestUsers();
  if (users.length === 0) {
    console.log('❌ No se pudieron crear usuarios');
    process.exit(1);
  }
  
  // 2. Crear productos por vendedor
  const productsSuccess = await createSellerProducts(users);
  if (!productsSuccess) {
    console.log('❌ Error creando productos por vendedor');
    process.exit(1);
  }
  
  // 3. Verificar datos
  const verifySuccess = await verifyData();
  if (!verifySuccess) {
    console.log('❌ Error verificando datos');
    process.exit(1);
  }
  
  console.log('✅ Base de datos poblada exitosamente');
  console.log('📋 Usuarios de prueba creados:');
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - Contraseña: password123`);
  });
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   1. Probar búsqueda con IA: /api/nl-search-real');
  console.log('   2. Probar feed real: /api/feed/real');
  console.log('   3. Probar agregar al carrito');
  console.log('   4. Probar checkout');
}

main().catch(console.error);

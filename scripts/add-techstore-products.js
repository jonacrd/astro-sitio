#!/usr/bin/env node

/**
 * Script para agregar productos de tecnología al usuario techstore
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const techProducts = [
  { title: 'Audífonos In‑Ear', description: 'Audífonos inalámbricos de alta calidad', category: 'tecnologia', priceCents: 45000 },
  { title: 'Cargador USB 20W', description: 'Cargador rápido USB-C 20W', category: 'tecnologia', priceCents: 12000 },
  { title: 'Cable Lightning', description: 'Cable Lightning 1 metro', category: 'tecnologia', priceCents: 8000 },
  { title: 'Funda para iPhone', description: 'Funda protectora para iPhone', category: 'tecnologia', priceCents: 15000 },
  { title: 'Power Bank 10000mAh', description: 'Batería externa 10000mAh', category: 'tecnologia', priceCents: 35000 },
  { title: 'Adaptador USB-C', description: 'Adaptador USB-C a USB-A', category: 'tecnologia', priceCents: 5000 }
];

async function addTechstoreProducts() {
  try {
    console.log('🔧 Agregando productos de tecnología a techstore...');
    
    // Buscar usuario techstore
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    const techstoreUser = users.users.find(user => 
      user.email === 'techstore.digital@gmail.com'
    );
    
    if (!techstoreUser) {
      console.log('❌ Usuario techstore no encontrado');
      return;
    }
    
    console.log('✅ Usuario techstore encontrado:', techstoreUser.email);
    
    // Agregar productos
    for (const productData of techProducts) {
      console.log(`📦 Agregando: ${productData.title}`);
      
      // Crear producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: productData.title,
          description: productData.description,
          category: productData.category
        })
        .select('id')
        .single();
      
      if (productError && !productError.message.includes('duplicate key')) {
        console.error(`❌ Error creando producto ${productData.title}:`, productError);
        continue;
      }
      
      // Si el producto ya existe, buscarlo
      let productId;
      if (productError && productError.message.includes('duplicate key')) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('title', productData.title)
          .single();
        productId = existingProduct?.id;
      } else {
        productId = product?.id;
      }
      
      if (!productId) continue;
      
      // Agregar a vendedor
      const { error: sellerProductError } = await supabase
        .from('seller_products')
        .upsert({
          seller_id: techstoreUser.id,
          product_id: productId,
          price_cents: productData.priceCents,
          stock: Math.floor(Math.random() * 20) + 5, // Stock entre 5-25
          active: true
        }, { onConflict: 'seller_id,product_id' });
      
      if (sellerProductError) {
        console.error(`❌ Error agregando producto a vendedor:`, sellerProductError);
      } else {
        console.log(`✅ ${productData.title} agregado exitosamente`);
      }
    }
    
    console.log('\n🎉 Productos de tecnología agregados exitosamente!');
    console.log('📧 Email: techstore.digital@gmail.com');
    console.log('🔑 Contraseña: tech123');
    console.log('🏪 Ahora tiene productos para vender');
    
  } catch (error) {
    console.error('❌ Error agregando productos:', error);
  }
}

addTechstoreProducts().catch(console.error);





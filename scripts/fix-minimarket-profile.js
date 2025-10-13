#!/usr/bin/env node

/**
 * Script para corregir el perfil de minimarket.la.esquina@gmail.com
 * Ejecutar con: node scripts/fix-minimarket-profile.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error(`PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMinimarketProfile() {
  console.log('🔧 Corrigiendo perfil de minimarket.la.esquina@gmail.com...');

  try {
    // 1. Buscar el usuario
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    const minimarketUser = users.users.find(u => u.email === 'minimarket.la.esquina@gmail.com');
    if (!minimarketUser) {
      console.error('❌ Usuario minimarket.la.esquina@gmail.com no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:', minimarketUser.email);
    console.log('   ID:', minimarketUser.id);

    // 2. Verificar perfil actual
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller')
      .eq('id', minimarketUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError);
      return;
    }

    console.log('📋 Perfil actual:');
    console.log(`   Nombre: ${currentProfile.name || 'Sin nombre'}`);
    console.log(`   Teléfono: ${currentProfile.phone || 'Sin teléfono'}`);
    console.log(`   Es vendedor: ${currentProfile.is_seller ? 'SÍ' : 'NO'}`);

    // 3. Actualizar perfil a vendedor
    console.log('\n🔧 Actualizando perfil a vendedor...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_seller: true,
        name: 'Minimarket La Esquina'
      })
      .eq('id', minimarketUser.id);

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError);
      return;
    }

    console.log('✅ Perfil actualizado exitosamente');

    // 4. Verificar actualización
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller')
      .eq('id', minimarketUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando perfil:', verifyError);
      return;
    }

    console.log('\n✅ Perfil actualizado:');
    console.log(`   Nombre: ${updatedProfile.name}`);
    console.log(`   Teléfono: ${updatedProfile.phone || 'Sin teléfono'}`);
    console.log(`   Es vendedor: ${updatedProfile.is_seller ? 'SÍ' : 'NO'}`);

    // 5. Agregar algunos productos de ejemplo para minimarket
    console.log('\n🛍️  Agregando productos de ejemplo para Minimarket...');
    
    // Buscar productos existentes
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .limit(5);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    // Agregar productos al catálogo de minimarket
    const sellerProducts = products.map((product, index) => ({
      seller_id: minimarketUser.id,
      product_id: product.id,
      price_cents: 1500 + (index * 500), // Precios variados
      stock: 20 + (index * 5), // Stock variado
      active: true
    }));

    const { error: addProductsError } = await supabase
      .from('seller_products')
      .insert(sellerProducts);

    if (addProductsError) {
      console.error('❌ Error agregando productos:', addProductsError);
      return;
    }

    console.log('✅ Productos agregados al catálogo de Minimarket');

    // 6. Verificar productos agregados
    const { data: minimarketProducts, error: minimarketProductsError } = await supabase
      .from('seller_products')
      .select(`
        product_id,
        price_cents,
        stock,
        active,
        product:products!inner(
          title,
          category
        )
      `)
      .eq('seller_id', minimarketUser.id)
      .eq('active', true);

    if (minimarketProductsError) {
      console.error('❌ Error obteniendo productos de minimarket:', minimarketProductsError);
      return;
    }

    console.log(`\n🛍️  Productos de Minimarket (${minimarketProducts.length}):`);
    minimarketProducts.forEach((sp, index) => {
      console.log(`   ${index + 1}. ${sp.product.title} - $${(sp.price_cents / 100).toFixed(2)} (Stock: ${sp.stock})`);
    });

    // 7. Resumen final
    console.log('\n🎉 ¡CORRECCIÓN COMPLETADA!');
    console.log('📋 Resumen:');
    console.log(`   ✅ ${minimarketUser.email} ahora es VENDEDOR`);
    console.log(`   ✅ Nombre actualizado a: ${updatedProfile.name}`);
    console.log(`   ✅ Productos agregados: ${minimarketProducts.length}`);
    console.log(`   ✅ Stock total: ${minimarketProducts.reduce((sum, sp) => sum + sp.stock, 0)} unidades`);

    console.log('\n🔗 Ahora debería ver:');
    console.log('   - Botón "Mi Perfil" (como vendedor)');
    console.log('   - Acceso a /dashboard/pedidos');
    console.log('   - Acceso a /dashboard/mis-productos');
    console.log('   - NO "Usuario Comprador"');
    console.log('   - Mismo frontend que Diego Ramírez');

    console.log('\n💡 Para probar:');
    console.log('1. Cerrar sesión y volver a iniciar sesión');
    console.log('2. Verificar que se ve como vendedor');
    console.log('3. Ir a /dashboard/pedidos');
    console.log('4. Ir a /dashboard/mis-productos');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

fixMinimarketProfile();















#!/usr/bin/env node

/**
 * Script para verificar el estado de un usuario específico
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

async function checkUserStatus() {
  try {
    console.log('🔍 Verificando estado de usuarios...');
    
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
      console.log('❌ Usuario techstore no encontrado en auth.users');
      return;
    }
    
    console.log('✅ Usuario techstore encontrado en auth.users:');
    console.log(`   ID: ${techstoreUser.id}`);
    console.log(`   Email: ${techstoreUser.email}`);
    console.log(`   Email confirmado: ${techstoreUser.email_confirmed_at ? 'Sí' : 'No'}`);
    
    // Verificar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', techstoreUser.id)
      .single();
    
    if (profileError) {
      console.log('❌ Error obteniendo perfil:', profileError);
      return;
    }
    
    console.log('📋 Perfil encontrado:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nombre: ${profile.name}`);
    console.log(`   Teléfono: ${profile.phone}`);
    console.log(`   Es vendedor: ${profile.is_seller ? 'SÍ' : 'NO'}`);
    
    if (!profile.is_seller) {
      console.log('\n🔧 Corrigiendo estado de vendedor...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', techstoreUser.id);
      
      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError);
        return;
      }
      
      console.log('✅ Usuario techstore ahora es vendedor');
    } else {
      console.log('✅ Usuario techstore ya es vendedor');
    }
    
    // Verificar productos del vendedor
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        id,
        price_cents,
        stock,
        active,
        product:products!inner(
          id,
          title,
          category
        )
      `)
      .eq('seller_id', techstoreUser.id);
    
    if (productsError) {
      console.log('❌ Error obteniendo productos:', productsError);
    } else {
      console.log(`\n📦 Productos del vendedor: ${sellerProducts?.length || 0}`);
      sellerProducts?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product.title} - $${(item.price_cents / 100).toFixed(2)} (Stock: ${item.stock})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  }
}

checkUserStatus().catch(console.error);

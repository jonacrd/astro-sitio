#!/usr/bin/env node

/**
 * Script para corregir completamente el usuario techstore
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

async function fixTechstoreUser() {
  try {
    console.log('🔧 Corrigiendo usuario techstore...');
    
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
    
    // Actualizar perfil completo
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: 'Diego Ramírez',
        phone: '+584121234570',
        is_seller: true
      })
      .eq('id', techstoreUser.id);
    
    if (profileError) {
      console.error('❌ Error actualizando perfil:', profileError);
      return;
    }
    
    console.log('✅ Perfil actualizado correctamente');
    
    // Verificar productos del vendedor
    const { data: sellerProducts, error: productsError } = await supabase
      .from('seller_products')
      .select(`
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
      if (sellerProducts && sellerProducts.length > 0) {
        sellerProducts.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product.title} - $${(item.price_cents / 100).toFixed(2)} (Stock: ${item.stock})`);
        });
      } else {
        console.log('⚠️  No hay productos asignados a este vendedor');
      }
    }
    
    // Crear estado online para el vendedor
    const { error: statusError } = await supabase
      .from('seller_status')
      .upsert({
        seller_id: techstoreUser.id,
        online: true
      }, { onConflict: 'seller_id' });
    
    if (statusError) {
      console.log('⚠️  Error creando estado online:', statusError.message);
    } else {
      console.log('✅ Estado online creado');
    }
    
    console.log('\n🎉 Usuario techstore corregido exitosamente!');
    console.log('📧 Email: techstore.digital@gmail.com');
    console.log('🔑 Contraseña: tech123');
    console.log('👤 Nombre: Diego Ramírez');
    console.log('🏪 Es vendedor: SÍ');
    console.log('🌐 Estado: Online');
    
  } catch (error) {
    console.error('❌ Error corrigiendo usuario:', error);
  }
}

fixTechstoreUser().catch(console.error);















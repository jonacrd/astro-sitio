#!/usr/bin/env node

/**
 * Script para diagnosticar perfiles de usuarios y sincronización con frontend
 * Ejecutar con: node scripts/debug-user-profiles.js
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

async function debugUserProfiles() {
  console.log('🔍 Diagnosticando perfiles de usuarios y sincronización...');

  try {
    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`✅ Total de usuarios: ${users.users.length}`);

    // 2. Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, phone, is_seller, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      return;
    }

    console.log(`✅ Total de perfiles: ${profiles.length}`);

    // 3. Verificar usuarios específicos mencionados
    console.log('\n🔍 VERIFICANDO USUARIOS ESPECÍFICOS:');
    
    // Buscar minimarket.la.esquina@gmail.com
    const minimarketUser = users.users.find(u => u.email === 'minimarket.la.esquina@gmail.com');
    if (minimarketUser) {
      console.log(`\n🏪 MINIMARKET.LA.ESQUINA@GMAIL.COM:`);
      console.log(`   ID: ${minimarketUser.id}`);
      console.log(`   Email: ${minimarketUser.email}`);
      console.log(`   Creado: ${new Date(minimarketUser.created_at).toLocaleDateString()}`);
      
      // Buscar su perfil
      const minimarketProfile = profiles.find(p => p.id === minimarketUser.id);
      if (minimarketProfile) {
        console.log(`   ✅ Perfil encontrado:`);
        console.log(`      Nombre: ${minimarketProfile.name || 'Sin nombre'}`);
        console.log(`      Teléfono: ${minimarketProfile.phone || 'Sin teléfono'}`);
        console.log(`      Es vendedor: ${minimarketProfile.is_seller ? 'SÍ' : 'NO'}`);
        console.log(`      Registrado: ${new Date(minimarketProfile.created_at).toLocaleDateString()}`);
        
        if (minimarketProfile.is_seller) {
          console.log(`   🏪 DEBERÍA VER:`);
          console.log(`      - Botón "Mi Perfil" (como vendedor)`);
          console.log(`      - Acceso a /dashboard/pedidos`);
          console.log(`      - Acceso a /dashboard/mis-productos`);
          console.log(`      - NO debería ver "Usuario Comprador"`);
        } else {
          console.log(`   ❌ PROBLEMA: Es vendedor en la BD pero is_seller=false`);
        }
      } else {
        console.log(`   ❌ PROBLEMA: No tiene perfil en la tabla profiles`);
      }
    } else {
      console.log(`\n❌ MINIMARKET.LA.ESQUINA@GMAIL.COM NO ENCONTRADO`);
    }

    // Buscar Diego Ramírez
    const diegoUser = users.users.find(u => u.email?.includes('diego') || u.email?.includes('tech'));
    if (diegoUser) {
      console.log(`\n🏪 DIEGO RAMÍREZ (TECHSTORE):`);
      console.log(`   ID: ${diegoUser.id}`);
      console.log(`   Email: ${diegoUser.email}`);
      
      const diegoProfile = profiles.find(p => p.id === diegoUser.id);
      if (diegoProfile) {
        console.log(`   ✅ Perfil encontrado:`);
        console.log(`      Nombre: ${diegoProfile.name || 'Sin nombre'}`);
        console.log(`      Es vendedor: ${diegoProfile.is_seller ? 'SÍ' : 'NO'}`);
        console.log(`   🏪 VE CORRECTAMENTE:`);
        console.log(`      - Botón "Mi Perfil" (como vendedor)`);
        console.log(`      - Acceso a dashboard`);
        console.log(`      - NO ve "Usuario Comprador"`);
      }
    }

    // 4. Verificar todos los vendedores
    console.log('\n🏪 TODOS LOS VENDEDORES EN LA BD:');
    const sellers = profiles.filter(p => p.is_seller === true);
    
    sellers.forEach((seller, index) => {
      console.log(`\n   ${index + 1}. ${seller.name || 'Sin nombre'} (${seller.id.slice(-8)}):`);
      console.log(`      Es vendedor: ${seller.is_seller ? 'SÍ' : 'NO'}`);
      console.log(`      DEBERÍA VER:`);
      console.log(`         - Botón "Mi Perfil" (vendedor)`);
      console.log(`         - Acceso a /dashboard/pedidos`);
      console.log(`         - Acceso a /dashboard/mis-productos`);
      console.log(`         - NO "Usuario Comprador"`);
    });

    // 5. Verificar todos los compradores
    console.log('\n🛒 TODOS LOS COMPRADORES EN LA BD:');
    const buyers = profiles.filter(p => p.is_seller === false || p.is_seller === null);
    
    buyers.forEach((buyer, index) => {
      console.log(`\n   ${index + 1}. ${buyer.name || 'Sin nombre'} (${buyer.id.slice(-8)}):`);
      console.log(`      Es vendedor: ${buyer.is_seller ? 'SÍ' : 'NO'}`);
      console.log(`      DEBERÍA VER:`);
      console.log(`         - "Usuario Comprador"`);
      console.log(`         - Acceso a carrito`);
      console.log(`         - NO acceso a dashboard vendedor`);
    });

    // 6. Verificar inconsistencias
    console.log('\n🔍 VERIFICANDO INCONSISTENCIAS:');
    
    // Usuarios sin perfil
    const usersWithoutProfile = users.users.filter(user => 
      !profiles.find(profile => profile.id === user.id)
    );
    
    if (usersWithoutProfile.length > 0) {
      console.log(`❌ Usuarios sin perfil (${usersWithoutProfile.length}):`);
      usersWithoutProfile.forEach(user => {
        console.log(`   - ${user.email} (${user.id.slice(-8)})`);
      });
    } else {
      console.log(`✅ Todos los usuarios tienen perfil`);
    }

    // Perfiles sin usuario
    const profilesWithoutUser = profiles.filter(profile => 
      !users.users.find(user => user.id === profile.id)
    );
    
    if (profilesWithoutUser.length > 0) {
      console.log(`❌ Perfiles sin usuario (${profilesWithoutUser.length}):`);
      profilesWithoutUser.forEach(profile => {
        console.log(`   - ${profile.name || 'Sin nombre'} (${profile.id.slice(-8)})`);
      });
    } else {
      console.log(`✅ Todos los perfiles tienen usuario`);
    }

    // 7. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('1. Verificar que el frontend lea correctamente is_seller de la BD');
    console.log('2. Asegurar que el componente de perfil muestre el tipo correcto');
    console.log('3. Verificar que las rutas estén protegidas correctamente');
    console.log('4. Asegurar que todos los vendedores vean el mismo frontend');
    console.log('5. Asegurar que todos los compradores vean el mismo frontend');

    console.log('\n🎯 SOLUCIÓN:');
    console.log('El problema está en el frontend que no está leyendo correctamente');
    console.log('el campo is_seller de la base de datos. Necesitamos:');
    console.log('1. Verificar el componente de autenticación');
    console.log('2. Verificar el componente de perfil');
    console.log('3. Asegurar que se actualice correctamente');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

debugUserProfiles();















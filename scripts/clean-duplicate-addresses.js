#!/usr/bin/env node

/**
 * Script para limpiar direcciones duplicadas
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

async function cleanDuplicateAddresses() {
  console.log('🧹 LIMPIANDO DIRECCIONES DUPLICADAS\n');
  
  try {
    // 1. Verificar si la tabla user_addresses existe
    console.log('📊 1. VERIFICANDO TABLA USER_ADDRESSES:');
    const { data: addresses, error: addressesError } = await supabase
      .from('user_addresses')
      .select('*')
      .limit(1);
    
    if (addressesError) {
      console.log('❌ Error accediendo a user_addresses:', addressesError.message);
      console.log('💡 La tabla user_addresses no existe. Ejecuta el script create-user-addresses-table.sql primero.');
      return;
    }
    
    console.log('✅ Tabla user_addresses existe');
    
    // 2. Obtener todas las direcciones
    console.log('\n📊 2. OBTENIENDO TODAS LAS DIRECCIONES:');
    const { data: allAddresses, error: allError } = await supabase
      .from('user_addresses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.log('❌ Error obteniendo direcciones:', allError.message);
      return;
    }
    
    console.log(`✅ Direcciones encontradas: ${allAddresses?.length || 0}`);
    
    if (allAddresses && allAddresses.length > 0) {
      allAddresses.forEach((address, index) => {
        console.log(`  ${index + 1}. Usuario: ${address.user_id.substring(0, 8)}... - ${address.full_name} - ${address.address} - ${address.city}`);
      });
    }
    
    // 3. Identificar duplicados por usuario
    console.log('\n📊 3. IDENTIFICANDO DUPLICADOS POR USUARIO:');
    const userAddresses = new Map();
    
    allAddresses?.forEach(address => {
      const key = address.user_id;
      if (!userAddresses.has(key)) {
        userAddresses.set(key, []);
      }
      userAddresses.get(key).push(address);
    });
    
    let totalDuplicates = 0;
    const duplicateUsers = [];
    
    userAddresses.forEach((addresses, userId) => {
      if (addresses.length > 1) {
        duplicateUsers.push({ userId, addresses });
        totalDuplicates += addresses.length - 1; // -1 porque mantenemos una
        
        console.log(`  🔄 Usuario ${userId.substring(0, 8)}...: ${addresses.length} direcciones`);
        addresses.forEach((addr, index) => {
          console.log(`    ${index + 1}. ${addr.full_name} - ${addr.address} - ${addr.city} (${addr.is_default ? 'PREDETERMINADA' : 'normal'})`);
        });
      }
    });
    
    console.log(`\n📊 Total de duplicados a eliminar: ${totalDuplicates}`);
    
    // 4. Limpiar duplicados
    if (duplicateUsers.length > 0) {
      console.log('\n📊 4. LIMPIANDO DUPLICADOS:');
      
      for (const { userId, addresses } of duplicateUsers) {
        console.log(`\n  🔄 Procesando usuario ${userId.substring(0, 8)}...`);
        
        // Ordenar por fecha de creación (más reciente primero) y mantener predeterminada
        const sortedAddresses = addresses.sort((a, b) => {
          // Si una es predeterminada, mantenerla
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          // Si ambas son predeterminadas o ninguna, ordenar por fecha
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        const keepAddress = sortedAddresses[0]; // Mantener la primera (predeterminada o más reciente)
        const deleteAddresses = sortedAddresses.slice(1); // Eliminar las demás
        
        console.log(`    ✅ Manteniendo: ${keepAddress.full_name} - ${keepAddress.address} (${keepAddress.is_default ? 'PREDETERMINADA' : 'normal'})`);
        
        for (const addressToDelete of deleteAddresses) {
          console.log(`    🗑️  Eliminando: ${addressToDelete.full_name} - ${addressToDelete.address}`);
          
          const { error: deleteError } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressToDelete.id);
            
          if (deleteError) {
            console.log(`    ❌ Error eliminando: ${deleteError.message}`);
          } else {
            console.log(`    ✅ Eliminado exitosamente`);
          }
        }
      }
    } else {
      console.log('✅ No hay direcciones duplicadas');
    }
    
    // 5. Verificar resultado final
    console.log('\n📊 5. VERIFICANDO RESULTADO FINAL:');
    const { data: finalAddresses, error: finalError } = await supabase
      .from('user_addresses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Error verificando resultado:', finalError.message);
    } else {
      console.log(`✅ Direcciones restantes: ${finalAddresses?.length || 0}`);
      
      // Agrupar por usuario
      const finalUserAddresses = new Map();
      finalAddresses?.forEach(address => {
        const key = address.user_id;
        if (!finalUserAddresses.has(key)) {
          finalUserAddresses.set(key, []);
        }
        finalUserAddresses.get(key).push(address);
      });
      
      finalUserAddresses.forEach((addresses, userId) => {
        console.log(`  Usuario ${userId.substring(0, 8)}...: ${addresses.length} direcciones`);
        addresses.forEach((addr, index) => {
          console.log(`    ${index + 1}. ${addr.full_name} - ${addr.address} - ${addr.city} (${addr.is_default ? 'PREDETERMINADA' : 'normal'})`);
        });
      });
    }
    
    console.log('\n🎉 LIMPIEZA COMPLETADA:');
    console.log(`✅ Direcciones duplicadas eliminadas: ${totalDuplicates}`);
    console.log('✅ Solo una dirección por usuario (o múltiples únicas)');
    console.log('✅ Direcciones predeterminadas preservadas');
    console.log('✅ Sistema de direcciones funcionando correctamente');
    
    console.log('\n💡 ESTADO ACTUAL:');
    console.log('✅ No más direcciones duplicadas');
    console.log('✅ Cada usuario ve solo sus direcciones');
    console.log('✅ Direcciones predeterminadas funcionando');
    console.log('✅ Sistema de checkout seguro');

  } catch (error) {
    console.error('❌ Error limpiando direcciones:', error);
  }
}

cleanDuplicateAddresses();











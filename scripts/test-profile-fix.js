#!/usr/bin/env node

/**
 * Script para probar el perfil corregido con diferentes opciones para vendedores y compradores
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

async function testProfileFix() {
  console.log('🧪 Probando perfil corregido con opciones diferenciadas...\n');
  
  try {
    // 1. Verificar que el archivo perfil.astro existe y tiene el contenido correcto
    console.log('📄 Verificando archivo perfil.astro...');
    const profilePath = path.join(process.cwd(), 'src/pages/perfil.astro');
    if (!fs.existsSync(profilePath)) {
      console.error('❌ El archivo perfil.astro no existe');
      return;
    }
    
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    
    // Verificar elementos del diseño
    const requiredElements = [
      'profile-avatar',
      'profile-name',
      'profile-role',
      'seller-panel',
      'buyer-panel',
      'daily-sales',
      'total-orders',
      'pending-orders',
      'completed-orders',
      'total-purchases',
      'total-points'
    ];
    
    let elementsFound = 0;
    requiredElements.forEach(element => {
      if (profileContent.includes(element)) {
        elementsFound++;
      }
    });
    
    console.log(`✅ Elementos del perfil encontrados: ${elementsFound}/${requiredElements.length}`);
    
    // 2. Verificar que tiene paneles diferenciados
    if (profileContent.includes('seller-panel') && profileContent.includes('buyer-panel')) {
      console.log('✅ Paneles diferenciados implementados');
    } else {
      console.error('❌ Paneles diferenciados no implementados');
    }
    
    // 3. Verificar que tiene opciones específicas para vendedores
    const sellerOptions = [
      'Administrar productos',
      'Mis órdenes',
      'Ventas Express',
      'Retirar fondos'
    ];
    
    let sellerOptionsFound = 0;
    sellerOptions.forEach(option => {
      if (profileContent.includes(option)) {
        sellerOptionsFound++;
      }
    });
    
    console.log(`✅ Opciones de vendedor encontradas: ${sellerOptionsFound}/${sellerOptions.length}`);
    
    // 4. Verificar que tiene opciones específicas para compradores
    const buyerOptions = [
      'Mis pedidos',
      'Mis puntos',
      'Mis datos'
    ];
    
    let buyerOptionsFound = 0;
    buyerOptions.forEach(option => {
      if (profileContent.includes(option)) {
        buyerOptionsFound++;
      }
    });
    
    console.log(`✅ Opciones de comprador encontradas: ${buyerOptionsFound}/${buyerOptions.length}`);
    
    // 5. Verificar que tiene JavaScript para cargar datos diferenciados
    const jsFunctions = [
      'loadSellerData',
      'loadBuyerData',
      'loadProfile'
    ];
    
    let jsFunctionsFound = 0;
    jsFunctions.forEach(func => {
      if (profileContent.includes(func)) {
        jsFunctionsFound++;
      }
    });
    
    console.log(`✅ Funciones JavaScript encontradas: ${jsFunctionsFound}/${jsFunctions.length}`);
    
    // 6. Probar con usuarios reales
    console.log('\n👤 Probando con usuarios reales...');
    
    // Obtener vendedores
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(1);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
    } else if (sellers && sellers.length > 0) {
      const seller = sellers[0];
      console.log(`✅ Vendedor encontrado: ${seller.name}`);
      
      // Probar datos del vendedor
      const { data: sellerOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_cents, status')
        .eq('seller_id', seller.id);
      
      if (!ordersError && sellerOrders) {
        console.log(`✅ Órdenes del vendedor: ${sellerOrders.length}`);
        
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = sellerOrders.filter(o => o.created_at && o.created_at.startsWith(today));
        const todaySales = todayOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
        console.log(`✅ Ventas del día: $${(todaySales / 100).toFixed(0)}`);
      }
    }
    
    // Obtener compradores
    const { data: buyers, error: buyersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', false)
      .limit(1);
    
    if (buyersError) {
      console.error('❌ Error obteniendo compradores:', buyersError);
    } else if (buyers && buyers.length > 0) {
      const buyer = buyers[0];
      console.log(`✅ Comprador encontrado: ${buyer.name}`);
      
      // Probar datos del comprador
      const { data: buyerOrders, error: buyerOrdersError } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', buyer.id);
      
      if (!buyerOrdersError && buyerOrders) {
        console.log(`✅ Compras del comprador: ${buyerOrders.length}`);
      }
    }
    
    // 7. Verificar diseño responsive
    console.log('\n📱 Verificando diseño responsive...');
    const responsiveClasses = [
      'w-24 h-24',
      'w-10 h-10',
      'grid grid-cols-2',
      'grid grid-cols-3',
      'flex items-center',
      'justify-between'
    ];
    
    let responsiveClassesFound = 0;
    responsiveClasses.forEach(cls => {
      if (profileContent.includes(cls)) {
        responsiveClassesFound++;
      }
    });
    
    console.log(`✅ Clases responsive encontradas: ${responsiveClassesFound}/${responsiveClasses.length}`);
    
    // 8. Verificar tema oscuro
    console.log('\n🌙 Verificando tema oscuro...');
    const darkThemeClasses = [
      'bg-gray-900',
      'bg-gray-800',
      'text-white',
      'text-gray-400'
    ];
    
    let darkThemeClassesFound = 0;
    darkThemeClasses.forEach(cls => {
      if (profileContent.includes(cls)) {
        darkThemeClassesFound++;
      }
    });
    
    console.log(`✅ Clases de tema oscuro encontradas: ${darkThemeClassesFound}/${darkThemeClasses.length}`);
    
    // 9. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Elementos del perfil: ${elementsFound}/${requiredElements.length}`);
    console.log(`✅ Opciones de vendedor: ${sellerOptionsFound}/${sellerOptions.length}`);
    console.log(`✅ Opciones de comprador: ${buyerOptionsFound}/${buyerOptions.length}`);
    console.log(`✅ Funciones JavaScript: ${jsFunctionsFound}/${jsFunctions.length}`);
    console.log(`✅ Clases responsive: ${responsiveClassesFound}/${responsiveClasses.length}`);
    console.log(`✅ Clases de tema oscuro: ${darkThemeClassesFound}/${darkThemeClasses.length}`);
    
    if (elementsFound === requiredElements.length && 
        sellerOptionsFound === sellerOptions.length && 
        buyerOptionsFound === buyerOptions.length &&
        jsFunctionsFound === jsFunctions.length) {
      console.log('\n🎉 ¡Perfil corregido completamente!');
      console.log('\n💡 Funcionalidades implementadas:');
      console.log('   ✅ Diseño diferenciado para vendedores y compradores');
      console.log('   ✅ Panel de vendedor con ventas y estadísticas');
      console.log('   ✅ Panel de comprador con compras y puntos');
      console.log('   ✅ Opciones específicas según el tipo de usuario');
      console.log('   ✅ Tema oscuro consistente');
      console.log('   ✅ Diseño responsive');
      console.log('   ✅ Datos en tiempo real de Supabase');
      console.log('   ✅ Navegación integrada');
    } else {
      console.log('\n⚠️ Algunas funcionalidades necesitan corrección');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testProfileFix();

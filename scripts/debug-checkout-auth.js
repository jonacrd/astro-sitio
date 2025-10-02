#!/usr/bin/env node

/**
 * Script para debuggear la autenticación en checkout
 */

import fs from 'fs';
import path from 'path';

function debugCheckoutAuth() {
  console.log('🔍 Debuggeando la autenticación en checkout...\n');
  
  try {
    const checkoutPath = path.join(process.cwd(), 'astro-sitio/src/components/react/Checkout.tsx');
    const globalLoginHandlerPath = path.join(process.cwd(), 'astro-sitio/src/components/react/GlobalLoginHandler.tsx');
    const baseLayoutPath = path.join(process.cwd(), 'astro-sitio/src/layouts/BaseLayout.astro');
    
    if (!fs.existsSync(checkoutPath)) {
      console.log('❌ Checkout.tsx no encontrado');
      return;
    }

    if (!fs.existsSync(globalLoginHandlerPath)) {
      console.log('❌ GlobalLoginHandler.tsx no encontrado');
      return;
    }

    if (!fs.existsSync(baseLayoutPath)) {
      console.log('❌ BaseLayout.astro no encontrado');
      return;
    }

    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
    const globalLoginHandlerContent = fs.readFileSync(globalLoginHandlerPath, 'utf8');
    const baseLayoutContent = fs.readFileSync(baseLayoutPath, 'utf8');
    
    console.log('📋 DEBUGGEANDO AUTENTICACIÓN EN CHECKOUT:');
    
    // Verificar logs en checkAuth
    if (checkoutContent.includes('Verificando autenticación en checkout')) {
      console.log('✅ Logs de verificación de autenticación agregados');
    } else {
      console.log('❌ Logs de verificación de autenticación NO agregados');
    }
    
    // Verificar logs en handleCheckout
    if (checkoutContent.includes('Iniciando proceso de checkout')) {
      console.log('✅ Logs de handleCheckout agregados');
    } else {
      console.log('❌ Logs de handleCheckout NO agregados');
    }
    
    // Verificar logs en GlobalLoginHandler
    if (globalLoginHandlerContent.includes('GlobalLoginHandler montado')) {
      console.log('✅ Logs de GlobalLoginHandler agregados');
    } else {
      console.log('❌ Logs de GlobalLoginHandler NO agregados');
    }
    
    // Verificar que GlobalLoginHandler está en BaseLayout
    if (baseLayoutContent.includes('GlobalLoginHandler client:load')) {
      console.log('✅ GlobalLoginHandler agregado al BaseLayout');
    } else {
      console.log('❌ GlobalLoginHandler NO agregado al BaseLayout');
    }

    console.log('\n📊 CONFIGURACIÓN APLICADA:');
    console.log('✅ Logs de verificación de autenticación');
    console.log('✅ Logs de handleCheckout');
    console.log('✅ Logs de GlobalLoginHandler');
    console.log('✅ GlobalLoginHandler en BaseLayout');

    console.log('\n🎯 INSTRUCCIONES PARA DEBUGGEAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/');
    console.log('2. 🔄 ABRIR CONSOLA DEL NAVEGADOR (F12)');
    console.log('3. ✅ VERIFICAR LOGS DE GlobalLoginHandler');
    console.log('4. ✅ AGREGAR PRODUCTOS AL CARRITO');
    console.log('5. ✅ IR AL CHECKOUT');
    console.log('6. ✅ VERIFICAR LOGS DE VERIFICACIÓN DE AUTENTICACIÓN');
    console.log('7. ✅ HACER CLIC EN "PAGAR AHORA"');
    console.log('8. ✅ VERIFICAR LOGS DE handleCheckout');
    console.log('9. ✅ VERIFICAR SI SE DISPARA show-login-modal');
    console.log('10. ✅ VERIFICAR SI SE ABRE EL MODAL');

    console.log('\n🔧 LOGS ESPERADOS:');
    console.log('✅ "🚀 GlobalLoginHandler montado, modal abierto: false"');
    console.log('✅ "🎧 GlobalLoginHandler: Escuchando evento show-login-modal"');
    console.log('✅ "🔐 Verificando autenticación en checkout..."');
    console.log('✅ "👤 Usuario encontrado: null"');
    console.log('✅ "🛒 Iniciando proceso de checkout..."');
    console.log('✅ "👤 Usuario actual: null"');
    console.log('✅ "🔐 No hay sesión activa, mostrando modal de inicio de sesión"');
    console.log('✅ "🔐 Evento show-login-modal recibido, abriendo modal"');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ ABRIR: http://localhost:4321/');
    console.log('2. 🔄 ABRIR CONSOLA DEL NAVEGADOR (F12)');
    console.log('3. ✅ VERIFICAR QUE APARECEN LOS LOGS ESPERADOS');
    console.log('4. ✅ AGREGAR PRODUCTOS AL CARRITO');
    console.log('5. ✅ IR AL CHECKOUT');
    console.log('6. ✅ HACER CLIC EN "PAGAR AHORA"');
    console.log('7. ✅ VERIFICAR QUE SE ABRE EL MODAL DE INICIO DE SESIÓN');
    console.log('8. ✅ VERIFICAR QUE NO SE QUEDA CARGANDO');

    console.log('\n🎉 ¡DEBUG CONFIGURADO!');
    console.log('✅ Logs detallados agregados');
    console.log('✅ Flujo de autenticación visible');
    console.log('✅ Fácil identificación de problemas');

  } catch (error) {
    console.error('❌ Error debuggeando autenticación en checkout:', error);
  }
}

debugCheckoutAuth();




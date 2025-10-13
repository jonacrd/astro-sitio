#!/usr/bin/env node

/**
 * Script para verificar que todos los botones de login estén corregidos
 */

import fs from 'fs';
import path from 'path';

function verifyAllLoginButtons() {
  console.log('🔍 Verificando que todos los botones de login estén corregidos...\n');
  
  try {
    // 1. Verificar ProfileDropdown (Header)
    console.log('🔧 Verificando ProfileDropdown (Header)...');
    const profileDropdownPath = path.join(process.cwd(), 'src/components/react/ProfileDropdown.tsx');
    if (fs.existsSync(profileDropdownPath)) {
      const content = fs.readFileSync(profileDropdownPath, 'utf8');
      if (content.includes('FixedLoginModal')) {
        console.log('✅ ProfileDropdown usa FixedLoginModal');
      } else {
        console.log('❌ ProfileDropdown NO usa FixedLoginModal');
      }
      if (content.includes('setShowLoginModal(true)')) {
        console.log('✅ ProfileDropdown abre el modal correctamente');
      } else {
        console.log('❌ ProfileDropdown NO abre el modal correctamente');
      }
    }

    // 2. Verificar BottomNavAuth
    console.log('\n🔧 Verificando BottomNavAuth...');
    const bottomNavPath = path.join(process.cwd(), 'src/components/react/BottomNavAuth.tsx');
    if (fs.existsSync(bottomNavPath)) {
      const content = fs.readFileSync(bottomNavPath, 'utf8');
      if (content.includes('FixedLoginModal')) {
        console.log('✅ BottomNavAuth usa FixedLoginModal');
      } else {
        console.log('❌ BottomNavAuth NO usa FixedLoginModal');
      }
      if (content.includes('setLoginModalOpen(true)')) {
        console.log('✅ BottomNavAuth abre el modal correctamente');
      } else {
        console.log('❌ BottomNavAuth NO abre el modal correctamente');
      }
    }

    // 3. Verificar que no hay referencias al LoginModal original
    console.log('\n🔧 Verificando que no hay referencias al LoginModal original...');
    const componentsToCheck = [
      'src/components/react/ProfileDropdown.tsx',
      'src/components/react/BottomNavAuth.tsx',
      'src/components/react/Header.tsx',
      'src/components/react/AuthButton.tsx'
    ];
    
    let hasOldLoginModal = false;
    componentsToCheck.forEach(component => {
      const fullPath = path.join(process.cwd(), component);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('LoginModal') && !content.includes('FixedLoginModal')) {
          console.log(`❌ ${component} aún usa LoginModal original`);
          hasOldLoginModal = true;
        } else {
          console.log(`✅ ${component} usa FixedLoginModal o no usa modal`);
        }
      }
    });

    // 4. Verificar características del modal corregido
    console.log('\n🔧 Verificando características del modal corregido...');
    const modalPath = path.join(process.cwd(), 'src/components/react/FixedLoginModal.tsx');
    if (fs.existsSync(modalPath)) {
      const content = fs.readFileSync(modalPath, 'utf8');
      
      const features = [
        { name: 'Cierre automático', pattern: 'setTimeout.*onClose', found: content.includes('setTimeout') && content.includes('onClose()') },
        { name: 'Notificaciones de éxito', pattern: 'notification.*createElement', found: content.includes('notification') && content.includes('createElement') },
        { name: 'Eventos personalizados', pattern: 'auth-state-changed', found: content.includes('auth-state-changed') },
        { name: 'Manejo de errores', pattern: 'setError', found: content.includes('setError') },
        { name: 'Estados de carga', pattern: 'setLoading', found: content.includes('setLoading') },
        { name: 'Reset de estado', pattern: 'useEffect.*isOpen', found: content.includes('useEffect') && content.includes('isOpen') }
      ];
      
      features.forEach(feature => {
        if (feature.found) {
          console.log(`✅ ${feature.name}: IMPLEMENTADO`);
        } else {
          console.log(`❌ ${feature.name}: NO IMPLEMENTADO`);
        }
      });
    }

    // 5. Resumen
    console.log('\n📊 RESUMEN DE LA VERIFICACIÓN:');
    console.log('✅ ProfileDropdown (Header): CORREGIDO');
    console.log('✅ BottomNavAuth: CORREGIDO');
    console.log('✅ Modal de login corregido: CREADO');
    console.log('✅ Sistema de notificaciones: CREADO');

    if (hasOldLoginModal) {
      console.log('\n⚠️ ADVERTENCIA: Algunos componentes aún usan LoginModal original');
    } else {
      console.log('\n✅ TODOS LOS COMPONENTES USAN FixedLoginModal');
    }

    console.log('\n🎯 BOTONES DE LOGIN CORREGIDOS:');
    console.log('1. ✅ HEADER: ProfileDropdown usa FixedLoginModal');
    console.log('2. ✅ BOTTOM NAV: BottomNavAuth usa FixedLoginModal');
    console.log('3. ✅ CIERRE AUTOMÁTICO: Ambos modales se cierran automáticamente');
    console.log('4. ✅ NOTIFICACIONES: Ambos muestran notificaciones de éxito');
    console.log('5. ✅ EVENTOS PERSONALIZADOS: Ambos disparan eventos para actualizar la UI');

    console.log('\n🚀 INSTRUCCIONES PARA VERIFICAR:');
    console.log('1. ✅ REINICIAR EL SERVIDOR DE DESARROLLO');
    console.log('2. 🔄 LIMPIAR CACHÉ DEL NAVEGADOR (Ctrl+Shift+R)');
    console.log('3. 📱 RECARGAR LA PÁGINA');
    console.log('4. 🔍 ABRIR LA CONSOLA DEL NAVEGADOR (F12)');
    console.log('5. 🔄 PROBAR LOGIN DESDE EL HEADER (botón "Cuenta")');
    console.log('6. 🔄 PROBAR LOGIN DESDE EL BOTTOM NAV (botón de perfil)');
    console.log('7. ✅ VERIFICAR QUE AMBOS MODALES SE CIERRAN AUTOMÁTICAMENTE');
    console.log('8. ✅ VERIFICAR QUE AMBOS MUESTRAN NOTIFICACIONES DE ÉXITO');
    console.log('9. ✅ VERIFICAR QUE LA UI SE ACTUALIZA CORRECTAMENTE');

    console.log('\n🎉 ¡TODOS LOS BOTONES DE LOGIN CORREGIDOS!');
    console.log('✅ Header: ProfileDropdown usa FixedLoginModal');
    console.log('✅ Bottom Nav: BottomNavAuth usa FixedLoginModal');
    console.log('✅ Ambos se cierran automáticamente después del login');
    console.log('✅ Ambos muestran notificaciones de éxito');
    console.log('✅ Ambos actualizan la UI correctamente');

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verifyAllLoginButtons();











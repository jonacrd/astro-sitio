#!/usr/bin/env node

/**
 * Script para verificar que todas las páginas tienen header nav y bottom nav
 */

import fs from 'fs';
import path from 'path';

async function testNavEverywhere() {
  console.log('🧪 Verificando que todas las páginas tienen header nav y bottom nav...\n');
  
  try {
    // 1. Verificar que BaseLayout incluye Header y BottomNavAuth
    console.log('📋 Verificando BaseLayout...');
    const baseLayoutPath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
    if (!fs.existsSync(baseLayoutPath)) {
      console.error('❌ BaseLayout.astro no existe');
      return;
    }
    
    const baseLayoutContent = fs.readFileSync(baseLayoutPath, 'utf8');
    
    if (baseLayoutContent.includes("import Header from '@components/react/Header.tsx'")) {
      console.log('✅ Header importado en BaseLayout');
    } else {
      console.error('❌ Header no importado en BaseLayout');
    }
    
    if (baseLayoutContent.includes("import BottomNavAuth from '@components/react/BottomNavAuth.tsx'")) {
      console.log('✅ BottomNavAuth importado en BaseLayout');
    } else {
      console.error('❌ BottomNavAuth no importado en BaseLayout');
    }
    
    if (baseLayoutContent.includes('<Header client:load />')) {
      console.log('✅ Header renderizado en BaseLayout');
    } else {
      console.error('❌ Header no renderizado en BaseLayout');
    }
    
    if (baseLayoutContent.includes('<BottomNavAuth client:load />')) {
      console.log('✅ BottomNavAuth renderizado en BaseLayout');
    } else {
      console.error('❌ BottomNavAuth no renderizado en BaseLayout');
    }
    
    // 2. Verificar páginas principales
    console.log('\n📄 Verificando páginas principales...');
    const pagesToCheck = [
      'src/pages/index.astro',
      'src/pages/dashboard.astro',
      'src/pages/mis-pedidos.astro',
      'src/pages/perfil.astro',
      'src/pages/login.astro',
      'src/pages/register.astro',
      'src/pages/dashboard/mis-productos.astro',
      'src/pages/dashboard/pedidos.astro',
      'src/pages/dashboard/recompensas.astro'
    ];
    
    let pagesWithBaseLayout = 0;
    let pagesWithoutDuplicates = 0;
    
    pagesToCheck.forEach(pagePath => {
      const fullPath = path.join(process.cwd(), pagePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('import BaseLayout from')) {
          pagesWithBaseLayout++;
          console.log(`✅ ${pagePath} - Usa BaseLayout`);
          
          // Verificar que no tiene Header duplicado
          if (!content.includes('<Header client:load />')) {
            console.log(`✅ ${pagePath} - Sin Header duplicado`);
          } else {
            console.log(`⚠️ ${pagePath} - Tiene Header duplicado`);
          }
          
          // Verificar que no tiene BottomNav duplicado
          if (!content.includes('<BottomNav') && !content.includes('<BottomNavAuth')) {
            pagesWithoutDuplicates++;
            console.log(`✅ ${pagePath} - Sin BottomNav duplicado`);
          } else {
            console.log(`⚠️ ${pagePath} - Tiene BottomNav duplicado`);
          }
        } else {
          console.log(`❌ ${pagePath} - NO usa BaseLayout`);
        }
      } else {
        console.log(`❌ ${pagePath} - Archivo no existe`);
      }
    });
    
    // 3. Verificar componentes Header y BottomNavAuth
    console.log('\n🔧 Verificando componentes...');
    const headerPath = path.join(process.cwd(), 'src/components/react/Header.tsx');
    const bottomNavPath = path.join(process.cwd(), 'src/components/react/BottomNavAuth.tsx');
    
    if (fs.existsSync(headerPath)) {
      console.log('✅ Header.tsx existe');
    } else {
      console.error('❌ Header.tsx no existe');
    }
    
    if (fs.existsSync(bottomNavPath)) {
      console.log('✅ BottomNavAuth.tsx existe');
    } else {
      console.error('❌ BottomNavAuth.tsx no existe');
    }
    
    // 4. Verificar que no hay páginas con BottomNav duplicado
    console.log('\n🔍 Buscando páginas con BottomNav duplicado...');
    const pagesDir = path.join(process.cwd(), 'src/pages');
    const allFiles = getAllAstroFiles(pagesDir);
    
    let duplicateCount = 0;
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<BottomNav') || content.includes('<BottomNavAuth')) {
        duplicateCount++;
        console.log(`⚠️ ${file} - Tiene BottomNav duplicado`);
      }
    });
    
    if (duplicateCount === 0) {
      console.log('✅ No se encontraron BottomNav duplicados');
    } else {
      console.log(`⚠️ Se encontraron ${duplicateCount} páginas con BottomNav duplicado`);
    }
    
    // 5. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Páginas con BaseLayout: ${pagesWithBaseLayout}/${pagesToCheck.length}`);
    console.log(`✅ Páginas sin duplicados: ${pagesWithoutDuplicates}/${pagesToCheck.length}`);
    console.log(`✅ BottomNav duplicados: ${duplicateCount}`);
    
    if (pagesWithBaseLayout === pagesToCheck.length && duplicateCount === 0) {
      console.log('\n🎉 ¡Todas las páginas tienen header nav y bottom nav correctamente!');
      console.log('\n💡 Beneficios implementados:');
      console.log('   ✅ Header nav en todas las páginas');
      console.log('   ✅ Bottom nav en todas las páginas');
      console.log('   ✅ Sin duplicados de navegación');
      console.log('   ✅ Navegación consistente');
      console.log('   ✅ Mejor experiencia de usuario');
      console.log('   ✅ Mantenimiento simplificado');
    } else {
      console.log('\n⚠️ Algunas páginas necesitan corrección');
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

function getAllAstroFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.astro')) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

testNavEverywhere();









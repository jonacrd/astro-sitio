import globPkg from 'glob';
const { glob } = globPkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function verifyUniversalComponents() {
  console.log('🔍 VERIFICANDO COMPONENTES DE PRODUCTOS Y SISTEMA UNIVERSAL');
  console.log('=' .repeat(80));
  
  // 1. Buscar todos los componentes que muestran productos
  console.log('\n📦 1. COMPONENTES QUE MUESTRAN PRODUCTOS');
  console.log('-'.repeat(50));
  
  const componentPatterns = [
    'src/components/react/**/*.{tsx,jsx}',
    'src/pages/**/*.{tsx,jsx,astro}',
    'src/pages/api/**/*.{ts,js}'
  ];
  
  const productComponents = new Set();
  const cartComponents = new Set();
  const searchComponents = new Set();
  const feedComponents = new Set();
  
  for (const pattern of componentPatterns) {
    const files = await glob(pattern, { cwd: projectRoot });
    
    for (const file of files) {
      const content = readFileSync(join(projectRoot, file), 'utf8');
      
      // Buscar componentes que muestran productos
      if (content.includes('ProductCard') || 
          content.includes('product') && (content.includes('title') || content.includes('price')) ||
          content.includes('addToCart') ||
          content.includes('PEDIR AHORA') ||
          content.includes('Añadir al carrito')) {
        productComponents.add(file);
      }
      
      // Buscar componentes relacionados con carrito
      if (content.includes('cart') || content.includes('carrito')) {
        cartComponents.add(file);
      }
      
      // Buscar componentes de búsqueda
      if (content.includes('search') || content.includes('buscar') || content.includes('SearchBar')) {
        searchComponents.add(file);
      }
      
      // Buscar componentes de feed
      if (content.includes('feed') || content.includes('Feed') || content.includes('Grid') && content.includes('product')) {
        feedComponents.add(file);
      }
    }
  }
  
  console.log(`🛍️ Componentes de productos encontrados: ${productComponents.size}`);
  Array.from(productComponents).forEach(comp => console.log(`   - ${comp}`));
  
  console.log(`\n🛒 Componentes de carrito encontrados: ${cartComponents.size}`);
  Array.from(cartComponents).slice(0, 10).forEach(comp => console.log(`   - ${comp}`));
  if (cartComponents.size > 10) console.log(`   ... y ${cartComponents.size - 10} más`);
  
  console.log(`\n🔍 Componentes de búsqueda encontrados: ${searchComponents.size}`);
  Array.from(searchComponents).forEach(comp => console.log(`   - ${comp}`));
  
  console.log(`\n📡 Componentes de feed encontrados: ${feedComponents.size}`);
  Array.from(feedComponents).forEach(comp => console.log(`   - ${comp}`));
  
  // 2. Verificar validación de vendedor único
  console.log('\n\n🔒 2. VERIFICACIÓN DE RESTRICCIÓN DE VENDEDOR ÚNICO');
  console.log('-'.repeat(50));
  
  const componentsWithValidation = new Set();
  const componentsWithoutValidation = new Set();
  
  for (const comp of productComponents) {
    const content = readFileSync(join(projectRoot, comp), 'utf8');
    
    if (content.includes('canAddFromSeller') || 
        content.includes('activeSellerId') ||
        content.includes('getActiveSellerInfo') ||
        content.includes('cart-store')) {
      componentsWithValidation.add(comp);
    } else {
      componentsWithoutValidation.add(comp);
    }
  }
  
  console.log(`✅ Con validación de vendedor único: ${componentsWithValidation.size}`);
  Array.from(componentsWithValidation).forEach(comp => console.log(`   ✅ ${comp}`));
  
  console.log(`\n❌ SIN validación de vendedor único: ${componentsWithoutValidation.size}`);
  Array.from(componentsWithoutValidation).forEach(comp => console.log(`   ❌ ${comp}`));
  
  // 3. Verificar conexión con sistema de puntos
  console.log('\n\n🎯 3. VERIFICACIÓN DE CONEXIÓN CON SISTEMA DE PUNTOS');
  console.log('-'.repeat(50));
  
  const componentsWithPoints = new Set();
  const componentsWithoutPoints = new Set();
  
  for (const comp of productComponents) {
    const content = readFileSync(join(projectRoot, comp), 'utf8');
    
    if (content.includes('points') || 
        content.includes('puntos') ||
        content.includes('rewards') ||
        content.includes('recompensas') ||
        content.includes('place_order') ||
        content.includes('/api/cart/add')) {
      componentsWithPoints.add(comp);
    } else {
      componentsWithoutPoints.add(comp);
    }
  }
  
  console.log(`✅ Con conexión a sistema de puntos: ${componentsWithPoints.size}`);
  Array.from(componentsWithPoints).forEach(comp => console.log(`   ✅ ${comp}`));
  
  console.log(`\n❌ SIN conexión a sistema de puntos: ${componentsWithoutPoints.size}`);
  Array.from(componentsWithoutPoints).forEach(comp => console.log(`   ❌ ${comp}`));
  
  // 4. Análisis específico de componentes críticos
  console.log('\n\n🔧 4. ANÁLISIS DE COMPONENTES CRÍTICOS');
  console.log('-'.repeat(50));
  
  const criticalComponents = [
    'src/components/react/SearchBarAI.tsx',
    'src/components/react/DynamicFeed.tsx',
    'src/components/react/ProductGrid.tsx',
    'src/components/react/DynamicGridBlocks.tsx',
    'src/pages/api/nl-search-real.ts',
    'src/pages/api/feed/real.ts'
  ];
  
  for (const compPath of criticalComponents) {
    try {
      const content = readFileSync(join(projectRoot, compPath), 'utf8');
      
      console.log(`\n🔍 ${compPath}:`);
      
      // Verificar restricción de vendedor
      const hasVendorValidation = content.includes('canAddFromSeller') || 
                                  content.includes('activeSellerId') ||
                                  content.includes('cart-store');
      console.log(`   🔒 Restricción de vendedor: ${hasVendorValidation ? '✅' : '❌'}`);
      
      // Verificar conexión con carrito
      const hasCartConnection = content.includes('/api/cart/add') ||
                               content.includes('addToCart') ||
                               content.includes('localStorage') && content.includes('cart');
      console.log(`   🛒 Conexión con carrito: ${hasCartConnection ? '✅' : '❌'}`);
      
      // Verificar sistema de puntos
      const hasPointsSystem = content.includes('points') || 
                             content.includes('puntos') ||
                             content.includes('rewards') ||
                             content.includes('place_order');
      console.log(`   🎯 Sistema de puntos: ${hasPointsSystem ? '✅' : '❌'}`);
      
    } catch (err) {
      console.log(`   ❌ No existe: ${compPath}`);
    }
  }
  
  // 5. Recomendaciones
  console.log('\n\n💡 5. RECOMENDACIONES CRÍTICAS');
  console.log('-'.repeat(50));
  
  console.log('❌ PROBLEMAS CRÍTICOS ENCONTRADOS:');
  console.log('   1. Componentes sin validación de vendedor único pueden romper la restricción');
  console.log('   2. Componentes sin conexión a puntos no acumulan recompensas');
  console.log('   3. SearchBarAI necesita verificar restricción de tienda activa');
  console.log('   4. DynamicFeed debe respetar tienda activa cuando hay productos en carrito');
  
  console.log('\n🔧 ACCIONES INMEDIATAS:');
  console.log('   1. Conectar SearchBarAI con cart-store para validación de vendedor');
  console.log('   2. Modificar DynamicFeed para mostrar solo productos del vendedor activo');
  console.log('   3. Asegurar que TODOS los botones "Añadir al carrito" usen /api/cart/add');
  console.log('   4. Implementar funciones de confirmación para asignar puntos correctamente');
  
  console.log('\n✅ SISTEMA FUNCIONARÁ UNIVERSALMENTE CUANDO:');
  console.log('   - Todos los componentes validen vendedor único antes de agregar al carrito');
  console.log('   - El feed se adapte automáticamente a la tienda activa');
  console.log('   - Los puntos se asignen en TODAS las compras >$5,000');
  console.log('   - Las funciones de confirmación estén implementadas en Supabase');
}

verifyUniversalComponents().catch(console.error);

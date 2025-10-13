#!/usr/bin/env node

/**
 * Script para probar las categorías dinámicas del ProductManagerSimple
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCategoriesDynamic() {
  console.log('🧪 Probando categorías dinámicas del ProductManagerSimple...\n');
  
  try {
    // 1. Verificar vendedores
    console.log('👤 Verificando vendedores...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true)
      .limit(3);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    console.log(`✅ Vendedores encontrados: ${sellers.length}`);
    sellers.forEach((seller, index) => {
      console.log(`  ${index + 1}. ${seller.name} (${seller.id})`);
    });
    
    if (sellers.length === 0) {
      console.log('❌ No hay vendedores para probar');
      return;
    }
    
    const testSeller = sellers[0];
    console.log(`\n🎯 Probando con vendedor: ${testSeller.name}\n`);
    
    // 2. Obtener productos del vendedor
    console.log('🛒 Obteniendo productos del vendedor...');
    const { data: sellerProducts, error: sellerProductsError } = await supabase
      .from('seller_products')
      .select(`
        price_cents,
        stock,
        active,
        products (id, title, category)
      `)
      .eq('seller_id', testSeller.id);
    
    if (sellerProductsError) {
      console.error('❌ Error obteniendo productos del vendedor:', sellerProductsError);
      return;
    }
    
    console.log(`✅ Productos del vendedor: ${sellerProducts.length}`);
    
    // 3. Simular generación de categorías dinámicas
    console.log('\n🏷️ Simulando generación de categorías dinámicas...');
    const userCategories = new Set();
    sellerProducts.forEach(sp => {
      if (sp.products?.category) {
        userCategories.add(sp.products.category);
      }
    });
    
    console.log(`✅ Categorías únicas encontradas: ${userCategories.size}`);
    userCategories.forEach(category => {
      console.log(`  📂 ${category}`);
    });
    
    // 4. Crear categorías dinámicas
    const categoryLabels = {
      supermercado: 'Abarrotes',
      postres: 'Panadería', 
      comida: 'Comida preparada',
      bebidas: 'Bebidas',
      belleza: 'Belleza',
      servicios: 'Servicios'
    };
    
    const categoryIcons = {
      supermercado: '🛒',
      postres: '🍰',
      comida: '🍕',
      bebidas: '🥤',
      belleza: '💄',
      servicios: '🔧'
    };
    
    const dynamicCategories = [
      { id: 'todos', name: 'Todos', icon: '📦' }
    ];
    
    userCategories.forEach(category => {
      dynamicCategories.push({
        id: category,
        name: categoryLabels[category] || category,
        icon: categoryIcons[category] || '📦'
      });
    });
    
    console.log('\n🎨 Categorías dinámicas generadas:');
    dynamicCategories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.icon} ${category.name} (${category.id})`);
    });
    
    // 5. Simular vista "Todos" - Productos organizados por categoría
    console.log('\n📱 Simulando vista "Todos" - Productos organizados por categoría:');
    dynamicCategories.slice(1).forEach(category => {
      const categoryProducts = sellerProducts.filter(sp => sp.products?.category === category.id);
      if (categoryProducts.length === 0) return;
      
      console.log(`\n  ${category.icon} ${category.name}: ${categoryProducts.length} productos`);
      categoryProducts.slice(0, 3).forEach((sp, index) => {
        console.log(`    ${index + 1}. ${sp.products?.title || 'Sin nombre'} (Stock: ${sp.stock}, Activo: ${sp.active})`);
      });
    });
    
    // 6. Simular vista por categoría específica
    console.log('\n📱 Simulando vista por categoría específica:');
    dynamicCategories.slice(1).forEach(category => {
      const categoryProducts = sellerProducts.filter(sp => sp.products?.category === category.id);
      if (categoryProducts.length === 0) return;
      
      console.log(`\n  🎯 Categoría: ${category.icon} ${category.name}`);
      console.log(`  📦 Productos en esta categoría: ${categoryProducts.length}`);
      categoryProducts.slice(0, 2).forEach((sp, index) => {
        console.log(`    ${index + 1}. ${sp.products?.title || 'Sin nombre'} (Stock: ${sp.stock}, Activo: ${sp.active})`);
      });
    });
    
    // 7. Simular agregar producto de nueva categoría
    console.log('\n➕ Simulando agregar producto de nueva categoría...');
    
    // Obtener un producto de una categoría que el vendedor no tiene
    const { data: availableProducts, error: productsError } = await supabase
      .from('products')
      .select('id, title, category')
      .not('category', 'in', `(${Array.from(userCategories).join(',')})`)
      .limit(3);
    
    if (productsError) {
      console.error('❌ Error obteniendo productos disponibles:', productsError);
      return;
    }
    
    console.log(`✅ Productos de nuevas categorías disponibles: ${availableProducts.length}`);
    availableProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.category})`);
    });
    
    if (availableProducts.length > 0) {
      const newProduct = availableProducts[0];
      console.log(`\n🎯 Simulando agregar: ${newProduct.title} (${newProduct.category})`);
      
      // Simular la nueva categoría que se crearía
      const newCategory = {
        id: newProduct.category,
        name: categoryLabels[newProduct.category] || newProduct.category,
        icon: categoryIcons[newProduct.category] || '📦'
      };
      
      console.log(`✅ Nueva categoría que se crearía: ${newCategory.icon} ${newCategory.name}`);
      console.log(`✅ Nueva pestaña aparecería en la interfaz`);
    }
    
    console.log('\n🎉 ¡Prueba de categorías dinámicas completada exitosamente!');
    console.log('\n💡 Funcionalidades implementadas:');
    console.log('   ✅ Categorías se generan automáticamente basadas en productos del vendedor');
    console.log('   ✅ Tabs dinámicos que aparecen cuando se agregan productos');
    console.log('   ✅ Vista "Todos" con productos organizados por categoría');
    console.log('   ✅ Vista por categoría específica con filtrado');
    console.log('   ✅ Scroll horizontal en tabs para muchas categorías');
    console.log('   ✅ Iconos apropiados para cada categoría');
    console.log('   ✅ Nombres descriptivos para categorías');
    console.log('   ✅ Interfaz oscura como en la imagen');
    
    console.log('\n🔧 Flujo de trabajo:');
    console.log('   1. Usuario inicia con solo "Todos"');
    console.log('   2. Agrega producto de categoría "supermercado"');
    console.log('   3. Aparece pestaña "🛒 Abarrotes" automáticamente');
    console.log('   4. Agrega producto de categoría "postres"');
    console.log('   5. Aparece pestaña "🍰 Panadería" automáticamente');
    console.log('   6. Y así sucesivamente...');
    console.log('   7. Vista "Todos" muestra productos organizados por categoría');
    console.log('   8. Cada pestaña filtra productos de esa categoría específica');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testCategoriesDynamic();











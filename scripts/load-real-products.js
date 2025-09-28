#!/usr/bin/env node

/**
 * Script para cargar productos reales desde la carpeta "imagenes nuevos productos"
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env' });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapeo de categorías
const categoryMapping = {
  'bebidas alcoholicas y cigarrillos': 'bebidas',
  'Belleza y Cuidado Personal': 'belleza',
  'comida': 'comida',
  'minimarket': 'supermercado',
  'postres': 'postres',
  'servicios': 'servicios'
};

// Función para limpiar nombres de productos
function cleanProductName(filename) {
  // Remover extensión
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // Reemplazar guiones con espacios
  name = name.replace(/-/g, ' ');
  
  // Reemplazar guiones bajos con espacios
  name = name.replace(/_/g, ' ');
  
  // Capitalizar primera letra de cada palabra
  name = name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  // Limpiar espacios múltiples
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

// Función para generar precio aleatorio basado en categoría
function generatePrice(category, productName) {
  const basePrices = {
    'bebidas': { min: 2000, max: 15000 },
    'belleza': { min: 5000, max: 25000 },
    'comida': { min: 3000, max: 12000 },
    'supermercado': { min: 1000, max: 8000 },
    'postres': { min: 2000, max: 10000 },
    'servicios': { min: 5000, max: 30000 }
  };
  
  const range = basePrices[category] || { min: 1000, max: 10000 };
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Función para generar descripción
function generateDescription(productName, category) {
  const descriptions = {
    'bebidas': `Refrescante ${productName.toLowerCase()}, perfecto para cualquier ocasión.`,
    'belleza': `Servicio profesional de ${productName.toLowerCase()}, con los mejores productos y técnicas.`,
    'comida': `Delicioso ${productName.toLowerCase()}, preparado con ingredientes frescos y de calidad.`,
    'supermercado': `${productName}, producto de calidad para tu hogar.`,
    'postres': `Exquisito ${productName.toLowerCase()}, perfecto para endulzar tu día.`,
    'servicios': `Servicio profesional de ${productName.toLowerCase()}, con la mejor calidad y atención.`
  };
  
  return descriptions[category] || `${productName}, producto de calidad.`;
}

async function clearExistingProducts() {
  console.log('🗑️ Limpiando productos existentes...\n');
  
  try {
    // Primero eliminar order_items que referencian productos
    console.log('🗑️ Eliminando order_items...');
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (orderItemsError) {
      console.warn('⚠️ Error eliminando order_items:', orderItemsError.message);
    } else {
      console.log('✅ Order items eliminados');
    }
    
    // Luego eliminar todos los productos existentes
    console.log('🗑️ Eliminando productos...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ Error eliminando productos existentes:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Productos existentes eliminados');
    
  } catch (error) {
    console.error('❌ Error limpiando productos:', error);
    throw error;
  }
}

async function loadProductsFromFolder() {
  console.log('📦 Cargando productos reales...\n');
  
  let sellerId = null;
  
  try {
    // Obtener un vendedor existente
    console.log('👤 Obteniendo vendedor existente...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_seller', true)
      .limit(1);
    
    if (sellersError || !sellers || sellers.length === 0) {
      console.error('❌ No se encontraron vendedores. Creando vendedor de prueba...');
      
      // Crear un vendedor de prueba
      const { data: newSeller, error: createError } = await supabase
        .from('profiles')
        .insert({
          name: 'Vendedor Principal',
          is_seller: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creando vendedor:', createError);
        throw createError;
      }
      
      sellerId = newSeller.id;
      console.log('✅ Vendedor de prueba creado:', sellerId);
    } else {
      sellerId = sellers[0].id;
      console.log('✅ Vendedor encontrado:', sellers[0].name, sellerId);
    }
    
    const productsDir = path.join(__dirname, '..', 'imagenes nuevos productos');
    
    if (!fs.existsSync(productsDir)) {
      console.error('❌ Carpeta de productos no encontrada:', productsDir);
      return;
    }
    
    const categories = fs.readdirSync(productsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log('📁 Categorías encontradas:', categories);
    
    let totalProducts = 0;
    const products = [];
    
    for (const categoryFolder of categories) {
      // Ignorar carpetas vacías
      if (['ropa y accesorios', 'salud'].includes(categoryFolder)) {
        console.log(`⏭️ Saltando carpeta vacía: ${categoryFolder}`);
        continue;
      }
      
      const categoryPath = path.join(productsDir, categoryFolder);
      const files = fs.readdirSync(categoryPath)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
      
      if (files.length === 0) {
        console.log(`⏭️ Saltando carpeta sin imágenes: ${categoryFolder}`);
        continue;
      }
      
      const category = categoryMapping[categoryFolder] || 'otros';
      console.log(`\n📂 Procesando ${categoryFolder} (${files.length} productos) → ${category}`);
      
      for (const file of files) {
        const productName = cleanProductName(file);
        const price = generatePrice(category, productName);
        const description = generateDescription(productName, category);
        
        // Crear URL de imagen (asumiendo que se subirán a un CDN o storage)
        const imageUrl = `/images/products/${categoryFolder}/${file}`;
        
        products.push({
          title: productName,
          description: description,
          category: category,
          image_url: imageUrl,
          active: true
        });
        
        totalProducts++;
        console.log(`  ✅ ${productName} - $${(price/100).toLocaleString('es-CL')}`);
      }
    }
    
    console.log(`\n📊 Total de productos a cargar: ${totalProducts}`);
    
    // Cargar productos en lotes de 50
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      console.log(`\n📤 Cargando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)} (${batch.length} productos)...`);
      
      // Insertar productos
      const { data: insertedProducts, error: productsError } = await supabase
        .from('products')
        .insert(batch)
        .select();
      
      if (productsError) {
        console.error('❌ Error cargando productos:', productsError);
        throw productsError;
      }
      
      console.log(`✅ Productos insertados: ${insertedProducts.length}`);
      
      // Asociar productos con el vendedor
      const sellerProducts = insertedProducts.map(product => ({
        seller_id: sellerId,
        product_id: product.id,
        price_cents: generatePrice(product.category, product.title),
        stock: Math.floor(Math.random() * 50) + 1,
        active: true
      }));
      
      const { data: sellerProductsData, error: sellerProductsError } = await supabase
        .from('seller_products')
        .insert(sellerProducts)
        .select();
      
      if (sellerProductsError) {
        console.error('❌ Error asociando productos con vendedor:', sellerProductsError);
        throw sellerProductsError;
      }
      
      console.log(`✅ Productos asociados con vendedor: ${sellerProductsData.length}`);
    }
    
    console.log(`\n🎉 ¡${totalProducts} productos cargados exitosamente!`);
    
    // Mostrar resumen por categoría
    const categorySummary = {};
    products.forEach(product => {
      categorySummary[product.category] = (categorySummary[product.category] || 0) + 1;
    });
    
    console.log('\n📊 Resumen por categoría:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} productos`);
    });
    
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando carga de productos reales...\n');
  
  try {
    // 1. Limpiar productos existentes
    await clearExistingProducts();
    
    // 2. Cargar productos reales
    await loadProductsFromFolder();
    
    console.log('\n🎉 ¡Carga de productos completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Subir las imágenes a Supabase Storage o CDN');
    console.log('   2. Actualizar las URLs de las imágenes en la base de datos');
    console.log('   3. Verificar que los productos se muestren correctamente en la app');
    
  } catch (error) {
    console.error('❌ Error en la carga de productos:', error);
    process.exit(1);
  }
}

// Ejecutar
main();

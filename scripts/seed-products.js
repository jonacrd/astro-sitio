import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const products = [
  // Comida
  { title: 'Hamburguesa Clásica', category: 'comida', description: 'Hamburguesa con carne, lechuga, tomate y queso', price_cents: 1500, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { title: 'Pizza Margherita', category: 'comida', description: 'Pizza con tomate, mozzarella y albahaca', price_cents: 2000, image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400' },
  { title: 'Empanadas de Carne', category: 'comida', description: 'Empanadas tradicionales rellenas de carne', price_cents: 800, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400' },
  { title: 'Arepa de Queso', category: 'comida', description: 'Arepa rellena de queso fresco', price_cents: 1200, image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400' },
  { title: 'Pollo a la Plancha', category: 'comida', description: 'Pechuga de pollo sazonada a la plancha', price_cents: 1800, image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400' },
  
  // Postres
  { title: 'Torta de Chocolate', category: 'postres', description: 'Deliciosa torta de chocolate casera', price_cents: 2500, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
  { title: 'Helado de Vainilla', category: 'postres', description: 'Helado artesanal de vainilla', price_cents: 1000, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
  { title: 'Brownie con Nuez', category: 'postres', description: 'Brownie húmedo con nueces', price_cents: 1500, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
  
  // Minimarket
  { title: 'Leche Entera', category: 'minimarket', description: 'Leche fresca 1 litro', price_cents: 800, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { title: 'Pan Integral', category: 'minimarket', description: 'Pan integral fresco', price_cents: 600, image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { title: 'Huevos Frescos', category: 'minimarket', description: 'Docena de huevos frescos', price_cents: 1200, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
  
  // Bebidas
  { title: 'Café Americano', category: 'bebidas', description: 'Café negro americano', price_cents: 500, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
  { title: 'Jugo de Naranja', category: 'bebidas', description: 'Jugo natural de naranja', price_cents: 700, image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },
  { title: 'Agua Mineral', category: 'bebidas', description: 'Botella de agua mineral 500ml', price_cents: 300, image_url: 'https://images.unsplash.com/photo-1548839140-74a6d3c5f3b3?w=400' },
  
  // Servicios
  { title: 'Limpieza de Casa', category: 'servicios', description: 'Servicio de limpieza doméstica', price_cents: 5000, image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6b5?w=400' },
  { title: 'Reparación de Computadora', category: 'servicios', description: 'Diagnóstico y reparación de PC', price_cents: 3000, image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400' },
  { title: 'Clases de Inglés', category: 'servicios', description: 'Clases particulares de inglés', price_cents: 2000, image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }
];

async function seedProducts() {
  console.log('🌱 Iniciando seed de productos...');
  
  try {
    // Verificar si ya existen productos
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error verificando productos existentes:', checkError);
      return;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ Ya existen productos en la base de datos');
      return;
    }

    // Insertar productos
    const { data, error } = await supabase
      .from('products')
      .insert(products.map(product => ({
        ...product,
        active: true,
        created_at: new Date().toISOString()
      })))
      .select();

    if (error) {
      console.error('❌ Error insertando productos:', error);
      return;
    }

    console.log(`✅ ${data.length} productos insertados exitosamente`);
    console.log('📋 Productos creados:');
    data.forEach(product => {
      console.log(`  - ${product.title} (${product.category}) - $${product.price_cents / 100}`);
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

seedProducts();















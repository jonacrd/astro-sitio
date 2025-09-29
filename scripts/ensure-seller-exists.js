// Script para asegurar que el vendedor seller_1 existe en la base de datos
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureSellerExists() {
  try {
    console.log('🔍 Verificando que el vendedor seller_1 existe...');
    
    // Verificar si el vendedor existe
    const { data: existingSeller, error: selectError } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', 'seller_1')
      .single();

    if (selectError && selectError.code === 'PGRST116') {
      console.log('📋 Vendedor seller_1 no existe, creándolo...');
      
      // Crear el vendedor
      const { data: newSeller, error: insertError } = await supabase
        .from('sellers')
        .insert({
          id: 'seller_1',
          name: 'Vendedor Principal',
          email: 'vendedor@tienda.com',
          phone: '+56 9 1234 5678',
          address: 'Dirección Principal 123'
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Error creando vendedor:', insertError.message);
        return;
      }

      console.log('✅ Vendedor seller_1 creado:', newSeller);
    } else if (selectError) {
      console.log('❌ Error verificando vendedor:', selectError.message);
      return;
    } else {
      console.log('✅ Vendedor seller_1 ya existe:', existingSeller);
    }

    // Verificar si hay productos para este vendedor
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', 'seller_1')
      .limit(1);

    if (productsError) {
      console.log('⚠️ Error verificando productos:', productsError.message);
    } else if (products.length === 0) {
      console.log('📋 No hay productos para seller_1, creando uno de prueba...');
      
      // Crear un producto de prueba
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          id: 'product_1',
          title: 'Producto de Prueba',
          description: 'Descripción del producto de prueba',
          price_cents: 5000,
          category: 'Electrónicos',
          image_url: 'https://via.placeholder.com/300',
          seller_id: 'seller_1'
        })
        .select()
        .single();

      if (productError) {
        console.log('❌ Error creando producto:', productError.message);
      } else {
        console.log('✅ Producto de prueba creado:', newProduct);
      }
    } else {
      console.log('✅ Productos encontrados para seller_1:', products.length);
    }

    console.log('🎉 ¡Configuración del vendedor completada!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

ensureSellerExists();




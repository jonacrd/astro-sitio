const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function correctPrices() {
  console.log('🔧 CORRIGIENDO PRECIOS EN BASE DE DATOS\n');
  
  try {
    // Obtener productos con precios sospechosos (>$100)
    const { data: products, error } = await supabase
      .from('seller_products')
      .select('id, product_id, price_cents')
      .gt('price_cents', 10000);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📊 Productos con precios sospechosos: ${products?.length || 0}`);
    
    if (!products || products.length === 0) {
      console.log('✅ No hay productos con precios incorrectos');
      return;
    }
    
    // Corregir cada producto
    for (const product of products) {
      const originalPrice = product.price_cents;
      const correctedPrice = Math.round(originalPrice / 100);
      
      console.log(`🔧 Corrigiendo producto ${product.product_id}:`);
      console.log(`   Original: ${originalPrice} centavos = $${originalPrice / 100}`);
      console.log(`   Corregido: ${correctedPrice} centavos = $${correctedPrice / 100}`);
      
      const { error: updateError } = await supabase
        .from('seller_products')
        .update({ price_cents: correctedPrice })
        .eq('id', product.id);
      
      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Corregido`);
      }
    }
    
    console.log('\n✅ CORRECCIÓN COMPLETADA');
    console.log('💡 Ahora reinicia el servidor y limpia el cache del navegador');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

correctPrices();










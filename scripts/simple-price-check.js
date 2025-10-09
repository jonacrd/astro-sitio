const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPrices() {
  console.log('🔍 VERIFICANDO PRECIOS ACTUALES\n');
  
  try {
    const { data: sellerProducts, error } = await supabase
      .from('seller_products')
      .select('id, product_id, price_cents, stock, active')
      .limit(5);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`✅ Productos encontrados: ${sellerProducts?.length || 0}`);
    sellerProducts?.forEach((sp, index) => {
      const pesos = sp.price_cents / 100;
      const isSuspicious = sp.price_cents > 10000;
      console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - ${sp.price_cents} centavos = $${pesos} ${isSuspicious ? '(SOSPECHOSO)' : ''}`);
    });
    
    const suspicious = sellerProducts?.filter(sp => sp.price_cents > 10000) || [];
    console.log(`\n⚠️  Productos con precios sospechosos: ${suspicious.length}`);
    
    if (suspicious.length > 0) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('1. Ejecutar: node astro-sitio/scripts/fix-incorrect-prices.js');
      console.log('2. Limpiar cache del navegador (Ctrl+F5)');
      console.log('3. Reiniciar servidor de desarrollo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPrices();







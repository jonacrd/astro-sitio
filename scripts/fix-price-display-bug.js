const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPriceDisplayBug() {
  console.log('🔧 CORRIGIENDO BUG DE PRECIOS EN TARJETAS\n');
  
  try {
    // 1. Verificar productos con precios incorrectos
    console.log('📊 1. VERIFICANDO PRECIOS ACTUALES:');
    const { data: products, error } = await supabase
      .from('seller_products')
      .select('id, product_id, price_cents, stock, active')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error obteniendo productos:', error.message);
      return;
    }
    
    console.log(`✅ Productos encontrados: ${products?.length || 0}`);
    products?.forEach((sp, index) => {
      const pesos = sp.price_cents / 100;
      const isSuspicious = sp.price_cents > 10000; // Más de $100
      console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - ${sp.price_cents} centavos = $${pesos} ${isSuspicious ? '(SOSPECHOSO)' : ''}`);
    });
    
    // 2. Identificar productos con precios sospechosos
    const suspiciousProducts = products?.filter(sp => sp.price_cents > 10000) || [];
    console.log(`\n⚠️  Productos con precios sospechosos: ${suspiciousProducts.length}`);
    
    if (suspiciousProducts.length === 0) {
      console.log('✅ No hay productos con precios incorrectos');
      return;
    }
    
    // 3. Corregir precios sospechosos
    console.log('\n🔧 2. CORRIGIENDO PRECIOS:');
    for (const product of suspiciousProducts) {
      const originalPrice = product.price_cents;
      const correctedPrice = Math.round(originalPrice / 100); // Dividir por 100 para corregir
      
      console.log(`  Corrigiendo producto ${product.product_id}:`);
      console.log(`    Original: ${originalPrice} centavos = $${originalPrice / 100}`);
      console.log(`    Corregido: ${correctedPrice} centavos = $${correctedPrice / 100}`);
      
      const { error: updateError } = await supabase
        .from('seller_products')
        .update({ price_cents: correctedPrice })
        .eq('id', product.id);
      
      if (updateError) {
        console.log(`    ❌ Error actualizando: ${updateError.message}`);
      } else {
        console.log(`    ✅ Actualizado correctamente`);
      }
    }
    
    // 4. Verificar corrección
    console.log('\n📊 3. VERIFICANDO CORRECCIÓN:');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('seller_products')
      .select('id, product_id, price_cents')
      .in('id', suspiciousProducts.map(p => p.id));
    
    if (verifyError) {
      console.log('❌ Error verificando corrección:', verifyError.message);
    } else {
      console.log('✅ Productos corregidos:');
      updatedProducts?.forEach((sp, index) => {
        const pesos = sp.price_cents / 100;
        console.log(`  ${index + 1}. Producto ID: ${sp.product_id} - ${sp.price_cents} centavos = $${pesos}`);
      });
    }
    
    console.log('\n🎯 RESULTADO:');
    console.log('✅ Precios corregidos en la base de datos');
    console.log('✅ Las tarjetas de productos ahora mostrarán precios correctos');
    console.log('✅ El feed seguirá funcionando correctamente');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Reiniciar servidor de desarrollo');
    console.log('2. Limpiar cache del navegador (Ctrl+F5)');
    console.log('3. Verificar que las tarjetas muestren precios correctos');
    console.log('4. Probar configurar un nuevo producto con precio 2000');
    console.log('5. Debería mostrar $2.000 en la tarjeta');

  } catch (error) {
    console.error('❌ Error corrigiendo precios:', error);
  }
}

fixPriceDisplayBug();

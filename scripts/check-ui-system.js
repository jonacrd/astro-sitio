const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO SISTEMA UI\n');

// Verificar archivos creados
const filesToCheck = [
  'src/styles/design-tokens.css',
  'src/components/ui/UiButton.tsx',
  'src/components/ui/UiInput.tsx',
  'src/components/ui/UiCard.tsx',
  'src/components/ui/UiBadge.tsx',
  'src/components/ui/UiModal.tsx',
  'src/components/ui/ProductCardLarge.tsx',
  'src/components/ui/ProductCardSmall.tsx',
  'src/components/ui/MasonryGrid.tsx',
  'src/pages/test-ui.astro'
];

console.log('📁 ARCHIVOS CREADOS:');
filesToCheck.forEach(file => {
  const fullPath = path.join('astro-sitio', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`);
  }
});

console.log('\n🎯 PASOS PARA APLICAR CAMBIOS:');
console.log('');
console.log('1. 🔄 REINICIAR SERVIDOR:');
console.log('   - Detener servidor (Ctrl+C)');
console.log('   - Ejecutar: npm run dev');
console.log('   - Esperar a que se inicie');
console.log('');
console.log('2. 🧹 LIMPIAR CACHE:');
console.log('   - Presionar Ctrl+F5');
console.log('   - O usar modo incógnito');
console.log('');
console.log('3. 🔍 VERIFICAR:');
console.log('   - Ir a http://localhost:4321/test-ui');
console.log('   - Verificar que se muestren los colores nuevos');
console.log('   - Verificar que los botones se vean diferentes');
console.log('');
console.log('4. 🎨 CAMBIOS ESPERADOS:');
console.log('   - Fondo: #0F1115 (más oscuro)');
console.log('   - Cards: #151A21 (gris oscuro)');
console.log('   - Paper: #F7F6F2 (beige claro)');
console.log('   - Botones: #2563EB (azul)');
console.log('');
console.log('💡 SI NO SE VEN CAMBIOS:');
console.log('   - Verificar que el servidor se reinició');
console.log('   - Verificar que el cache se limpió');
console.log('   - Verificar que no hay errores en consola');
console.log('   - Verificar que /test-ui carga correctamente');





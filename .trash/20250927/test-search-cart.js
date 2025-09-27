// Script para probar que los productos de búsqueda se guarden en el carrito
console.log('🧪 Probando carrito de búsqueda...');

// Simular agregar un producto desde la búsqueda
const searchProduct = {
  id: 'hotdog-fallback',
  title: 'Perro Caliente',
  description: 'Hot dog con todos los ingredientes',
  price: 2500,
  image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&h=300&q=80',
  category: 'Comida',
  vendor: 'Max Snack'
};

// Crear item del carrito como lo hace SearchBarAI
const cartItem = {
  id: searchProduct.id,
  title: searchProduct.title,
  price: searchProduct.price,
  image: searchProduct.image_url,
  vendor: searchProduct.vendor,
  quantity: 1,
  addedAt: new Date().toISOString()
};

console.log('📦 Item del carrito creado:', cartItem);

// Simular guardar en localStorage
const cart = [cartItem];
localStorage.setItem('cart', JSON.stringify(cart));

console.log('💾 Carrito guardado en localStorage');

// Simular cargar desde localStorage (como lo hace Checkout)
const stored = localStorage.getItem('cart');
const parsed = JSON.parse(stored);

console.log('📋 Carrito cargado desde localStorage:', parsed);

// Verificar estructura
parsed.forEach((item, index) => {
  console.log(`🛒 Item ${index}:`, {
    id: item.id,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    vendor: item.vendor,
    hasRequiredFields: !!(item.id && item.title && item.price && item.quantity && item.vendor)
  });
});

console.log('✅ Prueba completada');


// Funcionalidad del carrito y productos
document.addEventListener('DOMContentLoaded', function() {
  setupCart();
  setupProducts();
});

// ========== CARRITO ==========
function setupCart() {
  const cartButton = document.querySelector('.cart-button');
  const cartPanel = document.getElementById('cart-panel');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Abrir carrito
  if (cartButton) {
    cartButton.addEventListener('click', () => {
      cartPanel?.classList.add('open');
      cartOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
      loadCartItems();
    });
  }

  // Cerrar carrito
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCart);
  }
  if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCart);
  }

  // Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  function closeCart() {
    cartPanel?.classList.remove('open');
    cartOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Cargar items del carrito
  async function loadCartItems() {
    try {
      const response = await fetch('/api/cart.json');
      const data = await response.json();
      
      const cartItems = document.getElementById('cart-items');
      const cartTotal = document.getElementById('cart-total');
      const cartCount = document.querySelector('.cart-count');
      
      if (!cartItems) return;

      if (data.items && data.items.length > 0) {
        cartItems.innerHTML = data.items.map(item => `
          <div class="cart-item" data-product-id="${item.productId}">
            <div class="cart-item-image">
              <img src="${item.product.imageUrl || '/img/placeholder.jpg'}" alt="${item.product.name}">
            </div>
            <div class="cart-item-info">
              <h4>${item.product.name}</h4>
              <p class="cart-item-price">$${(item.product.priceCents / 100).toFixed(2)}</p>
              <div class="cart-item-controls">
                <button class="qty-btn minus" onclick="updateCartItem(${item.productId}, ${item.qty - 1})">-</button>
                <span class="qty">${item.qty}</span>
                <button class="qty-btn plus" onclick="updateCartItem(${item.productId}, ${item.qty + 1})">+</button>
                <button class="remove-btn" onclick="removeCartItem(${item.productId})">🗑️</button>
              </div>
            </div>
          </div>
        `).join('');
        
        cartTotal.textContent = `$${(data.totalCents / 100).toFixed(2)}`;
        cartCount.textContent = data.items.reduce((sum, item) => sum + item.qty, 0);
      } else {
        cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        cartTotal.textContent = '$0.00';
        cartCount.textContent = '0';
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  // Actualizar cantidad de item
  window.updateCartItem = async function(productId, newQty) {
    if (newQty <= 0) {
      removeCartItem(productId);
      return;
    }

    try {
      const response = await fetch('/api/cart/update.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: newQty })
      });
      
      if (response.ok) {
        loadCartItems();
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  // Remover item del carrito
  window.removeCartItem = async function(productId) {
    try {
      const response = await fetch('/api/cart/remove.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        loadCartItems();
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  };

  // Checkout
  async function handleCheckout() {
    const customerName = prompt('Nombre completo:');
    const customerEmail = prompt('Email:');
    
    if (!customerName || !customerEmail) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const response = await fetch('/api/checkout.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, customerEmail })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`¡Orden creada exitosamente!\nCódigo: ${result.orderCode}`);
        closeCart();
        loadCartItems(); // Refrescar carrito vacío
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error al procesar la orden');
    }
  }

  // Cargar carrito al inicio
  loadCartItems();
  
  // Actualizar carrito cada 5 segundos
  setInterval(loadCartItems, 5000);
}

// ========== PRODUCTOS ==========
function setupProducts() {
  // Agregar al carrito
  window.addToCart = async function(productId, qty = 1) {
    try {
      const response = await fetch('/api/cart/add.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty })
      });
      
      if (response.ok) {
        // Mostrar feedback visual
        const button = document.querySelector(`[onclick*="${productId}"]`);
        if (button) {
          const originalText = button.textContent;
          button.textContent = '¡Agregado!';
          button.style.background = '#10b981';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
          }, 1000);
        }
        
        // Actualizar contador del carrito
        setTimeout(() => {
          const cartCount = document.querySelector('.cart-count');
          if (cartCount) {
            fetch('/api/cart.json')
              .then(res => res.json())
              .then(data => {
                cartCount.textContent = data.items ? data.items.reduce((sum, item) => sum + item.qty, 0) : 0;
              });
          }
        }, 100);
      } else {
        alert('Error al agregar producto al carrito');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar producto al carrito');
    }
  };

  // Filtros de productos (si existen)
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      filterProducts(category);
      
      // Actualizar botón activo
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
      if (category === 'all' || product.dataset.category === category) {
        product.style.display = 'block';
      } else {
        product.style.display = 'none';
      }
    });
  }
}

// ========== UTILIDADES ==========
// Formatear precio
function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Debounce para búsquedas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Búsqueda de productos
const searchInput = document.getElementById('search-products');
if (searchInput) {
  searchInput.addEventListener('input', debounce(function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
      const title = product.querySelector('.product-title')?.textContent.toLowerCase() || '';
      const description = product.querySelector('.product-description')?.textContent.toLowerCase() || '';
      
      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        product.style.display = 'block';
      } else {
        product.style.display = 'none';
      }
    });
  }, 300));
}

console.log('🛍️ Tienda cargada correctamente - Carrito funcional');


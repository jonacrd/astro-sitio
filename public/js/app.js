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
    checkoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/cart/checkout.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.error || 'Error en el checkout');
          return;
        }

        // Redirigir al ticket
        window.location.href = `/ticket/${result.order.orderCode}`;
        
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Error en el checkout');
      }
    });
  }

  function closeCart() {
    cartPanel?.classList.remove('open');
    cartOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ========== PRODUCTOS ==========
function setupProducts() {
  // Selectores de talla
  document.querySelectorAll('.size-select').forEach(select => {
    select.addEventListener('change', function() {
      const productCard = this.closest('.producto1, .product-card');
      if (productCard) {
        // Actualizar stock según talla seleccionada
        updateStockDisplay(productCard);
      }
    });
  });

  // Botones de cantidad
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const quantityDisplay = this.parentElement.querySelector('.quantity-display');
      const currentQty = parseInt(quantityDisplay.textContent);
      
      if (this.classList.contains('qty-increase')) {
        quantityDisplay.textContent = currentQty + 1;
      } else if (this.classList.contains('qty-decrease')) {
        if (currentQty > 1) {
          quantityDisplay.textContent = currentQty - 1;
        }
      }
    });
  });
  
  // Botones agregar al carrito
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const productCard = e.target.closest('.producto1, .product-card');
      if (!productCard) return;
      
      const productId = productCard.dataset.productId;
      const size = productCard.querySelector('.size-select')?.value;
      const color = productCard.querySelector('.color-btn.active')?.dataset.color;
      const quantity = parseInt(productCard.querySelector('.quantity-display')?.textContent || '1');
      const stock = parseInt(productCard.dataset.stock || '0');
      
      if (!productId) {
        alert('Error: ID de producto no encontrado');
        return;
      }
      
      if (!size) {
        alert('Por favor selecciona una talla');
        return;
      }
      
      if (quantity > stock) {
        alert('No hay suficiente stock disponible');
        return;
      }
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: parseInt(productId),
            size,
            color,
            quantity
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Producto agregado al carrito');
          updateCartCount();
        } else {
          alert(result.error || 'Error al agregar producto');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el pedido');
      }
    });
  });
}

// Función para agregar al carrito (usada por onclick)
function addToCart(productId, productName, price, imageUrl, stock) {
  if (stock === 0) {
    alert('Este producto está agotado');
    return;
  }

  // Aquí puedes implementar la lógica para agregar al carrito
  console.log('Agregando al carrito:', { productId, productName, price, imageUrl, stock });
  alert(`${productName} agregado al carrito`);
}

// Función para actualizar contador del carrito
async function updateCartCount() {
  try {
    const response = await fetch('/api/cart.json');
    const cart = await response.json();
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    const cartButton = document.querySelector('.cart-button');
    const existingBadge = cartButton?.querySelector('.cart-badge');
    
    if (totalItems > 0) {
      if (existingBadge) {
        existingBadge.textContent = totalItems;
      } else if (cartButton) {
        const badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.setAttribute('aria-label', `${totalItems} productos en el carrito`);
        badge.textContent = totalItems;
        cartButton.appendChild(badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  } catch (error) {
    console.log('Error al actualizar carrito:', error);
  }
}

// Función para actualizar display de stock
function updateStockDisplay(productCard) {
  const sizeSelect = productCard.querySelector('.size-select');
  const stockDisplay = productCard.querySelector('.product-stock');
  
  if (sizeSelect && stockDisplay) {
    const selectedSize = sizeSelect.value;
    // Aquí puedes implementar la lógica para obtener el stock según la talla
    // Por ahora, mantenemos el stock original
  }
}

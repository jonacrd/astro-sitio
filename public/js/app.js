// public/js/app.js - Sistema de carrito y productos

// Evitar doble inicialización en HMR
if (!window.__APP_INIT__) {
    window.__APP_INIT__ = true;
  
    console.log('[app] init');
  
    // ========== UTILIDADES ==========
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  
    // ========== CARRITO ==========
    function setupCart() {
      const cartToggle = $('.cart-toggle');
      const cartPanel = $('.cart-panel');
      const cartList = $('.cart-list');
      const cartTotal = $('.cart-total');
      const checkoutBtn = $('.btn-checkout');
      const clearBtn = $('.btn-clear');
      
      if (!cartToggle || !cartPanel) return;
      
      // Abrir/cerrar carrito
      cartToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        cartPanel.classList.toggle('open');
        cartToggle.classList.toggle('panel-open');
        updateCartDisplay();
      });
      
      // Cerrar carrito al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!cartPanel.contains(e.target) && !cartToggle.contains(e.target)) {
          cartPanel.classList.remove('open');
          cartToggle.classList.remove('panel-open');
        }
      });
      
      // Limpiar carrito
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('¿Estás seguro de que quieres limpiar el carrito?')) {
            localStorage.removeItem('cart');
            updateCartDisplay();
          }
        });
      }
      
      // Checkout
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
          console.log('[CART] Iniciando checkout...');
          const cart = getCart();
          
          if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
          }
          
          try {
            const response = await fetch('/api/cart/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: cart })
            });
            
            const result = await response.json();
            console.log('[CART] Respuesta checkout:', result);
            
            if (result.success) {
              localStorage.removeItem('cart');
              updateCartDisplay();
              window.location.href = `/orden/${result.orderId}`;
            } else {
              alert('Error al procesar el pedido: ' + (result.error || 'Error desconocido'));
            }
          } catch (error) {
            console.error('[CART] Error en checkout:', error);
            alert('Error al procesar el pedido');
          }
        });
      }
    }
    
    
    // ========== PRODUCTOS ==========
    function setupProducts() {
      // Selectores de talla
      $$('.size-select').forEach(select => {
        select.addEventListener('change', (e) => {
          const productCard = e.target.closest('.producto1, .product-card');
          const stockDisplay = productCard?.querySelector('.stock-display');
          const selectedSize = e.target.value;
          
          if (stockDisplay && selectedSize) {
            const stock = parseInt(productCard.dataset.stock || '0');
            stockDisplay.textContent = `Stock: ${stock}`;
            stockDisplay.style.color = stock > 0 ? '#28a745' : '#dc3545';
          }
        });
      });
      
      
      // Botones de cantidad
      $$('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const quantityDisplay = e.target.parentElement.querySelector('.quantity-display');
          const currentQty = parseInt(quantityDisplay.textContent);
          const productCard = e.target.closest('.producto1, .product-card');
          const stock = parseInt(productCard?.dataset.stock || '0');
          
          if (currentQty < stock) {
            quantityDisplay.textContent = currentQty + 1;
          }
        });
      });
      
      $$('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const quantityDisplay = e.target.parentElement.querySelector('.quantity-display');
          const currentQty = parseInt(quantityDisplay.textContent);
          
          if (currentQty > 1) {
            quantityDisplay.textContent = currentQty - 1;
          }
        });
      });
      
      // Botones agregar al carrito
      $$('.btn-add-cart').forEach(btn => {
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
              updateCartDisplay();
              showNotification('Producto agregado al carrito');
            } else {
              alert('Error: ' + (result.error || 'No se pudo agregar el producto'));
            }
          } catch (error) {
            console.error('Error al agregar producto:', error);
            alert('Error al agregar el producto al carrito');
          }
        });
      });
    }
    
    // ========== UTILIDADES DEL CARRITO ==========
    function getCart() {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    }
    
    function updateCartDisplay() {
      const cart = getCart();
      const cartList = $('.cart-list');
      const cartTotal = $('.cart-total');
      const cartCount = $('.cart-count');
      
      if (!cartList) return;
      
      if (cart.length === 0) {
        cartList.innerHTML = '<p class="cart-empty">El carrito está vacío</p>';
        if (cartTotal) cartTotal.textContent = '$0';
        if (cartCount) cartCount.textContent = '0';
        return;
      }
      
      cartList.innerHTML = cart.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
          <div class="cart-item-header">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
              <h4 class="cart-item-name">${item.name}</h4>
              <p class="cart-item-specs">Talla: ${item.size} | Color: ${item.color}</p>
            </div>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-controls">
              <button class="btn-quantity btn-minus" data-item-id="${item.id}">-</button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="btn-quantity btn-plus" data-item-id="${item.id}">+</button>
            </div>
            <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString()}</div>
            <button class="btn-remove" data-item-id="${item.id}">×</button>
          </div>
        </div>
      `).join('');
      
      // Calcular total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (cartTotal) cartTotal.textContent = `$${total.toLocaleString()}`;
      if (cartCount) cartCount.textContent = cart.length.toString();
      
      // Eventos de los controles del carrito
      setupCartControls();
    }
    
    function setupCartControls() {
      // Botones de cantidad en el carrito
      $$('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.target.dataset.itemId;
          const cart = getCart();
          const item = cart.find(i => i.id === itemId);
          
          if (item) {
            item.quantity++;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
          }
        });
      });
      
      $$('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.target.dataset.itemId;
          const cart = getCart();
          const item = cart.find(i => i.id === itemId);
          
          if (item && item.quantity > 1) {
            item.quantity--;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
          }
        });
      });
      
      // Botones eliminar
      $$('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.target.dataset.itemId;
          const cart = getCart().filter(i => i.id !== itemId);
          localStorage.setItem('cart', JSON.stringify(cart));
          updateCartDisplay();
        });
      });
    }
    
    function showNotification(message) {
      // Crear notificación temporal
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
    
    // ========== INICIALIZACIÓN ==========
    document.addEventListener('DOMContentLoaded', () => {
      setupCart();
      setupProducts();
      updateCartDisplay();
    });
    
    // ========== SCROLL SUAVE ==========
    document.addEventListener('DOMContentLoaded', () => {
      const scrollBtn = $('#scroll-to-products');
      if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
          const productsSection = $('.productos-destacados');
          if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    });
}
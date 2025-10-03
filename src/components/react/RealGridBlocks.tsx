import React, { useEffect, useState } from 'react';
import CartToast from './CartToast';

interface Product {
  id: string;
  title: string;
  price_cents: number;
  image_url: string;
  seller_name: string;
  seller_id: string;
  stock: number;
  category: string;
}

interface Props {
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onContactService?: (serviceId: string) => void;
}

interface ToastData {
  productName: string;
  productImage: string;
}

export default function RealGridBlocks({ onAddToCart, onViewProduct, onContactService }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/feed/simple');
        const data = await res.json();
        if (data?.success && data?.data?.products?.length) {
          const mapped = data.data.products.slice(0, 4).map((p: any) => ({
            id: p.id,
            title: p.title,
            price_cents: p.price,
            image_url: p.image || '/img/placeholders/tecnologia.jpg',
            seller_name: p.sellerName || 'Vendedor',
            seller_id: p.sellerId,
            stock: p.stock ?? 0,
            category: p.category || 'General'
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      } catch (e) {
        setError('Error cargando productos destacados');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);

  if (loading) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[420px] mx-auto">
          <div className="columns-2 gap-3 md:columns-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="break-inside-avoid inline-block w-full rounded-2xl overflow-hidden shadow ring-1 ring-white/10 bg-[#141820] mb-3"
              >
                <div className="max-h-[260px] md:max-h-[300px] overflow-hidden bg-gray-700 animate-pulse">
                  <div className="w-full h-48 bg-gray-600"></div>
                </div>
                <div className="p-3">
                  <div className="inline-flex h-6 px-2 rounded-full bg-gray-600 text-white text-[11px] font-semibold mb-2 animate-pulse">
                    <div className="w-16 h-4 bg-gray-500 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-600 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-600 rounded w-2/3 mb-2 animate-pulse"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-gray-600 rounded w-1/2 animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[420px] mx-auto">
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">
              {error || 'No hay productos destacados disponibles'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const badges = ['Producto del Mes', 'Oferta Especial', 'Nuevo', 'Servicio Premium'];

  return (
    <>
      {/* Toast de notificación */}
      {showToast && toastData && (
        <CartToast
          productName={toastData.productName}
          productImage={toastData.productImage}
          onClose={() => setShowToast(false)}
          onClick={() => {
            // Disparar evento para abrir el carrito
            const cartButton = document.getElementById('cart-button');
            if (cartButton) {
              cartButton.click();
            }
          }}
        />
      )}

      <section className="px-4 mb-6">
        <div className="max-w-[420px] mx-auto">
          <div className="columns-2 gap-3 md:columns-3">
          {products.slice(0, 4).map((product, i) => (
            <div
              key={product.id}
              className="break-inside-avoid inline-block w-full rounded-2xl overflow-hidden shadow ring-1 ring-white/10 bg-[#141820] mb-3"
            >
              {/* Imagen con altura controlada */}
              <div className="max-h-[260px] md:max-h-[300px] overflow-hidden relative">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-auto object-cover"
                />
                
                {/* Badge arriba-izquierda */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex h-6 px-2 rounded-full bg-rose-600/90 text-white text-[11px] font-semibold">
                    {badges[i] || 'Destacado'}
                  </span>
                </div>

                {/* Overlay inferior con gradiente */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
                  <h3 className="text-white text-[15px] font-semibold line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-white/70 text-[12px]">{product.seller_name}</p>
                </div>
              </div>

              {/* Contenido inferior */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    {product.price_cents && (
                      <p className="text-white text-[18px] font-extrabold">
                        {formatPrice(product.price_cents)}
                      </p>
                    )}
                  </div>
                  
                  {/* Botón + a la derecha del precio */}
                  <button
                    onClick={(e) => {
                      // Animación del botón
                      const button = e.currentTarget;
                      button.classList.add('animate-bounce');
                      setTimeout(() => button.classList.remove('animate-bounce'), 500);

                      // Agregar al carrito
                      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
                      const existingIndex = currentCart.findIndex((it: any) => it.id === product.id);
                      if (existingIndex >= 0) {
                        currentCart[existingIndex].quantity += 1;
                      } else {
                        currentCart.push({
                          id: product.id,
                          title: product.title,
                          price: product.price_cents / 100,
                          image: product.image_url,
                          sellerName: product.seller_name,
                          sellerId: product.seller_id,
                          quantity: 1
                        });
                      }
                      localStorage.setItem('cart', JSON.stringify(currentCart));
                      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart: currentCart }}));
                      
                      // Mostrar toast
                      setToastData({
                        productName: product.title,
                        productImage: product.image_url
                      });
                      setShowToast(true);
                      
                      onAddToCart?.(product.id);
                    }}
                    className="h-8 w-8 rounded-full bg-blue-600 text-white grid place-items-center hover:bg-blue-500 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                    aria-label="Agregar al carrito"
                  >
                    <span className="text-xl font-bold leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón "Ver más" si hay más de 4 productos */}
        {products.length > 4 && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                // TODO: Implementar navegación
                console.log('Ver más productos');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 active:scale-95 transition"
            >
              Ver más
            </button>
          </div>
        )}
        </div>
      </section>
    </>
  );
}
import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';

interface RealProduct {
  id: string;
  media: string[];
  title: string;
  vendor?: string;
  price?: number;
  badge?: string;
  hasSlider?: boolean;
  ctaLabel?: string;
  productId?: string;
  sellerId?: string;
  price_cents?: number;
}

interface DynamicGridBlocksSimpleNoQueryProps {
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onContactService?: (serviceId: string) => void;
}

export default function DynamicGridBlocksSimpleNoQuery({ onAddToCart, onViewProduct, onContactService }: DynamicGridBlocksSimpleNoQueryProps) {
  const [products, setProducts] = useState<RealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🛍️ Cargando productos de ejemplo (SIN consultas a Supabase)...');

      // Productos de ejemplo estáticos - SIN consultas a Supabase
      const exampleProducts: RealProduct[] = [
        {
          id: 'example-1',
          media: ['https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80'],
          title: 'Cerveza Premium',
          vendor: 'Bodega Central',
          price: 15000,
          badge: 'Producto del Mes',
          hasSlider: false,
          ctaLabel: 'Añadir al carrito',
          productId: 'example-1',
          sellerId: 'example-seller',
          price_cents: 1500000
        },
        {
          id: 'example-2',
          media: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80'],
          title: 'Hamburguesa Especial',
          vendor: 'Restaurante El Buen Sabor',
          price: 25000,
          badge: 'Oferta Especial',
          hasSlider: true,
          ctaLabel: 'Añadir al carrito',
          productId: 'example-2',
          sellerId: 'example-seller',
          price_cents: 2500000
        },
        {
          id: 'example-3',
          media: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80'],
          title: 'Pizza Margherita',
          vendor: 'Pizzería Italiana',
          price: 35000,
          badge: 'Nuevo',
          hasSlider: false,
          ctaLabel: 'Añadir al carrito',
          productId: 'example-3',
          sellerId: 'example-seller',
          price_cents: 3500000
        },
        {
          id: 'example-4',
          media: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80'],
          title: 'Servicio de Limpieza',
          vendor: 'CleanPro Services',
          price: 50000,
          badge: 'Servicio Premium',
          hasSlider: false,
          ctaLabel: 'Contactar',
          productId: 'example-4',
          sellerId: 'example-seller',
          price_cents: 5000000
        }
      ];

      // Simular carga rápida
      await new Promise(resolve => setTimeout(resolve, 100));

      setProducts(exampleProducts);
      setLoading(false);
      console.log('✅ Productos de ejemplo cargados: 4');

    } catch (err) {
      console.error('❌ Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando productos destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">⚠️ Error al cargar productos</div>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="max-w-[400px] mx-auto">
        {/* MOSAICO 2x2 CON BLOQUES PEQUEÑOS */}
        <div className="grid grid-cols-2 gap-2 [grid-auto-flow:dense] [grid-template-rows:auto_auto]">
          {products.slice(0, 4).map((product, index) => {
            const pattern = ['tall', 'short', 'short', 'tall'][index];
            const isTall = pattern === 'tall';
            
            return (
              <div
                key={product.id}
                className={`relative rounded-xl overflow-hidden shadow-lg transition-transform duration-200 hover:scale-[1.015] ${
                  isTall ? 'aspect-[3/4]' : 'aspect-[4/3]'
                } ${index === 3 ? 'self-start' : ''}`}
              >
                {/* IMAGEN CUBRE TODO EL BLOQUE */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={product.media[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80';
                    }}
                  />
                </div>

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-2 left-2 rounded-full h-6 px-2 bg-red-600/90 text-white text-xs font-semibold flex items-center">
                    {product.badge}
                  </div>
                )}

                {/* Overlay inferior */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                  <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1 mb-1">
                    {product.title}
                  </h3>
                  {product.vendor && (
                    <p className="text-white/80 text-xs mb-1">{product.vendor}</p>
                  )}
                  {product.price && (
                    <p className="text-white text-lg font-extrabold mt-1">
                      ${product.price.toLocaleString('es-CL')}
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={async () => {
                    if (product.ctaLabel === 'Contactar') {
                      if (onContactService) {
                        onContactService(product.id);
                      }
                    } else if (product.ctaLabel === 'Ver más') {
                      if (onViewProduct) {
                        onViewProduct(product.id);
                      }
                    } else {
                      // Agregar al carrito real
                      if (product.productId && product.sellerId && product.price_cents) {
                        const success = await addToCart(
                          product.productId,
                          product.sellerId,
                          product.title,
                          product.price_cents,
                          1,
                          product.media[0]
                        );
                        
                        if (success) {
                          console.log('✅ Producto agregado al carrito:', product.title);
                        } else {
                          console.error('❌ Error agregando al carrito:', product.title);
                        }
                      }
                      
                      // Callback opcional
                      if (onAddToCart) {
                        onAddToCart(product.id);
                      }
                    }
                  }}
                  disabled={cartLoading}
                  className="absolute left-2 bottom-2 rounded-full px-3 h-8 bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? 'Agregando...' : product.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}






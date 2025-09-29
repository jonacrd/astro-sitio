import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { useCart } from '../../hooks/useCart';

interface OptimizedGridProduct {
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

interface OptimizedGridBlocksProps {
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onContactService?: (serviceId: string) => void;
}

export default function OptimizedGridBlocks({ onAddToCart, onViewProduct, onContactService }: OptimizedGridBlocksProps) {
  const [products, setProducts] = useState<OptimizedGridProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    loadOptimizedProducts();
  }, []);

  const loadOptimizedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('⚡ Cargando productos optimizados para grid...');

      // CONSULTA OPTIMIZADA - Solo campos necesarios
      const { data, error: queryError } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
          products!inner (
            id,
            title,
            image_url
          )
        `)
        .eq('active', true)
        .gt('stock', 0)
        .limit(4);

      if (queryError) {
        console.error('❌ Error cargando productos:', queryError);
        setError('Error cargando productos');
        setLoading(false);
        return;
      }

      console.log('📊 Productos encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        // TRANSFORMACIÓN SIMPLE
        const optimizedProducts: OptimizedGridProduct[] = data.map((item, index) => ({
          id: `opt-grid-${index}-${Date.now()}`,
          media: [item.products.image_url || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80'],
          title: item.products.title || 'Producto',
          vendor: 'Vendedor',
          price: Math.round(item.price_cents / 100),
          badge: index === 0 ? 'Producto del Mes' : 
                 index === 1 ? 'Oferta Especial' : 
                 index === 2 ? 'Nuevo' : 'Servicio Premium',
          hasSlider: index === 1,
          ctaLabel: 'Añadir al carrito',
          productId: item.product_id,
          sellerId: item.seller_id,
          price_cents: item.price_cents
        }));

        setProducts(optimizedProducts);
        console.log(`✅ Productos optimizados cargados: ${optimizedProducts.length}`);
      } else {
        // PRODUCTOS DE EJEMPLO LIGEROS
        const fallbackProducts: OptimizedGridProduct[] = [
          {
            id: 'fallback-grid-1',
            media: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Cachapa con Queso',
            vendor: 'Minimarket La Esquina',
            price: 3500,
            badge: 'Producto del Mes',
            hasSlider: false,
            ctaLabel: 'Añadir al carrito'
          },
          {
            id: 'fallback-grid-2',
            media: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Asador de Pollo',
            vendor: 'Restaurante El Buen Sabor',
            price: 8000,
            badge: 'Oferta Especial',
            hasSlider: true,
            ctaLabel: 'Añadir al carrito'
          }
        ];
        
        setProducts(fallbackProducts);
        console.log(`✅ Productos de fallback cargados: ${fallbackProducts.length}`);
      }

      setLoading(false);

    } catch (err) {
      console.error('❌ Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-8">
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
        {/* MOSAICO 2x2 OPTIMIZADO */}
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
                    loading="lazy"
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
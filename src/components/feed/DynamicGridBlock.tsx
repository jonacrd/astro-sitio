import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

type Item = {
  id: string;
  media: string[];         // urls
  title: string;
  vendor?: string;
  price?: number;
  badge?: string;          // "Oferta Especial" | "0:06" etc.
  hasSlider?: boolean;
  ctaLabel?: string;       // "Añadir al carrito" | "Ver más" | "Contactar"
};

type Props = {
  items: Item[];           // al menos 4
  pattern?: ("tall"|"short")[]; 
  // default: ["tall","tall","short","tall"]  // <- patrón asimétrico
};

const STYLE = { 
  tall: "aspect-[4/5]", 
  short: "aspect-[4/3]" 
};

export default function DynamicGridBlock({ items, pattern }: Props) {
  const [currentSlides, setCurrentSlides] = useState<Record<string, number>>({});
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Patrón asimétrico por defecto
  const defaultPattern: ("tall"|"short")[] = ["tall", "tall", "short", "tall"];
  const layout = (pattern ?? defaultPattern)
    .concat(Array(Math.max(0, items.length - 4)).fill("tall")); // el resto alto por defecto

  // Auto-play para sliders
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlides(prev => {
        const newSlides = { ...prev };
        items.forEach(item => {
          if (item.hasSlider && item.media.length > 1) {
            newSlides[item.id] = ((prev[item.id] || 0) + 1) % item.media.length;
          }
        });
        return newSlides;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, items]);

  const nextSlide = (itemId: string, totalSlides: number) => {
    setCurrentSlides(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % totalSlides
    }));
  };

  const prevSlide = (itemId: string, totalSlides: number) => {
    setCurrentSlides(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) - 1 + totalSlides) % totalSlides
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async (itemId: string) => {
    try {
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Debes iniciar sesión para añadir productos al carrito');
        return;
      }

      // Buscar el producto en la base de datos
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_cents,
          image_url,
          seller_products!inner(
            seller_id,
            sellers!inner(
              id,
              name,
              status
            )
          )
        `)
        .eq('id', itemId)
        .eq('status', 'active')
        .eq('seller_products.sellers.status', 'online')
        .single();

      if (error || !product) {
        console.error('Error al buscar producto:', error);
        alert('Producto no disponible');
        return;
      }

      // Verificar si ya existe en el carrito
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', session.user.id)
        .eq('product_id', itemId)
        .single();

      if (existingItem) {
        // Actualizar cantidad
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error al actualizar carrito:', updateError);
          alert('Error al actualizar carrito');
          return;
        }
      } else {
        // Añadir nuevo item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: session.user.id,
            product_id: itemId,
            seller_id: product.seller_products[0].seller_id,
            quantity: 1,
            price_cents: product.price_cents
          });

        if (insertError) {
          console.error('Error al añadir al carrito:', insertError);
          alert('Error al añadir al carrito');
          return;
        }
      }

      // Disparar evento de actualización del carrito
      window.dispatchEvent(new CustomEvent('cart-updated'));
      alert('¡Producto añadido al carrito!');

    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      alert('Error al añadir al carrito');
    }
  };

  const handleContactService = (itemId: string) => {
    console.log('Contactar servicio:', itemId);
    // TODO: Implementar contacto con servicio
  };

  const handleViewProduct = (itemId: string) => {
    console.log('Ver producto:', itemId);
    // TODO: Implementar ver producto
  };

  return (
    <div className="mx-auto max-w-[480px] px-4">
      <section className="grid grid-cols-2 gap-3 [grid-auto-flow:dense]">
        {items.slice(0, 4).map((item, i) => (
          <article 
            key={item.id} 
            className={`relative ${STYLE[layout[i]]} rounded-2xl overflow-hidden ring-1 ring-white/5 shadow-lg bg-[#101828] transition-transform duration-200 will-change-transform hover:scale-[1.015]`}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Media (imagen o slider) */}
            <div className="absolute inset-0 w-full h-full">
              {item.hasSlider && item.media.length > 1 ? (
                <div className="relative w-full h-full">
                  <div
                    ref={el => sliderRefs.current[item.id] = el}
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ 
                      transform: `translateX(-${(currentSlides[item.id] || 0) * 100}%)` 
                    }}
                  >
                    {item.media.map((media, mediaIndex) => (
                      <div key={mediaIndex} className="w-full h-full flex-shrink-0">
                        {media.includes('.mp4') || media.includes('.webm') ? (
                          <video
                            src={media}
                            className="w-full h-full object-cover saturate-[1.05] contrast-[1.05]"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={media}
                            alt={`${item.title} - ${mediaIndex + 1}`}
                            className="w-full h-full object-cover saturate-[1.05] contrast-[1.05]"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navegación del slider */}
                  <button
                    onClick={() => prevSlide(item.id, item.media.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors text-sm"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => nextSlide(item.id, item.media.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors text-sm"
                  >
                    ›
                  </button>

                  {/* Dots del slider */}
                  <div className="absolute right-3 bottom-3 flex gap-1">
                    {item.media.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        onClick={() => setCurrentSlides(prev => ({ ...prev, [item.id]: dotIndex }))}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          (currentSlides[item.id] || 0) === dotIndex ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {item.media[0]?.includes('.mp4') || item.media[0]?.includes('.webm') ? (
                    <video
                      src={item.media[0]}
                      className="w-full h-full object-cover saturate-[1.05] contrast-[1.05]"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.media[0] || 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover saturate-[1.05] contrast-[1.05]"
                    />
                  )}
                </>
              )}
            </div>

            {/* Badge */}
            {item.badge && (
              <div className="absolute top-3 left-3 rounded-full h-8 px-3 bg-red-600/90 text-white text-sm font-semibold flex items-center">
                {item.badge}
              </div>
            )}

            {/* Overlay inferior */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-white text-xl font-semibold leading-tight line-clamp-2 mb-1">
                {item.title}
              </h3>
              {item.vendor && (
                <p className="text-white/80 text-sm mb-1">{item.vendor}</p>
              )}
              {item.price && (
                <p className="text-white text-2xl font-extrabold mt-1">
                  {formatPrice(item.price)}
                </p>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                if (item.ctaLabel?.includes('carrito')) {
                  handleAddToCart(item.id);
                } else if (item.ctaLabel?.includes('Contactar')) {
                  handleContactService(item.id);
                } else {
                  handleViewProduct(item.id);
                }
              }}
              className="absolute left-3 bottom-3 rounded-full px-4 h-10 bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-500 active:scale-95 transition"
            >
              {item.ctaLabel || 'Ver más'}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}



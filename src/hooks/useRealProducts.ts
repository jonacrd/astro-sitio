import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-browser';

export interface RealProduct {
  id: string;
  media: string[];
  title: string;
  vendor?: string;
  price?: number;
  badge?: string;
  hasSlider?: boolean;
  ctaLabel?: string;
}

export function useRealProducts() {
  const [products, setProducts] = useState<RealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRealProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🛍️ Cargando productos reales desde useRealProducts...');

        // Consulta simplificada sin joins problemáticos
        const { data, error: queryError } = await supabase
          .from('seller_products')
          .select(`
            price_cents,
            stock,
            active,
            product_id,
            seller_id
          `)
          .eq('active', true)
          .gt('stock', 0)
          .order('price_cents', { ascending: false })
          .limit(4);

        if (queryError) {
          console.error('❌ Error cargando productos reales:', queryError);
          throw queryError;
        }

        if (data && data.length > 0) {
          // Obtener detalles de productos por separado
          const productIds = data.map(item => item.product_id);
          const sellerIds = data.map(item => item.seller_id);

          const [productsResult, profilesResult] = await Promise.allSettled([
            supabase.from('products').select('id, title, description, category, image_url').in('id', productIds),
            supabase.from('profiles').select('id, name').in('id', sellerIds)
          ]);

          const productsData = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
          const profilesData = profilesResult.status === 'fulfilled' ? profilesResult.value.data : [];

          // Crear mapas para búsqueda rápida
          const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

          // Transformar productos reales
          const realProducts: RealProduct[] = data.map((item, index) => {
            const product = productsMap.get(item.product_id);
            const profile = profilesMap.get(item.seller_id);
            
            return {
              id: `real-${index}-${Date.now()}`,
              media: [product?.image_url || '/default-product.png'],
              title: product?.title || 'Producto',
              vendor: profile?.name || 'Vendedor',
              price: Math.round(item.price_cents / 100),
              badge: index === 0 ? 'Producto del Mes' : 
                     index === 1 ? 'Oferta Especial' : 
                     index === 2 ? 'Nuevo' : 'Servicio Premium',
              hasSlider: index === 1,
              ctaLabel: product?.category === 'servicios' ? 'Contactar' : 'Añadir al carrito'
            };
          });

          setProducts(realProducts);
          console.log(`✅ Productos reales cargados: ${realProducts.length}`);
          return;
        }

        // Si no hay productos reales, no mostrar nada
        console.log('⚠️ No hay productos reales disponibles');
        setProducts([]);
        console.log('✅ No se muestran productos de ejemplo');

      } catch (err) {
        console.error('❌ Error al cargar productos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // Fallback con productos de ejemplo
        const fallbackProducts: RealProduct[] = [
          {
            id: 'cachapa-fallback',
            media: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Cachapa con Queso',
            vendor: 'Minimarket La Esquina',
            price: 3500,
            badge: 'Producto del Mes',
            hasSlider: false,
            ctaLabel: 'Añadir al carrito'
          },
          {
            id: 'asador-fallback',
            media: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Asador de Pollo',
            vendor: 'Restaurante El Buen Sabor',
            price: 8000,
            badge: 'Oferta Especial',
            hasSlider: true,
            ctaLabel: 'Añadir al carrito'
          },
          {
            id: 'powerbank-fallback',
            media: ['https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Power Bank 10000mAh',
            vendor: 'TechStore Local',
            price: 15000,
            badge: 'Nuevo',
            hasSlider: false,
            ctaLabel: 'Ver más'
          },
          {
            id: 'limpieza-fallback',
            media: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Limpieza Profesional',
            vendor: 'CleanPro Services',
            price: 45000,
            badge: 'Servicio Premium',
            hasSlider: false,
            ctaLabel: 'Contactar'
          }
        ];
        
        setProducts(fallbackProducts);
        console.log(`✅ Productos de fallback cargados: ${fallbackProducts.length}`);
      } finally {
        setLoading(false);
      }
    };

    loadRealProducts();
  }, []);

  return { products, loading, error };
}

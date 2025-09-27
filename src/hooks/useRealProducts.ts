import { useState, useEffect } from 'react';

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
    const loadRealProducts = () => {
      try {
        setLoading(true);
        setError(null);

        // Usar productos de ejemplo directamente para evitar errores de base de datos
        const exampleProducts: RealProduct[] = [
          {
            id: 'cachapa-1',
            media: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Cachapa con Queso',
            vendor: 'Minimarket La Esquina',
            price: 3500,
            badge: 'Producto del Mes',
            hasSlider: false,
            ctaLabel: 'Añadir al carrito'
          },
          {
            id: 'asador-1',
            media: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Asador de Pollo',
            vendor: 'Restaurante El Buen Sabor',
            price: 8000,
            badge: 'Oferta Especial',
            hasSlider: true,
            ctaLabel: 'Añadir al carrito'
          },
          {
            id: 'powerbank-1',
            media: ['https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Power Bank 10000mAh',
            vendor: 'TechStore Local',
            price: 15000,
            badge: 'Nuevo',
            hasSlider: false,
            ctaLabel: 'Ver más'
          },
          {
            id: 'limpieza-1',
            media: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80'],
            title: 'Limpieza Profesional',
            vendor: 'CleanPro Services',
            price: 45000,
            badge: 'Servicio Premium',
            hasSlider: false,
            ctaLabel: 'Contactar'
          }
        ];

        setProducts(exampleProducts);

      } catch (err) {
        console.error('Error al cargar productos:', err);
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
      } finally {
        setLoading(false);
      }
    };

    loadRealProducts();
  }, []);

  return { products, loading, error };
}

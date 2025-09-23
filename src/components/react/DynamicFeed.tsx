import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import ActiveStoreBanner from './ActiveStoreBanner';
import StoreFilteredFeed from './StoreFilteredFeed';
import SmartRecommendations from './SmartRecommendations';
import CategoryRecommendations from './CategoryRecommendations';
import NoActiveStoreMessage from './NoActiveStoreMessage';
import { useCartStore } from '../../lib/cart-store';

interface FeedSection {
  id: string;
  title: string;
  type: 'featured' | 'offers' | 'new' | 'category';
  category?: string;
  limit: number;
  variant: 'small' | 'medium' | 'large';
  showSeller: boolean;
}

interface DynamicFeedProps {
  sections?: FeedSection[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const defaultSections: FeedSection[] = [
  {
    id: 'featured',
    title: 'Productos Destacados',
    type: 'featured',
    limit: 6,
    variant: 'medium',
    showSeller: true
  },
  {
    id: 'offers',
    title: 'Ofertas Especiales',
    type: 'offers',
    limit: 4,
    variant: 'small',
    showSeller: true
  },
  {
    id: 'new',
    title: 'Productos Nuevos',
    type: 'new',
    limit: 8,
    variant: 'small',
    showSeller: true
  },
  {
    id: 'comida',
    title: 'Comida',
    type: 'category',
    category: 'comida',
    limit: 6,
    variant: 'medium',
    showSeller: true
  },
  {
    id: 'bebidas',
    title: 'Bebidas',
    type: 'category',
    category: 'bebidas',
    limit: 4,
    variant: 'small',
    showSeller: true
  }
];

export default function DynamicFeed({ 
  sections = defaultSections,
  autoRefresh = false, // Desactivar auto-refresh por defecto
  refreshInterval = 30000 // 30 segundos
}: DynamicFeedProps) {
  const [productsBySection, setProductsBySection] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const store = useCartStore();

  const fetchSectionProducts = async (section: FeedSection) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', String(section.limit));
      if (section.type === 'category' && section.category) {
        params.append('category', section.category);
      } else {
        params.append(section.type, 'true');
      }

      const response = await fetch(`/api/feed/real?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProductsBySection(prev => ({
          ...prev,
          [section.id]: data.data.products
        }));
      } else {
        console.error(`Error fetching products for section ${section.id}:`, data.error);
        setError(data.error || 'Error al cargar productos');
      }
    } catch (err: any) {
      console.error(`Error fetching products for section ${section.id}:`, err);
      setError(err.message);
    }
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    setError(null);
    const fetchPromises = sections.map(fetchSectionProducts);
    await Promise.all(fetchPromises);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAllProducts();
    if (autoRefresh) {
      const interval = setInterval(fetchAllProducts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sections, autoRefresh, refreshInterval]);

  // Escuchar cambios en el store del carrito para actualizar el feed
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchAllProducts();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const getSectionProps = (section: FeedSection) => {
    const baseProps = {
      products: productsBySection[section.id] || [],
      title: section.title,
      variant: section.variant,
      showSeller: section.showSeller,
    };

    switch (section.type) {
      case 'category':
        return { ...baseProps, category: section.category };
      default:
        return baseProps;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error al cargar el feed: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      {/* Banner de tienda activa */}
      <ActiveStoreBanner />
      
      {/* Mostrar contenido según si hay tienda activa o no */}
      {store.activeSellerId ? (
        // Recomendaciones inteligentes por tienda activa
        <SmartRecommendations 
          key={`recommendations-${store.activeSellerId}`}
          title="Más productos de esta tienda"
          limit={12}
          showCategoryFilter={true}
        />
      ) : (
        // Mostrar secciones generales solo cuando no hay tienda activa
        <>
          <NoActiveStoreMessage />
          {sections.map((section) => (
            <div key={section.id} className="w-full">
              <ProductGrid {...getSectionProps(section)} />
            </div>
          ))}
        </>
      )}
      
    </div>
  );
}

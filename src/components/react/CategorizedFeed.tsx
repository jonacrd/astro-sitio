import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_cents: number;
  seller_id: string;
  seller_name: string;
  seller_active: boolean;
  stock: number;
}

interface CategorizedFeedProps {
  className?: string;
}

const CATEGORIES = [
  { id: 'abastos', name: '🥫 Abastos', description: 'Arroz, pasta, aceites, atún, azúcar, etc.' },
  { id: 'bebidas', name: '🥤 Bebidas', description: 'Jugos, coca cola, agua, bebidas gaseosas, etc.' },
  { id: 'bebidas_alcoholicas', name: '🍺 Bebidas Alcohólicas y Tabaco', description: 'Cervezas, vinos, licores, cigarros, etc.' },
  { id: 'cereales', name: '🥣 Cereales', description: 'Cereales, granola, avena, etc.' },
  { id: 'comida_rapida', name: '🍔 Comida Rápida', description: 'Hamburguesas, pizza, hot dogs, etc.' },
  { id: 'lacteos', name: '🥛 Lácteos', description: 'Leche, queso, yogurt, mantequilla, etc.' },
  { id: 'panaderia', name: '🍞 Panadería', description: 'Pan, pasteles, galletas, etc.' },
  { id: 'carnes', name: '🥩 Carnes y Embutidos', description: 'Pollo, res, cerdo, salchichas, etc.' },
  { id: 'frutas_verduras', name: '🥬 Frutas y Verduras', description: 'Frutas frescas, verduras, legumbres, etc.' },
  { id: 'limpieza', name: '🧹 Limpieza', description: 'Detergentes, desinfectantes, etc.' },
  { id: 'higiene', name: '🧼 Higiene Personal', description: 'Jabón, shampoo, pasta dental, etc.' },
  { id: 'servicios', name: '🛠️ Servicios', description: 'Reparaciones, delivery, etc.' },
  { id: 'otros', name: '📦 Otros', description: 'Productos varios' }
];

export default function CategorizedFeed({ className = '' }: CategorizedFeedProps) {
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando productos de todos los vendedores activos (v2)...');

      // Obtener TODOS los productos (sin filtrar por vendedor activo)
      const { data: sellerProducts, error: productsError } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
          active,
          product:products!inner(
            id,
            title,
            description,
            category,
            image_url
          ),
          seller:profiles!seller_products_seller_id_fkey(
            id,
            name,
            is_active
          )
        `)
        .eq('active', true)
        .gt('stock', 0);

      if (productsError) {
        throw new Error('Error cargando productos: ' + productsError.message);
      }

      console.log(`✅ ${sellerProducts?.length || 0} productos encontrados`);

      // Agrupar productos por categoría
      const grouped: Record<string, Product[]> = {};
      
      sellerProducts?.forEach((item: any) => {
        const category = item.product.category || 'otros';
        
        if (!grouped[category]) {
          grouped[category] = [];
        }

        grouped[category].push({
          id: `${item.seller_id}::${item.product_id}`,
          title: item.product.title,
          description: item.product.description,
          category: item.product.category,
          image_url: item.product.image_url,
          price_cents: item.price_cents,
          seller_id: item.seller_id,
          seller_name: item.seller?.name || 'Vendedor',
          seller_active: item.seller?.is_active !== false, // Por defecto true si no está definido
          stock: item.stock
        });
      });

      setProductsByCategory(grouped);
      console.log('📊 Productos por categoría:', Object.keys(grouped).map(cat => `${cat}: ${grouped[cat].length}`));

    } catch (err: any) {
      console.error('❌ Error cargando productos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      // Advertir si el vendedor está inactivo
      if (!product.seller_active) {
        const confirmAdd = window.confirm(
          `⚠️ ${product.seller_name} está temporalmente cerrado.\n\n` +
          `Puedes agregar este producto al carrito, pero no podrás completar la compra hasta que la tienda esté abierta.\n\n` +
          `¿Deseas agregarlo de todas formas?`
        );
        
        if (!confirmAdd) {
          return;
        }
      }
      
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const existingIndex = cart.findIndex((item: any) => item.id === product.id);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: product.price_cents / 100,
          quantity: 1,
          image: product.image_url,
          seller_id: product.seller_id,
          seller_name: product.seller_name,
          seller_active: product.seller_active
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: { 
          product: product.title,
          quantity: 1
        }
      }));
      
      console.log('✅ Producto agregado al carrito:', product.title);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  const displayedCategories = selectedCategory
    ? CATEGORIES.filter(cat => cat.id === selectedCategory)
    : CATEGORIES;

  return (
    <div className={`w-full ${className}`}>
      {/* Filtros de Categoría */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🔥 Todos
          </button>
          {CATEGORIES.map(category => {
            const count = productsByCategory[category.id]?.length || 0;
            if (count === 0) return null;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Productos por Categoría */}
      {displayedCategories.map(category => {
        const products = productsByCategory[category.id] || [];
        
        if (products.length === 0) return null;

        return (
          <div key={category.id} className="mb-12">
            {/* Encabezado de Categoría */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {category.name}
              </h2>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>

            {/* Grid de Productos Compactos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  {/* Imagen */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.image_url || '/images/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                      }}
                    />
                    {/* Badge de vendedor con estado */}
                    <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                      product.seller_active ? 'bg-green-600/90' : 'bg-gray-600/90'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${product.seller_active ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                      {product.seller_name}
                      {!product.seller_active && ' (Cerrado)'}
                    </div>
                    {/* Badge de stock */}
                    {product.stock < 5 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        ¡Últimos {product.stock}!
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                      {product.title}
                    </h3>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      {formatPrice(product.price_cents)}
                    </p>
                    
                    {/* Botón Agregar con estado */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full py-2 rounded-lg active:scale-95 transition-all text-sm font-medium ${
                        product.seller_active
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      }`}
                      title={product.seller_active ? 'Agregar al carrito' : 'Tienda cerrada - Click para más info'}
                    >
                      {product.seller_active ? '+ Agregar' : '🔒 Tienda Cerrada'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Mensaje si no hay productos */}
      {Object.keys(productsByCategory).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No hay productos disponibles</p>
          <p className="text-sm">Los vendedores aún no han activado productos.</p>
        </div>
      )}
    </div>
  );
}


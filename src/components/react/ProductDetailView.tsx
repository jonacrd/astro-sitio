import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import AddToCartButton from './AddToCartButton';

interface ProductDetailViewProps {
  productId: string;
}

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

export default function ProductDetailView({ productId }: ProductDetailViewProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando producto:', productId);

      // Cargar el producto principal
      const { data: sellerProducts, error: productError } = await supabase
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
        .eq('product_id', productId)
        .eq('active', true)
        .limit(1);

      if (productError) {
        console.error('Error en consulta Supabase:', productError);
        throw productError;
      }

      const sellerProduct = sellerProducts?.[0];

      if (!sellerProduct) {
        setError('Producto no encontrado');
        setLoading(false);
        return;
      }

      const mainProduct: Product = {
        id: sellerProduct.product_id,
        title: sellerProduct.product.title,
        description: sellerProduct.product.description,
        category: sellerProduct.product.category,
        image_url: sellerProduct.product.image_url,
        price_cents: sellerProduct.price_cents,
        seller_id: sellerProduct.seller_id,
        seller_name: sellerProduct.seller?.name || 'Vendedor',
        seller_active: sellerProduct.seller?.is_active !== false,
        stock: sellerProduct.stock
      };

      setProduct(mainProduct);

      // Cargar productos relacionados (misma categoría, mismo vendedor)
      const { data: related, error: relatedError } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
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
        .eq('seller_id', sellerProduct.seller_id)
        .eq('product.category', sellerProduct.product.category)
        .eq('active', true)
        .neq('product_id', productId)
        .limit(6);

      if (!relatedError && related) {
        const relatedProductsData = related.map((item: any) => ({
          id: item.product_id,
          title: item.product.title,
          description: item.product.description,
          category: item.product.category,
          image_url: item.product.image_url,
          price_cents: item.price_cents,
          seller_id: item.seller_id,
          seller_name: item.seller?.name || 'Vendedor',
          seller_active: item.seller?.is_active !== false,
          stock: item.stock
        }));

        setRelatedProducts(relatedProductsData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error cargando producto:', err);
      setError(err.message);
      setLoading(false);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error || 'Producto no encontrado'}</p>
          <a href="/" className="text-blue-600 hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Producto Principal */}
      <div className="bg-[#0F1115] rounded-2xl overflow-hidden shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Imagen del Producto */}
          <div className="aspect-square rounded-xl overflow-hidden bg-white">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Información del Producto */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-gray-400">Vendedor:</span>
                <span className="text-white font-medium">{product.seller_name}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  product.seller_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {product.seller_active ? '🟢 Abierto' : '🔴 Cerrado'}
                </span>
              </div>

              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-gray-400">Stock:</span>
                <span className={`font-medium ${
                  product.stock > 10 ? 'text-green-400' : 
                  product.stock > 0 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
                </span>
              </div>
            </div>

            <div>
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <div className="text-sm text-gray-400 mb-2">Precio</div>
                <div className="text-4xl font-bold text-white">
                  {formatPrice(product.price_cents)}
                </div>
              </div>

              <AddToCartButton
                productId={product.id}
                title={product.title}
                price={product.price_cents / 100}
                image={product.image_url}
                sellerName={product.seller_name}
                sellerId={product.seller_id}
                disabled={product.stock <= 0 || !product.seller_active}
                className="w-full py-4 text-lg"
              />

              {!product.seller_active && (
                <p className="text-yellow-400 text-sm mt-4 text-center">
                  ⚠️ Este vendedor está temporalmente cerrado
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">
            Productos Relacionados
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {relatedProducts.map((related) => (
              <a
                key={related.id}
                href={`/producto/${related.id}`}
                className="bg-[#0F1115] rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
              >
                <div className="aspect-square bg-white p-2">
                  <img
                    src={related.image_url}
                    alt={related.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                    {related.title}
                  </h3>
                  <div className="text-[#D4AF37] font-bold text-lg">
                    {formatPrice(related.price_cents)}
                  </div>
                  {related.stock > 0 && related.stock <= 5 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      ⚠️ Últimas {related.stock} unidades
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

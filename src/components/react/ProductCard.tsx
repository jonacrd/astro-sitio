import { formatPrice } from '@lib/money'
import AddToCartButton from './AddToCartButton'

interface Product {
  id: number
  name: string
  slug: string
  description: string
  priceCents: number
  stock: number
  imageUrl?: string
  category: {
    id: number
    name: string
    slug: string
  }
}

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = "" }: ProductCardProps) {
  // Normalizar URL de imagen
  const imageUrl = product.imageUrl?.startsWith('http') 
    ? product.imageUrl 
    : (product.imageUrl || '/images/placeholder-product.jpg')
  
  return (
    <a 
      href={`/catalogo?pid=${product.id}`}
      className={`
        group rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300
        overflow-hidden hover:scale-[1.02] active:scale-[0.98]
        ${className}
      `}
    >
      {/* Imagen del producto */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img 
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        
        {/* Badge de categoría */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.category.name}
          </span>
        </div>
        
        {/* Badge de stock bajo */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              ¡Últimos {product.stock}!
            </span>
          </div>
        )}
        
        {/* Badge sin stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm sm:text-base">
              AGOTADO
            </span>
          </div>
        )}
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="p-3 sm:p-4">
        {/* Título */}
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        {/* Precio */}
        <p className="text-blue-600 font-semibold text-sm sm:text-base mb-2">
          {formatPrice(product.priceCents)}
        </p>
        
        {/* Stock */}
        <p className="text-xs text-gray-500 mb-3">
          {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
        </p>
        
        {/* Botón de agregar al carrito */}
        <AddToCartButton 
          productId={product.id}
          stock={product.stock}
          className="w-full min-h-11 text-sm sm:text-base"
        />
      </div>
    </a>
  )
}



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
  const imageUrl = product.imageUrl || '/images/placeholder-product.jpg'
  
  return (
    <div className={`
      bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
      border border-gray-100 overflow-hidden group hover:scale-105
      ${className}
    `}>
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badge de categoría */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.category.name}
          </span>
        </div>
        
        {/* Badge de stock bajo */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-3 right-3">
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              ¡Últimos {product.stock}!
            </span>
          </div>
        )}
        
        {/* Badge sin stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
              AGOTADO
            </span>
          </div>
        )}
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="p-6">
        {/* Título y descripción */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.description}
          </p>
        </div>
        
        {/* Precio y stock */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(product.priceCents)}
            </span>
            <span className="text-sm text-gray-500">
              Stock: {product.stock}
            </span>
          </div>
        </div>
        
        {/* Botón de agregar al carrito */}
        <AddToCartButton 
          productId={product.id}
          stock={product.stock}
          className="w-full"
        />
      </div>
    </div>
  )
}

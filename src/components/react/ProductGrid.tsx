import ProductCard from './ProductCard'

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

interface ProductGridProps {
  products: Product[]
  className?: string
}

export default function ProductGrid({ products, className = "" }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-500">
          Intenta cambiar los filtros o vuelve más tarde
        </p>
      </div>
    )
  }

  return (
    <div className={`
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
      gap-6 auto-rows-fr
      ${className}
    `}>
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product}
        />
      ))}
    </div>
  )
}

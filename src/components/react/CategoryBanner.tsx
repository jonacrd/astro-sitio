import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  priceCents: number
  stock: number
  imageUrl?: string
  category?: {
    name: string
  }
}

interface CategoryBannerProps {
  title: string
  subtitle: string
  products: Product[]
  gradient: string
  icon: string
  backgroundImage?: string
  height?: 'small' | 'medium' | 'large'
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

export default function CategoryBanner({
  title,
  subtitle,
  products,
  gradient,
  icon,
  backgroundImage,
  height = 'medium',
  autoPlay = true,
  autoPlayInterval = 4000,
  className = ""
}: CategoryBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)

  const heightClasses = {
    small: 'h-64 md:h-80',
    medium: 'h-80 md:h-96',
    large: 'h-96 md:h-[500px]'
  }

  useEffect(() => {
    if (isAutoPlaying && products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length)
      }, autoPlayInterval)
      return () => clearInterval(interval)
    }
  }, [isAutoPlaying, products.length, autoPlayInterval])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const addToCart = async (productId: number) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      })

      if (response.ok) {
        const button = document.querySelector(`[data-product-id="${productId}"]`) as HTMLButtonElement
        if (button) {
          const originalText = button.textContent
          button.textContent = '¡Agregado!'
          button.classList.add('bg-green-500')
          setTimeout(() => {
            button.textContent = originalText
            button.classList.remove('bg-green-500')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className={`relative w-full ${heightClasses[height]} overflow-hidden mb-8 ${className}`}>
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : `linear-gradient(to right, var(--tw-gradient-stops))`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} bg-opacity-80`}></div>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Category Info */}
            <div className="text-white">
              <div className="text-6xl mb-4">{icon}</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
              <p className="text-lg md:text-xl mb-6 text-white/90">
                {subtitle}
              </p>
              <a 
                href={`/catalogo?category=${products[0]?.category?.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Ver Todo
              </a>
            </div>

            {/* Right Side - Products Carousel */}
            <div 
              className="relative"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <div className="flex overflow-hidden">
                {products.map((product, index) => {
                  const price = product.priceCents / 100
                  const isOutOfStock = product.stock === 0

                  return (
                    <div
                      key={product.id}
                      className={`flex-shrink-0 w-full transition-transform duration-500 ease-out ${
                        index === currentIndex ? 'translate-x-0' : 
                        index < currentIndex ? '-translate-x-full' : 
                        'translate-x-full'
                      }`}
                      style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.imageUrl || '/images/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/images/placeholder-product.jpg'
                              }}
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {product.category?.name}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xl font-bold text-blue-600">
                                ${price.toFixed(2)}
                              </span>
                              <span className={`text-xs font-medium ${
                                isOutOfStock ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {isOutOfStock ? 'Agotado' : `${product.stock} disponibles`}
                              </span>
                            </div>
                            <button
                              onClick={() => addToCart(product.id)}
                              disabled={isOutOfStock}
                              data-product-id={product.id}
                              className={`w-full py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                isOutOfStock
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isOutOfStock ? 'Agotado' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Navigation */}
              {products.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
                  >
                    ›
                  </button>

                  {/* Indicators */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {products.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

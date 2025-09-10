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

interface ProductCarouselProps {
  title?: string
  subtitle?: string
  products?: Product[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

export default function ProductCarousel({
  title = "Productos Destacados",
  subtitle = "Descubre nuestras mejores ofertas",
  products = [],
  autoPlay = true,
  autoPlayInterval = 4000,
  className = ""
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)

  const itemsPerView = 4
  const maxIndex = Math.max(0, products.length - itemsPerView)

  useEffect(() => {
    if (isAutoPlaying && products.length > itemsPerView) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
      }, autoPlayInterval)
      return () => clearInterval(interval)
    }
  }, [isAutoPlaying, products.length, itemsPerView, maxIndex, autoPlayInterval])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setCurrentX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setCurrentX(e.clientX)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    
    const diff = startX - currentX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const diff = startX - currentX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    setIsDragging(false)
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
        // Mostrar notificación de éxito
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
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Products Track */}
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            {products.map((product) => {
              const price = product.priceCents / 100
              const isOutOfStock = product.stock === 0
              const isLowStock = product.stock > 0 && product.stock < 10

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-1/4 px-3"
                >
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={product.imageUrl || '/images/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder-product.jpg'
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      {product.category && (
                        <p className="text-sm text-gray-500 mb-2">
                          {product.category.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          ${price.toFixed(2)}
                        </span>
                        <span className={`text-sm font-medium ${
                          isOutOfStock ? 'text-red-500' : 
                          isLowStock ? 'text-orange-500' : 
                          'text-green-500'
                        }`}>
                          {isOutOfStock ? 'Agotado' : 
                           isLowStock ? `Solo ${product.stock}` : 
                           `${product.stock} disponibles`}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={isOutOfStock}
                        data-product-id={product.id}
                        className={`w-full py-2 px-4 rounded-lg font-bold transition-all duration-200 ${
                          isOutOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                        }`}
                      >
                        {isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation Buttons */}
          {products.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-blue-600 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:shadow-xl text-gray-600 hover:text-blue-600 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              >
                ›
              </button>
            </>
          )}

          {/* Indicators */}
          {products.length > itemsPerView && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: maxIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

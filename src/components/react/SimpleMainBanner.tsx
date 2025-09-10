import { useState, useEffect } from 'react'

export default function SimpleMainBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    {
      title: "¡LAS MEJORES MARCAS!",
      subtitle: "ENCUENTRA SOLO MARCAS RECONOCIDAS - EL MEJOR PRECIO DEL MERCADO",
      ctaText: "Ver Ofertas",
      backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&auto=format"
    },
    {
      title: "MODA DE DAMAS Y CABALLEROS",
      subtitle: "ROPA ELEGANTE Y MODERNA - CALIDAD GARANTIZADA",
      ctaText: "Ver Colección",
      backgroundImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop&auto=format"
    },
    {
      title: "TECNOLOGÍA DE VANGUARDIA",
      subtitle: "SMARTPHONES - LAPTOPS - ACCESORIOS TECH",
      ctaText: "Ver Tecnología",
      backgroundImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop&auto=format"
    },
    {
      title: "ZAPATILLAS DEPORTIVAS",
      subtitle: "ADIDAS - NIKE - LA MEJOR CALIDAD",
      ctaText: "Ver Zapatillas",
      backgroundImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=600&fit=crop&auto=format"
    },
    {
      title: "ACCESORIOS Y MÁS",
      subtitle: "MOCHILAS - LENTES - RELOJES - JOYERIA",
      ctaText: "Ver Accesorios",
      backgroundImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=600&fit=crop&auto=format"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative w-full h-96 md:h-[500px] overflow-hidden mb-16">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${slide.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl mb-8">
                {slide.subtitle}
              </p>
              <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                {slide.ctaText}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-all"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-all"
      >
        ›
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}

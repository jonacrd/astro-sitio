export default function SimpleCategoryBanners() {
  const categories = [
    {
      title: "Hombre",
      description: "Explora poleras, jeans y más.",
      icon: "👔",
      href: "/catalogo?cat=hombre",
      backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format"
    },
    {
      title: "Mujer", 
      description: "Novedades y básicos.",
      icon: "👗",
      href: "/catalogo?cat=mujer",
      backgroundImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop&auto=format"
    },
    {
      title: "Tecnología",
      description: "Smartphones, laptops y más.",
      icon: "💻",
      href: "/catalogo?cat=tecnologia",
      backgroundImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&auto=format"
    },
    {
      title: "Accesorios",
      description: "Completa tu outfit.",
      icon: "⌚",
      href: "/catalogo?cat=accesorios",
      backgroundImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format"
    }
  ]

  return (
    <section className="py-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <a
              key={index}
              href={category.href}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
            >
              <div 
                className="h-32 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${category.backgroundImage})`
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <span className="text-4xl">{category.icon}</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  {category.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

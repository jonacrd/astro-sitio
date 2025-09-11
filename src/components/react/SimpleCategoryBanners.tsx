export default function SimpleCategoryBanners() {
  const categories = [
    {
      title: "Hombre",
      description: "Explora poleras, jeans y más.",
      icon: "👔",
      href: "/catalogo?cat=hombre",
      backgroundImage:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Mujer",
      description: "Novedades y básicos.",
      icon: "👗",
      href: "/catalogo?cat=mujer",
      backgroundImage:
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Tecnología",
      description: "Smartphones, laptops y más.",
      icon: "💻",
      href: "/catalogo?cat=tecnologia",
      backgroundImage:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Accesorios",
      description: "Completa tu outfit.",
      icon: "⌚",
      href: "/catalogo?cat=accesorios",
      backgroundImage:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format",
    },
  ];

  return (
    <section className="py-10 md:py-14 lg:py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
            Explora nuestras categorías
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Encuentra exactamente lo que buscas en nuestras categorías organizadas
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <a
              key={index}
              href={category.href}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
            >
              <div
                className="aspect-[4/3] md:aspect-[16/9] bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${category.backgroundImage})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <span className="text-2xl md:text-3xl lg:text-4xl block mb-2">{category.icon}</span>
                </div>
              </div>
              <div className="p-3 md:p-4 text-center">
                <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  {category.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
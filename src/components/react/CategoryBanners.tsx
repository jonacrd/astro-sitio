import { useState } from "react";

interface Category {
  title: string;
  href: string;
  imageUrl?: string;
  description?: string;
  icon?: string;
}

interface CategoryBannersProps {
  categories?: Category[];
  className?: string;
}

export default function CategoryBanners({
  categories = [],
  className = "",
}: CategoryBannersProps) {
  // Categorías por defecto si no se proporcionan
  const defaultCategories: Category[] = [
    {
      title: "Hombre",
      href: "/catalogo?cat=hombre",
      description: "Explora poleras, jeans y más.",
      icon: "👔",
    },
    {
      title: "Mujer",
      href: "/catalogo?cat=mujer",
      description: "Novedades y básicos.",
      icon: "👗",
    },
    {
      title: "Niños",
      href: "/catalogo?cat=ninos",
      description: "Comodidad y estilo.",
      icon: "👶",
    },
    {
      title: "Accesorios",
      href: "/catalogo?cat=accesorios",
      description: "Completa tu outfit.",
      icon: "⌚",
    },
  ];

  const displayCategories =
    categories.length > 0 ? categories : defaultCategories;

  return (
    <section
      className={`py-6 bg-gradient-to-br from-gray-50 to-gray-200 max-h-80 overflow-hidden ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-64">
          {displayCategories.map((category, index) => (
            <a
              key={index}
              href={category.href}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-inherit no-underline block h-48 max-h-48"
            >
              {/* Category Image */}
              <div className="h-28 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-white z-10 relative drop-shadow-lg">
                    {category.icon || "📦"}
                  </span>
                )}
              </div>

              {/* Category Content */}
              <div className="p-4 h-20 flex flex-col justify-center flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">
                  {category.title}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 leading-tight">
                    {category.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}


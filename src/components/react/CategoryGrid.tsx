import React from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryGridProps {
  categories?: Category[];
  onCategoryClick: (category: Category) => void;
}

export default function CategoryGrid({ categories = [], onCategoryClick }: CategoryGridProps) {
  // Categorías de ejemplo basadas en la imagen
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Comida',
      icon: '🍽️',
      color: 'bg-orange-500'
    },
    {
      id: '2',
      name: 'Tecnología',
      icon: '📱',
      color: 'bg-blue-500'
    },
    {
      id: '3',
      name: 'Servicios',
      icon: '🔧',
      color: 'bg-green-500'
    },
    {
      id: '4',
      name: 'Salud',
      icon: '💊',
      color: 'bg-red-500'
    },
    {
      id: '5',
      name: 'Belleza',
      icon: '💄',
      color: 'bg-pink-500'
    },
    {
      id: '6',
      name: 'Hogar',
      icon: '🏠',
      color: 'bg-purple-500'
    }
  ];

  const displayCategories = categories.length > 0 ? categories : mockCategories;

  return (
    <section className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface/30 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-3">Categorías</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {displayCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category)}
                className="bg-muted/30 hover:bg-muted/40 rounded-lg p-3 transition-all duration-200 hover:scale-105 group"
              >
                <div className="text-center">
                  <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform duration-200`}>
                    {category.icon}
                  </div>
                  <p className="text-white text-xs font-medium">{category.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}






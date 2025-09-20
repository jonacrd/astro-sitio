import React from 'react';
import FeedTileSmall from './FeedTileSmall';

interface CategoryBannerProps {
  title: string;
  subtitle?: string;
  icon: string;
  products: any[];
  href: string;
}

export default function CategoryBanner({ title, subtitle, icon, products, href }: CategoryBannerProps) {
  return (
    <section className="py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header de la categoría */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <a 
            href={href} 
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Ver más →
          </a>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {products.map((product, index) => (
            <div key={index} className="relative">
              <FeedTileSmall item={product} />
              {/* Indicador de estado del vendedor */}
              <div className="absolute top-1 right-1">
                <span className={`w-2 h-2 rounded-full ${
                  product.sellerActive ? 'bg-green-500' : 'bg-red-500'
                }`} title={product.sellerActive ? 'Vendedor activo' : 'Vendedor inactivo'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
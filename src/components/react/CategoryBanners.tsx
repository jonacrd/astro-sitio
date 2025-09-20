import React, { useEffect, useState } from 'react';
import CategoryBanner from './CategoryBanner';

export default function CategoryBanners() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de categorías con productos
    const mockCategories = [
      {
        id: 'food',
        title: 'Comida & Postres',
        subtitle: 'Los mejores sabores de tu barrio',
        icon: '🍽️',
        href: '/categoria/comida',
        products: [
          { type: 'product', sellerId: 's1', sellerProductId: 'sp1', title: 'Arepa Reina Pepiada', priceCents: 2200, imageUrl: null, category: 'comida', sellerActive: true },
          { type: 'product', sellerId: 's2', sellerProductId: 'sp2', title: 'Empanada de Queso', priceCents: 1500, imageUrl: null, category: 'comida', sellerActive: true },
          { type: 'product', sellerId: 's3', sellerProductId: 'sp3', title: 'Cachapa con Queso', priceCents: 2500, imageUrl: null, category: 'comida', sellerActive: true },
          { type: 'product', sellerId: 's4', sellerProductId: 'sp4', title: 'Torta Tres Leches', priceCents: 3500, imageUrl: null, category: 'postres', sellerActive: false }
        ]
      },
      {
        id: 'minimarket',
        title: 'Minimarket & Bebidas',
        subtitle: 'Todo para tu hogar',
        icon: '🛒',
        href: '/categoria/minimarket',
        products: [
          { type: 'product', sellerId: 's5', sellerProductId: 'sp5', title: 'Cerveza Nacional', priceCents: 1800, imageUrl: null, category: 'cervezas', sellerActive: true },
          { type: 'product', sellerId: 's6', sellerProductId: 'sp6', title: 'Ron Premium', priceCents: 12000, imageUrl: null, category: 'ron', sellerActive: true },
          { type: 'product', sellerId: 's7', sellerProductId: 'sp7', title: 'Whisky Importado', priceCents: 25000, imageUrl: null, category: 'whisky', sellerActive: true },
          { type: 'product', sellerId: 's8', sellerProductId: 'sp8', title: 'Vodka Premium', priceCents: 15000, imageUrl: null, category: 'vodka', sellerActive: false }
        ]
      },
      {
        id: 'services',
        title: 'Servicios',
        subtitle: 'Profesionales cerca de ti',
        icon: '🔧',
        href: '/categoria/servicios',
        products: [
          { type: 'product', sellerId: 's9', sellerProductId: 'sp9', title: 'Corte de Cabello', priceCents: 8000, imageUrl: null, category: 'peluqueria', sellerActive: true },
          { type: 'product', sellerId: 's10', sellerProductId: 'sp10', title: 'Manicure Completa', priceCents: 5000, imageUrl: null, category: 'manicurista', sellerActive: true },
          { type: 'product', sellerId: 's11', sellerProductId: 'sp11', title: 'Reparación Moto', priceCents: 15000, imageUrl: null, category: 'mecanica', sellerActive: true },
          { type: 'product', sellerId: 's12', sellerProductId: 'sp12', title: 'Alarma Vehicular', priceCents: 80000, imageUrl: null, category: 'alarmas', sellerActive: false }
        ]
      }
    ];

    setTimeout(() => {
      setCategories(mockCategories);
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-6 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <CategoryBanner
          key={category.id}
          title={category.title}
          subtitle={category.subtitle}
          icon={category.icon}
          products={category.products}
          href={category.href}
        />
      ))}
    </div>
  );
}
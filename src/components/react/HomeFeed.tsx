import React, { useState, useEffect } from 'react';
import Carousel from './Carousel';

const pesos = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default function HomeFeed() {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [miniItems, setMiniItems] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  useEffect(() => {
    // Cargar best sellers
    fetch('/api/home/bestsellers')
      .then(r => r.json())
      .then(data => setBestSellers(data));

    // Cargar comida
    fetch('/api/home/carousel?group=food')
      .then(r => r.json())
      .then(data => setFoodItems(data));

    // Cargar minimarket
    fetch('/api/home/carousel?group=minimarket')
      .then(r => r.json())
      .then(data => setMiniItems(data));

    // Cargar servicios
    fetch('/api/home/carousel?group=services')
      .then(r => r.json())
      .then(data => setServiceItems(data));
  }, []);

  const bestSellersMapped = bestSellers.map((x: any) => ({
    id: x.sellerProductId,
    title: x.title,
    subtitle: x.storeName + (x.available ? ' · Disponible' : ''),
    price: pesos(x.priceCents),
    image: x.imageUrl || null,
    href: `/stand/${x.sellerId}`
  }));

  const foodMapped = foodItems.map((p: any) => ({
    id: p.productId,
    title: p.title,
    price: pesos(p.priceCents),
    image: p.imageUrl || null,
    href: `/buscar?q=${encodeURIComponent(p.title)}`
  }));

  const miniMapped = miniItems.map((p: any) => ({
    id: p.productId,
    title: p.title,
    price: pesos(p.priceCents),
    image: p.imageUrl || null,
    href: `/buscar?q=${encodeURIComponent(p.title)}`
  }));

  const serviceMapped = serviceItems.map((p: any) => ({
    id: p.productId,
    title: p.title,
    price: pesos(p.priceCents),
    image: p.imageUrl || null,
    href: `/buscar?q=${encodeURIComponent(p.title)}`
  }));

  return (
    <>
      {/* Feed: Best-sellers por tienda */}
      <section className="px-2">
        <h2 className="text-xl font-bold mb-2">Lo más vendido por tienda</h2>
        <Carousel title="Destacados de cada tienda" items={bestSellersMapped} />
      </section>

      {/* Banner Comida */}
      <section className="px-2 mt-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold">🍽️ Comida & Postres</h3>
          <p className="text-sm opacity-90">Los mejores sabores de Venezuela y Chile</p>
        </div>
      </section>

      {/* Carrusel Comida & Postres */}
      <section className="px-2">
        <Carousel title="Comida & Postres" items={foodMapped} />
      </section>

      {/* Banner Minimarket */}
      <section className="px-2 mt-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold">🛒 Minimarket & Bebidas</h3>
          <p className="text-sm opacity-90">Todo lo que necesitas para tu hogar</p>
        </div>
      </section>

      {/* Carrusel Minimarket & Bebidas */}
      <section className="px-2">
        <Carousel title="Minimarket & Bebidas" items={miniMapped} />
      </section>

      {/* Banner Servicios */}
      <section className="px-2 mt-4">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold">🔧 Servicios</h3>
          <p className="text-sm opacity-90">Profesionales al servicio de tu hogar y vehículo</p>
        </div>
      </section>

      {/* Carrusel Servicios */}
      <section className="px-2 mb-6">
        <Carousel title="Servicios" items={serviceMapped} />
      </section>
    </>
  );
}









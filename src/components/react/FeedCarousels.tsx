import React, { useState, useEffect } from 'react';
import Carousel from './Carousel';
import { formatPrice } from '../../lib/money';

export default function FeedCarousels() {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [miniItems, setMiniItems] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  useEffect(() => {
    // Cargar comida
    fetch('/api/home/carousel?group=food')
      .then(r => r.json())
      .then((rows: any[]) => {
        const mapped = rows.slice(0, 10).map(r => ({
          id: r.productId || r.id,
          title: r.title,
          price: r.priceCents ? formatPrice(r.priceCents) : undefined,
          image: r.imageUrl || null,
          href: `/buscar?q=${encodeURIComponent(r.title)}`
        }));
        setFoodItems(mapped);
      });

    // Cargar minimarket
    fetch('/api/home/carousel?group=minimarket')
      .then(r => r.json())
      .then((rows: any[]) => {
        const mapped = rows.slice(0, 10).map(r => ({
          id: r.productId || r.id,
          title: r.title,
          price: r.priceCents ? formatPrice(r.priceCents) : undefined,
          image: r.imageUrl || null,
          href: `/buscar?q=${encodeURIComponent(r.title)}`
        }));
        setMiniItems(mapped);
      });

    // Cargar servicios
    fetch('/api/home/carousel?group=services')
      .then(r => r.json())
      .then((rows: any[]) => {
        const mapped = rows.slice(0, 10).map(r => ({
          id: r.productId || r.id,
          title: r.title,
          price: r.priceCents ? formatPrice(r.priceCents) : undefined,
          image: r.imageUrl || null,
          href: `/buscar?q=${encodeURIComponent(r.title)}`
        }));
        setServiceItems(mapped);
      });
  }, []);

  return (
    <>
      {foodItems.length > 0 && <Carousel title="Destacados — Comida & Postres" items={foodItems} />}
      {miniItems.length > 0 && <Carousel title="Destacados — Minimarket & Bebidas" items={miniItems} />}
      {serviceItems.length > 0 && <Carousel title="Destacados — Servicios" items={serviceItems} />}
    </>
  );
}











import React, { useEffect, useState } from 'react';
import Carousel from './Carousel';

const fmt = (c:number)=>`$${Math.round(c/100)}`;

export default function HomeCarousel() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/home/carousel?group=food')
      .then(r => r.json())
      .then((rows: any[]) => {
        const mapped = rows.slice(0,10).map(r => ({
          id: r.productId || r.id,
          title: r.title,
          price: r.priceCents ? fmt(r.priceCents) : undefined,
          image: r.imageUrl || null,
          href: `/buscar?q=${encodeURIComponent(r.title)}`
        }));
        setItems(mapped);
      });
  }, []);

  if (!items.length) return null;
  
  return <Carousel title="Destacados — Comida & Postres" items={items} />;
}

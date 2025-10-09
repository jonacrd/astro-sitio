import React from 'react';

export default function FeedTileBig({ item }: { item: any }) {
  const price = item.priceCents != null ? `$${Math.round(item.priceCents/100)}` : '';
  return (
    <div className="bg-white rounded-2xl border shadow overflow-hidden">
      <div className="aspect-[16/9] relative sm:aspect-[21/9]">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-slate-100" />}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold line-clamp-2">{item.title}</div>
        {price && <div className="text-sm font-bold mt-1">{price}</div>}
      </div>
    </div>
  );
}











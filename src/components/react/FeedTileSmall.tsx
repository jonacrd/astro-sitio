import React from 'react';
import { formatPrice } from '../../lib/money';

export default function FeedTileSmall({ item }: { item: any }) {
  const price = item.priceCents != null ? formatPrice(item.priceCents) : '';
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="aspect-[4/5] relative">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-slate-100" />}
      </div>
      <div className="p-2">
        <div className="text-xs font-medium line-clamp-2">{item.title}</div>
        {price && <div className="text-xs font-semibold mt-1">{price}</div>}
      </div>
    </div>
  );
}











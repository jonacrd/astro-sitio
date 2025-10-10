import React from 'react';
import { formatPrice } from '../../lib/money';

export default function FeedTileSmall({ item }: { item: any }) {
  const price = item.priceCents != null ? formatPrice(item.priceCents) : '';
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
      <div className="aspect-[4/5] relative">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold line-clamp-2 text-white leading-relaxed">{item.title}</div>
        {price && <div className="text-sm font-bold mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{price}</div>}
      </div>
    </div>
  );
}











import React from 'react';

export default function FeedCard({ item }: { item: any }) {
  if (item.type === 'banner') {
    return (
      <a href={item.href||'#'} className="block bg-white rounded-2xl shadow border overflow-hidden">
        <div className="aspect-[9/16] bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
          <div className="text-center px-4">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            {item.subtitle && <p className="text-sm text-slate-600 mt-1">{item.subtitle}</p>}
          </div>
        </div>
      </a>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden">
      <div className="aspect-[9/16] relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-slate-100" />
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-medium line-clamp-2">{item.title}</div>
        <div className="text-sm font-semibold mt-1">${Math.round(item.priceCents/100)}</div>
        <button className="mt-2 w-full text-sm py-1.5 rounded bg-blue-600 text-white">Añadir</button>
      </div>
    </div>
  );
}

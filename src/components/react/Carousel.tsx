import React, { useRef } from 'react';

export type CardItem = {
  id: string;
  title: string;
  subtitle?: string;
  price?: string;
  image?: string | null;
  href?: string;
};

export default function Carousel({ title, items }: { title: string; items: CardItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dx:number)=> ref.current?.scrollBy({ left: dx, behavior:'smooth' });

  return (
    <section className="my-6">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="hidden sm:flex gap-2">
          <button onClick={()=>scroll(-320)} className="px-2 py-1 rounded bg-slate-100">◀</button>
          <button onClick={()=>scroll(320)} className="px-2 py-1 rounded bg-slate-100">▶</button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-2 px-2">
        {items.map((it)=>(
          <a key={it.id} href={it.href || '#'} className="snap-start min-w-[180px] max-w-[200px] bg-white rounded-xl shadow-sm border overflow-hidden">
            {it.image ? <img src={it.image} alt={it.title} loading="lazy" className="w-full h-28 object-cover" /> : <div className="w-full h-28 bg-slate-100" />}
            <div className="p-3">
              <div className="text-sm font-medium line-clamp-2">{it.title}</div>
              {it.subtitle && <div className="text-xs text-slate-500">{it.subtitle}</div>}
              {it.price && <div className="text-sm font-semibold mt-1">{it.price}</div>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}








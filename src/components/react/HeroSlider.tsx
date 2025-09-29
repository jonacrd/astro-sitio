import React, { useRef } from 'react';

export default function HeroSlider({ items }: { items: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dx:number)=> ref.current?.scrollBy({ left: dx, behavior:'smooth' });
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((it, idx)=>(
          <div key={idx} className="snap-start min-w-full">
            <div className="bg-white rounded-2xl border shadow overflow-hidden">
              <div className="aspect-[16/9] relative sm:aspect-[21/9]">
                {it.imageUrl
                  ? <img src={it.imageUrl} alt={it.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0 bg-slate-100" />}
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold line-clamp-2">{it.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden sm:flex absolute inset-y-0 left-2 items-center">
        <button onClick={()=>scroll(-600)} className="px-2 py-1 rounded bg-white/80 border shadow">◀</button>
      </div>
      <div className="hidden sm:flex absolute inset-y-0 right-2 items-center">
        <button onClick={()=>scroll(600)} className="px-2 py-1 rounded bg-white/80 border shadow">▶</button>
      </div>
    </div>
  );
}






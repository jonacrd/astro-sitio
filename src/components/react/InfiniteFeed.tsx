import React, { useEffect, useRef, useState } from 'react';
import FeedTileSmall from './FeedTileSmall';

type FeedResp = { items:any[]; nextCursor:string|null };

export default function InfiniteFeed() {
  const [items,setItems] = useState<any[]>([]);
  const [cursor,setCursor] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const [done,setDone] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('pageSize','12'); // 3 filas de 4 productos
    const res:FeedResp = await fetch('/api/feed?'+qs.toString()).then(r=>r.json());
    setItems(prev=>[...prev, ...res.items]);
    setCursor(res.nextCursor);
    setDone(!res.nextCursor);
    setLoading(false);
  }

  useEffect(()=>{ loadMore(); },[]);
  useEffect(()=>{
    const el = sentinel.current; if(!el) return;
    const io = new IntersectionObserver((es)=>{ if(es[0].isIntersecting) loadMore(); }, { rootMargin: '600px' });
    io.observe(el); return ()=> io.disconnect();
  }, [sentinel.current, cursor, loading, done]);

  return (
    <section className="py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Más Productos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item, index) => (
            <div key={index} className="relative">
              <FeedTileSmall item={item} />
              {/* Indicador de estado del vendedor */}
              <div className="absolute top-1 right-1">
                <span className={`w-2 h-2 rounded-full ${
                  item.sellerActive ? 'bg-green-500' : 'bg-red-500'
                }`} title={item.sellerActive ? 'Vendedor activo' : 'Vendedor inactivo'} />
              </div>
            </div>
          ))}
        </div>
        {!done && <div ref={sentinel} className="h-10" />}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

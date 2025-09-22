import React, { useState } from 'react';

const SUGGESTIONS = [
  'hamburguesa barata',
  'empanadas con delivery',
  'malta 355ml',
];

type SearchResult = {
  productId: string;
  productTitle: string;
  category: string;
  price: string;
  sellerId: string;
  sellerName: string;
  online: boolean;
  delivery: boolean;
  stock: number;
  sellerProductId: string;
  productUrl: string;
  addToCartUrl: string;
};

export default function SmartSearch(){
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState('');

  async function runSearch(text: string){
    if(!text.trim()) return;
    setLoading(true); setError(null);
    
    try{
      const url = `/api/nl-search?q=${encodeURIComponent(text)}&limit=8`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('No se pudo consultar el buscador.');
      const data = await res.json();
      console.log('Resultados:', data);
      setResults(data.results || []);
      setLastQuery(text);
    }catch(e:any){
      const errorMsg = e.message || 'Error desconocido.';
      setError(errorMsg);
      setResults([]);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 items-stretch w-full">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') runSearch(q); }}
          placeholder="¿Qué necesitas? Ej: hamburguesa, cerveza, corte de cabello…"
          className="flex-1 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder:text-slate-500 ring-2 ring-white/25 focus:ring-white/40 outline-none"
        />
        <button
          onClick={()=>runSearch(q)}
          className="rounded-xl px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {/* Texto de ayuda */}
      <p className="text-white/70 text-sm mt-2">
        Tip: pide en lenguaje natural. Ej: hamburguesa barata con delivery
      </p>

      {/* Sugerencias con scroll horizontal */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={()=>{ setQ(s); runSearch(s); }}
            className="shrink-0 bg-white/10 hover:bg-white/20 text-white/90 text-sm px-3 py-1.5 rounded-full border border-white/15"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Errores */}
      {error && (
        <div className="mt-3 text-red-100 bg-red-600/70 border border-red-400 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Resultados */}
      {loading && (
        <div className="mt-6">
          <div className="text-center text-white/80 mb-4">Buscando productos...</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6">
          <div className="text-white/90 mb-4">
            {results.length} resultado{results.length !== 1 ? 's' : ''} para "{lastQuery}"
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <article key={result.sellerProductId} className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{result.productTitle}</h3>
                  <span className="text-sm text-white/80">{result.price}</span>
                </div>
                <div className="text-sm text-white/70 mb-3">
                  <div className="flex items-center gap-1">
                    <span>Vendedor:</span>
                    <strong className="text-white">{result.sellerName}</strong>
                    {result.online ? '🟢' : '⚪'}
                  </div>
                  <div>
                    Stock: {result.stock} {result.delivery ? '· Delivery' : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={result.productUrl} 
                    className="flex-1 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm text-center transition-colors"
                  >
                    Ver
                  </a>
                  <button 
                    onClick={async () => {
                      try {
                        const { supabase } = await import('../../lib/supabaseClient');
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                          alert('Debes iniciar sesión para agregar productos al carrito');
                          return;
                        }
                        
                        window.location.href = result.addToCartUrl;
                      } catch (error) {
                        console.error('Error checking auth:', error);
                        alert('Error al verificar autenticación');
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm text-center transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && lastQuery && (
        <div className="mt-6">
          <div className="text-center text-white/80">
            No se encontraron productos para "{lastQuery}". Prueba con otras palabras.
          </div>
        </div>
      )}
    </div>
  );
}

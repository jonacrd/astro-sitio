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
      const url = `/api/nl-search-real?q=${encodeURIComponent(text)}&limit=8`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('No se pudo consultar el buscador.');
      const data = await res.json();
      console.log('Resultados:', data);
      setResults(data.items || []);
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
      <div className="flex gap-3 items-stretch w-full">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') runSearch(q); }}
          placeholder="¿Qué necesitas? Ej: hamburguesa, cerveza, corte de cabello…"
          className="flex-1 rounded-full px-5 py-4 bg-white/5 backdrop-blur-md text-white placeholder:text-white/50 border-2 border-[#FF4D6A]/30 focus:border-[#FF4D6A] focus:ring-4 focus:ring-[#FF4D6A]/50 focus:bg-white/10 outline-none transition-all duration-200 shadow-lg"
          style={{
            boxShadow: '0 8px 32px rgba(255, 77, 106, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        />
        <button
          onClick={()=>runSearch(q)}
          className="bg-[#FF4D6A] hover:bg-[#E6435D] text-white rounded-full px-6 py-4 font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {/* Texto de ayuda */}
      <p className="text-white/70 text-sm mt-2">
        Tip: pide en lenguaje natural. Ej: hamburguesa barata con delivery
      </p>

      {/* Sugerencias con scroll horizontal - Estilo Rosa */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={()=>{ setQ(s); runSearch(s); }}
            className="shrink-0 text-sm px-4 py-2 rounded-full bg-white/10 hover:bg-[#FF4D6A] text-white/80 hover:text-white border border-white/20 hover:border-[#FF4D6A] transition-all duration-200 hover:scale-105"
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
                        const { getUser } = await import('../../lib/session');
                        const user = await getUser();
                        
                        if (!user) {
                          alert('Debes iniciar sesión para agregar productos al carrito');
                          return;
                        }
                        
                        // Parsear sellerProductId para obtener sellerId y productId
                        const [sellerId, productId] = result.addToCartUrl.split('?')[1].split('&')[0].split('=')[1].split('::');
                        
                        // Hacer POST request al endpoint
                        const { supabase } = await import('../../lib/supabase-browser');
                        const { data: { session } } = await supabase.auth.getSession();
                        
                        if (!session?.access_token) {
                          alert('No hay sesión activa');
                          return;
                        }
                        
                        const response = await fetch("/api/cart/add", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            sellerId: sellerId,
                            productId: productId,
                            title: result.productTitle,
                            price_cents: result.priceCents,
                            qty: 1
                          })
                        });
                        
                        const result_data = await response.json();
                        
                        if (result_data.success) {
                          alert('¡Producto agregado al carrito!');
                          // Disparar evento para actualizar el carrito
                          const cartUpdateEvent = new CustomEvent("cart-updated", {
                            detail: {
                              itemCount: result_data.itemCount,
                              totalCents: result_data.totalCents,
                              productId: productId,
                            },
                          });
                          window.dispatchEvent(cartUpdateEvent);
                        } else {
                          alert('Error: ' + result_data.error);
                        }
                      } catch (error) {
                        console.error('Error adding to cart:', error);
                        alert('Error al agregar producto al carrito');
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#FF4D6A] hover:bg-[#E6435D] text-white text-sm text-center transition-all duration-200 hover:scale-105"
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

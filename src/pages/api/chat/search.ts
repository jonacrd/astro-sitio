import type { APIRoute } from 'astro';

// Funciones helper locales
function productUrl(productId: string, sellerId: string) {
  return `/producto/${encodeURIComponent(productId)}?seller=${encodeURIComponent(sellerId)}`;
}

function addToCartUrl(sellerProductId: string, qty = 1) {
  return `/api/cart/add?sellerProductId=${encodeURIComponent(sellerProductId)}&qty=${qty}`;
}

type ChatItem = {
  productId: string;
  productTitle: string;
  category: string;
  priceCents: number;
  price: string;
  imageUrl?: string|null;

  sellerId: string;
  sellerName: string;
  online: boolean;
  delivery: boolean;
  stock: number;

  sellerProductId: string;
  productUrl: string;
  addToCartUrl: string;
};

// Datos mock (simplificados para el chat)
const GLOBAL_PRODUCTS = [
  { id:'p_perro_caliente', title:'Perro Caliente', category:'comida', origin:'chi', priceCents:2000, discountCents:0, imageUrl:null, active:true },
  { id:'p_hamburguesa', title:'Hamburguesa Clásica', category:'comida', origin:'chi', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_salchipapa', title:'Salchipapa', category:'comida', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_empanada_venezolana', title:'Empanada Venezolana', category:'comida', origin:'ven', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_arepa_huevo', title:'Arepa de Huevo', category:'comida', origin:'col', priceCents:2000, discountCents:0, imageUrl:null, active:true },
  { id:'p_cachapa', title:'Cachapa', category:'comida', origin:'ven', priceCents:2500, discountCents:0, imageUrl:null, active:true },
  { id:'p_parrilla_mixta', title:'Parrilla Mixta', category:'comida', origin:'chi', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_sopa_pollo', title:'Sopa de Pollo', category:'comida', origin:'chi', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  { id:'p_lasagna', title:'Lasaña', category:'comida', origin:'chi', priceCents:4200, discountCents:0, imageUrl:null, active:true },
  { id:'p_cerveza_polar', title:'Cerveza Polar 355ml', category:'cervezas', origin:'ven', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_ron_cacique', title:'Ron Cacique 500ml', category:'ron', origin:'ven', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_whisky_johnnie', title:'Whisky Johnnie Walker 750ml', category:'whisky', origin:'chi', priceCents:25000, discountCents:0, imageUrl:null, active:true },
  { id:'p_corte_cabello', title:'Corte de Cabello', category:'peluqueria', origin:'chi', priceCents:8000, discountCents:0, imageUrl:null, active:true },
  { id:'p_manicure', title:'Manicure Completa', category:'manicurista', origin:'ven', priceCents:5000, discountCents:0, imageUrl:null, active:true },
  { id:'p_revision_motor', title:'Revisión de Motor', category:'mecanica', origin:'chi', priceCents:25000, discountCents:0, imageUrl:null, active:true },
  { id:'p_alarma_auto', title:'Instalación de Alarma', category:'alarmas', origin:'ven', priceCents:80000, discountCents:0, imageUrl:null, active:true },
  { id:'p_tres_leches', title:'Torta Tres Leches', category:'tortas', origin:'ven', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_quesillo', title:'Quesillo Venezolano', category:'quesillos', origin:'ven', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_malta', title:'Malta 355ml', category:'bebidas', origin:'ven', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  { id:'p_harina_pan', title:'Harina PAN 1kg', category:'comida', origin:'ven', priceCents:2800, discountCents:0, imageUrl:null, active:true }
];

const SELLERS = [
  { id:'s1', storeName:'Carnes del Zulia', onlineManual:true, delivery: true },
  { id:'s2', storeName:'Postres y Dulces', onlineManual:true, delivery: true },
  { id:'s3', storeName:'Licores Premium', onlineManual:false, delivery: false },
  { id:'s4', storeName:'Belleza y Estilo', onlineManual:true, delivery: false },
  { id:'s5', storeName:'AutoMecánica Pro', onlineManual:true, delivery: false },
  { id:'s6', storeName:'Sabores Tradicionales', onlineManual:true, delivery: true },
  { id:'s7', storeName:'Comidas Rápidas Express', onlineManual:true, delivery: true },
  { id:'s8', storeName:'Almuerzos Ejecutivos', onlineManual:true, delivery: true },
  { id:'s9', storeName:'Parrilla y Mariscos', onlineManual:true, delivery: true }
];

// Inventario simplificado (productos disponibles por vendedor)
const SELLER_INVENTORY = [
  // Carnes del Zulia (s1) - comidas
  { sellerId:'s1', productId:'p_perro_caliente', stock:15, active:true },
  { sellerId:'s1', productId:'p_hamburguesa', stock:8, active:true },
  { sellerId:'s1', productId:'p_parrilla_mixta', stock:6, active:true },
  
  // Postres y Dulces (s2) - postres
  { sellerId:'s2', productId:'p_tres_leches', stock:12, active:true },
  { sellerId:'s2', productId:'p_quesillo', stock:10, active:true },
  
  // Licores Premium (s3) - bebidas (offline)
  { sellerId:'s3', productId:'p_ron_cacique', stock:5, active:true },
  { sellerId:'s3', productId:'p_whisky_johnnie', stock:2, active:true },
  
  // Belleza y Estilo (s4) - servicios
  { sellerId:'s4', productId:'p_corte_cabello', stock:8, active:true },
  { sellerId:'s4', productId:'p_manicure', stock:6, active:true },
  
  // AutoMecánica Pro (s5) - servicios
  { sellerId:'s5', productId:'p_revision_motor', stock:3, active:true },
  { sellerId:'s5', productId:'p_alarma_auto', stock:2, active:true },
  
  // Sabores Tradicionales (s6) - comida tradicional
  { sellerId:'s6', productId:'p_empanada_venezolana', stock:20, active:true },
  { sellerId:'s6', productId:'p_arepa_huevo', stock:18, active:true },
  { sellerId:'s6', productId:'p_cachapa', stock:14, active:true },
  { sellerId:'s6', productId:'p_malta', stock:25, active:true },
  { sellerId:'s6', productId:'p_harina_pan', stock:30, active:true },
  
  // Comidas Rápidas Express (s7) - comida rápida
  { sellerId:'s7', productId:'p_salchipapa', stock:12, active:true },
  { sellerId:'s7', productId:'p_sopa_pollo', stock:8, active:true },
  
  // Almuerzos Ejecutivos (s8) - comida ejecutiva
  { sellerId:'s8', productId:'p_lasagna', stock:7, active:true },
  
  // Parrilla y Mariscos (s9) - parrilla
  { sellerId:'s9', productId:'p_parrilla_mixta', stock:4, active:true }
];

function normalize(s: string) { 
  return s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase(); 
}

function price(priceCents: number) {
  return `$${Math.round(priceCents/100)}`;
}

export const GET: APIRoute = async ({ url, request }) => {
  const qRaw = (url.searchParams.get('q') || '').trim();
  const q = normalize(qRaw);
  const category = url.searchParams.get('category') || undefined;
  const deliveryOnly = (url.searchParams.get('deliveryOnly') || 'false') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '6', 10) || 6, 15);

  // 1) Filtrar productos por texto/categoría
  const candidates = GLOBAL_PRODUCTS.filter(p => {
    const okCat = category ? p.category === category : true;
    const okText = q ? normalize(p.title).includes(q) : true;
    return okCat && okText;
  });

  // 2) Cruce con inventario por vendedor
  const items: ChatItem[] = [];
  for (const p of candidates) {
    const stocks = SELLER_INVENTORY.filter(st => st.productId === p.id && st.active && st.stock > 0);
    for (const st of stocks) {
      const s = SELLERS.find(ss => ss.id === st.sellerId);
      if (!s) continue;
      if (deliveryOnly && !s.delivery) continue;

      items.push({
        productId: p.id,
        productTitle: p.title,
        category: p.category,
        priceCents: p.priceCents,
        price: price(p.priceCents),
        imageUrl: p.imageUrl || null,

        sellerId: s.id,
        sellerName: s.storeName,
        online: s.onlineManual,
        delivery: s.delivery,
        stock: st.stock,

        sellerProductId: `${st.sellerId}::${st.productId}`,
        productUrl: productUrl(p.id, s.id),
        addToCartUrl: addToCartUrl(`${st.sellerId}::${st.productId}`, 1),
      });
    }
  }

  // 3) Orden: online primero, mayor stock, menor precio
  items.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (b.stock !== a.stock) return b.stock - a.stock;
    return a.priceCents - b.priceCents;
  });

  const slice = items.slice(0, limit);

  // 4) Mensaje amigable (para Landbot)
  const lines: string[] = [];
  if (slice.length) {
    lines.push(`Encontré ${slice.length} opción(es) para "${qRaw || 'tu búsqueda'}":\n`);
    for (const it of slice) {
      const onlineDot = it.online ? '🟢' : '⚪';
      const del = it.delivery ? ' · delivery' : '';
      lines.push(`${onlineDot} *${it.productTitle}* — ${it.price}`);
      lines.push(`    Vendedor: ${it.sellerName}${del} · stock: ${it.stock}`);
      lines.push(`    👉 Ver: ${it.productUrl}`);
      lines.push(`    🛒 Añadir: ${it.addToCartUrl}`);
      lines.push('');
    }
    lines.push('¿Te paso el link al vendedor o agrego al carrito?');
  } else {
    lines.push('No hay stock disponible ahora para esa búsqueda. ¿Intentamos con otra palabra o categoría?');
  }

  const payload = {
    query: { q: qRaw, category, deliveryOnly, limit },
    count: slice.length,
    items: slice,
    message: lines.join('\n')
  };

  // CORS amistoso por si Landbot llama directo
  const headers = {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*'
  };

  return new Response(JSON.stringify(payload), { headers });
};

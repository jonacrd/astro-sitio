import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';

const GROUPS: Record<string, string[]> = {
  food: ['comida','postres','tortas','quesillos'],
  minimarket: ['fiambres','carnes','pollos','chuleta','cervezas','ron','whisky','aguardiente','vodka'],
  services: ['peluqueria','manicurista','mecanica','autopartes','accesorios','motos','alarmas','gps','sensores']
};

export const GET: APIRoute = async ({ url }) => {
  const group = url.searchParams.get('group') || 'food';
  const cats = GROUPS[group] || GROUPS['food'];

  // Obtener vendedores disponibles
  const sellers = await repos.status.list();
  const items: any[] = [];

  // Priorizar productos de vendedores disponibles y más vendidos
  for (const s of sellers) {
    const inv = await repos.inventory.list(s.id);
    if (!inv?.length) continue;

    // Ventas 7d para priorizar
    const orders = await repos.orders.listBySeller(s.id, 7);
    const counts = new Map<string, number>();
    for (const o of orders) for (const it of o.items) counts.set(it.productId, (counts.get(it.productId)||0) + it.qty);

    // Filtrar por categoría y ordenar por ventas
    const filtered = inv
      .filter(sp => sp.active && sp.stock > 0 && cats.includes(sp.product.category))
      .sort((a,b) => {
        const ca = counts.get(a.product.id)||0, cb = counts.get(b.product.id)||0;
        if (s.available && !s.available) return -1;
        if (!s.available && s.available) return 1;
        return cb - ca;
      });

    for (const sp of filtered.slice(0, 3)) { // Máximo 3 por vendedor
      items.push({
        productId: sp.product.id,
        title: sp.product.title,
        category: sp.product.category,
        priceCents: sp.product.priceCents - (sp.product.discountCents || 0),
        imageUrl: sp.product.imageUrl || null
      });
    }
  }

  // Si no hay suficientes, completar con catálogo global
  if (items.length < 10) {
    for (const c of cats) {
      const list = await repos.products.globalList({ category: c, limit: 5 });
      for (const p of list) {
        if (items.length >= 10) break;
        if (!items.find(item => item.productId === p.id)) {
          items.push({
            productId: p.id,
            title: p.title,
            category: p.category,
            priceCents: p.priceCents - (p.discountCents || 0),
            imageUrl: p.imageUrl || null
          });
        }
      }
    }
  }

  return new Response(JSON.stringify(items.slice(0, 10)), { headers:{'content-type':'application/json'} });
};

import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';

export const GET: APIRoute = async () => {
  // MOCK: vendedores fijos s1, s2. Si existen más en mock, listarlos de repos.status.list()
  const sellers = await repos.status.list(); // [{id,storeName,...}]
  const results: Array<{
    sellerId: string;
    storeName: string;
    sellerProductId: string;
    title: string;
    priceCents: number;
    discountCents?: number;
    imageUrl?: string | null;
    stock: number;
    available: boolean;
  }> = [];

  for (const s of sellers) {
    // top por ventas 7d
    const orders = await repos.orders.listBySeller(s.id, 7);
    const counts: Record<string, number> = {};
    for (const o of orders) for (const it of o.items) counts[it.productId] = (counts[it.productId]||0) + it.qty;

    let pickProductId: string | null = null;
    let max = -1;
    for (const [pid, qty] of Object.entries(counts)) if (qty > max) { max = qty; pickProductId = pid; }

    const inv = await repos.inventory.list(s.id);
    let chosen = inv.find(sp => sp.product.id === pickProductId && sp.active && sp.stock > 0);
    if (!chosen) chosen = inv.find(sp => sp.active && sp.stock > 0) || inv[0];

    if (chosen) {
      const pe = chosen.product.priceCents - (chosen.product.discountCents || 0);
      results.push({
        sellerId: s.id,
        storeName: s.storeName,
        sellerProductId: chosen.id,
        title: chosen.product.title,
        priceCents: pe,
        discountCents: chosen.product.discountCents || 0,
        imageUrl: chosen.product.imageUrl || null,
        stock: chosen.stock,
        available: s.available
      });
    }
  }

  return new Response(JSON.stringify(results), { headers:{'content-type':'application/json'} });
};













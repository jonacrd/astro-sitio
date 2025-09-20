import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';

// Nota: en este MVP, cada pedido es a UN vendedor.
export const POST: APIRoute = async ({ request }) => {
  const { sellerId, items, paymentMethod, buyerName, buyerPhone } = await request.json();
  if(!sellerId || !Array.isArray(items) || !paymentMethod) return new Response('Bad Request', { status:400 });
  try {
    const order = await repos.orders.create({
      sellerId,
      items: items.map((it:any)=>({ sellerProductId: it.sellerProductId, qty: Number(it.qty||0) })),
      paymentMethod,
      buyerName, buyerPhone
    });
    return new Response(JSON.stringify(order), { headers:{'content-type':'application/json'} });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e.message || 'Error' }), { status:400, headers:{'content-type':'application/json'} });
  }
};

import type { APIRoute } from 'astro';
import { repos } from '../../../../lib/repos';
const SELLER_ID = 's1';

export const PATCH: APIRoute = async ({ request }) => {
  const { sellerProductId, stock, active } = await request.json();
  if(!sellerProductId) return new Response('Bad Request',{status:400});
  await repos.inventory.update(SELLER_ID, sellerProductId, { 
    ...(stock != null ? { stock: Number(stock) } : {}),
    ...(active != null ? { active: !!active } : {})
  });
  return new Response(JSON.stringify({ ok: true }), { headers:{'content-type':'application/json'} });
};
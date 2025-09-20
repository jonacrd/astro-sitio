import type { APIRoute } from 'astro';
import { repos } from '../../../../lib/repos';
const SELLER_ID = 's1';

export const POST: APIRoute = async ({ request }) => {
  const { sellerProductId } = await request.json();
  if(!sellerProductId) return new Response('Bad Request',{status:400});
  await repos.inventory.remove(SELLER_ID, sellerProductId);
  return new Response(JSON.stringify({ ok: true }), { headers:{'content-type':'application/json'} });
};
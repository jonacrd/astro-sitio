import type { APIRoute } from 'astro';
import { repos } from '../../../../lib/repos';
const SELLER_ID = 's1';

export const POST: APIRoute = async ({ request }) => {
  const { productId, stock } = await request.json();
  if(!productId) return new Response('Bad Request',{status:400});
  const row = await repos.inventory.add(SELLER_ID, productId, Number(stock||0));
  return new Response(JSON.stringify(row), { headers:{'content-type':'application/json'} });
};
import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';
const SELLER_ID = 's1';

export const GET: APIRoute = async () => {
  const stats = await repos.orders.statsBySeller(SELLER_ID);
  return new Response(JSON.stringify(stats), { headers:{'content-type':'application/json'} });
};

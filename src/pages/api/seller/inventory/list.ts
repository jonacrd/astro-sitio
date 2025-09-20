import type { APIRoute } from 'astro';
import { repos } from '../../../../lib/repos';
const SELLER_ID = 's1'; // mock

export const GET: APIRoute = async () => {
  const data = await repos.inventory.list(SELLER_ID);
  return new Response(JSON.stringify(data), { headers:{'content-type':'application/json'} });
};
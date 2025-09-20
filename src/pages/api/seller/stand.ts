import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';

export const GET: APIRoute = async ({ url }) => {
  const sellerId = url.searchParams.get('sellerId') || 's1';
  const data = await repos.inventory.list(sellerId);
  return new Response(JSON.stringify(data), { headers:{'content-type':'application/json'} });
};

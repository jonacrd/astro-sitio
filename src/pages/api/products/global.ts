import type { APIRoute } from 'astro';
import { repos } from '../../../lib/repos';

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const list = await repos.products.globalList({ q, category, limit: 50 });
  return new Response(JSON.stringify(list), { headers:{'content-type':'application/json'} });
};

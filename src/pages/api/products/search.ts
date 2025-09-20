import type { APIRoute } from 'astro';
import { productRepo } from '@lib/repos';

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') || '';
  const cat = url.searchParams.get('category') || '';

  const list = await productRepo.search(q, cat);

  const out = list.map(p => ({
    id: p.id, 
    title: p.name, 
    category: p.category?.name || 'otros',
    priceCents: p.priceCents, 
    discountCents: p.discountCents || 0, 
    imageUrl: p.imageUrl
  }));

  return new Response(JSON.stringify(out), { headers:{'content-type':'application/json'} });
};

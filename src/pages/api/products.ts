import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db';

export const GET: APIRoute = async () => {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  return new Response(JSON.stringify(products), { headers: { 'Content-Type': 'application/json' } });
};



// Devuelve todos los productos con variantes e inventario.
// GET /api/products.json
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/db.js';



export const GET: APIRoute = async () => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: { include: { inventory: true } },
      suppliers: { include: { supplier: true } },
    }
  });

  return new Response(JSON.stringify(products), {
    headers: { 'Content-Type': 'application/json' },
  });
};

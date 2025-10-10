import type { APIRoute } from 'astro';
import { sellerStatusRepo } from '@lib/repos';

export const GET: APIRoute = async () => {
  try {
    const data = await sellerStatusRepo.list();
    return new Response(JSON.stringify(data), { 
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching sellers status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};













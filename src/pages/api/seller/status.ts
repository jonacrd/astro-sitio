import type { APIRoute } from 'astro';
import { sellerStatusRepo } from '@lib/repos';

const MOCK_SELLER_ID = 's1';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { online } = await request.json().catch(() => ({}));
    const data = await sellerStatusRepo.toggleOnline(MOCK_SELLER_ID, !!online);
    return new Response(JSON.stringify(data), { 
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Error toggling seller status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};





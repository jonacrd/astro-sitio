import type { APIRoute } from 'astro';
import { sellerStatusRepo } from '@lib/repos';

const MOCK_SELLER_ID = 's1';

export const POST: APIRoute = async () => {
  try {
    const data = await sellerStatusRepo.heartbeat(MOCK_SELLER_ID);
    return new Response(JSON.stringify(data), { 
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating seller heartbeat:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};








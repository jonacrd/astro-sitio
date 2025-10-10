import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || '');
  }
  return new Response('forbidden', { status: 403 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('📥 WhatsApp webhook:', JSON.stringify(body));

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (supabaseUrl && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, serviceKey);
      await sb.from('whatsapp_logs').insert({
        to_phone: 'incoming',
        template: 'incoming_webhook',
        payload: body,
        response_status: 200,
        response_body: body
      });
    }
  } catch (e) {
    console.error('Webhook error:', e);
  }
  return new Response('ok');
};




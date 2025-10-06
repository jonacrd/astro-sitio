import type { APIRoute } from 'astro';
import { sendTemplateMessage } from '../../server/whatsapp';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!process.env.WHATSAPP_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), { status: 500 });
    }

    const body = await request.json();
    const { to, template, components } = body || {};
    if (!to || !template) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing to/template' }), { status: 400 });
    }

    const result = await sendTemplateMessage({ to, template, components });
    return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
};

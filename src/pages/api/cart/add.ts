import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const sellerProductId = url.searchParams.get('sellerProductId');
  const qty = parseInt(url.searchParams.get('qty') || '1', 10);

  // Aquí harías: validar SPID, push a sesión/cookie/DB. De momento solo simulamos.
  if (!sellerProductId) {
    return new Response(JSON.stringify({ ok:false, error:'sellerProductId requerido' }), { status:400 });
  }

  return new Response(JSON.stringify({
    ok: true,
    added: { sellerProductId, qty },
    // redirige al carrito de tu app si lo deseas:
    redirectTo: '/carrito'
  }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' }});
};
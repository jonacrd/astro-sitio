export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';          // ← tu instancia
import { Prisma, Size } from '@prisma/client';     // ← tipos/enums vienen de aquí


// Helpers cookies (usa los que ya tengas si existen)
function parseCookies(req: Request) {
  const raw = req.headers.get('cookie') || '';
  const out: Record<string, string> = {};
  raw.split(';').forEach(p => {
    const [k, ...rest] = p.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('=') || '');
  });
  return out;
}
function buildSetCookie(name: string, value: string, opts: { maxAgeSec?: number } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax', 'HttpOnly'];
  if (opts.maxAgeSec) parts.push(`Max-Age=${opts.maxAgeSec}`);
  return parts.join('; ');
}

// 👇 util para convertir string → enum Size
function parseSizeEnum(input: unknown, fallback: Size): Size {
  const s = String(input || '').toUpperCase().trim(); // "m" -> "M"
  // Acepta sólo miembros reales del enum
  const candidates = Object.values(Size) as string[];
  // Si tu enum es "XS","S","M","L","XL" esto funcionará
  if (candidates.includes(s)) {
    return s as Size;
  }
  return fallback;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1) Cookie y carrito
    const cookies = parseCookies(request);
    let cartId = cookies['cartId'] ? Number(cookies['cartId']) : undefined;

    let setCookieHeader: string | undefined;
    if (!cartId) {
      const created = await prisma.cart.create({ data: {} });
      cartId = created.id;
      setCookieHeader = buildSetCookie('cartId', String(cartId), { maxAgeSec: 60 * 60 * 24 * 30 });
    }

    // 2) Body
    const body = await request.json();
    const variantId: number = Number(body?.variantId);
    const quantity: number = Math.max(1, Number(body?.quantity ?? 1));
    const bodySizeStr: string = String(body?.size ?? '');
    const colorHex: string = String(body?.colorHex ?? '#000000');

    if (!variantId || Number.isNaN(variantId)) {
      return new Response(JSON.stringify({ ok: false, error: 'variantId inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3) Variante: necesitamos su size (enum), precio e inventario
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { 
        salePriceCents: true, 
        size: true, 
        colorHex: true,
        inventory: {
          select: { stock: true }
        }
      },
    });
    if (!variant) {
      return new Response(JSON.stringify({ ok: false, error: 'Variante no encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4) Verificar stock disponible
    const availableStock = variant.inventory?.stock || 0;
    if (availableStock < quantity) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles` 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4) Convertir size string → enum Size, usando el de la variante como default
    const sizeEnum: Size = parseSizeEnum(bodySizeStr, variant.size);

    // 5) Upsert del item usando enum (NO string)
    const item = await prisma.cartItem.upsert({
      where: {
        cartId_variantId_size_colorHex: {
          cartId,            // number garantizado
          variantId,
          size: sizeEnum,    // 👈 enum, no string
          colorHex,
        },
      },
      update: {
        quantity: { increment: quantity },
        updatedAt: new Date(),
      },
      create: {
        cartId,
        variantId,
        quantity,
        salePriceCents: variant.salePriceCents ?? 0,
        size: sizeEnum,     // 👈 enum aquí también
        colorHex,
      },
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (setCookieHeader) headers['Set-Cookie'] = setCookieHeader;

    return new Response(JSON.stringify({ ok: true, item }), { headers });
  } catch (err) {
    console.error('[cart/add] error', err);
    return new Response(JSON.stringify({ ok: false, error: 'Error interno' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

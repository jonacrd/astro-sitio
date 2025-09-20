import { createHmac, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';

const NAME = 'town.sid';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change';

function sign(v: string) { 
  return createHmac('sha256', SECRET).update(v).digest('hex'); 
}

function pack(id: string) { 
  const p = Buffer.from(id).toString('base64url'); 
  return `${p}.${sign(p)}`; 
}

function unpack(raw?: string | null) { 
  if (!raw) return null; 
  const [p, s] = raw.split('.'); 
  if (!p || !s) return null; 
  const ok = timingSafeEqual(Buffer.from(s), Buffer.from(sign(p))); 
  if (!ok) return null; 
  return Buffer.from(p, 'base64url').toString(); 
}

export function setSession(ctx: APIContext, userId: string) {
  ctx.cookies.set(NAME, pack(userId), { 
    httpOnly: true, 
    path: '/', 
    sameSite: 'lax', 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 60 * 60 * 24 * 30 
  });
}

export function clearSession(ctx: APIContext) { 
  ctx.cookies.set(NAME, '', { 
    httpOnly: true, 
    path: '/', 
    maxAge: 0 
  }); 
}

export function getUserId(ctx: APIContext) { 
  return unpack(ctx.cookies.get(NAME)?.value); 
}
// src/lib/cookies.ts
export function parseCookies(request: Request): Record<string, string> {
    const raw = request.headers.get('cookie') ?? '';
    const out: Record<string, string> = {};
    raw.split(';').forEach(p => {
      const [k, ...rest] = p.trim().split('=');
      if (!k) return;
      out[k] = decodeURIComponent(rest.join('=') || '');
    });
    return out;
  }
  
  export function buildSetCookie(
    name: string,
    value: string,
    opts: { maxAgeSec?: number } = {}
  ) {
    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      'Path=/',                // disponible para todo el sitio
      'HttpOnly',              // no accesible desde JS (más seguro)
      'SameSite=Lax',          // evita CSRF básico, y funciona en dev sin HTTPS
    ];
    if (opts.maxAgeSec) parts.push(`Max-Age=${opts.maxAgeSec}`);
    // En producción con HTTPS agrega: parts.push('Secure')
    return parts.join('; ');
  }
  
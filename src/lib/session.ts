import { randomUUID } from 'crypto';

const COOKIE = 'sessionId';
const DAYS = 60;

export function getOrSetSessionId(req: Request, headers: Headers) {
  const cookie = req.headers.get('cookie') ?? '';
  const found = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  if (found) return found.split('=')[1];

  const sid = randomUUID();
  const expires = new Date(Date.now() + DAYS*24*60*60*1000).toUTCString();
  headers.append('Set-Cookie', `${COOKIE}=${sid}; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`);
  return sid;
}



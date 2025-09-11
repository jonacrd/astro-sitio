// Utilidad para tener una sesión estable por cookie
import { nanoid } from "nanoid";
import type { APIContext } from "astro";

export function getOrCreateSessionId(ctx: APIContext) {
  let sid = ctx.cookies.get("sid")?.value;
  if (!sid) {
    sid = "s_" + nanoid(24);
    ctx.cookies.set("sid", sid, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true, // en Vercel = https
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
  }
  return sid;
}

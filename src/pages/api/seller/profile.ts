import type { APIRoute } from 'astro';
import { userRepo, sellerRepo } from '@lib/repos';
import { getUserId } from '@lib/session';

export const POST: APIRoute = async (ctx) => {
  const uid = getUserId(ctx);
  if(!uid) return new Response('Unauthorized', { status: 401 });

  const { storeName, firstName, lastName, addressLine1, addressLine2, comuna, ciudad, phoneContact } = await ctx.request.json();

  if(!storeName || !firstName || !lastName || !addressLine1 || !comuna || !ciudad || !phoneContact){
    return new Response('Bad Request', { status: 400 });
  }

  // Actualizar rol del usuario
  await userRepo.update(uid, { role: 'SELLER' });

  // Crear o actualizar seller
  const existingSeller = await sellerRepo.findByUserId(uid);
  if (existingSeller) {
    await sellerRepo.update(uid, { 
      storeName, firstName, lastName, addressLine1, addressLine2, comuna, ciudad, phoneContact 
    });
  } else {
    await sellerRepo.create({
      userId: uid,
      storeName, firstName, lastName, addressLine1, addressLine2, comuna, ciudad, phoneContact
    });
  }

  return new Response(JSON.stringify({ ok: true }), { headers:{'content-type':'application/json'} });
};

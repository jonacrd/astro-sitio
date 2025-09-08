import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db.js';
import { parseCookies } from '../../../lib/cookies';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { itemId } = await request.json();
    
    if (!itemId) {
      return new Response(JSON.stringify({ 
        error: 'itemId es requerido' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cookies = parseCookies(request);
    const cartId = cookies.cartId;

    if (!cartId) {
      return new Response(JSON.stringify({ 
        error: 'No hay carrito activo' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar el item del carrito
    const result = await prisma.cartItem.deleteMany({
      where: { 
        id: Number(itemId), 
        cartId: Number(cartId) 
      }
    });

    if (result.count === 0) {
      return new Response(JSON.stringify({ 
        error: 'Item no encontrado o ya eliminado' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al quitar item del carrito:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


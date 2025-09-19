import type { APIRoute } from "astro";
import { getSessionId, removeFromCart } from "@lib/cart.server";
import { calculateCartTotal } from "@lib/money";

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { productId } = body;

    if (!productId || typeof productId !== "number") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de producto requerido",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const sessionId = getSessionId(context);
    const cart = await removeFromCart(sessionId, productId);

    const totalCents = calculateCartTotal(
      cart.items.map((item) => ({
        quantity: item.quantity,
        priceCents: item.product.priceCents,
      })),
    );

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return new Response(
      JSON.stringify({
        success: true,
        cart,
        totalCents,
        itemCount,
        message: "Producto removido del carrito",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error removing from cart:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al remover del carrito",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};





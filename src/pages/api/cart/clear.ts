import type { APIRoute } from "astro";
import { getSessionId, clearCart } from "@lib/cart.server";

export const POST: APIRoute = async (context) => {
  try {
    const sessionId = getSessionId(context);
    await clearCart(sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Carrito vaciado",
        itemCount: 0,
        totalCents: 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error clearing cart:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al vaciar el carrito",
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













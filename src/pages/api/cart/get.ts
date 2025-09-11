import type { APIRoute } from "astro";
import { getCart, getSessionId } from "@lib/cart.server";

export const GET: APIRoute = async (context) => {
  try {
    const sessionId = getSessionId(context);
    const cartData = await getCart(sessionId);

    if (!cartData) {
      return new Response(
        JSON.stringify({
          success: true,
          items: [],
          totalCents: 0,
          itemCount: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const totalCents = cartData.items.reduce(
      (total, item) => total + item.quantity * item.product.priceCents,
      0,
    );
    const itemCount = cartData.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return new Response(
      JSON.stringify({
        success: true,
        items: cartData.items,
        totalCents,
        itemCount,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error getting cart:", error);

    return new Response(
      JSON.stringify({
        success: false,
        items: [],
        totalCents: 0,
        itemCount: 0,
        error: "Error al obtener el carrito",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

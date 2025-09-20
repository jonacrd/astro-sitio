import type { APIRoute } from "astro";
import { prisma } from "@lib/db";

interface CartItem {
  productId: number;
  qty: number;
}

interface PriceResponse {
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: Array<{
    productId: number;
    name: string;
    price: number;
    discount?: number;
    qty: number;
    subtotal: number;
  }>;
  breakdown: {
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Items del carrito requeridos",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validar estructura de items
    const validItems = items.every((item: any) => 
      typeof item.productId === 'number' && 
      typeof item.qty === 'number' && 
      item.qty > 0
    );

    if (!validItems) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Formato de items inválido. Cada item debe tener productId (number) y qty (number > 0)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Obtener productos con precios
    const productIds = items.map((item: CartItem) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        discountCents: true,
      },
    });

    if (products.length !== productIds.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Algunos productos no están disponibles",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Calcular precios
    let subtotalCents = 0;
    const itemDetails: PriceResponse['items'] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const discountCents = product.discountCents || 0;
      const finalPriceCents = Math.max(0, product.priceCents - discountCents);
      const itemSubtotalCents = finalPriceCents * item.qty;

      itemDetails.push({
        productId: product.id,
        name: product.name,
        price: Math.round(product.priceCents / 100),
        discount: discountCents > 0 ? Math.round(discountCents / 100) : undefined,
        qty: item.qty,
        subtotal: Math.round(itemSubtotalCents / 100),
      });

      subtotalCents += itemSubtotalCents;
    }

    // Calcular delivery fee (fijo por ahora)
    const deliveryFeeCents = subtotalCents >= 10000 ? 0 : 2000; // Gratis sobre $10.000
    
    const totalCents = subtotalCents + deliveryFeeCents;

    const response: PriceResponse = {
      subtotal: Math.round(subtotalCents / 100),
      deliveryFee: Math.round(deliveryFeeCents / 100),
      total: Math.round(totalCents / 100),
      items: itemDetails,
      breakdown: {
        subtotalCents,
        deliveryFeeCents,
        totalCents,
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error calculating order price:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al calcular precio del pedido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};


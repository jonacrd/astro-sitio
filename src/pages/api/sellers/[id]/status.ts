import type { APIRoute } from "astro";
import { prisma } from "@lib/db";

// GET /api/sellers/[id]/status - Obtener estado del vendedor
export const GET: APIRoute = async ({ params }) => {
  try {
    const sellerId = params.id;
    
    if (!sellerId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de vendedor requerido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        storeName: true,
        online: true,
        deliveryEnabled: true,
        deliveryETA: true,
        createdAt: true,
      },
    });

    if (!seller) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendedor no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        seller,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching seller status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener estado del vendedor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// POST /api/sellers/[id]/status - Toggle estado online del vendedor
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const sellerId = params.id;
    
    if (!sellerId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de vendedor requerido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const { online, deliveryEnabled, deliveryETA } = body;

    // Verificar que el vendedor existe
    const existingSeller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });

    if (!existingSeller) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendedor no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Actualizar estado
    const updateData: any = {};
    
    if (typeof online === 'boolean') {
      updateData.online = online;
    }
    
    if (typeof deliveryEnabled === 'boolean') {
      updateData.deliveryEnabled = deliveryEnabled;
    }
    
    if (deliveryETA !== undefined) {
      updateData.deliveryETA = deliveryETA;
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        storeName: true,
        online: true,
        deliveryEnabled: true,
        deliveryETA: true,
        createdAt: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        seller: updatedSeller,
        message: `Vendedor ${online ? 'activado' : 'desactivado'} exitosamente`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating seller status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al actualizar estado del vendedor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};


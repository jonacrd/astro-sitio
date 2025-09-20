import { randomUUID } from "crypto";
import type { APIContext } from "astro";
import { productRepo } from "./repos";
import type { Product } from "./repos";

// Simplificado: usar localStorage en el cliente para el carrito
export type CartItem = {
  productId: number;
  quantity: number;
  product: Product;
};

export type CartData = {
  items: CartItem[];
  totalCents: number;
  itemCount: number;
};

/**
 * Obtener o crear sessionId desde las cookies
 */
export function getSessionId(context: APIContext): string {
  let sessionId = context.cookies.get("sessionId")?.value;

  if (!sessionId) {
    sessionId = randomUUID();
    context.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
  }

  return sessionId;
}

/**
 * Obtener carrito simplificado (usando localStorage en cliente)
 */
export async function getCart(sessionId: string): Promise<CartData | null> {
  // Por ahora devolver carrito vacío - el carrito se maneja en el cliente
  return {
    items: [],
    totalCents: 0,
    itemCount: 0,
  };
}

/**
 * Agregar item al carrito (simplificado)
 */
export async function addToCart(
  sessionId: string,
  productId: number,
  quantity: number = 1,
): Promise<CartData> {
  // Verificar que el producto existe
  const product = await productRepo.findById(productId.toString());

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  // Por ahora devolver carrito vacío - el carrito se maneja en el cliente
  return {
    items: [],
    totalCents: 0,
    itemCount: 0,
  };
}

/**
 * Actualizar cantidad de item en el carrito (simplificado)
 */
export async function updateCartItem(
  sessionId: string,
  productId: number,
  quantity: number,
): Promise<CartData> {
  // Por ahora devolver carrito vacío - el carrito se maneja en el cliente
  return {
    items: [],
    totalCents: 0,
    itemCount: 0,
  };
}

/**
 * Remover item del carrito (simplificado)
 */
export async function removeFromCart(
  sessionId: string,
  productId: number,
): Promise<CartData> {
  // Por ahora devolver carrito vacío - el carrito se maneja en el cliente
  return {
    items: [],
    totalCents: 0,
    itemCount: 0,
  };
}

/**
 * Vaciar carrito (simplificado)
 */
export async function clearCart(sessionId: string): Promise<void> {
  // Por ahora no hacer nada - el carrito se maneja en el cliente
}

/**
 * Procesar checkout (simplificado)
 */
export async function checkout(
  sessionId: string,
  customerName?: string,
  customerEmail?: string,
): Promise<{ orderCode: string; totalCents: number }> {
  const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  return {
    orderCode,
    totalCents: 0,
  };
}

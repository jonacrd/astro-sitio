import { prisma } from "./db";
import { randomUUID } from "crypto";
import type { APIContext } from "astro";
import type { Cart, CartItem, Product } from "@prisma/client";

export type CartWithItems = Cart & {
  items: Array<
    CartItem & {
      product: Product;
    }
  >;
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
 * Obtener o crear carrito para la sesión
 */
export async function ensureCart(sessionId: string): Promise<Cart> {
  let cart = await prisma.cart.findUnique({
    where: { id: sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { id: sessionId },
    });
  }

  return cart;
}

/**
 * Obtener carrito con items
 */
export async function getCart(
  sessionId: string,
): Promise<CartWithItems | null> {
  return await prisma.cart.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Agregar item al carrito
 */
export async function addToCart(
  sessionId: string,
  productId: number,
  quantity: number = 1,
): Promise<CartWithItems> {
  // Verificar que el producto existe y tiene stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  if (product.stock < quantity) {
    throw new Error("Stock insuficiente");
  }

  // Asegurar que existe el carrito
  await ensureCart(sessionId);

  // Verificar si el item ya existe en el carrito
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: sessionId,
        productId,
      },
    },
  });

  if (existingItem) {
    // Actualizar cantidad existente
    const newQuantity = existingItem.quantity + quantity;

    if (product.stock < newQuantity) {
      throw new Error("Stock insuficiente");
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    // Crear nuevo item
    await prisma.cartItem.create({
      data: {
        cartId: sessionId,
        productId,
        quantity,
      },
    });
  }

  // Retornar carrito actualizado
  return (await getCart(sessionId)) as CartWithItems;
}

/**
 * Actualizar cantidad de item en el carrito
 */
export async function updateCartItem(
  sessionId: string,
  productId: number,
  quantity: number,
): Promise<CartWithItems> {
  if (quantity <= 0) {
    return await removeFromCart(sessionId, productId);
  }

  // Verificar stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  if (product.stock < quantity) {
    throw new Error("Stock insuficiente");
  }

  // Actualizar item
  await prisma.cartItem.updateMany({
    where: {
      cartId: sessionId,
      productId,
    },
    data: { quantity },
  });

  return (await getCart(sessionId)) as CartWithItems;
}

/**
 * Remover item del carrito
 */
export async function removeFromCart(
  sessionId: string,
  productId: number,
): Promise<CartWithItems> {
  await prisma.cartItem.deleteMany({
    where: {
      cartId: sessionId,
      productId,
    },
  });

  return (await getCart(sessionId)) as CartWithItems;
}

/**
 * Vaciar carrito
 */
export async function clearCart(sessionId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { cartId: sessionId },
  });
}

/**
 * Procesar checkout - crear orden y vaciar carrito
 */
export async function checkout(
  sessionId: string,
  customerName?: string,
  customerEmail?: string,
): Promise<{ orderCode: string; totalCents: number }> {
  const cart = await getCart(sessionId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Carrito vacío");
  }

  // Verificar stock de todos los productos
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${item.product.name}`);
    }
  }

  const totalCents = cart.items.reduce(
    (total, item) => total + item.quantity * item.product.priceCents,
    0,
  );

  const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // Usar transacción para crear orden y actualizar stock
  const order = await prisma.$transaction(async (tx) => {
    // Crear orden
    const newOrder = await tx.order.create({
      data: {
        orderCode,
        cartId: sessionId,
        totalCents,
        customerName,
        customerEmail,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            priceCents: item.product.priceCents,
            quantity: item.quantity,
          })),
        },
      },
    });

    // Actualizar stock de productos
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Vaciar carrito
    await tx.cartItem.deleteMany({
      where: { cartId: sessionId },
    });

    return newOrder;
  });

  return {
    orderCode: order.orderCode,
    totalCents: order.totalCents,
  };
}

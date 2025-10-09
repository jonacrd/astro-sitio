// src/lib/data-adapters.ts
// Adaptadores para mantener compatibilidad con UI existente

import type { Product, Category, Seller, SellerProduct } from "@prisma/client";

// Tipos extendidos para el nuevo sistema
export type ProductWithDetails = Product & {
  category: Category;
  sellers: (SellerProduct & {
    seller: Seller;
  })[];
};

// Tipo que espera la UI existente
export type UIProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number; // En pesos chilenos, no centavos
  priceCents: number; // Para compatibilidad
  discount?: number; // En pesos
  discountCents?: number; // Para compatibilidad
  stock: number;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  // Nuevos campos
  origin: string;
  rating: number;
  active: boolean;
  sellerOnline: boolean;
  deliveryETA?: string;
  effectivePrice: number; // Precio final con descuento
};

/**
 * Convierte un producto de la base de datos al formato que espera la UI
 */
export function mapProductToUI(product: ProductWithDetails): UIProduct {
  const discountCents = product.discountCents || 0;
  const effectivePriceCents = Math.max(0, product.priceCents - discountCents);
  
  // Verificar si algún vendedor está online
  const sellerOnline = product.sellers.some(sp => sp.seller.online);
  
  // Obtener ETA de entrega del primer vendedor online
  const onlineSeller = product.sellers.find(sp => sp.seller.online);
  const deliveryETA = onlineSeller?.seller.deliveryETA || undefined;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Math.round(product.priceCents / 100), // Convertir a pesos
    priceCents: product.priceCents,
    discount: discountCents > 0 ? Math.round(discountCents / 100) : undefined,
    discountCents: discountCents > 0 ? discountCents : undefined,
    stock: product.stock,
    imageUrl: product.imageUrl,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    origin: product.origin,
    rating: product.rating,
    active: product.active,
    sellerOnline,
    deliveryETA,
    effectivePrice: Math.round(effectivePriceCents / 100),
  };
}

/**
 * Convierte múltiples productos
 */
export function mapProductsToUI(products: ProductWithDetails[]): UIProduct[] {
  return products.map(mapProductToUI);
}

/**
 * Formatea precio para mostrar en UI
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Formatea precio con descuento
 */
export function formatPriceWithDiscount(priceCents: number, discountCents: number = 0): string {
  const finalPrice = Math.max(0, priceCents - discountCents);
  return formatPrice(finalPrice);
}

/**
 * Obtiene el badge de origen
 */
export function getOriginBadge(origin: string): string {
  switch (origin) {
    case 'chi':
      return '🇨🇱 Chileno';
    case 'ven':
      return '🇻🇪 Venezolano';
    default:
      return '🌍 Internacional';
  }
}

/**
 * Obtiene el color del badge de origen
 */
export function getOriginBadgeColor(origin: string): string {
  switch (origin) {
    case 'chi':
      return 'bg-blue-100 text-blue-800';
    case 'ven':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}












export function productUrl(productId: string, sellerId: string) {
  return `/producto/${encodeURIComponent(productId)}?seller=${encodeURIComponent(sellerId)}`;
}

export function addToCartUrl(sellerProductId: string, qty = 1) {
  return `/api/cart/add?sellerProductId=${encodeURIComponent(sellerProductId)}&qty=${qty}`;
}

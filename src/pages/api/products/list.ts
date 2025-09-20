import type { APIRoute } from "astro";

// Datos mock temporales mientras se configura la base de datos
const mockProducts = [
  {
    id: "mock-1",
    name: "Arepa Reina Pepiada",
    slug: "arepa-reina-pepiada",
    description: "Deliciosa arepa venezolana con pollo y aguacate",
    priceCents: 2500,
    discountCents: 300,
    stock: 15,
    imageUrl: "/img/placeholders/comida.jpg",
    category: {
      id: "cat-1",
      name: "Comida",
      slug: "comida"
    },
    origin: "ven",
    rating: 4.8,
    active: true,
    sellerOnline: true,
    deliveryETA: "30-40m",
    effectivePrice: 2200
  },
  {
    id: "mock-2", 
    name: "Completo Italiano",
    slug: "completo-italiano",
    description: "Clásico hot dog chileno con tomate, palta y mayonesa",
    priceCents: 1800,
    discountCents: 0,
    stock: 8,
    imageUrl: "/img/placeholders/comida.jpg",
    category: {
      id: "cat-1",
      name: "Comida", 
      slug: "comida"
    },
    origin: "chi",
    rating: 4.5,
    active: true,
    sellerOnline: true,
    deliveryETA: "25-35m",
    effectivePrice: 1800
  },
  {
    id: "mock-3",
    name: "Polera Básica",
    slug: "polera-basica", 
    description: "Polera de algodón suave y cómoda",
    priceCents: 5990,
    discountCents: 0,
    stock: 12,
    imageUrl: "/img/placeholders/ropa.jpg",
    category: {
      id: "cat-2",
      name: "Ropa",
      slug: "ropa"
    },
    origin: "chi",
    rating: 4.2,
    active: true,
    sellerOnline: true,
    deliveryETA: "2-3 días",
    effectivePrice: 5990
  },
  {
    id: "mock-4",
    name: "Smartphone XYZ",
    slug: "smartphone-xyz",
    description: "Último modelo de smartphone con cámara de alta resolución",
    priceCents: 80000,
    discountCents: 5000,
    stock: 5,
    imageUrl: "/img/placeholders/tecnologia.jpg",
    category: {
      id: "cat-3",
      name: "Tecnología",
      slug: "tecnologia"
    },
    origin: "ven",
    rating: 4.9,
    active: true,
    sellerOnline: false,
    deliveryETA: "1-2 días",
    effectivePrice: 75000
  },
  {
    id: "mock-5",
    name: "Juego de Sábanas",
    slug: "juego-de-sabanas",
    description: "Set de sábanas de algodón egipcio para cama king size",
    priceCents: 30000,
    discountCents: 0,
    stock: 20,
    imageUrl: "/img/placeholders/hogar.jpg",
    category: {
      id: "cat-4",
      name: "Hogar",
      slug: "hogar"
    },
    origin: "chi",
    rating: 4.7,
    active: true,
    sellerOnline: true,
    deliveryETA: "3-5 días",
    effectivePrice: 30000
  }
];

export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get("category");
    const origin = url.searchParams.get("origin"); // 'chi' | 'ven'
    const online = url.searchParams.get("online"); // 'true' | 'false'
    const q = url.searchParams.get("q"); // búsqueda
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Filtrar productos mock
    let filteredProducts = mockProducts;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category.slug === category);
    }

    if (origin) {
      filteredProducts = filteredProducts.filter(p => p.origin === origin);
    }

    if (online === "true") {
      filteredProducts = filteredProducts.filter(p => p.sellerOnline);
    }

    if (q) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase()) || 
        p.description?.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Aplicar límite
    const limitedProducts = filteredProducts.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        products: limitedProducts,
        total: filteredProducts.length,
        filters: { category, origin, online, q, limit },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al obtener productos",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
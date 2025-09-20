import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Ropa Hombre",
    slug: "ropa-hombre",
    products: [
      {
        name: "Camisa Polo Hombre",
        slug: "camisa-polo-hombre",
        description:
          "Camisa polo de algodón 100% para hombre, cómoda y elegante",
        priceCents: 29990,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop&auto=format",
      },
      {
        name: "Jeans Clásicos Hombre",
        slug: "jeans-clasicos-hombre",
        description: "Jeans de corte clásico en color azul, tela resistente",
        priceCents: 45990,
        stock: 18,
        imageUrl:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
      },
      {
        name: "Chaqueta Deportiva",
        slug: "chaqueta-deportiva-hombre",
        description:
          "Chaqueta deportiva con capucha, ideal para actividades al aire libre",
        priceCents: 69990,
        stock: 12,
        imageUrl:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
      },
      {
        name: "Zapatos Deportivos",
        slug: "zapatos-deportivos-hombre",
        description:
          "Zapatos deportivos cómodos para caminar y hacer ejercicio",
        priceCents: 89990,
        stock: 8,
        imageUrl:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      },
    ],
  },
  {
    name: "Ropa Mujer",
    slug: "ropa-mujer",
    products: [
      {
        name: "Vestido Casual",
        slug: "vestido-casual-mujer",
        description: "Vestido casual de verano, cómodo y elegante",
        priceCents: 34990,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop",
      },
      {
        name: "Blusa Elegante",
        slug: "blusa-elegante-mujer",
        description: "Blusa elegante para ocasiones especiales",
        priceCents: 25990,
        stock: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
      },
      {
        name: "Pantalón de Vestir",
        slug: "pantalon-vestir-mujer",
        description: "Pantalón de vestir elegante para oficina",
        priceCents: 39990,
        stock: 10,
        imageUrl:
          "https://images.unsplash.com/photo-1506629905607-1b8b4b4b4b4b?w=400&h=400&fit=crop",
      },
      {
        name: "Zapatos de Tacón",
        slug: "zapatos-tacon-mujer",
        description: "Zapatos de tacón elegantes para ocasiones especiales",
        priceCents: 79990,
        stock: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop",
      },
    ],
  },
  {
    name: "Tecnología",
    slug: "tecnologia",
    products: [
      {
        name: "Smartphone Samsung Galaxy",
        slug: "smartphone-samsung-galaxy",
        description: "Smartphone Samsung Galaxy con cámara de alta resolución",
        priceCents: 599990,
        stock: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      },
      {
        name: "Laptop HP Pavilion",
        slug: "laptop-hp-pavilion",
        description: "Laptop HP Pavilion con procesador Intel i5 y 8GB RAM",
        priceCents: 899990,
        stock: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      },
      {
        name: "Auriculares Bluetooth",
        slug: "auriculares-bluetooth",
        description: "Auriculares Bluetooth con cancelación de ruido",
        priceCents: 129990,
        stock: 12,
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      },
      {
        name: "Tablet iPad",
        slug: "tablet-ipad",
        description: "Tablet iPad con pantalla Retina de 10.2 pulgadas",
        priceCents: 399990,
        stock: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
      },
    ],
  },
  {
    name: "Accesorios",
    slug: "accesorios",
    products: [
      {
        name: "Reloj Inteligente",
        slug: "reloj-inteligente",
        description: "Reloj inteligente con monitor de frecuencia cardíaca",
        priceCents: 199990,
        stock: 8,
        imageUrl:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      },
      {
        name: "Mochila Deportiva",
        slug: "mochila-deportiva",
        description: "Mochila deportiva resistente al agua",
        priceCents: 59990,
        stock: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      },
      {
        name: "Gafas de Sol",
        slug: "gafas-sol",
        description: "Gafas de sol con protección UV 400",
        priceCents: 89990,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
      },
      {
        name: "Cinturón de Cuero",
        slug: "cinturon-cuero",
        description: "Cinturón de cuero genuino, elegante y duradero",
        priceCents: 39990,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      },
    ],
  },
  {
    name: "Hogar",
    slug: "hogar",
    products: [
      {
        name: "Aspiradora Robot",
        slug: "aspiradora-robot",
        description: "Aspiradora robot inteligente con programación",
        priceCents: 299990,
        stock: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop",
      },
      {
        name: "Cafetera Eléctrica",
        slug: "cafetera-electrica",
        description: "Cafetera eléctrica con molinillo integrado",
        priceCents: 149990,
        stock: 10,
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
      },
      {
        name: "Lámpara LED",
        slug: "lampara-led",
        description: "Lámpara LED con control de intensidad",
        priceCents: 49990,
        stock: 18,
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      },
      {
        name: "Set de Ollas",
        slug: "set-ollas",
        description: "Set de ollas de acero inoxidable, 5 piezas",
        priceCents: 199990,
        stock: 7,
        imageUrl:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      },
    ],
  },
  {
    name: "Deportes",
    slug: "deportes",
    products: [
      {
        name: "Pelota de Fútbol",
        slug: "pelota-futbol",
        description: "Pelota de fútbol oficial, tamaño 5",
        priceCents: 29990,
        stock: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop",
      },
      {
        name: "Raqueta de Tenis",
        slug: "raqueta-tenis",
        description: "Raqueta de tenis profesional, peso balanceado",
        priceCents: 89990,
        stock: 12,
        imageUrl:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
      },
      {
        name: "Bicicleta de Montaña",
        slug: "bicicleta-montana",
        description: "Bicicleta de montaña con 21 velocidades",
        priceCents: 599990,
        stock: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop",
      },
      {
        name: "Pesas Ajustables",
        slug: "pesas-ajustables",
        description: "Set de pesas ajustables de 2.5kg a 20kg",
        priceCents: 199990,
        stock: 8,
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log("🧹 Datos existentes eliminados");

  // Crear categorías y productos
  for (const categoryData of categories) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
      },
    });

    console.log(`📁 Categoría creada: ${category.name}`);

    for (const productData of categoryData.products) {
      await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          priceCents: productData.priceCents,
          stock: productData.stock,
          imageUrl: productData.imageUrl,
          categoryId: category.id,
        },
      });

      console.log(`  📦 Producto creado: ${productData.name}`);
    }
  }

  console.log("✅ Seed completado exitosamente!");
  console.log(`📊 Total de categorías: ${categories.length}`);
  console.log(
    `📦 Total de productos: ${categories.reduce((total, cat) => total + cat.products.length, 0)}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed: creando productos...');

  const products = [
    {
      slug: 'camisa-manga-larga-azul',
      name: 'Camisa Manga Larga Azul',
      description: 'Camisa de algodón 100% con corte clásico, perfecta para ocasiones formales y casuales.',
      priceCents: 25000,
      stock: 15,
      imageUrl: '/img/camisa-azul.jpg'
    },
    {
      slug: 'pantalon-jeans-negro',
      name: 'Pantalón Jeans Negro',
      description: 'Jeans de corte recto en color negro, confeccionados con mezclilla de alta calidad.',
      priceCents: 35000,
      stock: 8,
      imageUrl: '/img/jeans-negro.jpg'
    },
    {
      slug: 'zapatos-deportivos-blancos',
      name: 'Zapatos Deportivos Blancos',
      description: 'Zapatillas deportivas blancas con tecnología de amortiguación para máximo confort.',
      priceCents: 45000,
      stock: 12,
      imageUrl: '/img/zapatos-blancos.jpg'
    },
    {
      slug: 'vestido-floral-verano',
      name: 'Vestido Floral de Verano',
      description: 'Vestido ligero con estampado floral, ideal para días soleados y ocasiones especiales.',
      priceCents: 28000,
      stock: 6,
      imageUrl: '/img/vestido-floral.jpg'
    },
    {
      slug: 'chaqueta-denim-clasica',
      name: 'Chaqueta Denim Clásica',
      description: 'Chaqueta de mezclilla azul clásica, perfecta para completar cualquier look casual.',
      priceCents: 32000,
      stock: 10,
      imageUrl: '/img/chaqueta-denim.jpg'
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  console.log('✅ Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  console.log('🗑️ Datos anteriores eliminados')

  // Crear categorías
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Periféricos', slug: 'perifericos' },
      { name: 'Accesorios', slug: 'accesorios' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Audio', slug: 'audio' }
    ]
  })

  console.log('📂 Categorías creadas')

  // Obtener IDs de categorías
  const laptopsCategory = await prisma.category.findUnique({ where: { slug: 'laptops' } })
  const perifericosCategory = await prisma.category.findUnique({ where: { slug: 'perifericos' } })
  const accesoriosCategory = await prisma.category.findUnique({ where: { slug: 'accesorios' } })
  const gamingCategory = await prisma.category.findUnique({ where: { slug: 'gaming' } })
  const audioCategory = await prisma.category.findUnique({ where: { slug: 'audio' } })

  // Crear productos
  const products = [
    // Laptops
    {
      name: 'Laptop Gaming ASUS ROG Strix G15',
      slug: 'laptop-asus-rog-strix-g15',
      description: 'Laptop gaming con procesador AMD Ryzen 7 5800H, 16GB RAM, RTX 3060, 512GB SSD. Pantalla 15.6" 144Hz.',
      priceCents: 129999, // $1,299.99
      stock: 8,
      imageUrl: '/images/laptop-asus-rog.jpg',
      categoryId: laptopsCategory.id
    },
    {
      name: 'MacBook Air M2 13"',
      slug: 'macbook-air-m2-13',
      description: 'MacBook Air con chip M2, 8GB RAM unificada, SSD de 256GB. Pantalla Liquid Retina de 13.6".',
      priceCents: 119999, // $1,199.99
      stock: 5,
      imageUrl: '/images/macbook-air-m2.jpg',
      categoryId: laptopsCategory.id
    },
    {
      name: 'Dell XPS 13 Plus',
      slug: 'dell-xps-13-plus',
      description: 'Ultrabook premium con Intel Core i7-1260P, 16GB RAM, 512GB SSD. Pantalla 13.4" 3.5K OLED.',
      priceCents: 149999, // $1,499.99
      stock: 3,
      imageUrl: '/images/dell-xps-13.jpg',
      categoryId: laptopsCategory.id
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon',
      slug: 'lenovo-thinkpad-x1-carbon',
      description: 'Laptop empresarial con Intel Core i5-1135G7, 8GB RAM, 256GB SSD. Pantalla 14" FHD.',
      priceCents: 89999, // $899.99
      stock: 12,
      imageUrl: '/images/thinkpad-x1.jpg',
      categoryId: laptopsCategory.id
    },

    // Periféricos
    {
      name: 'Mouse Gaming Logitech G Pro X Superlight',
      slug: 'mouse-logitech-g-pro-x-superlight',
      description: 'Mouse gaming inalámbrico ultra liviano (63g), sensor HERO 25K, hasta 70 horas de batería.',
      priceCents: 14999, // $149.99
      stock: 25,
      imageUrl: '/images/mouse-logitech-gpro.jpg',
      categoryId: perifericosCategory.id
    },
    {
      name: 'Teclado Mecánico Keychron K3',
      slug: 'teclado-keychron-k3',
      description: 'Teclado mecánico inalámbrico 75%, switches Gateron Low Profile, retroiluminación RGB.',
      priceCents: 9999, // $99.99
      stock: 18,
      imageUrl: '/images/teclado-keychron-k3.jpg',
      categoryId: perifericosCategory.id
    },
    {
      name: 'Monitor LG 27" 4K UltraFine',
      slug: 'monitor-lg-27-4k-ultrafine',
      description: 'Monitor 4K IPS de 27", USB-C, DisplayPort, compatible con Mac y PC. Color profesional.',
      priceCents: 59999, // $599.99
      stock: 7,
      imageUrl: '/images/monitor-lg-27-4k.jpg',
      categoryId: perifericosCategory.id
    },
    {
      name: 'Webcam Logitech C920s HD Pro',
      slug: 'webcam-logitech-c920s',
      description: 'Webcam Full HD 1080p con micrófono dual, corrección automática de luz, obturador de privacidad.',
      priceCents: 7999, // $79.99
      stock: 30,
      imageUrl: '/images/webcam-logitech-c920s.jpg',
      categoryId: perifericosCategory.id
    },

    // Gaming
    {
      name: 'PlayStation 5 Console',
      slug: 'playstation-5-console',
      description: 'Consola PlayStation 5 con SSD ultra rápido, ray tracing, audio 3D y DualSense Controller.',
      priceCents: 49999, // $499.99
      stock: 2,
      imageUrl: '/images/playstation-5.jpg',
      categoryId: gamingCategory.id
    },
    {
      name: 'Xbox Series X',
      slug: 'xbox-series-x',
      description: 'Consola Xbox Series X con 4K nativo, 120fps, SSD de 1TB, compatibilidad con miles de juegos.',
      priceCents: 49999, // $499.99
      stock: 4,
      imageUrl: '/images/xbox-series-x.jpg',
      categoryId: gamingCategory.id
    },
    {
      name: 'Steam Deck 64GB',
      slug: 'steam-deck-64gb',
      description: 'Consola portátil Steam Deck con 64GB eMMC, pantalla 7" LCD, AMD APU personalizado.',
      priceCents: 39999, // $399.99
      stock: 6,
      imageUrl: '/images/steam-deck.jpg',
      categoryId: gamingCategory.id
    },

    // Audio
    {
      name: 'AirPods Pro (2da generación)',
      slug: 'airpods-pro-2da-generacion',
      description: 'Auriculares inalámbricos con cancelación activa de ruido, audio espacial, hasta 30h de batería.',
      priceCents: 24999, // $249.99
      stock: 15,
      imageUrl: '/images/airpods-pro-2.jpg',
      categoryId: audioCategory.id
    },
    {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'Auriculares over-ear con cancelación de ruido líder en la industria, 30h de batería.',
      priceCents: 39999, // $399.99
      stock: 10,
      imageUrl: '/images/sony-wh1000xm5.jpg',
      categoryId: audioCategory.id
    },
    {
      name: 'Marshall Acton III',
      slug: 'marshall-acton-iii',
      description: 'Altavoz Bluetooth con diseño icónico Marshall, sonido potente, conectividad inalámbrica.',
      priceCents: 27999, // $279.99
      stock: 8,
      imageUrl: '/images/marshall-acton-iii.jpg',
      categoryId: audioCategory.id
    },

    // Accesorios
    {
      name: 'Soporte para Laptop Adjustable',
      slug: 'soporte-laptop-adjustable',
      description: 'Soporte ergonómico ajustable para laptop, aluminio, compatible con laptops de 10-17".',
      priceCents: 4999, // $49.99
      stock: 22,
      imageUrl: '/images/soporte-laptop.jpg',
      categoryId: accesoriosCategory.id
    },
    {
      name: 'Hub USB-C 7 en 1',
      slug: 'hub-usb-c-7-en-1',
      description: 'Hub USB-C con HDMI 4K, USB 3.0, lector SD, USB-C PD, compatible con MacBook y laptops.',
      priceCents: 5999, // $59.99
      stock: 35,
      imageUrl: '/images/hub-usb-c.jpg',
      categoryId: accesoriosCategory.id
    },
    {
      name: 'Cargador Inalámbrico 15W',
      slug: 'cargador-inalambrico-15w',
      description: 'Cargador inalámbrico rápido 15W, compatible con iPhone, Samsung, Google Pixel.',
      priceCents: 2999, // $29.99
      stock: 40,
      imageUrl: '/images/cargador-inalambrico.jpg',
      categoryId: accesoriosCategory.id
    },
    {
      name: 'Mochila para Laptop 15.6"',
      slug: 'mochila-laptop-15-6',
      description: 'Mochila resistente al agua con compartimento acolchado para laptop, múltiples bolsillos.',
      priceCents: 3999, // $39.99
      stock: 28,
      imageUrl: '/images/mochila-laptop.jpg',
      categoryId: accesoriosCategory.id
    }
  ]

  // Insertar productos
  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log('💻 Productos creados')

  // Crear algunas órdenes de ejemplo (opcional)
  const exampleOrder = await prisma.order.create({
    data: {
      orderCode: 'ORD-DEMO-001',
      cartId: 'demo-cart-123',
      totalCents: 17998, // $179.98
      customerName: 'Juan Pérez',
      customerEmail: 'juan@ejemplo.com',
      items: {
        create: [
          {
            productId: (await prisma.product.findUnique({ where: { slug: 'mouse-logitech-g-pro-x-superlight' } })).id,
            name: 'Mouse Gaming Logitech G Pro X Superlight',
            priceCents: 14999,
            quantity: 1
          },
          {
            productId: (await prisma.product.findUnique({ where: { slug: 'cargador-inalambrico-15w' } })).id,
            name: 'Cargador Inalámbrico 15W',
            priceCents: 2999,
            quantity: 1
          }
        ]
      }
    }
  })

  console.log('📦 Orden de ejemplo creada')

  const productCount = await prisma.product.count()
  const categoryCount = await prisma.category.count()

  console.log('✅ Seed completado!')
  console.log(`📊 Resumen:`)
  console.log(`   - ${categoryCount} categorías creadas`)
  console.log(`   - ${productCount} productos creados`)
  console.log(`   - 1 orden de ejemplo creada`)
  console.log('')
  console.log('🚀 Base de datos lista para usar!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
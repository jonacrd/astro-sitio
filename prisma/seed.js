// prisma/seed.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpieza
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  console.log('🗑️ Datos anteriores eliminados')

  // Categorías
  await prisma.category.createMany({
    data: [
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Periféricos', slug: 'perifericos' },
      { name: 'Accesorios', slug: 'accesorios' },
    ],
  })
  const cats = await prisma.category.findMany()
  const cid = (slug) => cats.find(c => c.slug === slug).id
  console.log('📂 Categorías creadas')

  // Productos
  await prisma.product.createMany({
    data: [
      {
        name: 'Laptop Ryzen 7 7840U',
        slug: 'laptop-ryzen-7-7840u',
        description: '14", 32GB RAM, 1TB NVMe, ideal dev',
        priceCents: 129999,
        stock: 8,
        imageUrl: '/images/laptop-ryzen7.jpg',
        categoryId: cid('laptops'),
      },
      {
        name: 'Mouse Inalámbrico',
        slug: 'mouse-inalambrico',
        description: '1000 DPI, batería larga',
        priceCents: 1999,
        stock: 40,
        imageUrl: '/images/mouse.jpg',
        categoryId: cid('perifericos'),
      },
      {
        name: 'Teclado Mecánico 60%',
        slug: 'teclado-mecanico-60',
        description: 'Switches rojos, compacto',
        priceCents: 4999,
        stock: 25,
        imageUrl: '/images/teclado.jpg',
        categoryId: cid('perifericos'),
      },
    ],
  })
  console.log('💻 Productos creados')

  // (Opcional) Crear una orden de ejemplo SOLO con campos existentes
  // const order = await prisma.order.create({
  //   data: {
  //     orderCode: 'ORD-SEED',
  //     cartId: 'seed-cart',
  //     totalCents: 129999,
  //     items: {
  //       create: [
  //         {
  //           productId: (await prisma.product.findFirst({ where: { slug: 'laptop-ryzen-7-7840u' } })).id,
  //           name: 'Laptop Ryzen 7 7840U',
  //           priceCents: 129999,
  //           quantity: 1,
  //         },
  //       ],
  //     },
  //   },
  // })
  // console.log('🧾 Orden demo creada:', order.orderCode)
}

run()
  .then(() => console.log('✅ Seed completado'))
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

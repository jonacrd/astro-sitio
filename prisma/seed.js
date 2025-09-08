// prisma/seed.js  (ESM porque tienes "type":"module")
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('> Seed: creando categorías...');
  const shirts = await prisma.category.upsert({
    where: { slug: 'camisas' },
    update: {},
    create: { name: 'Camisas', slug: 'camisas' }
  });
  const pants = await prisma.category.upsert({
    where: { slug: 'pantalones' },
    update: {},
    create: { name: 'Pantalones', slug: 'pantalones' }
  });
  const sneakers = await prisma.category.upsert({
    where: { slug: 'zapatillas' },
    update: {},
    create: { name: 'Zapatillas', slug: 'zapatillas' }
  });
  const dresses = await prisma.category.upsert({
    where: { slug: 'vestidos' },
    update: {},
    create: { name: 'Vestidos', slug: 'vestidos' }
  });
  const accessories = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { name: 'Accesorios', slug: 'accesorios' }
  });
  const jackets = await prisma.category.upsert({
    where: { slug: 'chaquetas' },
    update: {},
    create: { name: 'Chaquetas', slug: 'chaquetas' }
  });
  const shoes = await prisma.category.upsert({
    where: { slug: 'zapatos' },
    update: {},
    create: { name: 'Zapatos', slug: 'zapatos' }
  });

  console.log('> Seed: creando proveedores...');
  const sup1 = await prisma.supplier.upsert({
    where: { name: 'Andes Fashion' },
    update: {},
    create: {
      name: 'Andes Fashion',
      contactEmail: 'ventas@andesfashion.com',
      phone: '+56 9 1234 5678',
      rating: 5,
      leadTimeDays: 7,
      paymentTerms: 'Net 15',
      notes: 'Entrega rápida y buena calidad'
    }
  });
  const sup2 = await prisma.supplier.upsert({
    where: { name: 'Pacífico Textil' },
    update: {},
    create: {
      name: 'Pacífico Textil',
      contactEmail: 'contacto@pacificotextil.cl',
      phone: '+56 2 2345 6789',
      rating: 4,
      leadTimeDays: 12,
      paymentTerms: 'Net 30'
    }
  });
  const sup3 = await prisma.supplier.upsert({
    where: { name: 'Altiplano Shoes' },
    update: {},
    create: {
      name: 'Altiplano Shoes',
      contactEmail: 'soporte@altipshoes.com',
      rating: 4,
      leadTimeDays: 10,
      paymentTerms: 'Contado'
    }
  });
  const sup4 = await prisma.supplier.upsert({
    where: { name: 'Moda Latina' },
    update: {},
    create: {
      name: 'Moda Latina',
      contactEmail: 'ventas@modalatina.cl',
      phone: '+56 2 3456 7890',
      rating: 5,
      leadTimeDays: 5,
      paymentTerms: 'Net 7',
      notes: 'Especialistas en ropa femenina'
    }
  });
  const sup5 = await prisma.supplier.upsert({
    where: { name: 'Kids World' },
    update: {},
    create: {
      name: 'Kids World',
      contactEmail: 'info@kidsworld.cl',
      phone: '+56 9 8765 4321',
      rating: 4,
      leadTimeDays: 14,
      paymentTerms: 'Net 21',
      notes: 'Ropa infantil de alta calidad'
    }
  });
  const sup6 = await prisma.supplier.upsert({
    where: { name: 'Accesorios Premium' },
    update: {},
    create: {
      name: 'Accesorios Premium',
      contactEmail: 'contacto@accesoriospremium.cl',
      phone: '+56 2 4567 8901',
      rating: 5,
      leadTimeDays: 3,
      paymentTerms: 'Contado',
      notes: 'Accesorios de lujo y moda'
    }
  });

  console.log('> Seed: helper createProduct...');
  async function createProduct({ name, categoryId, gender, imageUrl, variants }) {
    const product = await prisma.product.create({
      data: { name, categoryId, gender, imageUrl }
    });
    for (const v of variants) {
      const variant = await prisma.variant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          size: v.size,           // 'S' | 'M' | ...
          colorName: v.colorName, // 'Rojo'
          colorHex: v.colorHex,   // '#ff0000'
          salePriceCents: v.salePriceCents
        }
      });
      await prisma.inventory.create({
        data: { variantId: variant.id, stock: v.stock ?? 0 }
      });
    }
    return product;
  }

  console.log('> Seed: creando productos y variantes...');
  
  // PRODUCTOS PARA HOMBRES
  const camisaOxford = await createProduct({
    name: 'Camisa Oxford Clásica',
    categoryId: shirts.id,
    gender: 'MEN',
    imageUrl: '/img/ropa-caballero.png',
    variants: [
      { sku: 'SH-OX-001-BLU-S', size: 'S',  colorName: 'Azul Marino', colorHex: '#1e3a8a', salePriceCents: 24990, stock: 8 },
      { sku: 'SH-OX-001-BLU-M', size: 'M',  colorName: 'Azul Marino', colorHex: '#1e3a8a', salePriceCents: 24990, stock: 15 },
      { sku: 'SH-OX-001-BLU-L', size: 'L',  colorName: 'Azul Marino', colorHex: '#1e3a8a', salePriceCents: 24990, stock: 12 },
      { sku: 'SH-OX-001-BLU-XL', size: 'XL', colorName: 'Azul Marino', colorHex: '#1e3a8a', salePriceCents: 24990, stock: 6 },
      { sku: 'SH-OX-001-WHT-M', size: 'M',  colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 24990, stock: 0 }, // AGOTADO
      { sku: 'SH-OX-001-WHT-L', size: 'L',  colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 24990, stock: 3 },
      { sku: 'SH-OX-001-GRY-M', size: 'M',  colorName: 'Gris', colorHex: '#6b7280', salePriceCents: 24990, stock: 7 }
    ]
  });

  const pantalonChino = await createProduct({
    name: 'Pantalón Chino Hombre',
    categoryId: pants.id,
    gender: 'MEN',
    imageUrl: '/img/ropa-caballero.png',
    variants: [
      { sku: 'PA-CH-002-KHA-S', size: 'S', colorName: 'Caqui', colorHex: '#8b7355', salePriceCents: 29990, stock: 5 },
      { sku: 'PA-CH-002-KHA-M', size: 'M', colorName: 'Caqui', colorHex: '#8b7355', salePriceCents: 29990, stock: 18 },
      { sku: 'PA-CH-002-KHA-L', size: 'L', colorName: 'Caqui', colorHex: '#8b7355', salePriceCents: 29990, stock: 14 },
      { sku: 'PA-CH-002-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 29990, stock: 0 }, // AGOTADO
      { sku: 'PA-CH-002-BLK-L', size: 'L', colorName: 'Negro', colorHex: '#111111', salePriceCents: 29990, stock: 9 }
    ]
  });

  const chaquetaDenim = await createProduct({
    name: 'Chaqueta Denim Clásica',
    categoryId: jackets.id,
    gender: 'MEN',
    imageUrl: '/img/ropa-caballero.png',
    variants: [
      { sku: 'CH-DN-003-BLU-M', size: 'M', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 39990, stock: 6 },
      { sku: 'CH-DN-003-BLU-L', size: 'L', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 39990, stock: 11 },
      { sku: 'CH-DN-003-BLU-XL', size: 'XL', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 39990, stock: 4 }
    ]
  });

  // PRODUCTOS PARA MUJERES
  const vestidoElegante = await createProduct({
    name: 'Vestido Elegante Mujer',
    categoryId: dresses.id,
    gender: 'WOMEN',
    imageUrl: '/img/ropa-mujer.png',
    variants: [
      { sku: 'VS-EL-004-BLK-S', size: 'S', colorName: 'Negro', colorHex: '#111111', salePriceCents: 34990, stock: 0 }, // AGOTADO
      { sku: 'VS-EL-004-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 34990, stock: 8 },
      { sku: 'VS-EL-004-BLK-L', size: 'L', colorName: 'Negro', colorHex: '#111111', salePriceCents: 34990, stock: 5 },
      { sku: 'VS-EL-004-RED-M', size: 'M', colorName: 'Rojo', colorHex: '#dc2626', salePriceCents: 34990, stock: 12 },
      { sku: 'VS-EL-004-RED-L', size: 'L', colorName: 'Rojo', colorHex: '#dc2626', salePriceCents: 34990, stock: 7 }
    ]
  });

  const pantalonMujer = await createProduct({
    name: 'Pantalón Skinny Mujer',
    categoryId: pants.id,
    gender: 'WOMEN',
    imageUrl: '/img/ropa-mujer.png',
    variants: [
      { sku: 'PA-SK-005-BLU-S', size: 'S', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 27990, stock: 9 },
      { sku: 'PA-SK-005-BLU-M', size: 'M', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 27990, stock: 16 },
      { sku: 'PA-SK-005-BLU-L', size: 'L', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 27990, stock: 11 },
      { sku: 'PA-SK-005-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 27990, stock: 13 }
    ]
  });

  const blusaFemenina = await createProduct({
    name: 'Blusa Femenina Casual',
    categoryId: shirts.id,
    gender: 'WOMEN',
    imageUrl: '/img/ropa-mujer.png',
    variants: [
      { sku: 'BL-CS-006-WHT-S', size: 'S', colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 19990, stock: 0 }, // AGOTADO
      { sku: 'BL-CS-006-WHT-M', size: 'M', colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 19990, stock: 6 },
      { sku: 'BL-CS-006-PNK-M', size: 'M', colorName: 'Rosa', colorHex: '#ec4899', salePriceCents: 19990, stock: 14 },
      { sku: 'BL-CS-006-PNK-L', size: 'L', colorName: 'Rosa', colorHex: '#ec4899', salePriceCents: 19990, stock: 8 }
    ]
  });

  // PRODUCTOS PARA NIÑOS
  const zapatillaNino = await createProduct({
    name: 'Zapatilla Running Niño',
    categoryId: sneakers.id,
    gender: 'KIDS_BOY',
    imageUrl: '/img/header-ninos.png',
    variants: [
      { sku: 'SN-RN-007-RED-XS', size: 'XS', colorName: 'Rojo', colorHex: '#ef4444', salePriceCents: 19990, stock: 0 }, // AGOTADO
      { sku: 'SN-RN-007-RED-S', size: 'S', colorName: 'Rojo', colorHex: '#ef4444', salePriceCents: 19990, stock: 4 },
      { sku: 'SN-RN-007-BLU-S', size: 'S', colorName: 'Azul', colorHex: '#3b82f6', salePriceCents: 19990, stock: 7 },
      { sku: 'SN-RN-007-BLU-M', size: 'M', colorName: 'Azul', colorHex: '#3b82f6', salePriceCents: 19990, stock: 5 }
    ]
  });

  const vestidoNina = await createProduct({
    name: 'Vestido Princesa Niña',
    categoryId: dresses.id,
    gender: 'KIDS_GIRL',
    imageUrl: '/img/ropa-nina.png',
    variants: [
      { sku: 'VS-PR-008-PNK-XS', size: 'XS', colorName: 'Rosa', colorHex: '#f472b6', salePriceCents: 22990, stock: 3 },
      { sku: 'VS-PR-008-PNK-S', size: 'S', colorName: 'Rosa', colorHex: '#f472b6', salePriceCents: 22990, stock: 8 },
      { sku: 'VS-PR-008-PNK-M', size: 'M', colorName: 'Rosa', colorHex: '#f472b6', salePriceCents: 22990, stock: 6 },
      { sku: 'VS-PR-008-PUR-S', size: 'S', colorName: 'Morado', colorHex: '#a855f7', salePriceCents: 22990, stock: 0 } // AGOTADO
    ]
  });

  const pantalonNino = await createProduct({
    name: 'Pantalón Deportivo Niño',
    categoryId: pants.id,
    gender: 'KIDS_BOY',
    imageUrl: '/img/ropa-nino.png',
    variants: [
      { sku: 'PA-DP-009-BLU-XS', size: 'XS', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 17990, stock: 5 },
      { sku: 'PA-DP-009-BLU-S', size: 'S', colorName: 'Azul', colorHex: '#1e40af', salePriceCents: 17990, stock: 12 },
      { sku: 'PA-DP-009-GRY-S', size: 'S', colorName: 'Gris', colorHex: '#6b7280', salePriceCents: 17990, stock: 8 }
    ]
  });

  // ACCESORIOS
  const relojElegante = await createProduct({
    name: 'Reloj Elegante Unisex',
    categoryId: accessories.id,
    gender: 'UNISEX',
    imageUrl: '/img/reloj-acesorio.png',
    variants: [
      { sku: 'RL-EL-010-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 49990, stock: 2 },
      { sku: 'RL-EL-010-SLV-M', size: 'M', colorName: 'Plateado', colorHex: '#9ca3af', salePriceCents: 49990, stock: 0 }, // AGOTADO
      { sku: 'RL-EL-010-GLD-M', size: 'M', colorName: 'Dorado', colorHex: '#fbbf24', salePriceCents: 49990, stock: 1 }
    ]
  });

  const bolsoMujer = await createProduct({
    name: 'Bolso Elegante Mujer',
    categoryId: accessories.id,
    gender: 'WOMEN',
    imageUrl: '/img/acesorios-dama.png',
    variants: [
      { sku: 'BG-EL-011-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 39990, stock: 4 },
      { sku: 'BG-EL-011-BRN-M', size: 'M', colorName: 'Café', colorHex: '#8b4513', salePriceCents: 39990, stock: 0 }, // AGOTADO
      { sku: 'BG-EL-011-TAN-M', size: 'M', colorName: 'Beige', colorHex: '#d2b48c', salePriceCents: 39990, stock: 6 }
    ]
  });

  // ZAPATOS
  const zapatoHombre = await createProduct({
    name: 'Zapato Formal Hombre',
    categoryId: shoes.id,
    gender: 'MEN',
    imageUrl: '/img/zapatillas-marron.png',
    variants: [
      { sku: 'ZP-FM-012-BLK-S', size: 'S', colorName: 'Negro', colorHex: '#111111', salePriceCents: 59990, stock: 3 },
      { sku: 'ZP-FM-012-BLK-M', size: 'M', colorName: 'Negro', colorHex: '#111111', salePriceCents: 59990, stock: 7 },
      { sku: 'ZP-FM-012-BLK-L', size: 'L', colorName: 'Negro', colorHex: '#111111', salePriceCents: 59990, stock: 5 },
      { sku: 'ZP-FM-012-BRN-M', size: 'M', colorName: 'Café', colorHex: '#8b4513', salePriceCents: 59990, stock: 0 } // AGOTADO
    ]
  });

  const zapatillaMujer = await createProduct({
    name: 'Zapatilla Deportiva Mujer',
    categoryId: sneakers.id,
    gender: 'WOMEN',
    imageUrl: '/img/zapatillas-mujer.png',
    variants: [
      { sku: 'SN-DP-013-WHT-S', size: 'S', colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 34990, stock: 0 }, // AGOTADO
      { sku: 'SN-DP-013-WHT-M', size: 'M', colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 34990, stock: 8 },
      { sku: 'SN-DP-013-WHT-L', size: 'L', colorName: 'Blanco', colorHex: '#ffffff', salePriceCents: 34990, stock: 6 },
      { sku: 'SN-DP-013-PNK-M', size: 'M', colorName: 'Rosa', colorHex: '#ec4899', salePriceCents: 34990, stock: 12 }
    ]
  });

  console.log('> Seed: precios de compra por proveedor...');
  await prisma.productSupplier.createMany({
    data: [
      // Camisas
      { productId: camisaOxford.id, supplierId: sup1.id, purchasePriceCents: 12990, preferred: true },
      { productId: camisaOxford.id, supplierId: sup2.id, purchasePriceCents: 13990, preferred: false },
      { productId: blusaFemenina.id, supplierId: sup4.id, purchasePriceCents: 9990, preferred: true },
      
      // Pantalones
      { productId: pantalonChino.id, supplierId: sup1.id, purchasePriceCents: 15990, preferred: true },
      { productId: pantalonMujer.id, supplierId: sup4.id, purchasePriceCents: 13990, preferred: true },
      { productId: pantalonNino.id, supplierId: sup5.id, purchasePriceCents: 8990, preferred: true },
      
      // Vestidos
      { productId: vestidoElegante.id, supplierId: sup4.id, purchasePriceCents: 17990, preferred: true },
      { productId: vestidoNina.id, supplierId: sup5.id, purchasePriceCents: 11490, preferred: true },
      
      // Chaquetas
      { productId: chaquetaDenim.id, supplierId: sup1.id, purchasePriceCents: 19990, preferred: true },
      
      // Zapatillas
      { productId: zapatillaNino.id, supplierId: sup3.id, purchasePriceCents: 9990, preferred: true },
      { productId: zapatillaMujer.id, supplierId: sup3.id, purchasePriceCents: 17490, preferred: true },
      
      // Zapatos
      { productId: zapatoHombre.id, supplierId: sup3.id, purchasePriceCents: 29990, preferred: true },
      
      // Accesorios
      { productId: relojElegante.id, supplierId: sup6.id, purchasePriceCents: 24990, preferred: true },
      { productId: bolsoMujer.id, supplierId: sup6.id, purchasePriceCents: 19990, preferred: true },
    ]
  });

  console.log('> Seed: clientes...');
  await prisma.customer.createMany({
    data: [
      { type: 'RETAIL', name: 'María González', email: 'maria.gonzalez@email.com', phone: '+56 9 1111 2222' },
      { type: 'RETAIL', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', phone: '+56 9 3333 4444' },
      { type: 'RETAIL', name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+56 9 5555 6666' },
      { type: 'WHOLESALE', name: 'Comercial Los Andes', email: 'compras@losandes.cl', phone: '+56 2 7777 8888', companyName: 'Los Andes SpA', taxId: '76.123.456-7' },
      { type: 'WHOLESALE', name: 'Distribuidora Central', email: 'ventas@distcentral.cl', phone: '+56 2 9999 0000', companyName: 'Distribuidora Central Ltda', taxId: '76.987.654-3' },
      { type: 'RETAIL', name: 'Pedro Silva', email: 'pedro.silva@email.com', phone: '+56 9 1234 5678' }
    ]
  });

  console.log('> Seed: reglas de precio y direcciones...');
  await prisma.priceRule.createMany({
    data: [
      {
        appliesTo: 'GLOBAL',
        customerType: 'WHOLESALE',
        percentOff: 15,
        active: true,
        note: 'Descuento mayorista global'
      },
      {
        appliesTo: 'GLOBAL',
        customerType: 'RETAIL',
        percentOff: 5,
        active: true,
        note: 'Descuento minorista por compras mayores a $100.000'
      }
    ]
  });

  // Crear direcciones para algunos clientes
  const maria = await prisma.customer.findFirst({ where: { name: 'María González' } });
  if (maria) {
    await prisma.address.create({
      data: {
        customerId: maria.id,
        line1: 'Av. Providencia 1234',
        line2: 'Depto 45',
        city: 'Santiago',
        state: 'Región Metropolitana',
        postalCode: '7500000',
        isDefault: true
      }
    });
  }

  const carlos = await prisma.customer.findFirst({ where: { name: 'Carlos Rodríguez' } });
  if (carlos) {
    await prisma.address.create({
      data: {
        customerId: carlos.id,
        line1: 'Calle Las Flores 567',
        city: 'Valparaíso',
        state: 'Región de Valparaíso',
        postalCode: '2340000',
        isDefault: true
      }
    });
  }

  const comercial = await prisma.customer.findFirst({ where: { name: 'Comercial Los Andes' } });
  if (comercial) {
    await prisma.address.create({
      data: {
        customerId: comercial.id,
        line1: 'Av. Industrial 890',
        line2: 'Bodega 12',
        city: 'Santiago',
        state: 'Región Metropolitana',
        postalCode: '7500000',
        isDefault: true
      }
    });
  }

  console.log('Seed listo ✅ - Base de datos realista creada con stock variado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

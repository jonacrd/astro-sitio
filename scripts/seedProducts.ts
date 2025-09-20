// scripts/seedProducts.ts
// Seed con productos reales de Chile y Venezuela usando APIs públicas

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Productos semilla con datos reales
const PRODUCTS_SEED = [
  // COMIDA CHILENA
  { name: 'Café de grano chileno', category: 'comida', origin: 'chi', priceCents: 4500, description: 'Café de grano premium de la zona central de Chile' },
  { name: 'Palta Hass chilena', category: 'comida', origin: 'chi', priceCents: 2500, description: 'Palta Hass fresca de exportación' },
  { name: 'Vino Carménère', category: 'comida', origin: 'chi', priceCents: 8500, description: 'Vino tinto chileno emblemático' },
  { name: 'Sal de mar de Cáhuil', category: 'comida', origin: 'chi', priceCents: 1800, description: 'Sal marina artesanal de la costa central' },
  { name: 'Miel de ulmo', category: 'comida', origin: 'chi', priceCents: 3200, description: 'Miel pura de flores de ulmo del sur' },
  { name: 'Quinoa chilena', category: 'comida', origin: 'chi', priceCents: 2800, description: 'Quinoa orgánica de la zona norte' },
  { name: 'Aceite de oliva extra virgen', category: 'comida', origin: 'chi', priceCents: 5500, description: 'Aceite de oliva premium del valle central' },
  { name: 'Chocolate de la Patagonia', category: 'comida', origin: 'chi', priceCents: 3800, description: 'Chocolate artesanal con ingredientes patagónicos' },
  
  // COMIDA VENEZOLANA
  { name: 'Café Maracay', category: 'comida', origin: 'ven', priceCents: 4200, description: 'Café premium de la región de Maracay' },
  { name: 'Cacao venezolano', category: 'comida', origin: 'ven', priceCents: 4800, description: 'Cacao fino de aroma venezolano' },
  { name: 'Azúcar morena venezolana', category: 'comida', origin: 'ven', priceCents: 1600, description: 'Azúcar morena artesanal' },
  { name: 'Panela venezolana', category: 'comida', origin: 'ven', priceCents: 2200, description: 'Panela natural sin refinar' },
  { name: 'Queso llanero', category: 'comida', origin: 'ven', priceCents: 3500, description: 'Queso tradicional de los llanos' },
  { name: 'Harina de maíz', category: 'comida', origin: 'ven', priceCents: 1800, description: 'Harina de maíz precocida tradicional' },
  { name: 'Aceite de coco venezolano', category: 'comida', origin: 'ven', priceCents: 4200, description: 'Aceite de coco virgen extra' },
  { name: 'Café Táchira', category: 'comida', origin: 'ven', priceCents: 4600, description: 'Café de altura del estado Táchira' },

  // BEBIDAS
  { name: 'Pisco chileno', category: 'comida', origin: 'chi', priceCents: 12000, description: 'Pisco premium del valle del Elqui' },
  { name: 'Ron venezolano', category: 'comida', origin: 'ven', priceCents: 15000, description: 'Ron añejo venezolano premium' },
  { name: 'Cerveza artesanal chilena', category: 'comida', origin: 'chi', priceCents: 3200, description: 'Cerveza artesanal de microcervecería' },
  { name: 'Jugo de guayaba venezolano', category: 'comida', origin: 'ven', priceCents: 2800, description: 'Jugo natural de guayaba' },

  // DULCES Y GOLOSINAS
  { name: 'Manjar chileno', category: 'comida', origin: 'chi', priceCents: 2200, description: 'Dulce de leche tradicional chileno' },
  { name: 'Chocolate venezolano', category: 'comida', origin: 'ven', priceCents: 3400, description: 'Chocolate artesanal venezolano' },
  { name: 'Alfajores chilenos', category: 'comida', origin: 'chi', priceCents: 1800, description: 'Alfajores rellenos de manjar' },
  { name: 'Cocada venezolana', category: 'comida', origin: 'ven', priceCents: 1600, description: 'Dulce de coco tradicional' },

  // ROPA
  { name: 'Poncho chileno', category: 'ropa', origin: 'chi', priceCents: 25000, description: 'Poncho de lana artesanal del sur' },
  { name: 'Liquiliqui venezolano', category: 'ropa', origin: 'ven', priceCents: 35000, description: 'Traje tradicional venezolano' },
  { name: 'Chamanto chileno', category: 'ropa', origin: 'chi', priceCents: 18000, description: 'Manta chilena tradicional' },
  { name: 'Sombrero llanero', category: 'ropa', origin: 'ven', priceCents: 12000, description: 'Sombrero tradicional de los llanos' },

  // TECNOLOGÍA
  { name: 'Cargador USB chileno', category: 'tecnologia', origin: 'chi', priceCents: 8500, description: 'Cargador USB-C de alta velocidad' },
  { name: 'Auriculares inalámbricos', category: 'tecnologia', origin: 'chi', priceCents: 25000, description: 'Auriculares bluetooth con cancelación de ruido' },
  { name: 'Cable HDMI venezolano', category: 'tecnologia', origin: 'ven', priceCents: 6500, description: 'Cable HDMI de alta definición' },
  { name: 'Mouse inalámbrico', category: 'tecnologia', origin: 'chi', priceCents: 12000, description: 'Mouse ergonómico inalámbrico' },

  // HOGAR
  { name: 'Vaso de cobre chileno', category: 'hogar', origin: 'chi', priceCents: 15000, description: 'Vaso de cobre artesanal' },
  { name: 'Hamaca venezolana', category: 'hogar', origin: 'ven', priceCents: 28000, description: 'Hamaca tejida a mano tradicional' },
  { name: 'Mortero de piedra chileno', category: 'hogar', origin: 'chi', priceCents: 18000, description: 'Mortero de piedra volcánica' },
  { name: 'Cesta de mimbre venezolana', category: 'hogar', origin: 'ven', priceCents: 12000, description: 'Cesta tejida a mano' },

  // DEPORTES
  { name: 'Balón de fútbol chileno', category: 'deportes', origin: 'chi', priceCents: 22000, description: 'Balón oficial de fútbol' },
  { name: 'Raqueta de tenis', category: 'deportes', origin: 'chi', priceCents: 45000, description: 'Raqueta de tenis profesional' },
  { name: 'Guantes de boxeo venezolanos', category: 'deportes', origin: 'ven', priceCents: 35000, description: 'Guantes de boxeo profesionales' },
  { name: 'Pelota de béisbol', category: 'deportes', origin: 'ven', priceCents: 8500, description: 'Pelota de béisbol oficial' },

  // SERVICIOS
  { name: 'Curso de español chileno', category: 'servicios', origin: 'chi', priceCents: 50000, description: 'Curso online de español chileno' },
  { name: 'Consultoría empresarial', category: 'servicios', origin: 'ven', priceCents: 80000, description: 'Consultoría empresarial especializada' },
  { name: 'Clases de cocina venezolana', category: 'servicios', origin: 'ven', priceCents: 35000, description: 'Clases online de cocina tradicional' },
  { name: 'Asesoría legal chilena', category: 'servicios', origin: 'chi', priceCents: 60000, description: 'Asesoría legal especializada' },
];

// Categorías existentes o por crear
const CATEGORIES = [
  { name: 'Comida', slug: 'comida' },
  { name: 'Ropa', slug: 'ropa' },
  { name: 'Tecnología', slug: 'tecnologia' },
  { name: 'Hogar', slug: 'hogar' },
  { name: 'Deportes', slug: 'deportes' },
  { name: 'Servicios', slug: 'servicios' },
];

/**
 * Busca imagen en Open Food Facts
 */
async function searchImageInOFF(productName: string, origin: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(`${productName} ${origin}`);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process&json=1&page_size=1`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      if (product.image_front_url) {
        console.log(`✅ Imagen encontrada en OFF para: ${productName}`);
        return product.image_front_url;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Error buscando en OFF para ${productName}:`, error);
    return null;
  }
}

/**
 * Busca imagen en Wikimedia Commons
 */
async function searchImageInWikimedia(productName: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(productName);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${searchTerm}&srnamespace=6&srlimit=1`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.query && data.query.search && data.query.search.length > 0) {
      const result = data.query.search[0];
      const imageUrl = `https://commons.wikimedia.org/wiki/File:${result.title}`;
      console.log(`✅ Imagen encontrada en Wikimedia para: ${productName}`);
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Error buscando en Wikimedia para ${productName}:`, error);
    return null;
  }
}

/**
 * Obtiene placeholder local por categoría
 */
function getPlaceholderImage(category: string): string {
  return `/img/placeholders/${category}.jpg`;
}

/**
 * Resuelve imagen para un producto
 */
async function resolveProductImage(productName: string, category: string, origin: string): Promise<string> {
  // 1. Intentar Open Food Facts
  let imageUrl = await searchImageInOFF(productName, origin);
  if (imageUrl) return imageUrl;
  
  // 2. Intentar Wikimedia Commons
  imageUrl = await searchImageInWikimedia(productName);
  if (imageUrl) return imageUrl;
  
  // 3. Usar placeholder local
  console.log(`📷 Usando placeholder para: ${productName}`);
  return getPlaceholderImage(category);
}

/**
 * Función principal de seed
 */
async function seedProducts() {
  console.log('🌱 Iniciando seed de productos...');
  
  try {
    // 1. Crear categorías si no existen
    console.log('📂 Creando categorías...');
    for (const category of CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          name: category.name,
          slug: category.slug,
        },
      });
    }

    // 2. Crear usuario vendedor demo
    console.log('👤 Creando vendedor demo...');
    const demoUser = await prisma.user.upsert({
      where: { phone: '+56912345678' },
      update: {},
      create: {
        name: 'Vendedor Demo',
        phone: '+56912345678',
        role: 'SELLER',
        points: 100,
      },
    });

    const demoSeller = await prisma.seller.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        storeName: 'Tienda Demo Chile-Venezuela',
        online: true,
        deliveryEnabled: true,
        deliveryETA: '30-45 minutos',
      },
    });

    // 3. Crear productos
    console.log('🛍️ Creando productos...');
    let createdCount = 0;
    
    for (const productData of PRODUCTS_SEED) {
      try {
        // Buscar categoría
        const category = await prisma.category.findUnique({
          where: { slug: productData.category },
        });
        
        if (!category) {
          console.log(`❌ Categoría no encontrada: ${productData.category}`);
          continue;
        }

        // Resolver imagen
        const imageUrl = await resolveProductImage(
          productData.name,
          productData.category,
          productData.origin
        );

        // Crear producto
        const slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const product = await prisma.product.upsert({
          where: { slug },
          update: {
            name: productData.name,
            description: productData.description,
            priceCents: productData.priceCents,
            origin: productData.origin,
            imageUrl,
            active: true,
          },
          create: {
            name: productData.name,
            slug,
            description: productData.description,
            priceCents: productData.priceCents,
            discountCents: Math.random() > 0.7 ? Math.floor(productData.priceCents * 0.1) : 0,
            origin: productData.origin,
            rating: 4.0 + Math.random() * 1.0, // Rating entre 4.0 y 5.0
            imageUrl,
            categoryId: category.id,
            active: true,
          },
        });

        // Crear relación con vendedor
        await prisma.sellerProduct.upsert({
          where: {
            sellerId_productId: {
              sellerId: demoSeller.id,
              productId: product.id,
            },
          },
          update: {
            quantity: 10 + Math.floor(Math.random() * 20), // Stock entre 10-30
          },
          create: {
            sellerId: demoSeller.id,
            productId: product.id,
            quantity: 10 + Math.floor(Math.random() * 20),
          },
        });

        createdCount++;
        console.log(`✅ Producto creado: ${product.name} (${productData.origin})`);
        
        // Pequeña pausa para no sobrecargar las APIs
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creando producto ${productData.name}:`, error);
      }
    }

    console.log(`🎉 Seed completado! ${createdCount} productos creados.`);
    console.log(`👤 Vendedor demo creado: ${demoSeller.storeName}`);
    console.log(`🌐 Vendedor online: ${demoSeller.online ? 'Sí' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts();
}

export { seedProducts };

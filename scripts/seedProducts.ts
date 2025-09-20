import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

// Utilidad simple para slug
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type SeedItem = {
  name: string;
  description?: string;
  category: string;        // comida | ropa | tecnologia | hogar | deportes | servicios
  origin?: 'chi' | 'ven';
  priceCents: number;
  discountCents?: number;
  imageQuery?: string;     // para buscar imagen
};

const CHI: SeedItem[] = [
  { name:'Completo italiano', category:'comida', origin:'chi', priceCents:1800, imageQuery:'completo italiano' },
  { name:'Churrasco chileno', category:'comida', origin:'chi', priceCents:5500, imageQuery:'churrasco sandwich chile' },
  { name:'Manjar en pote', category:'comida', origin:'chi', priceCents:3200, imageQuery:'manjar dulce de leche chile' },
  { name:'Polera básica', category:'ropa', origin:'chi', priceCents:5990, imageQuery:'polera basica' },
  { name:'Kuchen de frambuesa', category:'comida', origin:'chi', priceCents:4200, imageQuery:'kuchen frambuesa' },
  { name:'Café de grano chileno', category:'comida', origin:'chi', priceCents:4500, imageQuery:'cafe grano chile' },
  { name:'Palta Hass chilena', category:'comida', origin:'chi', priceCents:2500, imageQuery:'palta hass chile' },
  { name:'Vino Carménère', category:'comida', origin:'chi', priceCents:8500, imageQuery:'vino carmenere chile' },
  { name:'Sal de mar de Cáhuil', category:'comida', origin:'chi', priceCents:1800, imageQuery:'sal mar cahuil chile' },
  { name:'Miel de ulmo', category:'comida', origin:'chi', priceCents:3200, imageQuery:'miel ulmo chile' },
  { name:'Quinoa chilena', category:'comida', origin:'chi', priceCents:2800, imageQuery:'quinoa chile' },
  { name:'Aceite de oliva extra virgen', category:'comida', origin:'chi', priceCents:5500, imageQuery:'aceite oliva chile' },
  { name:'Chocolate de la Patagonia', category:'comida', origin:'chi', priceCents:3800, imageQuery:'chocolate patagonia chile' },
  { name:'Pisco chileno', category:'comida', origin:'chi', priceCents:12000, imageQuery:'pisco chile' },
  { name:'Cerveza artesanal chilena', category:'comida', origin:'chi', priceCents:3200, imageQuery:'cerveza artesanal chile' },
  { name:'Manjar chileno', category:'comida', origin:'chi', priceCents:2200, imageQuery:'manjar dulce leche chile' },
  { name:'Alfajores chilenos', category:'comida', origin:'chi', priceCents:1800, imageQuery:'alfajores chile' },
  { name:'Poncho chileno', category:'ropa', origin:'chi', priceCents:25000, imageQuery:'poncho lana chile' },
  { name:'Chamanto chileno', category:'ropa', origin:'chi', priceCents:18000, imageQuery:'chamanto chile' },
  { name:'Cargador USB chileno', category:'tecnologia', origin:'chi', priceCents:8500, imageQuery:'cargador usb' },
  { name:'Auriculares inalámbricos', category:'tecnologia', origin:'chi', priceCents:25000, imageQuery:'auriculares bluetooth' },
  { name:'Mouse inalámbrico', category:'tecnologia', origin:'chi', priceCents:12000, imageQuery:'mouse inalambrico' },
  { name:'Vaso de cobre chileno', category:'hogar', origin:'chi', priceCents:15000, imageQuery:'vaso cobre chile' },
  { name:'Mortero de piedra chileno', category:'hogar', origin:'chi', priceCents:18000, imageQuery:'mortero piedra chile' },
  { name:'Balón de fútbol chileno', category:'deportes', origin:'chi', priceCents:22000, imageQuery:'balon futbol' },
  { name:'Raqueta de tenis', category:'deportes', origin:'chi', priceCents:45000, imageQuery:'raqueta tenis' },
  { name:'Curso de español chileno', category:'servicios', origin:'chi', priceCents:50000, imageQuery:'curso español chile' },
  { name:'Asesoría legal chilena', category:'servicios', origin:'chi', priceCents:60000, imageQuery:'asesoria legal chile' },
];

const VEN: SeedItem[] = [
  { name:'Arepa reina pepiada', category:'comida', origin:'ven', priceCents:2500, discountCents:300, imageQuery:'arepa reina pepiada' },
  { name:'Empanada de queso', category:'comida', origin:'ven', priceCents:1500, imageQuery:'empanada venezolana queso' },
  { name:'Cachapa con queso', category:'comida', origin:'ven', priceCents:4000, imageQuery:'cachapa queso' },
  { name:'Malta Polar 355ml', category:'comida', origin:'ven', priceCents:2200, imageQuery:'malta polar bottle' },
  { name:'Harina PAN 1kg', category:'comida', origin:'ven', priceCents:2800, imageQuery:'harina pan 1kg' },
  { name:'Café Maracay', category:'comida', origin:'ven', priceCents:4200, imageQuery:'cafe maracay venezuela' },
  { name:'Cacao venezolano', category:'comida', origin:'ven', priceCents:4800, imageQuery:'cacao venezuela' },
  { name:'Azúcar morena venezolana', category:'comida', origin:'ven', priceCents:1600, imageQuery:'azucar morena venezuela' },
  { name:'Panela venezolana', category:'comida', origin:'ven', priceCents:2200, imageQuery:'panela venezuela' },
  { name:'Queso llanero', category:'comida', origin:'ven', priceCents:3500, imageQuery:'queso llanero venezuela' },
  { name:'Harina de maíz', category:'comida', origin:'ven', priceCents:1800, imageQuery:'harina maiz venezuela' },
  { name:'Aceite de coco venezolano', category:'comida', origin:'ven', priceCents:4200, imageQuery:'aceite coco venezuela' },
  { name:'Café Táchira', category:'comida', origin:'ven', priceCents:4600, imageQuery:'cafe tachira venezuela' },
  { name:'Ron venezolano', category:'comida', origin:'ven', priceCents:15000, imageQuery:'ron venezuela' },
  { name:'Jugo de guayaba venezolano', category:'comida', origin:'ven', priceCents:2800, imageQuery:'jugo guayaba venezuela' },
  { name:'Chocolate venezolano', category:'comida', origin:'ven', priceCents:3400, imageQuery:'chocolate venezuela' },
  { name:'Cocada venezolana', category:'comida', origin:'ven', priceCents:1600, imageQuery:'cocada venezuela' },
  { name:'Liquiliqui venezolano', category:'ropa', origin:'ven', priceCents:35000, imageQuery:'liquiliqui venezuela' },
  { name:'Sombrero llanero', category:'ropa', origin:'ven', priceCents:12000, imageQuery:'sombrero llanero venezuela' },
  { name:'Cable HDMI venezolano', category:'tecnologia', origin:'ven', priceCents:6500, imageQuery:'cable hdmi' },
  { name:'Hamaca venezolana', category:'hogar', origin:'ven', priceCents:28000, imageQuery:'hamaca venezuela' },
  { name:'Cesta de mimbre venezolana', category:'hogar', origin:'ven', priceCents:12000, imageQuery:'cesta mimbre venezuela' },
  { name:'Guantes de boxeo venezolanos', category:'deportes', origin:'ven', priceCents:35000, imageQuery:'guantes boxeo' },
  { name:'Pelota de béisbol', category:'deportes', origin:'ven', priceCents:8500, imageQuery:'pelota beisbol' },
  { name:'Consultoría empresarial', category:'servicios', origin:'ven', priceCents:80000, imageQuery:'consultoria empresarial' },
  { name:'Clases de cocina venezolana', category:'servicios', origin:'ven', priceCents:35000, imageQuery:'clases cocina venezolana' },
];

const ITEMS: SeedItem[] = [...CHI, ...VEN];

// Búsqueda de imagen: intenta Wikimedia y OFF; si falla, placeholder por categoría
async function resolveImage(item: SeedItem): Promise<string | null> {
  const q = encodeURIComponent(item.imageQuery || item.name);
  // 1) Wikimedia
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&prop=pageimages|pageterms&piprop=thumbnail&pithumbsize=800&generator=search&gsrlimit=1&gsrsearch=${q}`);
    const j = await r.json() as any;
    const pages = j?.query?.pages || {};
    const first = Object.values(pages)[0] as any;
    const url = first?.thumbnail?.source;
    if (url) {
      console.log(`✅ Imagen encontrada en Wikimedia para: ${item.name}`);
      return url;
    }
  } catch (e) {
    console.log(`❌ Error en Wikimedia para ${item.name}:`, e);
  }
  
  // 2) Open Food Facts (solo comida)
  if (item.category === 'comida') {
    try {
      const rr = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=1&search_terms=${q}`);
      const jj = await rr.json() as any;
      const prod = jj?.products?.[0];
      const url = prod?.image_front_url || prod?.image_url;
      if (url) {
        console.log(`✅ Imagen encontrada en OFF para: ${item.name}`);
        return url;
      }
    } catch (e) {
      console.log(`❌ Error en OFF para ${item.name}:`, e);
    }
  }
  
  // 3) Placeholder local por categoría
  console.log(`📷 Usando placeholder para: ${item.name}`);
  return `/img/placeholders/${item.category || 'comida'}.jpg`;
}

async function main() {
  console.log('🌱 Iniciando seed de productos...');
  
  // Asegura categorías
  const catNames = Array.from(new Set(ITEMS.map(i=>i.category)));
  const cats = new Map<string, string>();
  for (const name of catNames) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    cats.set(name, c.id);
    console.log(`📂 Categoría: ${name}`);
  }

  // Crea usuario demo primero
  let demoUser = await prisma.user.findFirst({
    where: { phone: '123456789' },
  });
  
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: { 
        name: 'Vendedor Demo', 
        phone: '123456789', 
        passwordHash: await bcrypt.hash('123456', 10),
        role: 'SELLER'
      },
    });
  }

  // Crea seller demo
  let seller = await prisma.seller.findFirst({
    where: { userId: demoUser.id },
  });
  
  if (!seller) {
    seller = await prisma.seller.create({
      data: { 
        userId: demoUser.id,
        storeName: 'Vendedor Demo', 
        online: true, 
        deliveryEnabled: true, 
        deliveryETA: '30-40m' 
      },
    });
  }
  console.log(`👤 Vendedor demo: ${seller.storeName}`);

  // Inserta productos y stock por vendedor
  let createdCount = 0;
  for (const p of ITEMS) {
    try {
      const slug = slugify(p.name);
      const imageUrl = await resolveImage(p);

      let product = await prisma.product.findFirst({
        where: { slug },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: p.name,
            slug,
            description: p.description,
            origin: p.origin,
            priceCents: p.priceCents,
            discountCents: p.discountCents ?? 0,
            imageUrl,
            active: true,
            rating: 4.5,
            categoryId: cats.get(p.category),
          },
        });
      }

      await prisma.sellerProduct.upsert({
        where: { sellerId_productId: { sellerId: seller.id, productId: product.id } },
        update: { stock: 15 },
        create: { sellerId: seller.id, productId: product.id, stock: 15 },
      });

      createdCount++;
      console.log(`✅ Producto: ${product.name} (${p.origin}) - ${imageUrl ? 'Con imagen' : 'Placeholder'}`);
      
      // Pequeña pausa para no sobrecargar las APIs
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error creando producto ${p.name}:`, error);
    }
  }
  
  console.log(`🎉 Seed completado! ${createdCount} productos creados.`);
  console.log(`👤 Vendedor: ${seller.storeName} (${seller.online ? 'Online' : 'Offline'})`);
  console.log(`📂 Categorías: ${catNames.join(', ')}`);
}

main().catch(e=>{ console.error('❌ Error en seed:', e); process.exit(1); }).finally(()=>prisma.$disconnect());

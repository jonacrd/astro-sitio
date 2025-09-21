import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio del script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
config({ path: join(__dirname, '..', '.env') });

const URL = process.env.PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', URL ? 'Configurada' : 'FALTA');
console.log('SERVICE:', SERVICE ? 'Configurada' : 'FALTA');

if (!URL || !SERVICE) {
  console.error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  console.error('Verifica que el archivo .env esté en la raíz del proyecto');
  process.exit(1);
}

const sb = createClient(URL, SERVICE);

async function upsertUser(email, password, name, isSeller = false, phone = null) {
  // crear (o recuperar) user
  let { data: existing } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = existing?.users?.find(u => u.email === email);

  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) throw error;
    user = data.user;
  }

  // profile
  const { error: perr } = await sb.from('profiles').upsert({
    id: user.id,
    name,
    phone,
    is_seller: isSeller
  });
  if (perr) throw perr;

  return user.id;
}

const products = [
  // COMIDA (8)
  ['Arepa reina pepiada','Arepa tradicional venezolana','comida',2500,'https://images.unsplash.com/photo-1550547660-d9450f859349'],
  ['Empanada de queso','Crujiente y recién hecha','comida',1800,'https://images.unsplash.com/photo-1526318472351-c75fcf070305'],
  ['Hamburguesa clásica','Pan, carne, queso y salsa','comida',3500,'https://images.unsplash.com/photo-1550547660-8b6ebea77c47'],
  ['Perro caliente','Pan, salchicha y salsas','comida',2000,'https://images.unsplash.com/photo-1513104890138-7c749659a591'],
  ['Salchipapa','Papas con salchicha','comida',2800,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
  ['Pollo asado 1/2','Con papas','comida',5200,'https://images.unsplash.com/photo-1604908554049-7c01cc3ad6bf'],
  ['Arepa de mechada','Carne mechada','comida',2700,'https://images.unsplash.com/photo-1589308078053-f0f4d0e4f1f5'],
  ['Tequeños (6u)','Palitos de queso','comida',2200,'https://images.unsplash.com/photo-1608039829576-07c8d2fb504a'],

  // POSTRES (4)
  ['Quesillo venezolano','Postre tradicional','postres',2800,'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af'],
  ['Torta tres leches','Postre húmedo','postres',3500,'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55'],
  ['Brownie','Chocolate intenso','postres',2000,'https://images.unsplash.com/photo-1606313564200-e75d5e2b3b52'],
  ['Helado 1/2 lt','Vainilla','postres',3200,'https://images.unsplash.com/photo-1499636136210-6f4ee915583e'],

  // BEBIDAS (4)
  ['Malta 355ml','Bebida no alcohólica','bebidas',1200,'https://images.unsplash.com/photo-1516126491303-6f54240c8491'],
  ['Cerveza 355ml','Lager','bebidas',1500,'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff'],
  ['Refresco 1.5L','Sabor cola','bebidas',2300,'https://images.unsplash.com/photo-1571070908145-90d188d9a2a0'],
  ['Agua 1.5L','Sin gas','bebidas',1300,'https://images.unsplash.com/photo-1510627498534-cf7e9002facc'],

  // MINIMARKET (6)
  ['Jamón serrano 200g','Charcutería','minimarket',5200,'https://images.unsplash.com/photo-1604908554049-7c01cc3ad6bf'],
  ['Salchichón español','Charcutería','minimarket',3200,'https://images.unsplash.com/photo-1607301405390-5c9e4f386327'],
  ['Arroz 1kg','Grano largo','minimarket',1800,'https://images.unsplash.com/photo-1604908177073-9d1fba07f92e'],
  ['Aceite 1L','Girasol','minimarket',3500,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
  ['Leche 1L','Entera','minimarket',1900,'https://images.unsplash.com/photo-1580910051074-3eb69488611b'],
  ['Harina PAN 1kg','Maíz precocido','minimarket',2200,'https://images.unsplash.com/photo-1542831371-29b0f74f9713'],

  // SERVICIOS (4)
  ['Corte de cabello','Servicio peluquería','servicios',8000,'https://images.unsplash.com/photo-1503951914875-452162b0f3f1'],
  ['Manicure completa','Servicio estética','servicios',5000,'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'],
  ['Cambio de aceite','Servicio mecánico','servicios',15000,'https://images.unsplash.com/photo-1542362567-b07e54358753'],
  ['Revisión de motor','Servicio mecánico','servicios',25000,'https://images.unsplash.com/photo-1515923753294-9f5299d0f0c4'],

  // TECNOLOGÍA (2)
  ['Auriculares inalámbricos','Bluetooth','tecnologia',18000,'https://images.unsplash.com/photo-1518440563234-167f5700fb8b'],
  ['Mouse gamer','RGB','tecnologia',12000,'https://images.unsplash.com/photo-1587202372775-98927b06552b'],

  // HOGAR (1)
  ['Detergente 3L','Líquido','hogar',5200,'https://images.unsplash.com/photo-1581578731548-c64695cc6955'],

  // ROPA (1)
  ['Polera básica','Algodón','ropa',7000,'https://images.unsplash.com/photo-1520975661595-6453be3f7070']
];

async function seedProducts() {
  // upsert de ~30 productos
  const rows = products.map(([title, description, category, price_cents, image_url]) => ({
    title, description, category, price_cents, image_url, active: true
  }));

  for (const batch of [rows.slice(0, 20), rows.slice(20)]) {
    if (batch.length === 0) continue;
    const { error } = await sb.from('products').upsert(batch, { onConflict: 'title' });
    if (error) throw error;
  }

  // Obtén IDs
  const { data: dbp, error } = await sb.from('products').select('id,title,category,price_cents').limit(200);
  if (error) throw error;
  return dbp;
}

function pick(dbp, titles) {
  const map = new Map(dbp.map(p => [p.title, p]));
  return titles.map(t => map.get(t)).filter(Boolean);
}

async function seed() {
  // Usuarios
  const sellerFoodId = await upsertUser('vendedor.comidas@town.dev','Password123!','Deli Comidas', true, '+56 9 1111 1111');
  const sellerMiniId = await upsertUser('vendedor.minimarket@town.dev','Password123!','Mini Abarrotes', true, '+56 9 2222 2222');
  const sellerMechId = await upsertUser('vendedor.mecanica@town.dev','Password123!','Mecánica Express', true, '+56 9 3333 3333');
  const sellerTechId = await upsertUser('vendedor.tech@town.dev','Password123!','Tech Store', true, '+56 9 4444 4444');

  const buyerAId = await upsertUser('cliente.a@town.dev','Password123!','Cliente A', false, '+56 9 5555 5555');
  const buyerBId = await upsertUser('cliente.b@town.dev','Password123!','Cliente B', false, '+56 9 6666 6666');

  // Productos
  const dbp = await seedProducts();

  // Catálogo por vendedor (seller_products)
  const food = pick(dbp, [
    'Arepa reina pepiada','Empanada de queso','Hamburguesa clásica','Perro caliente','Salchipapa','Tequeños (6u)','Quesillo venezolano','Torta tres leches','Malta 355ml','Refresco 1.5L'
  ]);
  const mini = pick(dbp, [
    'Arroz 1kg','Aceite 1L','Leche 1L','Harina PAN 1kg','Jamón serrano 200g','Salchichón español','Cerveza 355ml','Agua 1.5L','Detergente 3L'
  ]);
  const mech = pick(dbp, [
    'Cambio de aceite','Revisión de motor'
  ]);
  const tech = pick(dbp, [
    'Auriculares inalámbricos','Mouse gamer'
  ]);

  const lines = [];

  const add = (sellerId, items, stock = 30, factor = 1.0) => {
    for (const p of items) {
      lines.push({
        seller_id: sellerId,
        product_id: p.id,
        price_cents: Math.round(p.price_cents * factor),
        stock,
        active: true
      });
    }
  };

  add(sellerFoodId, food, 40, 1.0);
  add(sellerMiniId, mini, 60, 1.05);
  add(sellerMechId, mech, 10, 1.0);
  add(sellerTechId, tech, 25, 1.1);

  // upsert por pares (seller_id, product_id)
  // Para upsert compuesto, hazlo en bucles pequeños
  for (const chunk of [lines.slice(0, 25), lines.slice(25)]) {
    if (chunk.length === 0) continue;
    const { error } = await sb.from('seller_products').upsert(chunk, { onConflict: 'seller_id,product_id' });
    if (error) throw error;
  }

  console.log('Seed OK: users, profiles, products, seller_products');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});

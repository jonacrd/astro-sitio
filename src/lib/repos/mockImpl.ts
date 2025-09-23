import type {
  ProductRepo, SellerInventoryRepo, OrderRepo, StatusRepo,
  ProductDTO, SellerProductDTO, OrderDTO, PaymentMethod, StatsDTO
} from './index';

// ====== Catálogo global (mock) ======
const GLOBAL_PRODUCTS: ProductDTO[] = [
  // FIAMBRES Y CARNES
  { id:'p_jamon_serrano', title:'Jamón Serrano 200g', category:'fiambres', origin:'ven', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_salchichon', title:'Salchichón Español', category:'fiambres', origin:'ven', priceCents:3200, discountCents:0, imageUrl:null, active:true },
  { id:'p_chorizo_parrilla', title:'Chorizo para Parrilla', category:'carnes', origin:'ven', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_pollo_entero', title:'Pollo Entero 1.5kg', category:'pollos', origin:'chi', priceCents:4200, discountCents:0, imageUrl:null, active:true },
  { id:'p_pechuga_pollo', title:'Pechuga de Pollo 1kg', category:'pollos', origin:'chi', priceCents:3800, discountCents:0, imageUrl:null, active:true },
  { id:'p_chuleta_cerdo', title:'Chuleta de Cerdo 1kg', category:'chuleta', origin:'chi', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_chuleta_ahumada', title:'Chuleta Ahumada 800g', category:'chuleta', origin:'ven', priceCents:4800, discountCents:0, imageUrl:null, active:true },
  { id:'p_lomo_cerdo', title:'Lomo de Cerdo 1kg', category:'carnes', origin:'chi', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_carne_molida', title:'Carne Molida 1kg', category:'carnes', origin:'chi', priceCents:3200, discountCents:0, imageUrl:null, active:true },
  
  // POSTRES
  { id:'p_tres_leches', title:'Torta Tres Leches', category:'tortas', origin:'ven', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_quesillo', title:'Quesillo Venezolano', category:'quesillos', origin:'ven', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_pie_limon', title:'Pie de Limón', category:'postres', origin:'chi', priceCents:3200, discountCents:0, imageUrl:null, active:true },
  { id:'p_kuchen_frambuesa', title:'Kuchen de Frambuesa', category:'postres', origin:'chi', priceCents:4200, discountCents:0, imageUrl:null, active:true },
  { id:'p_brazo_reina', title:'Brazo de Reina', category:'postres', origin:'ven', priceCents:2500, discountCents:0, imageUrl:null, active:true },
  { id:'p_flan_caramelo', title:'Flan de Caramelo', category:'postres', origin:'ven', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  
  // BEBIDAS ALCOHÓLICAS
  { id:'p_cerveza_polar', title:'Cerveza Polar 355ml', category:'cervezas', origin:'ven', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_cerveza_artesanal', title:'Cerveza Artesanal 500ml', category:'cervezas', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_ron_cacique', title:'Ron Cacique 500ml', category:'ron', origin:'ven', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_whisky_johnnie', title:'Whisky Johnnie Walker 750ml', category:'whisky', origin:'chi', priceCents:25000, discountCents:0, imageUrl:null, active:true },
  { id:'p_aguardiente_antioqueno', title:'Aguardiente Antioqueño 750ml', category:'aguardiente', origin:'col', priceCents:8500, discountCents:0, imageUrl:null, active:true },
  { id:'p_vodka_absolut', title:'Vodka Absolut 750ml', category:'vodka', origin:'chi', priceCents:12000, discountCents:0, imageUrl:null, active:true },
  { id:'p_pisco_chileno', title:'Pisco Chileno 750ml', category:'aguardiente', origin:'chi', priceCents:6500, discountCents:0, imageUrl:null, active:true },
  
  // SERVICIOS
  { id:'p_corte_cabello', title:'Corte de Cabello', category:'peluqueria', origin:'chi', priceCents:8000, discountCents:0, imageUrl:null, active:true },
  { id:'p_manicure', title:'Manicure Completa', category:'manicurista', origin:'ven', priceCents:5000, discountCents:0, imageUrl:null, active:true },
  { id:'p_revision_motor', title:'Revisión de Motor', category:'mecanica', origin:'chi', priceCents:25000, discountCents:0, imageUrl:null, active:true },
  { id:'p_cambio_aceite', title:'Cambio de Aceite', category:'mecanica', origin:'chi', priceCents:15000, discountCents:0, imageUrl:null, active:true },
  { id:'p_neumatico_auto', title:'Neumático para Auto', category:'autopartes', origin:'chi', priceCents:45000, discountCents:0, imageUrl:null, active:true },
  { id:'p_retrovisor_auto', title:'Retrovisor para Auto', category:'accesorios', origin:'chi', priceCents:12000, discountCents:0, imageUrl:null, active:true },
  { id:'p_casco_moto', title:'Casco para Moto', category:'motos', origin:'chi', priceCents:35000, discountCents:0, imageUrl:null, active:true },
  { id:'p_alarma_auto', title:'Instalación de Alarma', category:'alarmas', origin:'ven', priceCents:80000, discountCents:0, imageUrl:null, active:true },
  { id:'p_gps_auto', title:'GPS para Auto', category:'gps', origin:'chi', priceCents:120000, discountCents:0, imageUrl:null, active:true },
  { id:'p_sensor_proximidad', title:'Sensor de Proximidad', category:'sensores', origin:'chi', priceCents:25000, discountCents:0, imageUrl:null, active:true },
  
  // PRODUCTOS TRADICIONALES
  { id:'p_arepa_reina', title:'Arepa Reina Pepiada', category:'comida', origin:'ven', priceCents:2500, discountCents:300, imageUrl:null, active:true },
  { id:'p_emp_queso', title:'Empanada de Queso', category:'comida', origin:'ven', priceCents:1500, discountCents:0, imageUrl:null, active:true },
  { id:'p_completo', title:'Completo Italiano', category:'comida', origin:'chi', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_harina_pan', title:'Harina PAN 1kg', category:'comida', origin:'ven', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_malta', title:'Malta 355ml', category:'comida', origin:'ven', priceCents:2200, discountCents:0, imageUrl:null, active:true },

  // COMIDAS RÁPIDAS Y EJECUTIVAS
  { id:'p_perro_caliente', title:'Perro Caliente', category:'comida', origin:'chi', priceCents:2000, discountCents:0, imageUrl:null, active:true },
  { id:'p_hamburguesa', title:'Hamburguesa Clásica', category:'comida', origin:'chi', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_salchipapa', title:'Salchipapa', category:'comida', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_papa_rellena', title:'Papa Rellena', category:'comida', origin:'chi', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  { id:'p_empanada_venezolana', title:'Empanada Venezolana', category:'comida', origin:'ven', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_empanada_colombiana', title:'Empanada Colombiana', category:'comida', origin:'col', priceCents:1600, discountCents:0, imageUrl:null, active:true },
  { id:'p_arepa_huevo', title:'Arepa de Huevo', category:'comida', origin:'col', priceCents:2000, discountCents:0, imageUrl:null, active:true },
  { id:'p_chicharron_guacamole', title:'Chicharrón con Guacamole', category:'comida', origin:'ven', priceCents:3200, discountCents:0, imageUrl:null, active:true },
  { id:'p_yuca_frita', title:'Yuca Frita', category:'comida', origin:'ven', priceCents:1500, discountCents:0, imageUrl:null, active:true },
  { id:'p_cachapa', title:'Cachapa', category:'comida', origin:'ven', priceCents:2500, discountCents:0, imageUrl:null, active:true },
  { id:'p_parrilla_mixta', title:'Parrilla Mixta', category:'comida', origin:'chi', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_sopa_pollo', title:'Sopa de Pollo', category:'comida', origin:'chi', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  { id:'p_sopa_verduras', title:'Sopa de Verduras', category:'comida', origin:'chi', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_almuerzo_ejecutivo', title:'Almuerzo Ejecutivo', category:'comida', origin:'chi', priceCents:3800, discountCents:0, imageUrl:null, active:true },
  { id:'p_lasagna', title:'Lasaña', category:'comida', origin:'chi', priceCents:4200, discountCents:0, imageUrl:null, active:true },
  { id:'p_ensalada_cesar', title:'Ensalada César', category:'comida', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_pollo_broaster', title:'Pollo Broaster', category:'comida', origin:'chi', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_papas_fritas', title:'Papas Fritas', category:'comida', origin:'chi', priceCents:1200, discountCents:0, imageUrl:null, active:true },
  { id:'p_arroz_chino', title:'Arroz Chino', category:'comida', origin:'chi', priceCents:3000, discountCents:0, imageUrl:null, active:true },
  { id:'p_tacos_mexicanos', title:'Tacos Mexicanos', category:'comida', origin:'chi', priceCents:2500, discountCents:0, imageUrl:null, active:true },
  { id:'p_pizza_margherita', title:'Pizza Margherita', category:'comida', origin:'chi', priceCents:4000, discountCents:0, imageUrl:null, active:true },
  { id:'p_sandwich_cubano', title:'Sandwich Cubano', category:'comida', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_wrap_pollo', title:'Wrap de Pollo', category:'comida', origin:'chi', priceCents:3200, discountCents:0, imageUrl:null, active:true },
  { id:'p_quesadilla', title:'Quesadilla', category:'comida', origin:'chi', priceCents:2200, discountCents:0, imageUrl:null, active:true },
  { id:'p_burrito', title:'Burrito', category:'comida', origin:'chi', priceCents:3500, discountCents:0, imageUrl:null, active:true },
  { id:'p_pastel_choclo', title:'Pastel de Choclo', category:'comida', origin:'chi', priceCents:2800, discountCents:0, imageUrl:null, active:true },
  { id:'p_empanada_pino', title:'Empanada de Pino', category:'comida', origin:'chi', priceCents:1800, discountCents:0, imageUrl:null, active:true },
  { id:'p_cazuela_mariscos', title:'Cazuela de Mariscos', category:'comida', origin:'chi', priceCents:4500, discountCents:0, imageUrl:null, active:true },
  { id:'p_ceviche', title:'Ceviche', category:'comida', origin:'chi', priceCents:3800, discountCents:0, imageUrl:null, active:true },
  { id:'p_paila_marina', title:'Paila Marina', category:'comida', origin:'chi', priceCents:4200, discountCents:0, imageUrl:null, active:true },
];

const productsImpl: ProductRepo = {
  async globalList({ q, category, limit = 50 } = {}) {
    let list = GLOBAL_PRODUCTS.filter(p => p.active);
    if (category) list = list.filter(p => p.category === category);
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    return list.slice(0, limit);
  }
};

// ====== Usuarios de vendedores ======
type SellerUser = { 
  id:string; 
  username:string; 
  password:string; 
  name:string; 
  phone:string; 
  email?:string; 
  sellerId:string; 
  role:'seller'; 
  active:boolean;
  createdAt:Date;
};

const SELLER_USERS: SellerUser[] = [
  { id:'u1', username:'user1', password:'1', name:'Juan Pérez', phone:'+56912345678', email:'user1@carnesdelzulia.com', sellerId:'s1', role:'seller', active:true, createdAt:new Date('2024-01-01') },
  { id:'u2', username:'user2', password:'2', name:'María González', phone:'+56912345679', email:'user2@postresydulces.com', sellerId:'s2', role:'seller', active:true, createdAt:new Date('2024-01-02') },
  { id:'u3', username:'user3', password:'3', name:'Carlos López', phone:'+56912345680', email:'user3@licorespremium.com', sellerId:'s3', role:'seller', active:false, createdAt:new Date('2024-01-03') },
  { id:'u4', username:'user4', password:'4', name:'Ana Rodríguez', phone:'+56912345681', email:'user4@bellezayestilo.com', sellerId:'s4', role:'seller', active:true, createdAt:new Date('2024-01-04') },
  { id:'u5', username:'user5', password:'5', name:'Pedro Martínez', phone:'+56912345682', email:'user5@automecanicapro.com', sellerId:'s5', role:'seller', active:false, createdAt:new Date('2024-01-05') },
  { id:'u6', username:'user6', password:'6', name:'Laura Sánchez', phone:'+56912345683', email:'user6@saborestradicionales.com', sellerId:'s6', role:'seller', active:true, createdAt:new Date('2024-01-06') },
  { id:'u7', username:'user7', password:'7', name:'Roberto Torres', phone:'+56912345684', email:'user7@comidasrapidasexpress.com', sellerId:'s7', role:'seller', active:false, createdAt:new Date('2024-01-07') },
  { id:'u8', username:'user8', password:'8', name:'Carmen Flores', phone:'+56912345685', email:'user8@almuerzosejecutivos.com', sellerId:'s8', role:'seller', active:true, createdAt:new Date('2024-01-08') },
  { id:'u9', username:'user9', password:'9', name:'Diego Herrera', phone:'+56912345686', email:'user9@parrillaymariscos.com', sellerId:'s9', role:'seller', active:true, createdAt:new Date('2024-01-09') }
];

// ====== Estado vendedores ======
type SellerState = { id:string; storeName:string; onlineManual:boolean; lastSeen?:Date; timezone:string; hoursJson:any; };
let SELLERS: SellerState[] = [
  { id:'s1', storeName:'Carnes del Zulia', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[8,20], tue:[8,20], wed:[8,20], thu:[8,20], fri:[8,21], sat:[9,19], sun:[9,18] } },
  { id:'s2', storeName:'Postres y Dulces', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[9,19], tue:[9,19], wed:[9,19], thu:[9,19], fri:[9,20], sat:[10,18], sun:[10,17] } },
  { id:'s3', storeName:'Licores Premium', onlineManual:false, timezone:'America/Santiago', hoursJson:{ mon:[10,22], tue:[10,22], wed:[10,22], thu:[10,22], fri:[10,23], sat:[11,23], sun:[12,20] } },
  { id:'s4', storeName:'Belleza y Estilo', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[9,19], tue:[9,19], wed:[9,19], thu:[9,19], fri:[9,20], sat:[9,18], sun:null } },
  { id:'s5', storeName:'AutoMecánica Pro', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[8,18], tue:[8,18], wed:[8,18], thu:[8,18], fri:[8,18], sat:[8,14], sun:null } },
  { id:'s6', storeName:'Sabores Tradicionales', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[7,21], tue:[7,21], wed:[7,21], thu:[7,21], fri:[7,22], sat:[8,22], sun:[8,20] } },
  { id:'s7', storeName:'Comidas Rápidas Express', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[10,22], tue:[10,22], wed:[10,22], thu:[10,22], fri:[10,23], sat:[11,23], sun:[12,20] } },
  { id:'s8', storeName:'Almuerzos Ejecutivos', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[11,15], tue:[11,15], wed:[11,15], thu:[11,15], fri:[11,15], sat:[12,16], sun:null } },
  { id:'s9', storeName:'Parrilla y Mariscos', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[18,23], tue:[18,23], wed:[18,23], thu:[18,23], fri:[18,24], sat:[18,24], sun:[18,22] } }
];


function isOpen(hours:any, now=new Date()){
  const key = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
  const span = hours?.[key];
  if(!span) return false;
  const h = now.getHours() + now.getMinutes()/60;
  return h >= span[0] && h < span[1];
}
function isOnline(s:SellerState){ return !!s.onlineManual; }

const statusImpl: StatusRepo = {
  async list() {
    return SELLERS.map(s=>{
      const open = isOpen(s.hoursJson);
      const online = isOnline(s);
      return { id:s.id, storeName:s.storeName, open, online, available: open && online };
    });
  },
  async toggleOnline(sellerId, online) {
    const s = SELLERS.find(x=>x.id===sellerId); if(!s) throw new Error('seller not found');
    s.onlineManual = !!online; s.lastSeen = new Date();
    const open = isOpen(s.hoursJson);
    return { id:s.id, storeName:s.storeName, open, online:s.onlineManual, available: open && s.onlineManual };
  }
};

// ====== Inventarios por vendedor ======
type SellerProductRow = Omit<SellerProductDTO,'product'> & { product: ProductDTO };
let SELLER_PRODUCTS: SellerProductRow[] = [
  // VENDEDOR 1: Carnes del Zulia (carnes, fiambres, pollos, chuletas)
  { id:'sp_s1_jamon', sellerId:'s1', productId:'p_jamon_serrano', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_jamon_serrano')! },
  { id:'sp_s1_salchichon', sellerId:'s1', productId:'p_salchichon', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_salchichon')! },
  { id:'sp_s1_chorizo', sellerId:'s1', productId:'p_chorizo_parrilla', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_chorizo_parrilla')! },
  { id:'sp_s1_pollo', sellerId:'s1', productId:'p_pollo_entero', stock:8, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pollo_entero')! },
  { id:'sp_s1_pechuga', sellerId:'s1', productId:'p_pechuga_pollo', stock:10, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pechuga_pollo')! },
  { id:'sp_s1_chuleta', sellerId:'s1', productId:'p_chuleta_cerdo', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_chuleta_cerdo')! },
  { id:'sp_s1_chuleta_ahumada', sellerId:'s1', productId:'p_chuleta_ahumada', stock:6, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_chuleta_ahumada')! },
  { id:'sp_s1_lomo', sellerId:'s1', productId:'p_lomo_cerdo', stock:8, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_lomo_cerdo')! },
  { id:'sp_s1_carne_molida', sellerId:'s1', productId:'p_carne_molida', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_carne_molida')! },

  // VENDEDOR 2: Postres y Dulces (postres, tortas, quesillos)
  { id:'sp_s2_tres_leches', sellerId:'s2', productId:'p_tres_leches', stock:5, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_tres_leches')! },
  { id:'sp_s2_quesillo', sellerId:'s2', productId:'p_quesillo', stock:8, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_quesillo')! },
  { id:'sp_s2_pie_limon', sellerId:'s2', productId:'p_pie_limon', stock:6, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pie_limon')! },
  { id:'sp_s2_kuchen', sellerId:'s2', productId:'p_kuchen_frambuesa', stock:4, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_kuchen_frambuesa')! },
  { id:'sp_s2_brazo_reina', sellerId:'s2', productId:'p_brazo_reina', stock:7, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_brazo_reina')! },
  { id:'sp_s2_flan', sellerId:'s2', productId:'p_flan_caramelo', stock:10, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_flan_caramelo')! },

  // VENDEDOR 3: Licores Premium (bebidas alcohólicas)
  { id:'sp_s3_cerveza_polar', sellerId:'s3', productId:'p_cerveza_polar', stock:50, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_cerveza_polar')! },
  { id:'sp_s3_cerveza_artesanal', sellerId:'s3', productId:'p_cerveza_artesanal', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_cerveza_artesanal')! },
  { id:'sp_s3_ron', sellerId:'s3', productId:'p_ron_cacique', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_ron_cacique')! },
  { id:'sp_s3_whisky', sellerId:'s3', productId:'p_whisky_johnnie', stock:3, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_whisky_johnnie')! },
  { id:'sp_s3_aguardiente', sellerId:'s3', productId:'p_aguardiente_antioqueno', stock:8, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_aguardiente_antioqueno')! },
  { id:'sp_s3_vodka', sellerId:'s3', productId:'p_vodka_absolut', stock:5, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_vodka_absolut')! },
  { id:'sp_s3_pisco', sellerId:'s3', productId:'p_pisco_chileno', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pisco_chileno')! },

  // VENDEDOR 4: Belleza y Estilo (peluquería, manicurista)
  { id:'sp_s4_corte', sellerId:'s4', productId:'p_corte_cabello', stock:999, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_corte_cabello')! },
  { id:'sp_s4_manicure', sellerId:'s4', productId:'p_manicure', stock:999, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_manicure')! },

  // VENDEDOR 5: AutoMecánica Pro (mecánica, autopartes, accesorios, motos, alarmas, gps, sensores)
  { id:'sp_s5_revision', sellerId:'s5', productId:'p_revision_motor', stock:999, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_revision_motor')! },
  { id:'sp_s5_aceite', sellerId:'s5', productId:'p_cambio_aceite', stock:999, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_cambio_aceite')! },
  { id:'sp_s5_neumatico', sellerId:'s5', productId:'p_neumatico_auto', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_neumatico_auto')! },
  { id:'sp_s5_retrovisor', sellerId:'s5', productId:'p_retrovisor_auto', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_retrovisor_auto')! },
  { id:'sp_s5_casco', sellerId:'s5', productId:'p_casco_moto', stock:8, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_casco_moto')! },
  { id:'sp_s5_alarma', sellerId:'s5', productId:'p_alarma_auto', stock:999, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_alarma_auto')! },
  { id:'sp_s5_gps', sellerId:'s5', productId:'p_gps_auto', stock:5, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_gps_auto')! },
  { id:'sp_s5_sensor', sellerId:'s5', productId:'p_sensor_proximidad', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_sensor_proximidad')! },

  // VENDEDOR 6: Sabores Tradicionales (comida tradicional venezolana y chilena)
  { id:'sp_s6_arepa', sellerId:'s6', productId:'p_arepa_reina', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_arepa_reina')! },
  { id:'sp_s6_empanada', sellerId:'s6', productId:'p_emp_queso', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_emp_queso')! },
  { id:'sp_s6_completo', sellerId:'s6', productId:'p_completo', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_completo')! },
  { id:'sp_s6_harina', sellerId:'s6', productId:'p_harina_pan', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_harina_pan')! },
  { id:'sp_s6_malta', sellerId:'s6', productId:'p_malta', stock:40, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_malta')! },

  // VENDEDOR 7: Comidas Rápidas Express (comidas rápidas y snacks)
  { id:'sp_s7_perro', sellerId:'s7', productId:'p_perro_caliente', stock:50, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_perro_caliente')! },
  { id:'sp_s7_hamburguesa', sellerId:'s7', productId:'p_hamburguesa', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_hamburguesa')! },
  { id:'sp_s7_salchipapa', sellerId:'s7', productId:'p_salchipapa', stock:40, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_salchipapa')! },
  { id:'sp_s7_papa_rellena', sellerId:'s7', productId:'p_papa_rellena', stock:35, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_papa_rellena')! },
  { id:'sp_s7_papas_fritas', sellerId:'s7', productId:'p_papas_fritas', stock:60, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_papas_fritas')! },
  { id:'sp_s7_tacos', sellerId:'s7', productId:'p_tacos_mexicanos', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_tacos_mexicanos')! },
  { id:'sp_s7_quesadilla', sellerId:'s7', productId:'p_quesadilla', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_quesadilla')! },
  { id:'sp_s7_burrito', sellerId:'s7', productId:'p_burrito', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_burrito')! },
  { id:'sp_s7_wrap', sellerId:'s7', productId:'p_wrap_pollo', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_wrap_pollo')! },
  { id:'sp_s7_sandwich', sellerId:'s7', productId:'p_sandwich_cubano', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_sandwich_cubano')! },

  // VENDEDOR 8: Almuerzos Ejecutivos (comidas ejecutivas y almuerzos)
  { id:'sp_s8_almuerzo', sellerId:'s8', productId:'p_almuerzo_ejecutivo', stock:40, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_almuerzo_ejecutivo')! },
  { id:'sp_s8_lasagna', sellerId:'s8', productId:'p_lasagna', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_lasagna')! },
  { id:'sp_s8_ensalada', sellerId:'s8', productId:'p_ensalada_cesar', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_ensalada_cesar')! },
  { id:'sp_s8_pollo_broaster', sellerId:'s8', productId:'p_pollo_broaster', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pollo_broaster')! },
  { id:'sp_s8_arroz_chino', sellerId:'s8', productId:'p_arroz_chino', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_arroz_chino')! },
  { id:'sp_s8_pizza', sellerId:'s8', productId:'p_pizza_margherita', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pizza_margherita')! },
  { id:'sp_s8_sopa_pollo', sellerId:'s8', productId:'p_sopa_pollo', stock:35, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_sopa_pollo')! },
  { id:'sp_s8_sopa_verduras', sellerId:'s8', productId:'p_sopa_verduras', stock:30, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_sopa_verduras')! },
  { id:'sp_s8_pastel_choclo', sellerId:'s8', productId:'p_pastel_choclo', stock:18, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_pastel_choclo')! },
  { id:'sp_s8_empanada_pino', sellerId:'s8', productId:'p_empanada_pino', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_empanada_pino')! },

  // VENDEDOR 9: Parrilla y Mariscos (parrillas, mariscos y comidas especiales)
  { id:'sp_s9_parrilla', sellerId:'s9', productId:'p_parrilla_mixta', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_parrilla_mixta')! },
  { id:'sp_s9_cazuela', sellerId:'s9', productId:'p_cazuela_mariscos', stock:12, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_cazuela_mariscos')! },
  { id:'sp_s9_ceviche', sellerId:'s9', productId:'p_ceviche', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_ceviche')! },
  { id:'sp_s9_paila', sellerId:'s9', productId:'p_paila_marina', stock:10, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_paila_marina')! },
  { id:'sp_s9_chicharron', sellerId:'s9', productId:'p_chicharron_guacamole', stock:18, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_chicharron_guacamole')! },
  { id:'sp_s9_yuca', sellerId:'s9', productId:'p_yuca_frita', stock:25, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_yuca_frita')! },
  { id:'sp_s9_cachapa', sellerId:'s9', productId:'p_cachapa', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_cachapa')! },
  { id:'sp_s9_arepa_huevo', sellerId:'s9', productId:'p_arepa_huevo', stock:15, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_arepa_huevo')! },
  { id:'sp_s9_empanada_ven', sellerId:'s9', productId:'p_empanada_venezolana', stock:22, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_empanada_venezolana')! },
  { id:'sp_s9_empanada_col', sellerId:'s9', productId:'p_empanada_colombiana', stock:20, active:true, product: GLOBAL_PRODUCTS.find(p=>p.id==='p_empanada_colombiana')! },
];

const inventoryImpl: SellerInventoryRepo = {
  async list(sellerId) {
    return SELLER_PRODUCTS.filter(sp => sp.sellerId === sellerId).map(sp => ({ ...sp }));
  },
  async add(sellerId, productId, stock) {
    const exists = SELLER_PRODUCTS.find(sp => sp.sellerId===sellerId && sp.productId===productId);
    const product = GLOBAL_PRODUCTS.find(p => p.id === productId);
    if(!product) throw new Error('product not found');
    if (exists) {
      // si ya existe, solo actualiza stock y active
      exists.stock = Number(stock||0);
      exists.active = true;
      return { ...exists };
    }
    const row: SellerProductRow = {
      id: crypto.randomUUID(),
      sellerId, productId,
      stock: Number(stock||0),
      active: true,
      product
    };
    SELLER_PRODUCTS.push(row);
    return { ...row };
  },
  async update(sellerId, sellerProductId, patch) {
    const idx = SELLER_PRODUCTS.findIndex(sp => sp.id===sellerProductId && sp.sellerId===sellerId);
    if (idx < 0) throw new Error('not found');
    SELLER_PRODUCTS[idx] = { ...SELLER_PRODUCTS[idx], ...patch };
  },
  async remove(sellerId, sellerProductId) {
    SELLER_PRODUCTS = SELLER_PRODUCTS.filter(sp => !(sp.id===sellerProductId && sp.sellerId===sellerId));
  }
};

// ====== Órdenes y descuento de stock ======
let ORDERS: OrderDTO[] = [];

function priceEffective(p: ProductDTO) {
  return p.priceCents - (p.discountCents || 0);
}

const ordersImpl: OrderRepo = {
  async create({ sellerId, items, paymentMethod, buyerName, buyerPhone }) {
    // Validar stock y calcular totales
    let total = 0;
    const orderItems = items.map(it => {
      const sp = SELLER_PRODUCTS.find(x => x.id===it.sellerProductId && x.sellerId===sellerId && x.active);
      if(!sp) throw new Error('sellerProduct not found/active');
      if(sp.stock < it.qty) throw new Error('stock insuficiente');
      const pe = priceEffective(sp.product);
      total += pe * it.qty;
      return {
        sellerProductId: sp.id,
        productId: sp.productId,
        qty: it.qty,
        priceCents: sp.product.priceCents,
        discountCents: sp.product.discountCents || 0
      };
    });

    // Descontar stock SOLO de este vendedor
    for (const it of items) {
      const idx = SELLER_PRODUCTS.findIndex(x => x.id===it.sellerProductId && x.sellerId===sellerId);
      SELLER_PRODUCTS[idx].stock -= it.qty;
      if (SELLER_PRODUCTS[idx].stock <= 0) SELLER_PRODUCTS[idx].stock = 0;
    }

    const order: OrderDTO = {
      id: crypto.randomUUID(),
      sellerId,
      buyerId: null,
      createdAt: new Date().toISOString(),
      items: orderItems,
      paymentMethod,
      totalCents: total,
      buyerName, buyerPhone
    };
    ORDERS.push(order);
    return order;
  },

  async listBySeller(sellerId, sinceDays=7) {
    const since = Date.now() - sinceDays*86400000;
    return ORDERS.filter(o => o.sellerId===sellerId && new Date(o.createdAt).getTime() >= since);
  },

  async statsBySeller(sellerId) {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const last7 = Date.now() - 7*86400000;

    const vendorOrders = ORDERS.filter(o => o.sellerId===sellerId);
    const today = vendorOrders.filter(o => new Date(o.createdAt).getTime() >= startToday);
    const week = vendorOrders.filter(o => new Date(o.createdAt).getTime() >= last7);

    // low stock (<5)
    const lowStock = SELLER_PRODUCTS
      .filter(sp => sp.sellerId===sellerId && sp.stock < 5)
      .map(sp => ({ id: sp.id, stock: sp.stock, title: sp.product.title }));

    // top products (últimos 7 días)
    const mapTop = new Map<string, { productId:string; title:string; count:number; totalCents:number }>();
    for (const o of week) {
      for (const it of o.items) {
        const p = GLOBAL_PRODUCTS.find(g => g.id===it.productId)!;
        const pe = (it.priceCents - (it.discountCents||0)) * it.qty;
        const cur = mapTop.get(it.productId) || { productId: it.productId, title: p.title, count:0, totalCents:0 };
        cur.count += it.qty; cur.totalCents += pe;
        mapTop.set(it.productId, cur);
      }
    }
    const topProducts = [...mapTop.values()].sort((a,b)=> b.count - a.count).slice(0,5);

    // customers (conteo por nombre/teléfono en todas las órdenes)
    const mapCust = new Map<string, { buyerName: string; buyerPhone?: string; orders:number; lastAt:string }>();
    for (const o of vendorOrders) {
      const key = (o.buyerName||'Cliente') + '|' + (o.buyerPhone||'');
      const prev = mapCust.get(key) || { buyerName:o.buyerName||'Cliente', buyerPhone:o.buyerPhone, orders:0, lastAt:o.createdAt };
      prev.orders += 1; if (o.createdAt > prev.lastAt) prev.lastAt = o.createdAt;
      mapCust.set(key, prev);
    }

    const stats: StatsDTO = {
      todayCount: today.length,
      todayTotalCents: today.reduce((s,o)=>s+o.totalCents,0),
      weekCount: week.length,
      weekTotalCents: week.reduce((s,o)=>s+o.totalCents,0),
      lowStock,
      topProducts,
      customers: [...mapCust.values()].sort((a,b)=> b.orders - a.orders).slice(0,10)
    };
    return stats;
  }
};

// ====== COMPATIBILIDAD CON SISTEMA ANTERIOR ======

// Datos mock en memoria para compatibilidad
let mockProducts: any[] = [];
let mockCategories: any[] = [];
let mockSellers: any[] = [];
let mockUsers: any[] = [];
let mockSellerProducts: any[] = [];

// Usuario mock inicial para testing
const mockUser: any = {
  id: 'user-1',
  name: 'Usuario Demo',
  phone: '123456789',
  passwordHash: 'hashed_password',
  role: 'CUSTOMER',
  points: 0,
  createdAt: new Date()
};

// Cargar datos iniciales para compatibilidad
async function loadMockData() {
  try {
    // Convertir GLOBAL_PRODUCTS al formato anterior
    mockProducts = GLOBAL_PRODUCTS.map((p, index) => ({
      id: index + 1,
      name: p.title,
      slug: p.title.toLowerCase().replace(/\s+/g, '-'),
      description: `Descripción de ${p.title}`,
      categoryId: p.category === 'comida' ? 1 : p.category === 'ropa' ? 2 : 3,
      origin: p.origin,
      priceCents: p.priceCents,
      discountCents: p.discountCents || 0,
      imageUrl: p.imageUrl,
      active: p.active,
      rating: 4.5,
      stock: 10,
      createdAt: new Date()
    }));

    mockCategories = [
      { id: 1, name: 'comida', slug: 'comida' },
      { id: 2, name: 'ropa', slug: 'ropa' },
      { id: 3, name: 'tecnologia', slug: 'tecnologia' }
    ];

    // Agregar usuario mock inicial
    if (!mockUsers.find(u => u.id === mockUser.id)) {
      mockUsers.push(mockUser);
    }
  } catch (error) {
    console.warn('No se pudieron cargar los datos mock:', error);
  }
}

// Inicializar datos
loadMockData();

// Implementación mock de ProductRepo (compatibilidad)
export const mockProductRepo: any = {
  async findMany(filters: any = {}) {
    let products = [...mockProducts];

    if (filters.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters.active !== undefined) {
      products = products.filter(p => p.active === filters.active);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    // Agregar categoría a cada producto
    return products.map(p => {
      const category = mockCategories.find(c => c.id === p.categoryId);
      return {
        ...p,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : undefined
      };
    });
  },

  async findById(id: string) {
    const product = mockProducts.find(p => p.id.toString() === id);
    if (!product) return null;

    // Agregar categoría si existe
    const category = mockCategories.find(c => c.id === product.categoryId);
    return {
      ...product,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : undefined
    };
  },

  async findBySlug(slug: string) {
    const product = mockProducts.find(p => p.slug === slug);
    if (!product) return null;

    const category = mockCategories.find(c => c.id === product.categoryId);
    return {
      ...product,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : undefined
    };
  },

  async search(query: string, categoryName?: string) {
    let products = [...mockProducts];

    if (categoryName) {
      const category = mockCategories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
      if (category) {
        products = products.filter(p => p.categoryId === category.id);
      } else {
        return []; // No products if category not found
      }
    }

    if (query) {
      const search = query.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    return products.map(p => {
      const cat = mockCategories.find(c => c.id === p.categoryId);
      return {
        ...p,
        category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : undefined
      };
    });
  }
};

// Implementación mock de SellerRepo (compatibilidad)
export const mockSellerRepo: any = {
  async findByUserId(userId: string) {
    return mockSellers.find(s => s.userId === userId) || null;
  },

  async create(data: any) {
    const seller: any = {
      id: `seller-${Date.now()}`,
      ...data,
      online: false,
      deliveryEnabled: true,
      createdAt: new Date()
    };
    mockSellers.push(seller);
    return seller;
  },

  async update(userId: string, data: any) {
    const index = mockSellers.findIndex(s => s.userId === userId);
    if (index === -1) throw new Error('Seller not found');

    mockSellers[index] = { ...mockSellers[index], ...data };
    return mockSellers[index];
  }
};

// Implementación mock de SellerProductRepo (compatibilidad)
export const mockSellerProductRepo: any = {
  async findBySellerId(sellerId: string) {
    const sellerProducts = mockSellerProducts.filter(sp => sp.sellerId === sellerId);
    
    // Agregar datos del producto
    return sellerProducts.map(sp => {
      const product = mockProducts.find(p => p.id.toString() === sp.productId);
      if (!product) throw new Error(`Product with ID ${sp.productId} not found for SellerProduct ${sp.id}`);
      
      const category = mockCategories.find(c => c.id === product.categoryId);
      return {
        ...sp,
        product: {
          ...product,
          category: category ? { id: category.id, name: category.name, slug: category.slug } : undefined
        }
      };
    });
  },

  async add(sellerId: string, productId: string, stock: number) {
    const existing = mockSellerProducts.find(sp => 
      sp.sellerId === sellerId && sp.productId === productId
    );
    
    if (existing) {
      existing.stock = stock;
      existing.active = true;
      return existing;
    }
    
    const product = mockProducts.find(p => p.id.toString() === productId);
    if (!product) throw new Error('Product not found');
    
    const sellerProduct: any = {
      id: `sp-${Date.now()}`,
      sellerId,
      productId,
      stock,
      active: true,
      product
    };
    
    mockSellerProducts.push(sellerProduct);
    return sellerProduct;
  },

  async update(id: string, data: any) {
    const index = mockSellerProducts.findIndex(sp => sp.id === id);
    if (index === -1) throw new Error('SellerProduct not found');
    
    mockSellerProducts[index] = { ...mockSellerProducts[index], ...data };
    return mockSellerProducts[index];
  },

  async remove(id: string) {
    const index = mockSellerProducts.findIndex(sp => sp.id === id);
    if (index === -1) throw new Error('SellerProduct not found');
    
    mockSellerProducts.splice(index, 1);
  },

  async findBySellerAndProduct(sellerId: string, productId: string) {
    return mockSellerProducts.find(sp => 
      sp.sellerId === sellerId && sp.productId === productId
    ) || null;
  }
};

// Implementación mock de UserRepo (compatibilidad)
export const mockUserRepo: any = {
  async findById(id: string) {
    return mockUsers.find(u => u.id === id) || null;
  },

  async findByPhone(phone: string) {
    return mockUsers.find(u => u.phone === phone) || null;
  },

  async create(data: any) {
    const user: any = {
      id: `user-${Date.now()}`,
      ...data,
      role: data.role || 'CUSTOMER',
      points: 0,
      createdAt: new Date()
    };
    mockUsers.push(user);
    return user;
  },

  async update(id: string, data: any) {
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  }
};

// Implementación mock de CategoryRepo (compatibilidad)
export const mockCategoryRepo: any = {
  async findMany() {
    return [...mockCategories];
  },

  async findById(id: number) {
    return mockCategories.find(c => c.id === id) || null;
  },

  async findByName(name: string) {
    return mockCategories.find(c => c.name === name) || null;
  },

  async create(name: string) {
    const category: any = {
      id: Date.now(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    };
    mockCategories.push(category);
    return category;
  }
};

// ====== SISTEMA DE DISPONIBILIDAD DE VENDEDORES (compatibilidad) ======

// Helpers de horario y online simples
function nowInTZ(_tz: string) {
  // simplificado: por ahora usamos la hora local; más adelante: luxon
  return new Date();
}

function isOpenCompat(hoursJson: any, tz = 'America/Santiago') {
  const now = nowInTZ(tz);
  const dayIdx = now.getDay(); // 0..6 (dom..sab)
  const keys = ['sun','mon','tue','wed','thu','fri','sat'];
  const key = keys[dayIdx];
  const span = hoursJson?.[key]; // ej [9,22]
  if (!span) return false;
  const hour = now.getHours() + now.getMinutes()/60;
  return hour >= span[0] && hour < span[1];
}

function isOnlineCompat(manual: boolean, lastSeen?: Date, maxIdleMs = 120000) {
  if (!manual) return false;
  if (!lastSeen) return manual;
  return Date.now() - new Date(lastSeen).getTime() < maxIdleMs;
}

// MOCK de vendedores con estado
let sellersMock: Array<any> = [
  {
    id: 's1', 
    storeName: 'Sabor Zuliano', 
    online: false,
    onlineManual: true,
    timezone: 'America/Santiago',
    hoursJson: { 
      mon:[9,22], tue:[9,22], wed:[9,22], thu:[9,22], 
      fri:[9,23], sat:[10,23], sun:[10,20] 
    }
  },
  {
    id: 's2', 
    storeName: 'Ropax', 
    online: true,
    onlineManual: false,
    timezone: 'America/Santiago',
    hoursJson: { 
      mon:[10,20], tue:[10,20], wed:[10,20], thu:[10,20], 
      fri:[10,20], sat:[11,19], sun:null 
    }
  }
];

function projectSellerCompat(s: any): any {
  const open = isOpenCompat(s.hoursJson, s.timezone);
  const online = isOnlineCompat(s.onlineManual, s.lastSeen);
  const available = open && online;
  return { 
    id: s.id, 
    storeName: s.storeName, 
    open, 
    online, 
    available 
  };
}

// ====== Autenticación de vendedores ======
export const sellerAuthRepo = {
  async login(username: string, password: string) {
    const user = SELLER_USERS.find(u => u.username === username && u.password === password && u.active);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    
    // Actualizar último acceso
    const seller = SELLERS.find(s => s.id === user.sellerId);
    if (seller) {
      seller.lastSeen = new Date();
    }
    
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        sellerId: user.sellerId,
        role: user.role
      },
      seller: seller ? {
        id: seller.id,
        storeName: seller.storeName,
        online: seller.onlineManual,
        open: isOpen(seller.hoursJson),
        available: isOpen(seller.hoursJson) && seller.onlineManual
      } : null
    };
  },
  
  async getUserByUsername(username: string) {
    return SELLER_USERS.find(u => u.username === username);
  },
  
  async getUserById(userId: string) {
    return SELLER_USERS.find(u => u.id === userId);
  },
  
  async getSellerByUserId(userId: string) {
    const user = SELLER_USERS.find(u => u.id === userId);
    if (!user) return null;
    return SELLERS.find(s => s.id === user.sellerId);
  }
};

// Repositorio de estado mock (compatibilidad)
export const sellerStatusRepo: any = {
  async list() {
    return sellersMock.map(projectSellerCompat);
  },
  
  async toggleOnline(sellerId: string, online: boolean) {
    const s = sellersMock.find(x => x.id === sellerId);
    if (!s) throw new Error('seller not found');
    s.onlineManual = !!online;
    s.lastSeen = new Date();
    return projectSellerCompat(s);
  },
  
  async heartbeat(sellerId: string) {
    const s = sellersMock.find(x => x.id === sellerId);
    if (!s) throw new Error('seller not found');
    s.lastSeen = new Date();
    return projectSellerCompat(s);
  }
};

// ====== Export impl agrupada ======
const impl = {
  products: productsImpl,
  inventory: inventoryImpl,
  orders: ordersImpl,
  status: statusImpl
};
export default impl;
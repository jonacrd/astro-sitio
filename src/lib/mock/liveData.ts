export type Seller = {
  id: string;
  name: string;
  online: boolean;
  delivery: boolean;
};

export type Product = {
  id: string;
  title: string;
  category: 'comida' | 'postres' | 'minimarket' | 'bebidas' | 'alcohol' | 'servicios';
  priceCents: number;
  imageUrl?: string | null;
};

export type SellerStock = {
  sellerId: string;
  productId: string;
  stock: number;
  active: boolean;
};

export const SELLERS: Seller[] = [
  { id: 's1', name: 'Sabor Zuliano', online: true,  delivery: true  },
  { id: 's2', name: 'Ropax',         online: false, delivery: false },
  { id: 's3', name: 'Don Pancho',    online: true,  delivery: true  },
  { id: 's4', name: 'Carnes del Zulia', online: true, delivery: true },
  { id: 's5', name: 'Postres y Dulces', online: true, delivery: true },
  { id: 's6', name: 'Sabores Tradicionales', online: true, delivery: true },
  { id: 's7', name: 'Comidas Rápidas Express', online: true, delivery: true },
  { id: 's8', name: 'Almuerzos Ejecutivos', online: true, delivery: true },
  { id: 's9', name: 'Parrilla y Mariscos', online: true, delivery: true },
];

export const PRODUCTS: Product[] = [
  { id: 'p_emp_queso',  title:'Empanada de queso',      category:'comida',     priceCents:1500, imageUrl:null },
  { id: 'p_arepa',      title:'Arepa reina pepiada',    category:'comida',     priceCents:2500, imageUrl:null },
  { id: 'p_malta',      title:'Malta 355ml',            category:'bebidas',    priceCents:2200, imageUrl:null },
  { id: 'p_polera',     title:'Polera básica',          category:'minimarket', priceCents:5990, imageUrl:null },
  { id: 'p_corte',      title:'Corte de Cabello',       category:'servicios',  priceCents:8000, imageUrl:null },
  { id: 'p_perro_caliente', title:'Perro Caliente', category:'comida', priceCents:2000, imageUrl:null },
  { id: 'p_hamburguesa', title:'Hamburguesa Clásica', category:'comida', priceCents:3500, imageUrl:null },
  { id: 'p_salchipapa', title:'Salchipapa', category:'comida', priceCents:2800, imageUrl:null },
  { id: 'p_empanada_venezolana', title:'Empanada Venezolana', category:'comida', priceCents:1800, imageUrl:null },
  { id: 'p_arepa_huevo', title:'Arepa de Huevo', category:'comida', priceCents:2000, imageUrl:null },
  { id: 'p_cachapa', title:'Cachapa', category:'comida', priceCents:2500, imageUrl:null },
  { id: 'p_parrilla_mixta', title:'Parrilla Mixta', category:'comida', priceCents:4500, imageUrl:null },
  { id: 'p_sopa_pollo', title:'Sopa de Pollo', category:'comida', priceCents:2200, imageUrl:null },
  { id: 'p_lasagna', title:'Lasaña', category:'comida', priceCents:4200, imageUrl:null },
  { id: 'p_cerveza_polar', title:'Cerveza Polar 355ml', category:'alcohol', priceCents:1800, imageUrl:null },
  { id: 'p_ron_cacique', title:'Ron Cacique 500ml', category:'alcohol', priceCents:4500, imageUrl:null },
  { id: 'p_whisky_johnnie', title:'Whisky Johnnie Walker 750ml', category:'alcohol', priceCents:25000, imageUrl:null },
  { id: 'p_tres_leches', title:'Torta Tres Leches', category:'postres', priceCents:3500, imageUrl:null },
  { id: 'p_quesillo', title:'Quesillo Venezolano', category:'postres', priceCents:2800, imageUrl:null },
  { id: 'p_harina_pan', title:'Harina PAN 1kg', category:'minimarket', priceCents:2800, imageUrl:null },
  { id: 'p_manicure', title:'Manicure Completa', category:'servicios', priceCents:5000, imageUrl:null },
  { id: 'p_revision_motor', title:'Revisión de Motor', category:'servicios', priceCents:25000, imageUrl:null },
  { id: 'p_alarma_auto', title:'Instalación de Alarma', category:'servicios', priceCents:80000, imageUrl:null },
];

export const STOCKS: SellerStock[] = [
  { sellerId:'s1', productId:'p_emp_queso', stock:12, active:true },
  { sellerId:'s1', productId:'p_arepa',     stock:7,  active:true },
  { sellerId:'s1', productId:'p_malta',     stock:24, active:true },

  { sellerId:'s2', productId:'p_polera',    stock:5,  active:true },

  { sellerId:'s3', productId:'p_emp_queso', stock:4,  active:true },
  { sellerId:'s3', productId:'p_corte',     stock:3,  active:true },

  // Carnes del Zulia (s4) - comidas
  { sellerId:'s4', productId:'p_perro_caliente', stock:15, active:true },
  { sellerId:'s4', productId:'p_hamburguesa', stock:8, active:true },
  { sellerId:'s4', productId:'p_parrilla_mixta', stock:6, active:true },
  
  // Postres y Dulces (s5) - postres
  { sellerId:'s5', productId:'p_tres_leches', stock:12, active:true },
  { sellerId:'s5', productId:'p_quesillo', stock:10, active:true },
  
  // Sabores Tradicionales (s6) - comida tradicional
  { sellerId:'s6', productId:'p_empanada_venezolana', stock:20, active:true },
  { sellerId:'s6', productId:'p_arepa_huevo', stock:18, active:true },
  { sellerId:'s6', productId:'p_cachapa', stock:14, active:true },
  { sellerId:'s6', productId:'p_malta', stock:25, active:true },
  { sellerId:'s6', productId:'p_harina_pan', stock:30, active:true },
  
  // Comidas Rápidas Express (s7) - comida rápida
  { sellerId:'s7', productId:'p_salchipapa', stock:12, active:true },
  { sellerId:'s7', productId:'p_sopa_pollo', stock:8, active:true },
  
  // Almuerzos Ejecutivos (s8) - comida ejecutiva
  { sellerId:'s8', productId:'p_lasagna', stock:7, active:true },
  
  // Parrilla y Mariscos (s9) - parrilla
  { sellerId:'s9', productId:'p_parrilla_mixta', stock:4, active:true }
];

export const price = (cents:number)=> `$${(cents/100).toFixed(2)}`;






import { DATA_MODE } from '../config';

// ====== TIPOS DE DOMINIO ======

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export interface ProductDTO {
  id: string;
  slug?: string;
  title: string;
  category: string;
  origin?: string;
  priceCents: number;
  discountCents?: number;
  imageUrl?: string | null;
  active: boolean;
}

export interface SellerDTO {
  id: string;
  storeName: string;
  online: boolean;
}

export interface SellerProductDTO {
  id: string;           // id del item de inventario (SellerProduct)
  productId: string;    // id del Product global
  sellerId: string;
  stock: number;
  active: boolean;
  product: ProductDTO;  // embebido para pintar cards
}

export interface OrderItemDTO {
  sellerProductId: string;
  productId: string;
  qty: number;
  priceCents: number;        // precio a la hora de vender
  discountCents?: number;
}

export interface OrderDTO {
  id: string;
  sellerId: string;
  buyerId?: string | null;   // opcional en mock
  createdAt: string;         // ISO
  items: OrderItemDTO[];
  paymentMethod: PaymentMethod;
  totalCents: number;
  buyerName?: string;
  buyerPhone?: string;
}

export interface StatsDTO {
  todayCount: number;
  todayTotalCents: number;
  weekCount: number;
  weekTotalCents: number;
  lowStock: Array<Pick<SellerProductDTO,'id'|'stock'> & { title: string }>;
  topProducts: Array<{ productId: string; title: string; count: number; totalCents: number }>;
  customers: Array<{ buyerName: string; buyerPhone?: string; orders: number; lastAt: string }>;
}

// ====== INTERFACES DE REPOSITORIOS ======

export interface ProductRepo {
  globalList(params?: { q?: string; category?: string; limit?: number }): Promise<ProductDTO[]>;
}

export interface SellerInventoryRepo {
  list(sellerId: string): Promise<SellerProductDTO[]>;
  add(sellerId: string, productId: string, stock: number): Promise<SellerProductDTO>;
  update(sellerId: string, sellerProductId: string, patch: Partial<Pick<SellerProductDTO,'stock'|'active'>>): Promise<void>;
  remove(sellerId: string, sellerProductId: string): Promise<void>;
}

export interface OrderRepo {
  create(order: {
    sellerId: string;
    items: Array<{ sellerProductId: string; qty: number }>;
    paymentMethod: PaymentMethod;
    buyerName?: string;
    buyerPhone?: string;
  }): Promise<OrderDTO>;
  listBySeller(sellerId: string, sinceDays?: number): Promise<OrderDTO[]>;
  statsBySeller(sellerId: string): Promise<StatsDTO>;
}

export interface StatusRepo {
  list(): Promise<Array<{ id:string; storeName:string; open:boolean; online:boolean; available:boolean }>>;
  toggleOnline(sellerId: string, online: boolean): Promise<{ id:string; storeName:string; open:boolean; online:boolean; available:boolean }>;
}

// ====== EXPORTACIÓN DE REPOSITORIOS ======

// Importar implementación mock directamente
import mockImpl from './mockImpl';

export const repos = mockImpl;

// ====== COMPATIBILIDAD CON SISTEMA ANTERIOR ======

// Mantener interfaces anteriores para no romper código existente
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  origin?: string;
  priceCents: number;
  discountCents: number;
  imageUrl?: string;
  active: boolean;
  rating: number;
  stock: number;
  createdAt: Date;
}

export interface SellerProduct {
  id: string;
  sellerId: string;
  productId: string;
  stock: number;
  active: boolean;
  product: Product;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  comuna: string;
  ciudad: string;
  phoneContact: string;
  online: boolean;
  deliveryEnabled: boolean;
  deliveryETA?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  points: number;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface SellerStatusDTO { 
  id: string; 
  storeName: string; 
  open: boolean; 
  online: boolean; 
  available: boolean; 
}

export interface SellerStatusRepo {
  list(): Promise<SellerStatusDTO[]>;
  toggleOnline(sellerId: string, online: boolean): Promise<SellerStatusDTO>;
  heartbeat(sellerId: string): Promise<SellerStatusDTO>;
}

// Interfaces de repositorios anteriores (para compatibilidad)
export interface ProductRepoLegacy {
  findMany(filters?: {
    categoryId?: number;
    active?: boolean;
    search?: string;
  }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  search(query: string, category?: string): Promise<Product[]>;
}

export interface SellerRepo {
  findByUserId(userId: string): Promise<Seller | null>;
  create(data: {
    userId: string;
    storeName: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    comuna: string;
    ciudad: string;
    phoneContact: string;
  }): Promise<Seller>;
  update(userId: string, data: Partial<Seller>): Promise<Seller>;
}

export interface SellerProductRepo {
  findBySellerId(sellerId: string): Promise<SellerProduct[]>;
  add(sellerId: string, productId: string, stock: number): Promise<SellerProduct>;
  update(id: string, data: { stock?: number; active?: boolean }): Promise<SellerProduct>;
  remove(id: string): Promise<void>;
  findBySellerAndProduct(sellerId: string, productId: string): Promise<SellerProduct | null>;
}

export interface UserRepo {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  create(data: {
    name: string;
    phone: string;
    passwordHash: string;
    role?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

export interface CategoryRepo {
  findMany(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  create(name: string): Promise<Category>;
}

// Cargar implementación dinámicamente para compatibilidad
let productRepo: ProductRepoLegacy;
let sellerRepo: SellerRepo;
let sellerProductRepo: SellerProductRepo;
let userRepo: UserRepo;
let categoryRepo: CategoryRepo;
let sellerStatusRepo: SellerStatusRepo;

if (DATA_MODE === 'prisma') {
  // Cargar implementación de Prisma solo en runtime server
  const { prismaProductRepo, prismaSellerRepo, prismaSellerProductRepo, prismaUserRepo, prismaCategoryRepo } = await import('./prismaImpl');
  productRepo = prismaProductRepo;
  sellerRepo = prismaSellerRepo;
  sellerProductRepo = prismaSellerProductRepo;
  userRepo = prismaUserRepo;
  categoryRepo = prismaCategoryRepo;
  // TODO: Implementar prismaSellerStatusRepo cuando sea necesario
  sellerStatusRepo = {
    async list() { return []; },
    async toggleOnline() { throw new Error('Not implemented in Prisma mode yet'); },
    async heartbeat() { throw new Error('Not implemented in Prisma mode yet'); }
  };
} else {
  // Cargar implementación mock
  const { mockProductRepo, mockSellerRepo, mockSellerProductRepo, mockUserRepo, mockCategoryRepo, sellerStatusRepo: mockSellerStatusRepo } = await import('./mockImpl');
  productRepo = mockProductRepo;
  sellerRepo = mockSellerRepo;
  sellerProductRepo = mockSellerProductRepo;
  userRepo = mockUserRepo;
  categoryRepo = mockCategoryRepo;
  sellerStatusRepo = mockSellerStatusRepo;
}

export { productRepo, sellerRepo, sellerProductRepo, userRepo, categoryRepo, sellerStatusRepo };
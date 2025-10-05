import type { 
  Product, 
  Seller, 
  SellerProduct, 
  User, 
  Category,
  ProductRepo,
  SellerRepo,
  SellerProductRepo,
  UserRepo,
  CategoryRepo
} from './index';

// Importar Prisma solo en runtime server
let prisma: any = null;

async function getPrisma() {
  if (!prisma) {
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when using Prisma mode');
    }
    
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

// Implementación Prisma de ProductRepo
export const prismaProductRepo: ProductRepo = {
  async findMany(filters = {}) {
    const db = await getPrisma();
    
    const where: any = {};
    
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return products.map(p => ({
      ...p,
      category: p.category ? { id: p.category.id, name: p.category.name } : undefined
    }));
  },

  async findById(id: string) {
    const db = await getPrisma();
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true }
    });
    
    if (!product) return null;
    
    return {
      ...product,
      category: product.category ? { id: product.category.id, name: product.category.name } : undefined
    };
  },

  async findBySlug(slug: string) {
    const db = await getPrisma();
    const product = await db.product.findUnique({
      where: { slug },
      include: { category: true }
    });
    
    if (!product) return null;
    
    return {
      ...product,
      category: product.category ? { id: product.category.id, name: product.category.name } : undefined
    };
  },

  async search(query: string, category?: string) {
    const db = await getPrisma();
    
    const where: any = { active: true };
    
    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } };
    }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    const products = await db.product.findMany({
      where,
      include: { category: true },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    
    return products.map(p => ({
      ...p,
      category: p.category ? { id: p.category.id, name: p.category.name } : undefined
    }));
  }
};

// Implementación Prisma de SellerRepo
export const prismaSellerRepo: SellerRepo = {
  async findByUserId(userId: string) {
    const db = await getPrisma();
    return await db.seller.findUnique({
      where: { userId }
    });
  },

  async create(data) {
    const db = await getPrisma();
    return await db.seller.create({
      data: {
        ...data,
        online: false,
        deliveryEnabled: true
      }
    });
  },

  async update(userId: string, data) {
    const db = await getPrisma();
    return await db.seller.update({
      where: { userId },
      data
    });
  }
};

// Implementación Prisma de SellerProductRepo
export const prismaSellerProductRepo: SellerProductRepo = {
  async findBySellerId(sellerId: string) {
    const db = await getPrisma();
    const rows = await db.sellerProduct.findMany({
      where: { sellerId },
      include: { 
        product: { 
          include: { category: true } 
        } 
      },
      orderBy: { id: 'desc' }
    });
    
    return rows.map(sp => ({
      ...sp,
      product: {
        ...sp.product,
        category: sp.product.category ? { 
          id: sp.product.category.id, 
          name: sp.product.category.name 
        } : undefined
      }
    }));
  },

  async add(sellerId: string, productId: string, stock: number) {
    const db = await getPrisma();
    return await db.sellerProduct.upsert({
      where: { 
        sellerId_productId: { sellerId, productId } 
      },
      update: { stock, active: true },
      create: { sellerId, productId, stock, active: true },
      include: { product: { include: { category: true } } }
    });
  },

  async update(id: string, data) {
    const db = await getPrisma();
    return await db.sellerProduct.update({
      where: { id },
      data
    });
  },

  async remove(id: string) {
    const db = await getPrisma();
    await db.sellerProduct.delete({
      where: { id }
    });
  },

  async findBySellerAndProduct(sellerId: string, productId: string) {
    const db = await getPrisma();
    return await db.sellerProduct.findUnique({
      where: { 
        sellerId_productId: { sellerId, productId } 
      },
      include: { product: { include: { category: true } } }
    });
  }
};

// Implementación Prisma de UserRepo
export const prismaUserRepo: UserRepo = {
  async findById(id: string) {
    const db = await getPrisma();
    return await db.user.findUnique({
      where: { id }
    });
  },

  async findByPhone(phone: string) {
    const db = await getPrisma();
    return await db.user.findUnique({
      where: { phone }
    });
  },

  async create(data) {
    const db = await getPrisma();
    return await db.user.create({
      data: {
        ...data,
        role: data.role || 'CUSTOMER',
        points: 0
      }
    });
  },

  async update(id: string, data) {
    const db = await getPrisma();
    return await db.user.update({
      where: { id },
      data
    });
  }
};

// Implementación Prisma de CategoryRepo
export const prismaCategoryRepo: CategoryRepo = {
  async findMany() {
    const db = await getPrisma();
    return await db.category.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async findById(id: string) {
    const db = await getPrisma();
    return await db.category.findUnique({
      where: { id }
    });
  },

  async findByName(name: string) {
    const db = await getPrisma();
    return await db.category.findUnique({
      where: { name }
    });
  },

  async create(name: string) {
    const db = await getPrisma();
    return await db.category.create({
      data: { name }
    });
  }
};










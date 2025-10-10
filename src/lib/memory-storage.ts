// Almacenamiento compartido en memoria para desarrollo
// En producción, esto se reemplazaría con una base de datos real

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  online: boolean;
  deliveryEnabled: boolean;
  deliveryETA?: string;
  createdAt: Date;
}

// Arrays globales compartidos
export const users: User[] = [];
export const sellers: Seller[] = [];

// Funciones helper
export function findUserByPhone(phone: string): User | undefined {
  return users.find(u => u.phone === phone);
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date()
  };
  users.push(user);
  return user;
}

export function createSeller(sellerData: Omit<Seller, 'id' | 'createdAt'>): Seller {
  const seller: Seller = {
    id: 'seller_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...sellerData,
    createdAt: new Date()
  };
  sellers.push(seller);
  return seller;
}

export function findSellerByUserId(userId: string): Seller | undefined {
  return sellers.find(s => s.userId === userId);
}














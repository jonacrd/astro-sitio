// Repositorio en memoria para demo local
import type { Courier, Delivery, DeliveryOffer, OperationResult } from '../types';

// Singleton para mantener los datos entre requests
class MockDeliveryRepo {
  private static instance: MockDeliveryRepo;
  private couriers: Map<string, Courier> = new Map();
  private deliveries: Map<string, Delivery> = new Map();
  private offers: Map<string, DeliveryOffer> = new Map();
  private roundRobinIndex = 0;

  private constructor() {}

  static getInstance(): MockDeliveryRepo {
    if (!MockDeliveryRepo.instance) {
      MockDeliveryRepo.instance = new MockDeliveryRepo();
    }
    return MockDeliveryRepo.instance;
  }

  // Couriers
  async createCourier(courier: Omit<Courier, 'id' | 'updatedAt'>): Promise<OperationResult<Courier>> {
    // Generar UUID válido
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    console.log('🔍 createCourier called with:', courier);
    console.log('🔍 Generated ID:', id);
    
    const newCourier: Courier = {
      ...courier,
      id,
      updatedAt: new Date(),
    };
    
    this.couriers.set(id, newCourier);
    console.log('✅ Courier created and stored:', newCourier);
    console.log('🔍 Total couriers now:', this.couriers.size);
    
    return { success: true, data: newCourier };
  }

  async getCourier(id: string): Promise<OperationResult<Courier>> {
    const courier = this.couriers.get(id);
    if (!courier) {
      return { success: false, error: 'Courier not found' };
    }
    return { success: true, data: courier };
  }

  async updateCourier(id: string, updates: Partial<Courier>): Promise<OperationResult<Courier>> {
    console.log('🔍 updateCourier called with ID:', id);
    console.log('🔍 Available couriers:', Array.from(this.couriers.keys()));
    
    const courier = this.couriers.get(id);
    if (!courier) {
      console.log('❌ Courier not found for ID:', id);
      return { success: false, error: 'Courier not found' };
    }
    
    console.log('✅ Found courier:', courier);
    const updatedCourier = { ...courier, ...updates, updatedAt: new Date() };
    this.couriers.set(id, updatedCourier);
    console.log('✅ Updated courier:', updatedCourier);
    return { success: true, data: updatedCourier };
  }

  async getAvailableCouriers(): Promise<OperationResult<Courier[]>> {
    const available = Array.from(this.couriers.values())
      .filter(c => c.isActive && c.isAvailable);
    return { success: true, data: available };
  }

  async getCouriersCount(): Promise<number> {
    return this.couriers.size;
  }

  // Deliveries
  async createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<Delivery>> {
    // Generar UUID válido
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const now = new Date();
    const newDelivery: Delivery = {
      ...delivery,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.deliveries.set(id, newDelivery);
    return { success: true, data: newDelivery };
  }

  async getDelivery(id: string): Promise<OperationResult<Delivery>> {
    const delivery = this.deliveries.get(id);
    if (!delivery) {
      return { success: false, error: 'Delivery not found' };
    }
    return { success: true, data: delivery };
  }

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<OperationResult<Delivery>> {
    const delivery = this.deliveries.get(id);
    if (!delivery) {
      return { success: false, error: 'Delivery not found' };
    }
    
    const updatedDelivery = { ...delivery, ...updates, updatedAt: new Date() };
    this.deliveries.set(id, updatedDelivery);
    return { success: true, data: updatedDelivery };
  }

  // Offers
  async createOffer(offer: Omit<DeliveryOffer, 'id' | 'createdAt'>): Promise<OperationResult<DeliveryOffer>> {
    // Generar UUID válido
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const newOffer: DeliveryOffer = {
      ...offer,
      id,
      createdAt: new Date(),
    };
    this.offers.set(id, newOffer);
    return { success: true, data: newOffer };
  }

  async getOffer(id: string): Promise<OperationResult<DeliveryOffer>> {
    const offer = this.offers.get(id);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }
    return { success: true, data: offer };
  }

  async updateOffer(id: string, updates: Partial<DeliveryOffer>): Promise<OperationResult<DeliveryOffer>> {
    const offer = this.offers.get(id);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }
    
    const updatedOffer = { ...offer, ...updates };
    this.offers.set(id, updatedOffer);
    return { success: true, data: updatedOffer };
  }

  async getOffersByDelivery(deliveryId: string): Promise<OperationResult<DeliveryOffer[]>> {
    const offers = Array.from(this.offers.values())
      .filter(o => o.deliveryId === deliveryId);
    return { success: true, data: offers };
  }

  // Round-robin para asignación
  getNextCourier(couriers: Courier[]): Courier | null {
    if (couriers.length === 0) return null;
    
    const courier = couriers[this.roundRobinIndex % couriers.length];
    this.roundRobinIndex++;
    return courier;
  }

  // Limpiar datos (para testing)
  clear(): void {
    this.couriers.clear();
    this.deliveries.clear();
    this.offers.clear();
    this.roundRobinIndex = 0;
  }

  // Seed data para demo
  async seedDemoData(): Promise<void> {
    // Crear couriers de demo
    await this.createCourier({
      userId: 'demo_courier_1',
      name: 'Juan Pérez',
      phone: '+56912345678',
      isActive: true,
      isAvailable: true,
      lastLat: -33.4489,
      lastLng: -70.6693,
    });

    await this.createCourier({
      userId: 'demo_courier_2', 
      name: 'María González',
      phone: '+56987654321',
      isActive: true,
      isAvailable: true,
      lastLat: -33.4489,
      lastLng: -70.6693,
    });

    await this.createCourier({
      userId: 'demo_courier_3',
      name: 'Carlos Silva',
      phone: '+56911223344',
      isActive: true,
      isAvailable: false, // No disponible
      lastLat: -33.4489,
      lastLng: -70.6693,
    });
  }
}

// Singleton para mantener estado en memoria
export const mockRepo = MockDeliveryRepo.getInstance();

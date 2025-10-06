// Repositorio Supabase para producción
import { createClient } from '@supabase/supabase-js';
import type { Courier, Delivery, DeliveryOffer, OperationResult } from '../types';

class SupabaseDeliveryRepo {
  private supabase: any = null;

  constructor() {
    // Usar variables públicas para el cliente
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured - using mock mode');
      this.supabase = null;
      return;
    }
    
    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } catch (error) {
      console.warn('Failed to initialize Supabase client - using mock mode:', error);
      this.supabase = null;
    }
  }

  // Generar UUID válido
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Couriers
  async createCourier(courier: Omit<Courier, 'id' | 'updatedAt'>): Promise<OperationResult<Courier>> {
    if (!this.supabase) {
      // Modo mock
      const mockCourier: Courier = {
        id: this.generateUUID(),
        ...courier,
        updatedAt: new Date(),
      };
      return { success: true, data: mockCourier };
    }

    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .insert({
          user_id: courier.userId,
          name: courier.name,
          phone: courier.phone,
          is_active: courier.isActive,
          is_available: courier.isAvailable,
          last_lat: courier.lastLat,
          last_lng: courier.lastLng,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          phone: data.phone,
          isActive: data.is_active,
          isAvailable: data.is_available,
          lastLat: data.last_lat,
          lastLng: data.last_lng,
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCourier(id: string): Promise<OperationResult<Courier>> {
    if (!this.supabase) {
      // Modo mock - devolver courier simulado
      const mockCourier: Courier = {
        id,
        userId: 'mock-user-id',
        name: 'Repartidor Mock',
        phone: '+56912345678',
        isActive: true,
        isAvailable: true,
        updatedAt: new Date(),
      };
      return { success: true, data: mockCourier };
    }

    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          phone: data.phone,
          isActive: data.is_active,
          isAvailable: data.is_available,
          lastLat: data.last_lat,
          lastLng: data.last_lng,
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCourier(id: string, updates: Partial<Courier>): Promise<OperationResult<Courier>> {
    if (!this.supabase) {
      // Modo mock
      const mockCourier: Courier = {
        id,
        userId: 'mock-user-id',
        name: 'Repartidor Mock',
        phone: '+56912345678',
        isActive: updates.isActive ?? true,
        isAvailable: updates.isAvailable ?? true,
        updatedAt: new Date(),
      };
      return { success: true, data: mockCourier };
    }

    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .update({
          is_active: updates.isActive,
          is_available: updates.isAvailable,
          last_lat: updates.lastLat,
          last_lng: updates.lastLng,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          phone: data.phone,
          isActive: data.is_active,
          isAvailable: data.is_available,
          lastLat: data.last_lat,
          lastLng: data.last_lng,
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAvailableCouriers(): Promise<OperationResult<Courier[]>> {
    if (!this.supabase) {
      // Modo mock - devolver couriers simulados
      const mockCouriers: Courier[] = [
        {
          id: this.generateUUID(),
          userId: 'mock-user-1',
          name: 'Repartidor 1',
          phone: '+56912345678',
          isActive: true,
          isAvailable: true,
          updatedAt: new Date(),
        },
        {
          id: this.generateUUID(),
          userId: 'mock-user-2',
          name: 'Repartidor 2',
          phone: '+56987654321',
          isActive: true,
          isAvailable: true,
          updatedAt: new Date(),
        }
      ];
      return { success: true, data: mockCouriers };
    }

    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true);

      if (error) throw error;

      const couriers = data.map(c => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        phone: c.phone,
        isActive: c.is_active,
        isAvailable: c.is_available,
        lastLat: c.last_lat,
        lastLng: c.last_lng,
        updatedAt: new Date(c.updated_at),
      }));

      return { success: true, data: couriers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCouriersCount(): Promise<number> {
    if (!this.supabase) {
      return 5; // Modo mock
    }

    try {
      const { count, error } = await this.supabase
        .from('couriers')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  // Deliveries
  async createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<Delivery>> {
    if (!this.supabase) {
      // Modo mock
      const mockDelivery: Delivery = {
        id: this.generateUUID(),
        ...delivery,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: mockDelivery };
    }

    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .insert({
          order_id: delivery.orderId,
          seller_id: delivery.sellerId,
          courier_id: delivery.courierId,
          status: delivery.status,
          pickup_address: delivery.pickup.address,
          pickup_lat: delivery.pickup.latlng?.lat,
          pickup_lng: delivery.pickup.latlng?.lng,
          dropoff_address: delivery.dropoff.address,
          dropoff_lat: delivery.dropoff.latlng?.lat,
          dropoff_lng: delivery.dropoff.latlng?.lng,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          orderId: data.order_id,
          sellerId: data.seller_id,
          courierId: data.courier_id,
          status: data.status,
          pickup: { 
            address: data.pickup_address, 
            latlng: data.pickup_lat && data.pickup_lng ? { lat: data.pickup_lat, lng: data.pickup_lng } : undefined 
          },
          dropoff: { 
            address: data.dropoff_address, 
            latlng: data.dropoff_lat && data.dropoff_lng ? { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined 
          },
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDelivery(id: string): Promise<OperationResult<Delivery>> {
    if (!this.supabase) {
      // Modo mock
      const mockDelivery: Delivery = {
        id,
        orderId: 'mock-order-id',
        sellerId: 'mock-seller-id',
        courierId: 'mock-courier-id',
        status: 'pending',
        pickup: { address: 'Calle Test 123, Santiago' },
        dropoff: { address: 'Av. Mock 456, Santiago' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: mockDelivery };
    }

    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          orderId: data.order_id,
          sellerId: data.seller_id,
          courierId: data.courier_id,
          status: data.status,
          pickup: { 
            address: data.pickup_address, 
            latlng: data.pickup_lat && data.pickup_lng ? { lat: data.pickup_lat, lng: data.pickup_lng } : undefined 
          },
          dropoff: { 
            address: data.dropoff_address, 
            latlng: data.dropoff_lat && data.dropoff_lng ? { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined 
          },
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<OperationResult<Delivery>> {
    if (!this.supabase) {
      // Modo mock
      const mockDelivery: Delivery = {
        id,
        orderId: 'mock-order-id',
        sellerId: 'mock-seller-id',
        courierId: 'mock-courier-id',
        status: updates.status || 'pending',
        pickup: { address: 'Calle Test 123, Santiago' },
        dropoff: { address: 'Av. Mock 456, Santiago' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: mockDelivery };
    }

    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .update({
          courier_id: updates.courierId,
          status: updates.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          orderId: data.order_id,
          sellerId: data.seller_id,
          courierId: data.courier_id,
          status: data.status,
          pickup: { 
            address: data.pickup_address, 
            latlng: data.pickup_lat && data.pickup_lng ? { lat: data.pickup_lat, lng: data.pickup_lng } : undefined 
          },
          dropoff: { 
            address: data.dropoff_address, 
            latlng: data.dropoff_lat && data.dropoff_lng ? { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined 
          },
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Offers
  async createOffer(offer: Omit<DeliveryOffer, 'id' | 'createdAt'>): Promise<OperationResult<DeliveryOffer>> {
    if (!this.supabase) {
      // Modo mock
      const mockOffer: DeliveryOffer = {
        id: this.generateUUID(),
        ...offer,
        createdAt: new Date(),
      };
      return { success: true, data: mockOffer };
    }

    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .insert({
          delivery_id: offer.deliveryId,
          courier_id: offer.courierId,
          status: offer.status,
          expires_at: offer.expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          deliveryId: data.delivery_id,
          courierId: data.courier_id,
          status: data.status,
          expiresAt: new Date(data.expires_at),
          createdAt: new Date(data.created_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOffer(id: string): Promise<OperationResult<DeliveryOffer>> {
    if (!this.supabase) {
      // Modo mock
      const mockOffer: DeliveryOffer = {
        id,
        deliveryId: 'mock-delivery-id',
        courierId: 'mock-courier-id',
        status: 'offered',
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      };
      return { success: true, data: mockOffer };
    }

    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          deliveryId: data.delivery_id,
          courierId: data.courier_id,
          status: data.status,
          expiresAt: new Date(data.expires_at),
          createdAt: new Date(data.created_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateOffer(id: string, updates: Partial<DeliveryOffer>): Promise<OperationResult<DeliveryOffer>> {
    if (!this.supabase) {
      // Modo mock
      const mockOffer: DeliveryOffer = {
        id,
        deliveryId: 'mock-delivery-id',
        courierId: 'mock-courier-id',
        status: updates.status || 'offered',
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      };
      return { success: true, data: mockOffer };
    }

    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .update({
          status: updates.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          deliveryId: data.delivery_id,
          courierId: data.courier_id,
          status: data.status,
          expiresAt: new Date(data.expires_at),
          createdAt: new Date(data.created_at),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getActiveOffersForCourier(courierId: string): Promise<OperationResult<DeliveryOffer[]>> {
    if (!this.supabase) {
      // Modo mock - devolver ofertas simuladas
      const mockOffers: DeliveryOffer[] = [
        {
          id: this.generateUUID(),
          deliveryId: 'mock-delivery-1',
          courierId,
          status: 'offered',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
        }
      ];
      return { success: true, data: mockOffers };
    }

    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .select('*')
        .eq('courier_id', courierId)
        .eq('status', 'offered')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const offers = data.map(o => ({
        id: o.id,
        deliveryId: o.delivery_id,
        courierId: o.courier_id,
        status: o.status,
        expiresAt: new Date(o.expires_at),
        createdAt: new Date(o.created_at),
      }));

      return { success: true, data: offers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const supabaseRepo = new SupabaseDeliveryRepo();
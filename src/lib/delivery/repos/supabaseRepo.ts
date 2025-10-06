// Repositorio Supabase para producción
import { createClient } from '@supabase/supabase-js';
import type { Courier, Delivery, DeliveryOffer, OperationResult } from '../types';

class SupabaseDeliveryRepo {
  private supabase;

  constructor() {
    // Usar variables públicas para el cliente
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Couriers
  async createCourier(courier: Omit<Courier, 'id' | 'updatedAt'>): Promise<OperationResult<Courier>> {
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

      const result: Courier = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        phone: data.phone,
        isActive: data.is_active,
        isAvailable: data.is_available,
        lastLat: data.last_lat,
        lastLng: data.last_lng,
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCourier(id: string): Promise<OperationResult<Courier>> {
    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const result: Courier = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        phone: data.phone,
        isActive: data.is_active,
        isAvailable: data.is_available,
        lastLat: data.last_lat,
        lastLng: data.last_lng,
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCourier(id: string, updates: Partial<Courier>): Promise<OperationResult<Courier>> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.lastLat !== undefined) updateData.last_lat = updates.lastLat;
      if (updates.lastLng !== undefined) updateData.last_lng = updates.lastLng;

      const { data, error } = await this.supabase
        .from('couriers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const result: Courier = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        phone: data.phone,
        isActive: data.is_active,
        isAvailable: data.is_available,
        lastLat: data.last_lat,
        lastLng: data.last_lng,
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAvailableCouriers(): Promise<OperationResult<Courier[]>> {
    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true);

      if (error) throw error;

      const results: Courier[] = data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        phone: row.phone,
        isActive: row.is_active,
        isAvailable: row.is_available,
        lastLat: row.last_lat,
        lastLng: row.last_lng,
        updatedAt: new Date(row.updated_at),
      }));

      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCouriersCount(): Promise<number> {
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

      const result: Delivery = {
        id: data.id,
        orderId: data.order_id,
        sellerId: data.seller_id,
        courierId: data.courier_id,
        status: data.status,
        pickup: {
          address: data.pickup_address,
          latlng: data.pickup_lat && data.pickup_lng ? 
            { lat: data.pickup_lat, lng: data.pickup_lng } : undefined,
        },
        dropoff: {
          address: data.dropoff_address,
          latlng: data.dropoff_lat && data.dropoff_lng ? 
            { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined,
        },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDelivery(id: string): Promise<OperationResult<Delivery>> {
    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const result: Delivery = {
        id: data.id,
        orderId: data.order_id,
        sellerId: data.seller_id,
        courierId: data.courier_id,
        status: data.status,
        pickup: {
          address: data.pickup_address,
          latlng: data.pickup_lat && data.pickup_lng ? 
            { lat: data.pickup_lat, lng: data.pickup_lng } : undefined,
        },
        dropoff: {
          address: data.dropoff_address,
          latlng: data.dropoff_lat && data.dropoff_lng ? 
            { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined,
        },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<OperationResult<Delivery>> {
    try {
      const updateData: any = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.courierId !== undefined) updateData.courier_id = updates.courierId;

      const { data, error } = await this.supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const result: Delivery = {
        id: data.id,
        orderId: data.order_id,
        sellerId: data.seller_id,
        courierId: data.courier_id,
        status: data.status,
        pickup: {
          address: data.pickup_address,
          latlng: data.pickup_lat && data.pickup_lng ? 
            { lat: data.pickup_lat, lng: data.pickup_lng } : undefined,
        },
        dropoff: {
          address: data.dropoff_address,
          latlng: data.dropoff_lat && data.dropoff_lng ? 
            { lat: data.dropoff_lat, lng: data.dropoff_lng } : undefined,
        },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Offers
  async createOffer(offer: Omit<DeliveryOffer, 'id' | 'createdAt'>): Promise<OperationResult<DeliveryOffer>> {
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

      const result: DeliveryOffer = {
        id: data.id,
        deliveryId: data.delivery_id,
        courierId: data.courier_id,
        status: data.status,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOffer(id: string): Promise<OperationResult<DeliveryOffer>> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const result: DeliveryOffer = {
        id: data.id,
        deliveryId: data.delivery_id,
        courierId: data.courier_id,
        status: data.status,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateOffer(id: string, updates: Partial<DeliveryOffer>): Promise<OperationResult<DeliveryOffer>> {
    try {
      const updateData: any = {};
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await this.supabase
        .from('delivery_offers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const result: DeliveryOffer = {
        id: data.id,
        deliveryId: data.delivery_id,
        courierId: data.courier_id,
        status: data.status,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOffersByDelivery(deliveryId: string): Promise<OperationResult<DeliveryOffer[]>> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_offers')
        .select('*')
        .eq('delivery_id', deliveryId);

      if (error) throw error;

      const results: DeliveryOffer[] = data.map((row: any) => ({
        id: row.id,
        deliveryId: row.delivery_id,
        courierId: row.courier_id,
        status: row.status,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
      }));

      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const supabaseRepo = new SupabaseDeliveryRepo();

// Servicio de comunicación para delivery
import { createClient } from '@supabase/supabase-js';
import { notifyCourierNewOffer, notifyDeliveryConfirmed, notifyPickupConfirmed, notifyDeliveryCompleted } from '../../../server/whatsapp-simple';
import type { Delivery, Courier } from '../types';

export class CommunicationService {
  private supabase: any = null;

  constructor() {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured - using mock mode');
      this.supabase = null;
      return;
    }
    
    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ CommunicationService: Supabase client initialized');
    } catch (error) {
      console.warn('Failed to initialize Supabase client - using mock mode:', error);
      this.supabase = null;
    }
  }

  // Notificar al vendedor sobre el estado del delivery
  async notifySeller(deliveryId: string, status: string, message: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📱 Mock: Notificando vendedor - ${status}: ${message}`);
      return;
    }
    
    try {
      // Obtener información del delivery
      const { data: delivery } = await this.supabase
        .from('deliveries')
        .select('seller_id')
        .eq('id', deliveryId)
        .single();

      if (!delivery) return;

      // Crear notificación
      await this.supabase
        .from('delivery_notifications')
        .insert({
          delivery_id: deliveryId,
          user_id: delivery.seller_id,
          type: status,
          message: message
        });

      // Enviar notificación WhatsApp
      await notifyCourierNewOffer(delivery.seller_id, deliveryId);
    } catch (error) {
      console.error('Error notifying seller:', error);
    }
  }

  // Notificar al comprador sobre el estado del delivery
  async notifyBuyer(deliveryId: string, status: string, message: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📱 Mock: Notificando comprador - ${status}: ${message}`);
      return;
    }
    
    try {
      // Obtener información del delivery y order
      const { data: delivery } = await this.supabase
        .from('deliveries')
        .select(`
          order_id,
          orders!inner(
            user_id
          )
        `)
        .eq('id', deliveryId)
        .single();

      if (!delivery) return;

      // Crear notificación
      await this.supabase
        .from('delivery_notifications')
        .insert({
          delivery_id: deliveryId,
          user_id: delivery.orders.user_id,
          type: status,
          message: message
        });

      // Enviar notificación WhatsApp
      await notifyDeliveryConfirmed(delivery.orders.user_id, deliveryId);
    } catch (error) {
      console.error('Error notifying buyer:', error);
    }
  }

  // Notificar al repartidor sobre nuevas ofertas
  async notifyCourier(courierId: string, deliveryId: string, message: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📱 Mock: Notificando repartidor ${courierId} - ${message}`);
      return;
    }
    
    try {
      // Obtener información del courier
      const { data: courier } = await this.supabase
        .from('couriers')
        .select('user_id')
        .eq('id', courierId)
        .single();

      if (!courier) return;

      // Crear notificación
      await this.supabase
        .from('delivery_notifications')
        .insert({
          delivery_id: deliveryId,
          user_id: courier.user_id,
          type: 'offer',
          message: message
        });

      // Enviar notificación WhatsApp
      await notifyCourierNewOffer(courier.user_id, deliveryId);
    } catch (error) {
      console.error('Error notifying courier:', error);
    }
  }

  // Obtener notificaciones de un usuario
  async getUserNotifications(userId: string, limit: number = 10): Promise<any[]> {
    if (!this.supabase) {
      // Modo mock - devolver notificaciones de ejemplo
      return [
        {
          id: 'mock-notification-1',
          type: 'offer',
          message: 'Nueva oferta de delivery disponible',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-notification-2',
          type: 'assigned',
          message: 'Delivery asignado exitosamente',
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    
    try {
      const { data, error } = await this.supabase
        .from('delivery_notifications')
        .select(`
          *,
          deliveries!inner(
            order_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📱 Mock: Marcando notificación ${notificationId} como leída`);
      return;
    }
    
    try {
      const { error } = await this.supabase
        .from('delivery_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Obtener estado de disponibilidad de couriers
  async getCourierAvailability(): Promise<{
    total: number;
    available: number;
    busy: number;
    offline: number;
  }> {
    if (!this.supabase) {
      // Modo mock - devolver estadísticas de ejemplo
      return {
        total: 5,
        available: 3,
        busy: 1,
        offline: 1
      };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('is_active, is_available');

      if (error) throw error;

      const total = data.length;
      const available = data.filter(c => c.is_active && c.is_available).length;
      const busy = data.filter(c => c.is_active && !c.is_available).length;
      const offline = data.filter(c => !c.is_active).length;

      return { total, available, busy, offline };
    } catch (error) {
      console.error('Error fetching courier availability:', error);
      return { total: 0, available: 0, busy: 0, offline: 0 };
    }
  }

  // Obtener deliveries activos de un courier
  async getCourierActiveDeliveries(courierId: string): Promise<Delivery[]> {
    if (!this.supabase) {
      // Modo mock - devolver deliveries de ejemplo
      return [
        {
          id: 'mock-delivery-1',
          orderId: 'mock-order-1',
          sellerId: 'mock-seller-1',
          courierId: courierId,
          status: 'assigned',
          pickup: { address: 'Calle Test 123, Santiago' },
          dropoff: { address: 'Av. Mock 456, Santiago' },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    }
    
    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', courierId)
        .in('status', ['assigned', 'pickup_confirmed', 'en_route']);

      if (error) throw error;

      return data.map(d => ({
        id: d.id,
        orderId: d.order_id,
        sellerId: d.seller_id,
        courierId: d.courier_id,
        status: d.status,
        pickup: { address: d.pickup_address, latlng: d.pickup_lat && d.pickup_lng ? { lat: d.pickup_lat, lng: d.pickup_lng } : undefined },
        dropoff: { address: d.dropoff_address, latlng: d.dropoff_lat && d.dropoff_lng ? { lat: d.dropoff_lat, lng: d.dropoff_lng } : undefined },
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching courier active deliveries:', error);
      return [];
    }
  }

  // Suscribirse a notificaciones en tiempo real para un usuario
  subscribeToUserNotifications(userId: string, callback: (notification: any) => void): () => void {
    if (!this.supabase) {
      console.log(`📱 Mock: Suscribiéndose a notificaciones para usuario ${userId}`);
      // Simular notificaciones periódicas en modo mock
      const interval = setInterval(() => {
        callback({
          id: `mock-${Date.now()}`,
          type: 'offer',
          message: 'Nueva oferta de delivery disponible',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }, 30000); // Cada 30 segundos

      return () => {
        clearInterval(interval);
        console.log(`📱 Mock: Desuscribiéndose de notificaciones para usuario ${userId}`);
      };
    }

    const subscription = this.supabase
      .channel(`delivery_notifications_for_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Realtime notification received:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from delivery notifications for user ${userId}`);
    };
  }
}

export const communicationService = new CommunicationService();
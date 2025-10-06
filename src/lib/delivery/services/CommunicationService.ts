// Servicio de comunicación para delivery
import { createClient } from '@supabase/supabase-js';
import { notifyCourierNewOffer, notifyDeliveryConfirmed, notifyPickupConfirmed, notifyDeliveryCompleted } from '../../../server/whatsapp-simple';
import type { Delivery, Courier } from '../types';

export class CommunicationService {
  private supabase;

  constructor() {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Notificar al vendedor sobre el estado del delivery
  async notifySeller(deliveryId: string, status: string, message: string): Promise<void> {
    if (!this.supabase) return;
    
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
      await notifySellerNewOrder(delivery.seller_id, deliveryId);
    } catch (error) {
      console.error('Error notifying seller:', error);
    }
  }

  // Notificar al comprador sobre el estado del delivery
  async notifyBuyer(deliveryId: string, status: string, message: string): Promise<void> {
    if (!this.supabase) return;
    
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

      // Enviar notificación push si está disponible
      await this.sendPushNotification(delivery.orders.user_id, message);
    } catch (error) {
      console.error('Error notifying buyer:', error);
    }
  }

  // Notificar al repartidor sobre nuevas ofertas
  async notifyCourier(courierId: string, deliveryId: string, message: string): Promise<void> {
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

      // Enviar notificación push si está disponible
      await this.sendPushNotification(courier.user_id, message);
    } catch (error) {
      console.error('Error notifying courier:', error);
    }
  }

  // Obtener notificaciones de un usuario
  async getUserNotifications(userId: string, limit: number = 10): Promise<any[]> {
    if (!this.supabase) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('delivery_notifications')
        .select(`
          *,
          deliveries!inner(
            id,
            status,
            pickup_address,
            dropoff_address
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.supabase
        .from('delivery_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
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
    if (!this.supabase) return { total: 0, available: 0, busy: 0, offline: 0 };
    
    try {
      const { data, error } = await this.supabase
        .from('couriers')
        .select('is_active, is_available');

      if (error) throw error;

      const stats = {
        total: data.length,
        available: data.filter(c => c.is_active && c.is_available).length,
        busy: data.filter(c => c.is_active && !c.is_available).length,
        offline: data.filter(c => !c.is_active).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting courier availability:', error);
      return { total: 0, available: 0, busy: 0, offline: 0 };
    }
  }

  // Obtener deliveries activos de un courier
  async getCourierActiveDeliveries(courierId: string): Promise<Delivery[]> {
    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', courierId)
        .in('status', ['assigned', 'pickup_confirmed', 'en_route']);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting courier deliveries:', error);
      return [];
    }
  }

  // Obtener deliveries pendientes para asignar
  async getPendingDeliveries(): Promise<Delivery[]> {
    try {
      const { data, error } = await this.supabase
        .from('deliveries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending deliveries:', error);
      return [];
    }
  }

  // Enviar notificación push
  private async sendPushNotification(userId: string, message: string): Promise<void> {
    try {
      // Aquí se implementaría la lógica de notificaciones push
      // Por ahora solo logueamos
      console.log(`Push notification to ${userId}: ${message}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Suscribirse a cambios en tiempo real
  subscribeToDeliveryUpdates(deliveryId: string, callback: (delivery: Delivery) => void): () => void {
    const subscription = this.supabase
      .channel(`delivery-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`
        },
        (payload) => {
          callback(payload.new as Delivery);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Suscribirse a notificaciones de un usuario
  subscribeToUserNotifications(userId: string, callback: (notification: any) => void): () => void {
    const subscription = this.supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const communicationService = new CommunicationService();

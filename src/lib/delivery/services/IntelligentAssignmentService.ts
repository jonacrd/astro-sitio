// Servicio de asignación inteligente para delivery
import { getDeliveryRepo } from '../repos';
import type { Courier, Delivery, DeliveryOffer } from '../types';

export class IntelligentAssignmentService {
  private repo = getDeliveryRepo();

  // Estrategias de asignación
  private strategies = {
    round_robin: this.assignRoundRobin.bind(this),
    distance: this.assignByDistance.bind(this),
    availability: this.assignByAvailability.bind(this),
    load_balancing: this.assignByLoadBalancing.bind(this)
  };

  // Asignar delivery usando estrategia seleccionada
  async assignDelivery(deliveryId: string, strategy: keyof typeof this.strategies = 'round_robin'): Promise<{
    success: boolean;
    courierId?: string;
    error?: string;
  }> {
    try {
      // Obtener delivery
      const deliveryResult = await this.repo.getDelivery(deliveryId);
      if (!deliveryResult.success || !deliveryResult.data) {
        return { success: false, error: 'Delivery not found' };
      }

      const delivery = deliveryResult.data;

      // Obtener couriers disponibles
      const couriersResult = await this.repo.getAvailableCouriers();
      if (!couriersResult.success || !couriersResult.data || couriersResult.data.length === 0) {
        // Marcar como no_courier
        await this.repo.updateDelivery(deliveryId, { status: 'no_courier' });
        return { success: false, error: 'No available couriers' };
      }

      // Aplicar estrategia de asignación
      const selectedCourier = await this.strategies[strategy](couriersResult.data, delivery);
      
      if (!selectedCourier) {
        return { success: false, error: 'No suitable courier found' };
      }

      // Crear oferta con expiración de 60 segundos
      const expiresAt = new Date(Date.now() + 60 * 1000);
      const offerResult = await this.repo.createOffer({
        deliveryId,
        courierId: selectedCourier.id,
        status: 'offered',
        expiresAt
      });

      if (!offerResult.success) {
        return { success: false, error: offerResult.error };
      }

      // Actualizar estado del delivery
      await this.repo.updateDelivery(deliveryId, { status: 'offer_sent' });

      // Notificar al courier
      await this.notifyCourier(selectedCourier.userId, delivery, offerResult.data!.id);

      return { success: true, courierId: selectedCourier.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Estrategia Round Robin
  private async assignRoundRobin(couriers: Courier[], delivery: Delivery): Promise<Courier | null> {
    // Ordenar por última actualización (FIFO)
    const sortedCouriers = couriers.sort((a, b) => 
      a.updatedAt.getTime() - b.updatedAt.getTime()
    );
    
    return sortedCouriers[0] || null;
  }

  // Estrategia por distancia
  private async assignByDistance(couriers: Courier[], delivery: Delivery): Promise<Courier | null> {
    if (!delivery.pickup.latlng) {
      return this.assignRoundRobin(couriers, delivery);
    }

    // Calcular distancia y seleccionar el más cercano
    const couriersWithDistance = couriers
      .filter(c => c.lastLat && c.lastLng)
      .map(courier => ({
        ...courier,
        distance: this.calculateDistance(
          delivery.pickup.latlng!,
          { lat: courier.lastLat!, lng: courier.lastLng! }
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    return couriersWithDistance[0] || null;
  }

  // Estrategia por disponibilidad
  private async assignByAvailability(couriers: Courier[], delivery: Delivery): Promise<Courier | null> {
    // Priorizar couriers que han estado disponibles por más tiempo
    const sortedCouriers = couriers.sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    
    return sortedCouriers[0] || null;
  }

  // Estrategia de balance de carga
  private async assignByLoadBalancing(couriers: Courier[], delivery: Delivery): Promise<Courier | null> {
    // Obtener carga actual de cada courier
    const couriersWithLoad = await Promise.all(
      couriers.map(async (courier) => {
        const activeDeliveries = await this.getActiveDeliveriesForCourier(courier.id);
        return {
          ...courier,
          load: activeDeliveries.length
        };
      })
    );

    // Seleccionar el courier con menor carga
    const sortedCouriers = couriersWithLoad.sort((a, b) => a.load - b.load);
    return sortedCouriers[0] || null;
  }

  // Procesar respuesta del courier
  async processCourierResponse(offerId: string, accepted: boolean): Promise<{
    success: boolean;
    deliveryId?: string;
    error?: string;
  }> {
    try {
      // Obtener oferta
      const offerResult = await this.repo.getOffer(offerId);
      if (!offerResult.success || !offerResult.data) {
        return { success: false, error: 'Offer not found' };
      }

      const offer = offerResult.data;

      // Verificar si la oferta no ha expirado
      if (new Date() > offer.expiresAt) {
        await this.repo.updateOffer(offerId, { status: 'expired' });
        return { success: false, error: 'Offer expired' };
      }

      if (accepted) {
        // Aceptar oferta
        await this.repo.updateOffer(offerId, { status: 'accepted' });
        await this.repo.updateDelivery(offer.deliveryId, { 
          status: 'assigned',
          courierId: offer.courierId
        });

        // Marcar otros couriers como no disponibles temporalmente
        await this.markOtherCouriersUnavailable(offer.deliveryId, offer.courierId);

        return { success: true, deliveryId: offer.deliveryId };
      } else {
        // Rechazar oferta
        await this.repo.updateOffer(offerId, { status: 'declined' });
        
        // Intentar asignar a otro courier
        const nextCourierResult = await this.assignDelivery(offer.deliveryId);
        return nextCourierResult;
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Obtener deliveries activos de un courier
  private async getActiveDeliveriesForCourier(courierId: string): Promise<Delivery[]> {
    // Esta función se implementaría consultando la base de datos
    // Por ahora retornamos array vacío
    return [];
  }

  // Marcar otros couriers como no disponibles
  private async markOtherCouriersUnavailable(deliveryId: string, assignedCourierId: string): Promise<void> {
    // Esta función se implementaría para evitar conflictos
    // Por ahora no hacemos nada
  }

  // Calcular distancia entre dos puntos
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Notificar al courier
  private async notifyCourier(userId: string, delivery: Delivery, offerId: string): Promise<void> {
    // Esta función se implementaría con notificaciones push o WhatsApp
    console.log(`Notificando a courier ${userId} sobre delivery ${delivery.id}`);
  }
}

export const intelligentAssignmentService = new IntelligentAssignmentService();




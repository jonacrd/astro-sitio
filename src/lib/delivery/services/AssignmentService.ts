// Servicio de asignación de repartidores
import { getDeliveryRepo } from '../repos';
import { notifyCourierOffer, notifyCustomerAssigned, notifyVendorNoCourier } from './notify';
import { DELIVERY_CONFIG } from '../getEnv';
import type { Courier, Delivery, DeliveryOffer, OperationResult } from '../types';

export class AssignmentService {
  private repo = getDeliveryRepo();
  private activeTimeouts = new Map<string, NodeJS.Timeout>();

  // Crear oferta a un courier específico
  async createOffer(deliveryId: string, courierId: string): Promise<OperationResult<DeliveryOffer>> {
    try {
      // Verificar que el courier esté disponible
      const courierResult = await this.repo.getCourier(courierId);
      if (!courierResult.success || !courierResult.data) {
        return { success: false, error: 'Courier not found or not available' };
      }

      const courier = courierResult.data;
      if (!courier.isActive || !courier.isAvailable) {
        return { success: false, error: 'Courier is not available' };
      }

      // Crear oferta con expiración
      const expiresAt = new Date(Date.now() + DELIVERY_CONFIG.OFFER_TIMEOUT_MS);
      const offerResult = await this.repo.createOffer({
        deliveryId,
        courierId,
        status: 'offered',
        expiresAt,
      });

      if (!offerResult.success) {
        return offerResult;
      }

      // Programar expiración
      this.scheduleOfferExpiration(offerResult.data!.id, deliveryId);

      // Enviar notificación (stub por ahora)
      await notifyCourierOffer(courier, offerResult.data!);

      return offerResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Aceptar oferta
  async acceptOffer(offerId: string): Promise<OperationResult<Delivery>> {
    try {
      // Obtener oferta
      const offerResult = await this.repo.getOffer(offerId);
      if (!offerResult.success || !offerResult.data) {
        return { success: false, error: 'Offer not found' };
      }

      const offer = offerResult.data;

      // Verificar que no haya expirado
      if (offer.status !== 'offered' || new Date() > offer.expiresAt) {
        return { success: false, error: 'Offer has expired or is no longer valid' };
      }

      // Marcar oferta como aceptada
      const updateOfferResult = await this.repo.updateOffer(offerId, { status: 'accepted' });
      if (!updateOfferResult.success) {
        return { success: false, error: 'Failed to accept offer' };
      }

      // Actualizar delivery como asignado
      const updateDeliveryResult = await this.repo.updateDelivery(offer.deliveryId, {
        status: 'assigned',
        courierId: offer.courierId,
      });

      if (!updateDeliveryResult.success) {
        return { success: false, error: 'Failed to assign delivery' };
      }

      // Cancelar timeout de expiración
      this.cancelOfferExpiration(offerId);

      // Marcar otras ofertas como expiradas
      await this.expireOtherOffers(offer.deliveryId, offerId);

      // Enviar notificaciones
      const delivery = updateDeliveryResult.data!;
      await this.notifyAssignment(delivery, offer.courierId);

      return updateDeliveryResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Rechazar oferta
  async declineOffer(offerId: string): Promise<OperationResult<void>> {
    try {
      const offerResult = await this.repo.getOffer(offerId);
      if (!offerResult.success || !offerResult.data) {
        return { success: false, error: 'Offer not found' };
      }

      const offer = offerResult.data;
      if (offer.status !== 'offered') {
        return { success: false, error: 'Offer is no longer valid' };
      }

      // Marcar como rechazada
      const updateResult = await this.repo.updateOffer(offerId, { status: 'declined' });
      if (!updateResult.success) {
        return { success: false, error: 'Failed to decline offer' };
      }

      // Cancelar timeout
      this.cancelOfferExpiration(offerId);

      // Intentar siguiente courier
      await this.tryNextCourier(offer.deliveryId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Buscar couriers disponibles y crear ofertas
  async findAvailableCouriers(deliveryId: string): Promise<OperationResult<Courier[]>> {
    try {
      const result = await this.repo.getAvailableCouriers();
      if (!result.success) {
        return result;
      }

      const availableCouriers = result.data || [];
      
      if (availableCouriers.length === 0) {
        // No hay couriers disponibles
        await this.markDeliveryAsNoCourier(deliveryId);
        return { success: true, data: [] };
      }

      return { success: true, data: availableCouriers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Crear oferta al siguiente courier disponible
  async tryNextCourier(deliveryId: string): Promise<OperationResult<DeliveryOffer | null>> {
    try {
      // Obtener couriers disponibles
      const couriersResult = await this.findAvailableCouriers(deliveryId);
      if (!couriersResult.success) {
        return couriersResult;
      }

      const availableCouriers = couriersResult.data || [];
      if (availableCouriers.length === 0) {
        return { success: true, data: null };
      }

      // Obtener ofertas existentes para este delivery
      const existingOffersResult = await this.repo.getOffersByDelivery(deliveryId);
      if (!existingOffersResult.success) {
        return { success: false, error: 'Failed to get existing offers' };
      }

      const existingOffers = existingOffersResult.data || [];
      const offeredCourierIds = existingOffers
        .filter(o => o.status === 'offered')
        .map(o => o.courierId);

      // Encontrar courier que no haya recibido oferta
      const nextCourier = availableCouriers.find(c => !offeredCourierIds.includes(c.id));
      
      if (!nextCourier) {
        // Todos los couriers ya recibieron oferta, marcar como no_courier
        await this.markDeliveryAsNoCourier(deliveryId);
        return { success: true, data: null };
      }

      // Crear oferta al siguiente courier
      return await this.createOffer(deliveryId, nextCourier.id);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Marcar delivery como sin courier
  private async markDeliveryAsNoCourier(deliveryId: string): Promise<void> {
    try {
      await this.repo.updateDelivery(deliveryId, { status: 'no_courier' });
      
      // Notificar al vendedor
      const deliveryResult = await this.repo.getDelivery(deliveryId);
      if (deliveryResult.success && deliveryResult.data) {
        await notifyVendorNoCourier(deliveryResult.data);
      }
    } catch (error) {
      console.error('Error marking delivery as no_courier:', error);
    }
  }

  // Programar expiración de oferta
  private scheduleOfferExpiration(offerId: string, deliveryId: string): void {
    const timeout = setTimeout(async () => {
      try {
        // Marcar oferta como expirada
        await this.repo.updateOffer(offerId, { status: 'expired' });
        
        // Intentar siguiente courier
        await this.tryNextCourier(deliveryId);
      } catch (error) {
        console.error('Error handling offer expiration:', error);
      } finally {
        this.activeTimeouts.delete(offerId);
      }
    }, DELIVERY_CONFIG.OFFER_TIMEOUT_MS);

    this.activeTimeouts.set(offerId, timeout);
  }

  // Cancelar expiración de oferta
  private cancelOfferExpiration(offerId: string): void {
    const timeout = this.activeTimeouts.get(offerId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTimeouts.delete(offerId);
    }
  }

  // Marcar otras ofertas como expiradas
  private async expireOtherOffers(deliveryId: string, acceptedOfferId: string): Promise<void> {
    try {
      const offersResult = await this.repo.getOffersByDelivery(deliveryId);
      if (!offersResult.success || !offersResult.data) return;

      const otherOffers = offersResult.data.filter(o => 
        o.id !== acceptedOfferId && o.status === 'offered'
      );

      for (const offer of otherOffers) {
        await this.repo.updateOffer(offer.id, { status: 'expired' });
        this.cancelOfferExpiration(offer.id);
      }
    } catch (error) {
      console.error('Error expiring other offers:', error);
    }
  }

  // Notificar asignación
  private async notifyAssignment(delivery: Delivery, courierId: string): Promise<void> {
    try {
      const courierResult = await this.repo.getCourier(courierId);
      if (courierResult.success && courierResult.data) {
        await notifyCustomerAssigned(delivery, courierResult.data);
      }
    } catch (error) {
      console.error('Error notifying assignment:', error);
    }
  }

  // Limpiar timeouts activos
  cleanup(): void {
    for (const timeout of this.activeTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.activeTimeouts.clear();
  }
}

export const assignmentService = new AssignmentService();




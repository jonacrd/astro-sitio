// Endpoint para obtener disponibilidad de couriers
import type { APIRoute } from 'astro';
import { communicationService } from '../../../lib/delivery/services/CommunicationService';

export const GET: APIRoute = async () => {
  try {
    const availability = await communicationService.getCourierAvailability();

    return new Response(JSON.stringify({
      success: true,
      data: availability
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};




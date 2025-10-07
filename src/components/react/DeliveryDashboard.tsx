import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface DeliveryOffer {
  id: string;
  order_id: string;
  courier_id: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  order: {
    id: string;
    total_cents: number;
    status: string;
    created_at: string;
    buyer_name?: string;
    buyer_phone?: string;
    seller_name?: string;
    seller_phone?: string;
    delivery_address?: string;
  };
}

export default function DeliveryDashboard() {
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadOffers();
    
    // Escuchar cambios en ofertas
    const handleOfferUpdate = () => {
      loadOffers();
    };
    
    window.addEventListener('delivery-offer-updated', handleOfferUpdate);
    return () => window.removeEventListener('delivery-offer-updated', handleOfferUpdate);
  }, [filter]);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener ofertas de delivery para este courier
      const { data, error } = await supabase
        .from('delivery_offers')
        .select(`
          id,
          order_id,
          courier_id,
          status,
          created_at,
          order:orders!delivery_offers_order_id_fkey(
            id,
            total_cents,
            status,
            created_at,
            buyer:profiles!orders_user_id_fkey(name, phone),
            seller:profiles!orders_seller_id_fkey(name, phone)
          )
        `)
        .eq('courier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Formatear datos
      const formattedOffers = (data || []).map((offer: any) => ({
        id: offer.id,
        order_id: offer.order_id,
        courier_id: offer.courier_id,
        status: offer.status,
        created_at: offer.created_at,
        order: {
          id: offer.order.id,
          total_cents: offer.order.total_cents,
          status: offer.order.status,
          created_at: offer.order.created_at,
          buyer_name: offer.order.buyer?.name || 'Cliente',
          buyer_phone: offer.order.buyer?.phone || 'Sin teléfono',
          seller_name: offer.order.seller?.name || 'Vendedor',
          seller_phone: offer.order.seller?.phone || 'Sin teléfono',
          delivery_address: 'Dirección de entrega' // TODO: Obtener de la orden
        }
      }));

      // Aplicar filtro
      let filteredOffers = formattedOffers;
      if (filter === 'pending') {
        filteredOffers = formattedOffers.filter(offer => offer.status === 'pending');
      } else if (filter === 'in_progress') {
        filteredOffers = formattedOffers.filter(offer => 
          ['accepted', 'picked_up', 'in_transit'].includes(offer.status)
        );
      } else if (filter === 'completed') {
        filteredOffers = formattedOffers.filter(offer => offer.status === 'delivered');
      }

      setOffers(filteredOffers);
    } catch (err: any) {
      console.error('Error cargando ofertas:', err);
      setError('Error al cargar ofertas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      const response = await fetch('/api/delivery/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offerId
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Oferta aceptada');
        loadOffers();
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('delivery-offer-updated', {
          detail: { offerId, status: 'accepted' }
        }));
      } else {
        console.error('❌ Error aceptando oferta:', data.error);
        alert('Error aceptando oferta: ' + data.error);
      }
    } catch (error) {
      console.error('Error en acceptOffer:', error);
      alert('Error aceptando oferta');
    }
  };

  const updateStatus = async (offerId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/delivery/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offerId,
          newStatus: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Estado actualizado:', newStatus);
        loadOffers();
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('delivery-offer-updated', {
          detail: { offerId, status: newStatus }
        }));
      } else {
        console.error('❌ Error actualizando estado:', data.error);
        alert('Error actualizando estado: ' + data.error);
      }
    } catch (error) {
      console.error('Error en updateStatus:', error);
      alert('Error actualizando estado');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pendiente', class: 'status-pending', icon: '⏳' };
      case 'accepted':
        return { text: 'Aceptado', class: 'status-in-progress', icon: '✅' };
      case 'picked_up':
        return { text: 'Recogido', class: 'status-in-progress', icon: '📦' };
      case 'in_transit':
        return { text: 'En Camino', class: 'status-in-progress', icon: '🚚' };
      case 'delivered':
        return { text: 'Entregado', class: 'status-completed', icon: '🎉' };
      case 'cancelled':
        return { text: 'Cancelado', class: 'bg-gray-600', icon: '❌' };
      default:
        return { text: status, class: 'bg-gray-600', icon: '❓' };
    }
  };

  const getActionButtons = (offer: DeliveryOffer) => {
    switch (offer.status) {
      case 'pending':
        return (
          <button
            onClick={() => acceptOffer(offer.id)}
            className="px-4 py-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            ✅ Aceptar Pedido
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => updateStatus(offer.id, 'picked_up')}
            className="px-4 py-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📦 Confirmar Recogida
          </button>
        );
      case 'picked_up':
        return (
          <button
            onClick={() => updateStatus(offer.id, 'in_transit')}
            className="px-4 py-2 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            🚚 En Camino
          </button>
        );
      case 'in_transit':
        return (
          <button
            onClick={() => updateStatus(offer.id, 'delivered')}
            className="px-4 py-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            🎉 Marcar Entregado
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div class="px-4 py-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p class="text-gray-400">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="px-4 py-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div class="px-4 py-4">
      {/* Filtros */}
      <div class="mb-6">
        <div class="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all' 
                ? 'bg-orange-600 text-white' 
                : 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'pending' 
                ? 'bg-orange-600 text-white' 
                : 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'in_progress' 
                ? 'bg-orange-600 text-white' 
                : 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
            }`}
          >
            En Progreso
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'completed' 
                ? 'bg-orange-600 text-white' 
                : 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
            }`}
          >
            Completadas
          </button>
        </div>
      </div>

      {/* Lista de ofertas */}
      <div class="space-y-4">
        {offers.length === 0 ? (
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p class="text-gray-400">No hay ofertas disponibles</p>
          </div>
        ) : (
          offers.map((offer) => {
            const statusInfo = getStatusInfo(offer.status);
            const orderId = offer.order.id.substring(0, 8);
            const date = new Date(offer.created_at);
            const formattedDate = date.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            const time = date.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            });
            const price = (offer.order.total_cents / 100).toFixed(2);

            return (
              <div key={offer.id} class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="text-white font-semibold">Pedido #{orderId}</h3>
                    <p class="text-gray-400 text-sm">{formattedDate}, {time}</p>
                  </div>
                  <span class={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class} text-white`}>
                    {statusInfo.icon} {statusInfo.text}
                  </span>
                </div>
                
                <div class="mb-4">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-400">Cliente:</p>
                      <p class="text-white">{offer.order.buyer_name}</p>
                      <p class="text-gray-400">{offer.order.buyer_phone}</p>
                    </div>
                    <div>
                      <p class="text-gray-400">Vendedor:</p>
                      <p class="text-white">{offer.order.seller_name}</p>
                      <p class="text-gray-400">{offer.order.seller_phone}</p>
                    </div>
                  </div>
                  
                  <div class="mt-3">
                    <p class="text-gray-400 text-sm">Dirección de entrega:</p>
                    <p class="text-white text-sm">{offer.order.delivery_address}</p>
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <span class="text-orange-500 font-semibold">${price}</span>
                  <div class="flex gap-2">
                    {getActionButtons(offer)}
                    <button 
                      onClick={() => console.log('Ver detalles:', offer.id)}
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      👁️ Detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

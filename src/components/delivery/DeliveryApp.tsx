// PWA principal para repartidores
import React, { useState, useEffect } from 'react';
import { isDeliveryEnabled } from '../../lib/delivery/getEnv';
import { communicationService } from '../../lib/delivery/services/CommunicationService';
import type { Courier, Delivery, DeliveryOffer } from '../../lib/delivery/types';

interface DeliveryAppState {
  courier: Courier | null;
  currentOffer: DeliveryOffer | null;
  currentDelivery: Delivery | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  notifications: any[];
  availability: {
    total: number;
    available: number;
    busy: number;
    offline: number;
  };
}

export default function DeliveryApp() {
  const [state, setState] = useState<DeliveryAppState>({
    courier: null,
    currentOffer: null,
    currentDelivery: null,
    isConnected: false,
    isLoading: false,
    error: null,
    notifications: [],
    availability: { total: 0, available: 0, busy: 0, offline: 0 }
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (state.isConnected && state.courier) {
      loadNotifications();
      loadAvailability();
      loadActiveDeliveries();
    }
  }, [state.isConnected, state.courier]);

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!state.courier) return;

    const unsubscribe = communicationService.subscribeToUserNotifications(
      state.courier.userId,
      (notification) => {
        setState(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications]
        }));
      }
    );

    return unsubscribe;
  }, [state.courier]);

  // Cargar notificaciones
  const loadNotifications = async () => {
    if (!state.courier) return;
    
    try {
      const notifications = await communicationService.getUserNotifications(state.courier.userId);
      setState(prev => ({ ...prev, notifications }));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Cargar disponibilidad
  const loadAvailability = async () => {
    try {
      const availability = await communicationService.getCourierAvailability();
      setState(prev => ({ ...prev, availability }));
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  // Cargar deliveries activos
  const loadActiveDeliveries = async () => {
    if (!state.courier) return;
    
    try {
      const deliveries = await communicationService.getCourierActiveDeliveries(state.courier.id);
      if (deliveries.length > 0) {
        setState(prev => ({ ...prev, currentDelivery: deliveries[0] }));
      }
    } catch (error) {
      console.error('Error loading active deliveries:', error);
    }
  };

  // Verificar si delivery está habilitado
  if (!isDeliveryEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🚫 Delivery Deshabilitado
          </h1>
          <p className="text-gray-600">
            El sistema de delivery no está disponible en este momento.
          </p>
        </div>
      </div>
    );
  }

  // Login mock simple
  const handleLogin = async (email: string, phone: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Mock login - en producción esto vendría de Supabase Auth
      const mockCourier: Courier = {
        id: `courier_${Date.now()}`,
        userId: email,
        name: email.split('@')[0],
        phone,
        isActive: true,
        isAvailable: false,
        updatedAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        courier: mockCourier,
        isConnected: true,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Toggle disponibilidad
  const toggleAvailability = async (isAvailable: boolean) => {
    if (!state.courier) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/couriers/${state.courier.id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          courier: result.data,
          isLoading: false,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Aceptar oferta
  const acceptOffer = async (offerId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/delivery-offers/${offerId}/accept`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentOffer: null,
          currentDelivery: result.data,
          isLoading: false,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Rechazar oferta
  const declineOffer = async (offerId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/delivery-offers/${offerId}/decline`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentOffer: null,
          isLoading: false,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Actualizar estado del delivery
  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          currentDelivery: result.data,
          isLoading: false,
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Si no está conectado, mostrar login
  if (!state.isConnected) {
    return <LoginForm onLogin={handleLogin} isLoading={state.isLoading} error={state.error} />;
  }

  // Si no hay courier, mostrar error
  if (!state.courier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            ❌ Error de Conexión
          </h1>
          <p className="text-gray-600">
            No se pudo cargar la información del repartidor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 delivery-app">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🚚 Town Repartidor</h1>
              <p className="text-sm text-gray-600">Hola, {state.courier.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                state.courier.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {state.courier.isAvailable ? '🟢 Disponible' : '🔴 No disponible'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {state.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">❌ {state.error}</p>
          </div>
        )}

        {/* Toggle de disponibilidad */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Estado de Disponibilidad</h2>
            <button
              onClick={() => toggleAvailability(!state.courier.isAvailable)}
              disabled={state.isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                state.courier.isAvailable
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50`}
            >
              {state.isLoading ? '⏳ Procesando...' : 
               state.courier.isAvailable ? '🔴 Desconectarse' : '🟢 Conectarse'}
            </button>
          </div>
        </div>

        {/* Oferta activa */}
        {state.currentOffer && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                📦 Nueva Oferta de Delivery
              </h2>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>ID:</strong> {state.currentOffer.deliveryId}</p>
                <p><strong>Expira en:</strong> {new Date(state.currentOffer.expiresAt).toLocaleString()}</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => acceptOffer(state.currentOffer!.id)}
                  disabled={state.isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  ✅ Aceptar
                </button>
                <button
                  onClick={() => declineOffer(state.currentOffer!.id)}
                  disabled={state.isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery en progreso */}
        {state.currentDelivery && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                🚚 Delivery en Progreso
              </h2>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><strong>ID:</strong> {state.currentDelivery.id}</p>
                <p><strong>Estado:</strong> {state.currentDelivery.status}</p>
                <p><strong>Recogida:</strong> {state.currentDelivery.pickup.address}</p>
                <p><strong>Entrega:</strong> {state.currentDelivery.dropoff.address}</p>
              </div>
              
              <div className="space-y-2">
                {state.currentDelivery.status === 'assigned' && (
                  <button
                    onClick={() => updateDeliveryStatus(state.currentDelivery!.id, 'pickup_confirmed')}
                    disabled={state.isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                  >
                    📦 Confirmar Recogida
                  </button>
                )}
                
                {state.currentDelivery.status === 'pickup_confirmed' && (
                  <button
                    onClick={() => updateDeliveryStatus(state.currentDelivery!.id, 'en_route')}
                    disabled={state.isLoading}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                  >
                    🚗 En Camino
                  </button>
                )}
                
                {state.currentDelivery.status === 'en_route' && (
                  <button
                    onClick={() => updateDeliveryStatus(state.currentDelivery!.id, 'delivered')}
                    disabled={state.isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                  >
                    ✅ Marcar como Entregado
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel de estadísticas */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📊 Estadísticas del Sistema</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{state.availability.total}</div>
                <div className="text-sm text-gray-600">Total Repartidores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{state.availability.available}</div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{state.availability.busy}</div>
                <div className="text-sm text-gray-600">Ocupados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{state.availability.offline}</div>
                <div className="text-sm text-gray-600">Desconectados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        {state.notifications.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">🔔 Notificaciones</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.notifications.slice(0, 5).map((notification, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estado de espera */}
        {!state.currentOffer && !state.currentDelivery && state.courier.isAvailable && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Esperando Ofertas
            </h2>
            <p className="text-gray-600">
              Estás conectado y disponible. Las ofertas de delivery aparecerán aquí.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Sistema activo: {state.availability.available} repartidores disponibles
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Componente de login
function LoginForm({ onLogin, isLoading, error }: {
  onLogin: (email: string, phone: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && phone) {
      onLogin(email, phone);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🚚 Town Repartidor
          </h1>
          <p className="text-gray-600">
            Inicia sesión para comenzar a recibir ofertas
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+56912345678"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !phone}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Demo: Usa cualquier email y teléfono para probar
          </p>
        </div>
      </div>
    </div>
  );
}

// Banner condicional para mostrar cuando no hay repartidores disponibles
import React, { useState, useEffect } from 'react';
import { isDeliveryEnabled } from '../../lib/delivery/getEnv';
import type { DeliveryAvailabilityResponse } from '../../lib/delivery/types';

export default function DeliveryBanner() {
  const [availability, setAvailability] = useState<DeliveryAvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isDeliveryEnabled()) return;

    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/system/delivery-availability');
        const result = await response.json();
        
        if (result.success) {
          setAvailability(result.data);
        }
      } catch (error) {
        console.error('Error checking delivery availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  // No mostrar si delivery está deshabilitado
  if (!isDeliveryEnabled()) return null;

  // No mostrar si está cargando
  if (isLoading) return null;

  // No mostrar si hay repartidores disponibles
  if (availability?.anyAvailable) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400">⚠️</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-800">
            <strong>Sin repartidores disponibles.</strong> 
            {' '}El delivery no está disponible en este momento. 
            Intenta más tarde o contacta directamente con el vendedor.
          </p>
        </div>
      </div>
    </div>
  );
}



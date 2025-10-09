import React, { useState, useEffect } from 'react';

interface SellerRewardsToggleProps {
  sellerId: string;
  onToggle?: (isActive: boolean) => void;
  className?: string;
}

interface RewardsConfig {
  is_active: boolean;
  points_per_peso: number;
  minimum_purchase_cents: number;
  seller_id: string;
}

export default function SellerRewardsToggle({ sellerId, onToggle, className = '' }: SellerRewardsToggleProps) {
  const [config, setConfig] = useState<RewardsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [sellerId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/seller/rewards-config?sellerId=${sellerId}`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || 'Error cargando configuración');
      }
    } catch (err) {
      console.error('Error cargando configuración de recompensas:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const toggleRewards = async () => {
    if (!config) return;

    try {
      setToggling(true);
      setError(null);

      const newStatus = !config.is_active;
      
      const response = await fetch('/api/seller/rewards-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: sellerId,
          is_active: newStatus,
          points_per_peso: config.points_per_peso,
          minimum_purchase_cents: config.minimum_purchase_cents
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(prev => prev ? { ...prev, is_active: newStatus } : null);
        
        if (onToggle) {
          onToggle(newStatus);
        }

        // Mostrar mensaje de éxito
        const message = newStatus 
          ? 'Sistema de recompensas activado exitosamente' 
          : 'Sistema de recompensas desactivado exitosamente';
        
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
          newStatus ? 'bg-green-600' : 'bg-orange-600'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      } else {
        setError(data.error || 'Error actualizando configuración');
      }
    } catch (err) {
      console.error('Error actualizando configuración:', err);
      setError('Error de conexión');
    } finally {
      setToggling(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getPointsPerPeso = (pointsPerPeso: number) => {
    return Math.round(1 / pointsPerPeso);
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
          <button
            onClick={loadConfig}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-400">
          No se pudo cargar la configuración de recompensas
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Sistema de Recompensas</h3>
          <p className="text-sm text-gray-400">
            Gestiona el sistema de puntos para tus clientes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-400">Estado actual:</div>
            <div className={`font-medium ${config.is_active ? 'text-green-400' : 'text-gray-500'}`}>
              {config.is_active ? 'Activo' : 'Inactivo'}
            </div>
          </div>
          
          <button
            onClick={toggleRewards}
            disabled={toggling}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${config.is_active ? 'bg-green-600' : 'bg-gray-600'}
              ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${config.is_active ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Configuración actual */}
      <div className="bg-gray-700 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Valor de puntos:</div>
            <div className="text-white font-medium">
              1 punto = {getPointsPerPeso(config.points_per_peso)} pesos
            </div>
          </div>
          <div>
            <div className="text-gray-400">Compra mínima:</div>
            <div className="text-white font-medium">
              {formatPrice(config.minimum_purchase_cents)}
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">
              {config.is_active ? 'Sistema activo' : 'Sistema inactivo'}
            </p>
            <p className="text-xs">
              {config.is_active 
                ? 'Los clientes pueden ganar y canjear puntos en sus compras'
                : 'Los clientes no pueden ganar ni canjear puntos'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Botón para configurar */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Última actualización: {new Date().toLocaleDateString('es-CL')}
        </div>
        <button
          onClick={() => window.open('/dashboard/rewards-config', '_blank')}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Configurar detalles →
        </button>
      </div>
    </div>
  );
}







import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { getUser } from '../../lib/session';

interface RewardsConfig {
  id?: string;
  is_active: boolean;
  points_per_peso: number;
  minimum_purchase_cents: number;
}

interface RewardTier {
  id?: string;
  tier_name: string;
  minimum_purchase_cents: number;
  points_multiplier: number;
  description: string;
  is_active: boolean;
}

export default function SellerRewardsConfig() {
  const [config, setConfig] = useState<RewardsConfig>({
    is_active: false,
    points_per_peso: 0.0286, // 1 punto = 35 pesos
    minimum_purchase_cents: 500000 // 5000 pesos
  });
  
  const [tiers, setTiers] = useState<RewardTier[]>([
    {
      tier_name: 'Bronce',
      minimum_purchase_cents: 500000, // 5000 pesos
      points_multiplier: 1.0,
      description: 'Nivel básico - 1 punto por cada 35 pesos',
      is_active: true
    },
    {
      tier_name: 'Plata',
      minimum_purchase_cents: 1000000, // 10000 pesos
      points_multiplier: 1.2,
      description: 'Nivel intermedio - 20% más puntos',
      is_active: true
    },
    {
      tier_name: 'Oro',
      minimum_purchase_cents: 2000000, // 20000 pesos
      points_multiplier: 1.5,
      description: 'Nivel premium - 50% más puntos',
      is_active: true
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatorPurchase, setSimulatorPurchase] = useState(10000);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Obtener token de sesión
      const { supabase } = await import('../../lib/supabase-browser');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      // Llamar al endpoint API
      const response = await fetch('/api/seller/rewards-config-get', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        if (result.config) {
          setConfig({
            is_active: result.config.is_active,
            points_per_peso: result.config.points_per_peso,
            minimum_purchase_cents: result.config.minimum_purchase_cents
          });
        }
        
        if (result.tiers && result.tiers.length > 0) {
          setTiers(result.tiers);
        }
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error cargando configuración:', err);
      setError('Error cargando configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);

    try {
      const user = await getUser();
      if (!user) {
        setError('No hay usuario autenticado');
        return;
      }

      // Obtener token de sesión
      const { supabase } = await import('../../lib/supabase-browser');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      // Llamar al endpoint API
      const response = await fetch('/api/seller/rewards-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ config, tiers })
      });

      const result = await response.json();

      if (result.success) {
        alert('¡Configuración guardada exitosamente!');
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      console.error('Error guardando configuración:', err);
      setError('Error guardando configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatPesos = (cents: number) => {
    return `$${(cents / 100).toLocaleString('es-CL')}`;
  };

  const calculatePointsForPurchase = (purchaseCents: number, multiplier: number = 1.0) => {
    if (purchaseCents < config.minimum_purchase_cents) return 0;
    return Math.floor(purchaseCents * config.points_per_peso * multiplier);
  };

  const calculateDiscountValue = (points: number) => {
    return points * 35; // 1 punto = 35 pesos
  };

  const updateTier = (index: number, field: keyof RewardTier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sistema de Recompensas</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Configuración Principal */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración General</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Activar sistema de puntos para mi tienda
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compra mínima para puntos (pesos)
              </label>
              <input
                type="number"
                value={config.minimum_purchase_cents / 100}
                onChange={(e) => setConfig({ 
                  ...config, 
                  minimum_purchase_cents: parseInt(e.target.value) * 100 
                })}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: {formatPesos(config.minimum_purchase_cents)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor del punto (pesos)
              </label>
              <input
                type="number"
                value={35}
                disabled
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 punto = $35 pesos (fijo)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Niveles de Recompensa */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Niveles de Recompensa</h3>
        
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">{tier.tier_name}</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tier.is_active}
                    onChange={(e) => updateTier(index, 'is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Activo</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compra mínima (pesos)
                  </label>
                  <input
                    type="number"
                    value={tier.minimum_purchase_cents / 100}
                    onChange={(e) => updateTier(index, 'minimum_purchase_cents', parseInt(e.target.value) * 100)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multiplicador de puntos
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tier.points_multiplier}
                    onChange={(e) => updateTier(index, 'points_multiplier', parseFloat(e.target.value))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={tier.description}
                    onChange={(e) => updateTier(index, 'description', e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cálculo de ejemplo para este nivel */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-700">
                  <strong>Ejemplo para {tier.tier_name}:</strong>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Compra de {formatPesos(tier.minimum_purchase_cents)} → {calculatePointsForPurchase(tier.minimum_purchase_cents, tier.points_multiplier)} puntos → {formatPesos(calculateDiscountValue(calculatePointsForPurchase(tier.minimum_purchase_cents, tier.points_multiplier)))} de descuento
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulador de Puntos Interactivo */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-6">
        <h4 className="font-bold text-green-800 mb-4 text-lg">🧮 Simulador de Puntos Interactivo</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input del simulador */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Monto de compra (pesos):
              </label>
              <input
                type="number"
                value={simulatorPurchase}
                onChange={(e) => setSimulatorPurchase(parseInt(e.target.value) || 0)}
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                placeholder="Ej: 15000"
                min="0"
              />
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-2">📊 Proyección de 10 compras:</h5>
              <div className="text-sm text-gray-600">
                <p>• Total gastado: {formatPesos(simulatorPurchase * 10 * 100)}</p>
                <p>• Puntos acumulados: {calculatePointsForPurchase(simulatorPurchase * 100) * 10} puntos</p>
                <p>• Descuento total: {formatPesos(calculateDiscountValue(calculatePointsForPurchase(simulatorPurchase * 100) * 10))}</p>
              </div>
            </div>
          </div>

          {/* Resultados del simulador */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3">🎯 Resultado de esta compra:</h5>
            
            {simulatorPurchase >= 5000 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Puntos ganados:</span>
                  <span className="text-2xl font-bold text-green-800">
                    {calculatePointsForPurchase(simulatorPurchase * 100)} puntos
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Descuento disponible:</span>
                  <span className="text-xl font-bold text-blue-800">
                    {formatPesos(calculateDiscountValue(calculatePointsForPurchase(simulatorPurchase * 100)))}
                  </span>
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  <p>💡 El cliente puede usar estos puntos en futuras compras</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Compra mínima: $5,000 para ganar puntos
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Aumenta el monto para ver los puntos que ganaría
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Información del Sistema</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los puntos solo se otorgan en compras de {formatPesos(config.minimum_purchase_cents)} o más</li>
          <li>• 1 punto = $35 pesos de descuento</li>
          <li>• Los puntos son acumulables entre compras</li>
          <li>• Solo funciona con vendedores que tengan activado el sistema</li>
          <li>• Los clientes pueden canjear puntos por descuentos en futuras compras</li>
        </ul>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}

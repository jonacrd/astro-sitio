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
    minimum_purchase_cents: 1000000 // 10000 pesos
  });
  
  const [tiers, setTiers] = useState<RewardTier[]>([
    {
      tier_name: 'Bronce',
      minimum_purchase_cents: 1000000, // 10000 pesos
      points_multiplier: 2.0,
      description: 'Nivel básico - 2x puntos',
      is_active: true
    },
    {
      tier_name: 'Plata',
      minimum_purchase_cents: 2000000, // 20000 pesos
      points_multiplier: 2.0,
      description: 'Nivel intermedio - 2x puntos',
      is_active: true
    },
    {
      tier_name: 'Oro',
      minimum_purchase_cents: 3000000, // 30000 pesos
      points_multiplier: 3.0,
      description: 'Nivel premium - 3x puntos',
      is_active: true
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);

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

  const handleTierClick = (index: number) => {
    if (editingTier === index) {
      setEditingTier(null);
    } else {
      setEditingTier(index);
    }
  };

  const handleConfigClick = () => {
    setEditingConfig(!editingConfig);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Sistema de Recompensas</h2>
      
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Configuración General */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Configuración General</h3>
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.is_active}
                onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {editingConfig ? (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Compra sistema de puntos
                </label>
                <input
                  type="number"
                  value={config.minimum_purchase_cents / 100}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    minimum_purchase_cents: parseInt(e.target.value) * 100 
                  })}
                  className="mt-1 block w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setEditingConfig(false)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingConfig(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={handleConfigClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Compra sistema de puntos</p>
                <p className="text-gray-300 text-sm">{formatPesos(config.minimum_purchase_cents)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">Valor del punto (pesos)</p>
                <p className="text-white font-medium">$35</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Niveles de Recompensa */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Niveles de Recompensa</h3>
        
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div key={index} className="relative">
              {editingTier === index ? (
                <div className="bg-gray-700 rounded-lg p-4 border border-orange-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Compra mínima (pesos)
                      </label>
                      <input
                        type="number"
                        value={tier.minimum_purchase_cents / 100}
                        onChange={(e) => updateTier(index, 'minimum_purchase_cents', parseInt(e.target.value) * 100)}
                        className="mt-1 block w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Multiplicador x puntos
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tier.points_multiplier}
                        onChange={(e) => updateTier(index, 'points_multiplier', parseFloat(e.target.value))}
                        className="mt-1 block w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setEditingTier(null)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingTier(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleTierClick(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-orange-500 text-lg">{tier.tier_name}</h4>
                      <p className="text-gray-300 text-sm">Compra mínima: {formatPesos(tier.minimum_purchase_cents)}</p>
                      <p className="text-gray-300 text-sm">Multiplicador {tier.points_multiplier}x puntos</p>
                    </div>
                    <div className="text-right">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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

import React, { useState, useEffect } from 'react';

interface SimpleDeliveryAddress {
  address: string;
  tower: string;
  apartment: string;
  contact: string;
  deliveryNotes: string;
}

interface SimpleDeliveryInfoProps {
  address: SimpleDeliveryAddress;
  onAddressChange: (address: SimpleDeliveryAddress) => void;
  onSaveAddress?: (address: SimpleDeliveryAddress) => void;
}

// Direcciones comunes para autocompletado
const COMMON_ADDRESSES = [
  'Rivas Vicuña 1130',
  'Rivas Vicuña 1131', 
  'Mapocho 3549',
  'Mapocho 3521',
  'Rivas Vicuña 1214'
];

// Opciones de torre comunes (simplificadas)
const TOWER_OPTIONS = [
  'Torre A',
  'Torre B',
  'Torre C',
  'Torre D',
  'Rengo',
  'Teno',
  'Maule'
];

export default function SimpleDeliveryInfo({ 
  address, 
  onAddressChange, 
  onSaveAddress 
}: SimpleDeliveryInfoProps) {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTowerSuggestions, setShowTowerSuggestions] = useState(false);

  // Cargar direcciones guardadas al montar el componente
  useEffect(() => {
    const loadSavedAddresses = () => {
      const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      setSavedAddresses(addresses);
      console.log('🏠 Direcciones guardadas cargadas:', addresses);
      
      // Si hay direcciones guardadas y no hay dirección actual, mostrar selector
      if (addresses.length > 0 && (!address.address || !address.contact)) {
        setShowAddressSelector(true);
      }
    };
    
    loadSavedAddresses();
  }, []);

  // Manejar cambios en el campo de dirección con autocompletado
  const handleAddressInput = (value: string) => {
    setTempAddress({ ...tempAddress, address: value });
    
    // Mostrar sugerencias si coincide con direcciones comunes
    if (value.length > 3) {
      const suggestions = COMMON_ADDRESSES.filter(addr => 
        addr.toLowerCase().includes(value.toLowerCase())
      );
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Seleccionar sugerencia
  const selectSuggestion = (suggestion: string) => {
    setTempAddress({ ...tempAddress, address: suggestion });
    setShowSuggestions(false);
  };

  // Manejar cambios en el campo de torre con autocompletado
  const handleTowerInput = (value: string) => {
    setTempAddress({ ...tempAddress, tower: value });
    
    // Mostrar sugerencias si coincide con opciones de torre
    if (value.length > 0) {
      const suggestions = TOWER_OPTIONS.filter(tower => 
        tower.toLowerCase().includes(value.toLowerCase())
      );
      setShowTowerSuggestions(suggestions.length > 0);
    } else {
      setShowTowerSuggestions(false);
    }
  };

  // Seleccionar sugerencia de torre
  const selectTowerSuggestion = (suggestion: string) => {
    setTempAddress({ ...tempAddress, tower: suggestion });
    setShowTowerSuggestions(false);
  };

  const handleSave = () => {
    console.log('💾 Guardando dirección:', tempAddress);
    onAddressChange(tempAddress);
    
    // Guardar en localStorage si está marcado como predeterminada
    if (saveAsDefault) {
      const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      const newAddress = {
        ...tempAddress,
        id: Date.now().toString(),
        isDefault: true,
        savedAt: new Date().toISOString()
      };
      
      // Marcar otras direcciones como no predeterminadas
      const updatedAddresses = addresses.map((addr: any) => ({ ...addr, isDefault: false }));
      updatedAddresses.push(newAddress);
      
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      console.log('✅ Dirección guardada como predeterminada');
    }
    
    setShowChangeModal(false);
    setSaveAsDefault(false);
  };

  const handleSelectSavedAddress = (selectedAddress: any) => {
    console.log('📍 Seleccionando dirección guardada:', selectedAddress);
    onAddressChange(selectedAddress);
    setShowAddressSelector(false);
  };

  const formatAddress = (addr: SimpleDeliveryAddress) => {
    if (!addr.address) return 'Agregar dirección';
    const tower = addr.tower ? `, ${addr.tower}` : '';
    const apartment = addr.apartment ? `, Depto ${addr.apartment}` : '';
    return `${addr.address}${tower}${apartment}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          📍 Información de Entrega
        </h3>
        <button
          onClick={() => setShowChangeModal(true)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          {address.address ? 'Cambiar' : 'Agregar'}
        </button>
      </div>

      {/* Dirección actual */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">📍 Dirección:</span>
          <span className="font-medium text-white">{formatAddress(address)}</span>
        </div>
        {address.contact && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📞 Contacto:</span>
            <span className="font-medium text-white">{address.contact}</span>
          </div>
        )}
        {address.deliveryNotes && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📝 Notas:</span>
            <span className="font-medium text-white">{address.deliveryNotes}</span>
          </div>
        )}
      </div>

      {/* Selector de direcciones guardadas */}
      {showAddressSelector && savedAddresses.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Direcciones guardadas:</h4>
          <div className="space-y-2">
            {savedAddresses.map((savedAddr) => (
              <button
                key={savedAddr.id}
                onClick={() => handleSelectSavedAddress(savedAddr)}
                className="w-full text-left p-2 bg-white rounded border hover:bg-blue-50"
              >
                <div className="font-medium">{formatAddress(savedAddr)}</div>
                <div className="text-sm text-gray-600">{savedAddr.contact}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddressSelector(false)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Usar nueva dirección
          </button>
        </div>
      )}

      {/* Modal para cambiar dirección */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📍 Agregar Dirección</h3>
              <button
                onClick={() => setShowChangeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Dirección con autocompletado */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={tempAddress.address}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  placeholder="Ej: Rivas Vicuña 1130"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                
                {/* Sugerencias de autocompletado */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-gray-900"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Torre/Edificio */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Torre/Edificio
                </label>
                <input
                  type="text"
                  value={tempAddress.tower}
                  onChange={(e) => handleTowerInput(e.target.value)}
                  placeholder="Ej: Torre A, Torre B, Edificio Central"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                
                {/* Sugerencias de torre */}
                {showTowerSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {TOWER_OPTIONS.filter(tower => 
                      tower.toLowerCase().includes(tempAddress.tower.toLowerCase())
                    ).map((tower, index) => (
                      <button
                        key={index}
                        onClick={() => selectTowerSuggestion(tower)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-gray-900"
                      >
                        {tower}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Número de departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Número de departamento
                </label>
                <input
                  type="text"
                  value={tempAddress.apartment || ''}
                  onChange={(e) => setTempAddress({ ...tempAddress, apartment: e.target.value })}
                  placeholder="Ej: 101, 205, A3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* 4. Número de contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Número de contacto *
                </label>
                <input
                  type="tel"
                  value={tempAddress.contact}
                  onChange={(e) => setTempAddress({ ...tempAddress, contact: e.target.value })}
                  placeholder="Ej: +56 9 1234 5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* 5. Notas para la entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Notas para la entrega
                </label>
                <textarea
                  value={tempAddress.deliveryNotes}
                  onChange={(e) => setTempAddress({ ...tempAddress, deliveryNotes: e.target.value })}
                  placeholder="Ej: Timbre 2, dejar en portería, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Guardar como predeterminada */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveAsDefault"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveAsDefault" className="text-sm text-gray-900">
                  Guardar como dirección predeterminada
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChangeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!tempAddress.address || !tempAddress.contact}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Guardar Dirección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



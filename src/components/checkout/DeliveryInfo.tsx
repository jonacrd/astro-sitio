import React, { useState, useEffect } from 'react';

interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  instructions: string;
}

interface DeliveryInfoProps {
  address: DeliveryAddress;
  onAddressChange: (address: DeliveryAddress) => void;
  onSaveAddress?: (address: DeliveryAddress) => void;
}

export default function DeliveryInfo({ 
  address, 
  onAddressChange, 
  onSaveAddress 
}: DeliveryInfoProps) {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // Cargar direcciones guardadas al montar el componente
  useEffect(() => {
    const loadSavedAddresses = () => {
      const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      setSavedAddresses(addresses);
      console.log('🏠 Direcciones guardadas cargadas:', addresses);
      
      // Si hay direcciones guardadas y no hay dirección actual, mostrar selector
      if (addresses.length > 0 && (!address.fullName || !address.address)) {
        setShowAddressSelector(true);
      }
    };
    
    loadSavedAddresses();
  }, []);

  const handleSave = () => {
    console.log('💾 Guardando dirección:', tempAddress);
    onAddressChange(tempAddress);
    
    // Guardar en localStorage si está marcado como predeterminada
    if (saveAsDefault) {
      const addressToSave = {
        id: `addr_${Date.now()}`,
        ...tempAddress,
        isDefault: true,
        createdAt: new Date().toISOString()
      };
      
      const existingAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      const updatedAddresses = existingAddresses.map(addr => ({ ...addr, isDefault: false }));
      updatedAddresses.push(addressToSave);
      
      localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setSavedAddresses(updatedAddresses);
      console.log('🏠 Dirección guardada como predeterminada:', addressToSave);
    }
    
    setShowChangeModal(false);
    console.log('✅ Dirección guardada exitosamente');
  };

  const handleSelectAddress = (selectedAddress: any) => {
    const formattedAddress = {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      address: selectedAddress.address,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zipCode: selectedAddress.zipCode,
      instructions: selectedAddress.instructions
    };
    
    onAddressChange(formattedAddress);
    setShowAddressSelector(false);
    console.log('📍 Dirección seleccionada:', formattedAddress);
  };

  const handleDeleteAddress = (addressId: string) => {
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
    setSavedAddresses(updatedAddresses);
    console.log('🗑️ Dirección eliminada:', addressId);
  };

  const formatAddress = (addr: DeliveryAddress) => {
    return `${addr.address}, ${addr.city}, ${addr.state}`;
  };

  return (
    <>
      <div className="checkout-card rounded-2xl bg-[#1D2939] ring-1 ring-white/10 shadow-lg p-4">
        <h2 className="text-white text-lg font-semibold mb-4">Datos de Entrega</h2>
        
        <div className="space-y-3">
          {/* Dirección actual o selector */}
          {address.fullName && address.address ? (
            <div className="p-4 bg-white/10 rounded-lg border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-green-400 text-sm font-medium">Dirección de entrega</p>
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Seleccionada</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-medium">{address.fullName}</p>
                      <p className="text-white/80 text-sm">{address.address}</p>
                      <p className="text-white/70 text-sm">{address.city}, {address.state} {address.zipCode}</p>
                      <p className="text-white/60 text-sm">📞 {address.phone}</p>
                      {address.instructions && (
                        <p className="text-white/60 text-sm">📝 {address.instructions}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  {savedAddresses.length > 0 && (
                    <button 
                      onClick={() => setShowAddressSelector(true)} 
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Cambiar
                    </button>
                  )}
                  <button 
                    onClick={() => setShowChangeModal(true)} 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/10 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Dirección requerida</p>
                    <p className="text-white text-sm font-medium">Selecciona o agrega una dirección</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {savedAddresses.length > 0 && (
                    <button 
                      onClick={() => setShowAddressSelector(true)} 
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Seleccionar
                    </button>
                  )}
                  <button 
                    onClick={() => setShowChangeModal(true)} 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para seleccionar dirección guardada */}
      {showAddressSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1D2939] rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Seleccionar Dirección</h3>
              <button 
                onClick={() => setShowAddressSelector(false)} 
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-medium">{addr.fullName}</h4>
                        {addr.isDefault && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Predeterminada</span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm">{addr.address}</p>
                      <p className="text-white/60 text-xs">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p className="text-white/60 text-xs">{addr.phone}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleSelectAddress(addr)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowAddressSelector(false);
                  setShowChangeModal(true);
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Agregar Nueva Dirección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar/agregar dirección */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-[#1D2939] rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Cambiar Dirección</h3>
              <button 
                onClick={() => setShowChangeModal(false)} 
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-300 text-sm font-medium">
                      Completa todos los campos marcados con * (incluyendo código postal) y haz clic en "GUARDAR DIRECCIÓN"
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Nombre completo *</label>
                    <input
                      type="text"
                      value={tempAddress.fullName}
                      onChange={(e) => setTempAddress({...tempAddress, fullName: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      value={tempAddress.phone}
                      onChange={(e) => setTempAddress({...tempAddress, phone: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={tempAddress.address}
                      onChange={(e) => setTempAddress({...tempAddress, address: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Calle, número, colonia"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Ciudad *</label>
                      <input
                        type="text"
                        value={tempAddress.city}
                        onChange={(e) => setTempAddress({...tempAddress, city: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ciudad"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Estado *</label>
                      <input
                        type="text"
                        value={tempAddress.state}
                        onChange={(e) => setTempAddress({...tempAddress, state: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Estado"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Código postal *</label>
                    <input
                      type="text"
                      value={tempAddress.zipCode}
                      onChange={(e) => setTempAddress({...tempAddress, zipCode: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Código postal"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Instrucciones de entrega (opcional)</label>
                    <textarea
                      value={tempAddress.instructions}
                      onChange={(e) => setTempAddress({...tempAddress, instructions: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Llamar antes de llegar, dejar en portería, etc."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAsDefault"
                      checked={saveAsDefault}
                      onChange={(e) => setSaveAsDefault(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-white/5 border-white/10 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="saveAsDefault" className="text-white/70 text-sm">
                      Guardar como dirección predeterminada
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-[#1D2939] pt-4 -mx-6 px-6 border-t-2 border-green-500/20">
              <button
                onClick={handleSave}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-3 text-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                GUARDAR DIRECCIÓN
              </button>
              <button
                onClick={() => setShowChangeModal(false)}
                className="w-full mt-3 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
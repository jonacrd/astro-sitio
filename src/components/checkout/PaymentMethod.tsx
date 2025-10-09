import React, { useState } from 'react';
import TransferProofUpload from './TransferProofUpload';

interface PaymentMethodProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  onProofUpload?: (file: File | null) => void;
  uploadedProof?: File | null;
}

export default function PaymentMethod({ 
  selectedMethod, 
  onMethodChange,
  onProofUpload,
  uploadedProof
}: PaymentMethodProps) {
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  const handleMethodChange = (method: string) => {
    onMethodChange(method);
    setShowTransferDetails(method === 'transfer');
  };

  return (
    <div className="checkout-card rounded-2xl bg-[#1D2939] ring-1 ring-white/10 shadow-lg p-4">
      <h2 className="text-white text-lg font-semibold mb-4">Método de Pago</h2>
      
      <div className="space-y-3">
        {/* Transferencia (primera opción por defecto) */}
        <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/10 cursor-pointer hover:bg-white/15 transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="transfer"
            checked={selectedMethod === 'transfer'}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="w-5 h-5 text-blue-600 bg-white/5 border-white/10 focus:ring-blue-500"
          />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Transferencia bancaria</p>
              <p className="text-white/60 text-sm">Transfiere y envía comprobante</p>
            </div>
          </div>
        </label>

        {/* Efectivo */}
        <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/10 cursor-pointer hover:bg-white/15 transition-colors">
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={selectedMethod === 'cash'}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="w-5 h-5 text-blue-600 bg-white/5 border-white/10 focus:ring-blue-500"
          />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Pago en efectivo</p>
              <p className="text-white/60 text-sm">Paga cuando recibas tu pedido</p>
            </div>
          </div>
        </label>

        {/* Detalles de transferencia */}
        {showTransferDetails && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-white font-medium mb-3">Datos para Transferencia</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-white/70 text-sm mb-1">Banco</label>
                <input
                  type="text"
                  value="Banco de Chile"
                  readOnly
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Número de cuenta</label>
                <input
                  type="text"
                  value="1234567890"
                  readOnly
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Alias</label>
                <input
                  type="text"
                  value="@tienda_local"
                  readOnly
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white/70"
                />
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <strong>Importante:</strong> Después de realizar la transferencia, 
                  deberás enviar el comprobante para confirmar tu pedido.
                </p>
              </div>
            </div>
            
            {/* Componente de subida de comprobante */}
            {onProofUpload && (
              <TransferProofUpload
                onProofUpload={onProofUpload}
                uploadedFile={uploadedProof || null}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

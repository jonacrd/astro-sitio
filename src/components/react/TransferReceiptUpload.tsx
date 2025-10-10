import React, { useState } from 'react';

interface TransferReceiptUploadProps {
  orderId: string;
  onUploadSuccess?: (receiptUrl: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export default function TransferReceiptUpload({ 
  orderId, 
  onUploadSuccess, 
  onUploadError, 
  className = '' 
}: TransferReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [transferDetails, setTransferDetails] = useState({
    bank: '',
    account: '',
    amount: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setTransferDetails(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!transferDetails.bank || !transferDetails.account) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('receipt', selectedFile);
      formData.append('transferDetails', JSON.stringify(transferDetails));

      const response = await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Comprobante subido exitosamente:', data.receipt_url);
        if (onUploadSuccess) {
          onUploadSuccess(data.receipt_url);
        }
        
        // Reset form
        setSelectedFile(null);
        setTransferDetails({ bank: '', account: '', amount: '' });
        (document.getElementById('receipt-file') as HTMLInputElement).value = '';
      } else {
        throw new Error(data.error || 'Error subiendo comprobante');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      console.error('❌ Error subiendo comprobante:', errorMessage);
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Subir Comprobante de Transferencia</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Detalles de la transferencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Banco *
            </label>
            <select
              value={transferDetails.bank}
              onChange={(e) => handleInputChange('bank', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Selecciona un banco</option>
              <option value="Banco de Chile">Banco de Chile</option>
              <option value="Santander">Santander</option>
              <option value="BCI">BCI</option>
              <option value="Itaú">Itaú</option>
              <option value="Scotiabank">Scotiabank</option>
              <option value="Estado">Banco Estado</option>
              <option value="Ripley">Banco Ripley</option>
              <option value="Security">Banco Security</option>
              <option value="Falabella">Banco Falabella</option>
              <option value="Consorcio">Banco Consorcio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número de Cuenta *
            </label>
            <input
              type="text"
              value={transferDetails.account}
              onChange={(e) => handleInputChange('account', e.target.value)}
              placeholder="1234567890"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto Transferido (opcional)
            </label>
            <input
              type="text"
              value={transferDetails.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Ej: $8,000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Subida de archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comprobante de Transferencia *
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="receipt-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {selectedFile ? (
                  <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG o PDF (máx. 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="receipt-file"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Subiendo comprobante...
            </div>
          ) : (
            'Subir Comprobante'
          )}
        </button>
      </form>

      {/* Información adicional */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>El comprobante será revisado por el vendedor</li>
              <li>Recibirás una notificación cuando se confirme el pago</li>
              <li>Si el comprobante es rechazado, podrás subir uno nuevo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}









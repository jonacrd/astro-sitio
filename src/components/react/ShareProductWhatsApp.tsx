import React, { useState } from 'react';

interface ShareProductWhatsAppProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  stock: number;
}

export default function ShareProductWhatsApp({
  productId,
  productTitle,
  productPrice,
  productImage,
  stock
}: ShareProductWhatsAppProps) {
  const [showModal, setShowModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const productUrl = `${window.location.origin}/producto/${productId}`;

  const defaultMessage = `🛍️ *${productTitle}*\n\n💰 Precio: $${productPrice.toLocaleString('es-CL')}\n📦 Stock disponible: ${stock} unidades\n\n✨ ¡Compra ahora! 👇\n${productUrl}`;

  const getMessage = () => customMessage || defaultMessage;

  const handleShareWhatsApp = () => {
    const message = getMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setShowModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Botón Compartir */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all active:scale-95 text-sm font-medium shadow-md"
        title="Compartir en WhatsApp"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Compartir
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-green-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    📱 Compartir en WhatsApp
                  </h2>
                  <p className="text-green-100 text-sm">
                    Personaliza tu mensaje y compártelo con tus clientes
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Vista Previa del Producto */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Vista Previa del Producto</h3>
                <div className="flex gap-4">
                  <img
                    src={productImage}
                    alt={productTitle}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{productTitle}</h4>
                    <p className="text-lg font-bold text-green-600">${productPrice.toLocaleString('es-CL')}</p>
                    <p className="text-sm text-gray-600">Stock: {stock} unidades</p>
                  </div>
                </div>
              </div>

              {/* Link del Producto */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🔗 Link del Producto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              {/* Mensaje Personalizado */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  💬 Mensaje para WhatsApp
                </label>
                <textarea
                  value={customMessage || defaultMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Personaliza tu mensaje..."
                />
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={() => setCustomMessage('')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    🔄 Restaurar mensaje por defecto
                  </button>
                  <button
                    onClick={handleCopyMessage}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📋 Copiar mensaje
                  </button>
                </div>
              </div>

              {/* Vista Previa del Mensaje */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-semibold text-green-900 mb-2">👁️ Vista Previa</h3>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {getMessage()}
                  </pre>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Abrir WhatsApp
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


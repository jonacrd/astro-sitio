import React, { useState, useEffect } from 'react';

interface Payment {
  payment_id: string;
  order_id: string;
  amount_cents: number;
  payment_method: string;
  transfer_receipt_url: string;
  transfer_details: any;
  payment_created_at: string;
  buyer_id: string;
  seller_id: string;
  total_cents: number;
  order_status: string;
  expires_at: string;
  buyer_email: string;
  seller_email: string;
}

interface PaymentValidationPanelProps {
  sellerId: string;
  className?: string;
}

export default function PaymentValidationPanel({ sellerId, className = '' }: PaymentValidationPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayments();
  }, [sellerId]);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/validate-receipt?sellerId=${sellerId}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments || []);
        setError(null);
      } else {
        setError(data.error || 'Error cargando pagos');
      }
    } catch (err) {
      console.error('Error cargando pagos:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const validatePayment = async (paymentId: string, approved: boolean, rejectionReason?: string) => {
    try {
      setValidating(paymentId);
      
      const response = await fetch('/api/payments/validate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          approved,
          rejectionReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar la lista de pagos
        await loadPendingPayments();
        alert(data.message || `Pago ${approved ? 'aprobado' : 'rechazado'} exitosamente`);
      } else {
        alert(data.error || 'Error validando pago');
      }
    } catch (err) {
      console.error('Error validando pago:', err);
      alert('Error de conexión');
    } finally {
      setValidating(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-white">Cargando pagos pendientes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-300">{error}</span>
        </div>
        <button
          onClick={loadPendingPayments}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Validación de Pagos</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Pagos pendientes:</span>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-medium">
            {payments.length}
          </span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-lg">No hay pagos pendientes de revisión</p>
          <p className="text-gray-500 text-sm mt-2">Todos los pagos están al día</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.payment_id}
              className={`bg-gray-700 rounded-lg p-4 border-l-4 ${
                isExpired(payment.expires_at) ? 'border-red-500' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">
                      Pedido #{payment.order_id.slice(0, 8)}
                    </h3>
                    {isExpired(payment.expires_at) && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Expirado
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Comprador:</p>
                      <p className="text-white">{payment.buyer_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Monto:</p>
                      <p className="text-green-400 font-bold">{formatPrice(payment.amount_cents)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Fecha de pago:</p>
                      <p className="text-white">{formatDate(payment.payment_created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Expira:</p>
                      <p className={`${isExpired(payment.expires_at) ? 'text-red-400' : 'text-white'}`}>
                        {formatDate(payment.expires_at)}
                      </p>
                    </div>
                  </div>

                  {payment.transfer_receipt_url && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm mb-2">Comprobante:</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={payment.transfer_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Ver comprobante
                        </a>
                        <span className="text-gray-500 text-xs">
                          {payment.transfer_details?.bank || 'Sin detalles'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => validatePayment(payment.payment_id, true)}
                    disabled={validating === payment.payment_id || isExpired(payment.expires_at)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating === payment.payment_id ? 'Validando...' : 'Aprobar'}
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo del rechazo (opcional):');
                      if (reason !== null) {
                        validatePayment(payment.payment_id, false, reason || undefined);
                      }
                    }}
                    disabled={validating === payment.payment_id || isExpired(payment.expires_at)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={loadPendingPayments}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Actualizar lista
        </button>
      </div>
    </div>
  );
}




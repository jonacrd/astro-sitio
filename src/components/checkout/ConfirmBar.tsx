import React from 'react';

interface ConfirmBarProps {
  total: number;
  onCheckout: () => void;
  processing?: boolean;
}

export default function ConfirmBar({ total, onCheckout, processing = false }: ConfirmBarProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-[100] bg-gradient-to-t from-[#0E1626] via-[#0E1626]/95 to-transparent backdrop-blur">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-white/70 text-sm">Total</p>
            <p className="text-white text-2xl font-extrabold">
              {formatPrice(total)}
            </p>
          </div>
          
          <button
            onClick={onCheckout}
            disabled={processing}
            className="h-14 w-full max-w-xs rounded-xl bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#facc15', color: '#000000' }}
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              'Pagar ahora'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

interface OrderExpirationTimerProps {
  expiresAt: string;
  onExpired?: () => void;
  className?: string;
}

export default function OrderExpirationTimer({ expiresAt, onExpired, className = '' }: OrderExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        if (onExpired) {
          onExpired();
        }
        return;
      }

      setTimeLeft(difference);
    };

    // Calcular inmediatamente
    calculateTimeLeft();

    // Actualizar cada segundo
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-500';
    if (timeLeft < 300000) return 'text-red-400'; // Menos de 5 minutos
    if (timeLeft < 600000) return 'text-yellow-400'; // Menos de 10 minutos
    return 'text-green-400';
  };

  const getTimerBgColor = () => {
    if (isExpired) return 'bg-red-900/20 border-red-500/30';
    if (timeLeft < 300000) return 'bg-red-900/20 border-red-400/30';
    if (timeLeft < 600000) return 'bg-yellow-900/20 border-yellow-400/30';
    return 'bg-green-900/20 border-green-400/30';
  };

  if (isExpired) {
    return (
      <div className={`${getTimerBgColor()} border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-400 font-medium">Pedido expirado</span>
        </div>
        <p className="text-red-300 text-sm text-center mt-2">
          El tiempo para completar el pago ha terminado
        </p>
      </div>
    );
  }

  return (
    <div className={`${getTimerBgColor()} border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-white font-medium">Tiempo restante para pagar:</span>
      </div>
      <div className="text-center mt-2">
        <div className={`text-3xl font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <p className="text-gray-300 text-sm mt-1">
          {timeLeft < 300000 ? '¡Urgente! Completa el pago pronto' : 'Completa tu pago antes de que expire'}
        </p>
      </div>
    </div>
  );
}




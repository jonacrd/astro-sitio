import React from 'react';

interface SellerRewardsInfoProps {
  className?: string;
}

export default function SellerRewardsInfo({ className = '' }: SellerRewardsInfoProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Recompensas</h2>
        <p className="text-gray-600">Información sobre cómo funciona el sistema de puntos para tus clientes</p>
      </div>

      <div className="space-y-6">
        {/* Cómo funciona */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-3">🎯 ¿Cómo funciona?</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• <strong>1 punto = $1,000 pesos de descuento</strong> para tus clientes</li>
            <li>• Los clientes ganan puntos en compras de <strong>$5,000 o más</strong></li>
            <li>• <strong>$5,000 = 5 puntos</strong> • <strong>$10,000 = 10 puntos</strong> • <strong>$20,000 = 20 puntos</strong></li>
            <li>• Los puntos se acumulan automáticamente</li>
            <li>• Los clientes pueden canjear puntos por descuentos en futuras compras</li>
          </ul>
        </div>

        {/* Beneficios para el vendedor */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3">💰 Beneficios para tu negocio</h3>
          <ul className="text-sm text-green-700 space-y-2">
            <li>• <strong>Mayor fidelidad</strong> de tus clientes</li>
            <li>• <strong>Incentiva compras mayores</strong> (mínimo $5,000)</li>
            <li>• <strong>Clientes regresan</strong> para usar sus puntos</li>
            <li>• <strong>Diferenciación</strong> de la competencia</li>
            <li>• <strong>Sistema automático</strong> - no requiere gestión manual</li>
          </ul>
        </div>

        {/* Ejemplos prácticos */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-3">📊 Ejemplos prácticos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Compra de $5,000</span>
              <span className="font-semibold text-purple-800">5 puntos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Compra de $10,000</span>
              <span className="font-semibold text-purple-800">10 puntos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Compra de $20,000</span>
              <span className="font-semibold text-purple-800">20 puntos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Compra de $50,000</span>
              <span className="font-semibold text-purple-800">50 puntos</span>
            </div>
          </div>
        </div>

        {/* Información técnica */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">⚙️ Información técnica</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>Activación automática:</strong> El sistema está activo para tu tienda</li>
            <li>• <strong>Sin configuración:</strong> No necesitas configurar nada</li>
            <li>• <strong>Cálculo automático:</strong> Los puntos se calculan automáticamente</li>
            <li>• <strong>Historial completo:</strong> Puedes ver el historial de puntos de tus clientes</li>
            <li>• <strong>Sin costos adicionales:</strong> El sistema es gratuito</li>
          </ul>
        </div>
      </div>
    </div>
  );
}









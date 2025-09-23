import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { formatPrice } from '../../lib/money';

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  title: string;
  priceCents: number;
  qty: number;
  sellerId: string;
  sellerName: string;
  totalCents: number;
}

interface CheckoutProps {}

export default function Checkout({}: CheckoutProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [processing, setProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      if (!user) {
        setError('No hay usuario autenticado');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      const response = await fetch("/api/cart/items", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setCartItems(result.data.items);
      } else {
        setError(result.error || 'Error cargando carrito');
      }
    } catch (err: any) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }

    // Validar datos de domicilio
    if (!deliveryAddress.fullName.trim() || !deliveryAddress.phone.trim() || 
        !deliveryAddress.address.trim() || !deliveryAddress.city.trim() || 
        !deliveryAddress.state.trim() || !deliveryAddress.zipCode.trim()) {
      alert('Por favor completa todos los campos obligatorios de la dirección de entrega');
      return;
    }

    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('No hay sesión activa');
        return;
      }

      // Agrupar por vendedor
      const itemsBySeller = cartItems.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
          acc[item.sellerId] = {
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            items: []
          };
        }
        acc[item.sellerId].items.push(item);
        return acc;
      }, {} as Record<string, { sellerId: string; sellerName: string; items: CartItem[] }>);

      // Procesar cada vendedor por separado
      for (const [sellerId, sellerData] of Object.entries(itemsBySeller)) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            sellerId: sellerId,
            payment_method: paymentMethod,
            delivery_address: deliveryAddress
          })
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Error procesando pago');
        }
      }

      alert('¡Compra realizada exitosamente!');
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error en checkout:', err);
      alert('Error procesando la compra: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando carrito...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
        <a href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Volver al inicio
        </a>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
        <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Continuar comprando
        </a>
      </div>
    );
  }

  const totalCents = cartItems.reduce((sum, item) => sum + item.totalCents, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumen del pedido */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Resumen del Pedido
          </h2>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">Vendedor: {item.sellerName}</p>
                  <p className="text-sm text-gray-600">Cantidad: {item.qty}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.totalCents)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total ({itemCount} {itemCount === 1 ? 'producto' : 'productos'}):</span>
              <span className="text-blue-600">{formatPrice(totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Información de domicilio */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Datos de Entrega
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.fullName}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu número de teléfono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                value={deliveryAddress.address}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle, número, colonia"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ciudad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Estado"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.zipCode}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CP"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instrucciones de entrega (opcional)
              </label>
              <textarea
                value={deliveryAddress.instructions}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, instructions: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Llamar antes de llegar, dejar en portería, etc."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Información de pago */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Método de Pago
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona método de pago:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span>Efectivo (Pago al recibir)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span>Transferencia bancaria</span>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Información importante:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Los productos se organizan por vendedor</li>
                <li>• Cada vendedor procesará su pedido por separado</li>
                <li>• Recibirás confirmación de cada vendedor</li>
                <li>• El pago se coordina directamente con cada vendedor</li>
              </ul>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
            >
              {processing ? 'Procesando...' : 'Confirmar Compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

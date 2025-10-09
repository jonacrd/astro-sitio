import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { formatPrice, pesosToCents } from '../../lib/money';
import CartSummary from '../checkout/CartSummary';
import SimpleDeliveryInfo from '../checkout/SimpleDeliveryInfo';
import PaymentMethod from '../checkout/PaymentMethod';
import OrderNotes from '../checkout/OrderNotes';
import ConfirmBar from '../checkout/ConfirmBar';

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
  image?: string;
}

interface CheckoutProps {}

export default function Checkout({}: CheckoutProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [processing, setProcessing] = useState(false);
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: '',
    tower: '',
    apartment: '',
    contact: '',
    deliveryNotes: ''
  });

  // Función para manejar cambios de dirección con logs
  const handleAddressChange = (newAddress: any) => {
    console.log('📍 Actualizando dirección:', newAddress);
    setDeliveryAddress(newAddress);
  };

  // Función para manejar subida de comprobante
  const handleProofUpload = (file: File | null) => {
    console.log('📸 Comprobante de transferencia:', file);
    setTransferProof(file);
    
    // Guardar en localStorage para persistencia
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const proofData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target?.result
        };
        localStorage.setItem('transferProof', JSON.stringify(proofData));
      };
      reader.readAsDataURL(file);
    } else {
      localStorage.removeItem('transferProof');
    }
  };

  // Monitorear cambios en deliveryAddress
  useEffect(() => {
    console.log('📍 Estado actual de deliveryAddress:', deliveryAddress);
    // Guardar en localStorage para persistencia
    localStorage.setItem('checkoutDeliveryAddress', JSON.stringify(deliveryAddress));
  }, [deliveryAddress]);

  // Monitorear cambios en paymentMethod
  useEffect(() => {
    // Guardar en localStorage para persistencia
    localStorage.setItem('checkoutPaymentMethod', paymentMethod);
  }, [paymentMethod]);
  
  // Estados para direcciones guardadas
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Estado para notas del pedido
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 Verificando autenticación en checkout...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Usuario encontrado:', user ? user.email : 'null');
        setUser(user);
      } catch (error) {
        console.error('❌ Error checking auth:', error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCartItems();
      loadUserProfile();
    }
    // Cargar datos persistentes siempre, incluso sin usuario
    loadPersistentCheckoutData();
  }, [user]);

  // Cargar datos persistentes del checkout
  const loadPersistentCheckoutData = () => {
    try {
      // Cargar método de pago
      const savedPaymentMethod = localStorage.getItem('checkoutPaymentMethod');
      if (savedPaymentMethod) {
        setPaymentMethod(savedPaymentMethod);
      }

      // Cargar dirección de entrega
      const savedDeliveryAddress = localStorage.getItem('checkoutDeliveryAddress');
      if (savedDeliveryAddress) {
        setDeliveryAddress(JSON.parse(savedDeliveryAddress));
      }

      // Cargar comprobante de transferencia
      const savedProof = localStorage.getItem('transferProof');
      if (savedProof) {
        const proofData = JSON.parse(savedProof);
        // Crear un objeto File simulado para mantener compatibilidad
        const file = new File([], proofData.name, { type: proofData.type });
        setTransferProof(file);
      }

      console.log('🔄 Datos persistentes del checkout cargados');
    } catch (error) {
      console.error('❌ Error cargando datos persistentes:', error);
    }
  };

  // Cargar perfil del usuario y direcciones guardadas
  const loadUserProfile = async () => {
    try {
      if (!user) return;

      // Cargar perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error cargando perfil:', profileError);
      } else {
        setUserProfile(profile);
        console.log('👤 Perfil cargado:', profile);
      }

      // Cargar direcciones guardadas
      const { data: addresses, error: addressesError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (addressesError) {
        console.error('Error cargando direcciones:', addressesError);
      } else {
        setSavedAddresses(addresses || []);
        console.log('🏠 Direcciones cargadas:', addresses);
        
        // Si hay direcciones, seleccionar la primera por defecto
        if (addresses && addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
          loadSelectedAddress(addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  // Cargar dirección seleccionada
  const loadSelectedAddress = (address: any) => {
    setDeliveryAddress({
      fullName: address.full_name || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zip_code || '',
      instructions: address.instructions || ''
    });
    setShowNewAddressForm(false);
  };

  // Guardar nueva dirección
  const saveNewAddress = async () => {
    try {
      if (!user) return;

      // Verificar si ya existe una dirección idéntica
      const { data: existingAddress, error: checkError } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('address', deliveryAddress.address)
        .eq('tower', deliveryAddress.tower || '')
        .eq('phone', deliveryAddress.contact)
        .single();

      if (existingAddress) {
        console.log('📍 Dirección ya existe, seleccionando existente');
        setSelectedAddressId(existingAddress.id);
        setShowNewAddressForm(false);
        alert('Esta dirección ya está guardada');
        return;
      }

      // Si no existe, crear nueva dirección
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
          phone: deliveryAddress.contact,
          address: deliveryAddress.address,
          tower: deliveryAddress.tower || '',
          city: 'Santiago', // Por defecto
          state: 'RM', // Por defecto
          zip_code: '', // No requerido
          instructions: deliveryAddress.deliveryNotes || '',
          is_default: savedAddresses.length === 0 // Primera dirección es por defecto
        })
        .select()
        .single();

      if (error) {
        console.error('Error guardando dirección:', error);
        alert('Error al guardar la dirección');
        return;
      }

      console.log('✅ Dirección guardada:', data);
      
      // Recargar direcciones
      await loadUserProfile();
      
      // Seleccionar la nueva dirección
      setSelectedAddressId(data.id);
      setShowNewAddressForm(false);
      
      alert('Dirección guardada exitosamente');
    } catch (error) {
      console.error('Error guardando dirección:', error);
      alert('Error al guardar la dirección');
    }
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar items del localStorage
      const stored = localStorage.getItem('cart');
      if (!stored) {
        setError('Tu carrito está vacío');
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(stored);
      if (!parsed || parsed.length === 0) {
        setError('Tu carrito está vacío');
        setLoading(false);
        return;
      }

      console.log('🛒 Checkout: Cargando items del localStorage:', parsed);

      // Debug: verificar estructura de cada item
      parsed.forEach((item: any, index: number) => {
        console.log(`🛒 Item ${index} del localStorage:`, {
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          vendor: item.vendor,
          sellerName: item.sellerName,
          sellerId: item.sellerId,
          image: item.image
        });
      });

      // Convertir formato de localStorage a formato del checkout
      const formattedItems: CartItem[] = parsed.map((item: any) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        
        console.log(`🛒 Convirtiendo item:`, {
          original: item,
          price: price,
          quantity: quantity,
          total: price * quantity
        });

        return {
          id: item.id,
          cartId: user?.id || 'local',
          productId: item.id,
          title: item.title,
          priceCents: price, // Precio unitario en pesos (para mostrar en UI)
          qty: quantity, // Usar qty como espera la interfaz
          sellerId: item.sellerId || 'seller_1', // Usar sellerId del item si existe
          sellerName: item.sellerName || item.vendor || 'Vendedor', // Usar sellerName primero
          totalCents: pesosToCents(price * quantity), // Total en centavos (para cálculos internos)
          image: item.image || '/placeholder-product.jpg' // Incluir imagen del producto
        };
      });

      console.log('🛒 Checkout: Items formateados:', formattedItems);
      
      // Debug: verificar valores de cada item
      formattedItems.forEach((item, index) => {
        console.log(`🛒 Item ${index} formateado:`, {
          id: item.id,
          title: item.title,
          priceCents: item.priceCents,
          qty: item.qty,
          sellerName: item.sellerName,
          sellerId: item.sellerId,
          totalCents: item.totalCents,
          image: item.image,
          isPriceNaN: isNaN(item.priceCents),
          isQtyNaN: isNaN(item.qty),
          isTotalNaN: isNaN(item.totalCents)
        });
      });
      
      setCartItems(formattedItems);
    } catch (err: any) {
      console.error('❌ Error cargando carrito:', err);
      setError('Error al cargar el carrito: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    console.log('🛒 Iniciando proceso de checkout...');
    console.log('👤 Usuario actual:', user ? user.email : 'null');
    console.log('🛍️ Items en carrito:', cartItems.length);
    
    // Verificar si hay sesión activa
    if (!user) {
      console.log('🔐 No hay sesión activa, mostrando modal de inicio de sesión');
      // Disparar evento para mostrar modal de inicio de sesión
      window.dispatchEvent(new CustomEvent('show-login-modal'));
      return;
    }

    if (cartItems.length === 0) {
      console.log('❌ No hay productos en el carrito');
      alert('No hay productos en el carrito');
      return;
    }

    // Validar datos de domicilio
    console.log('🔍 Validando dirección:', deliveryAddress);
    const missingFields = [];
    if (!deliveryAddress.address?.trim()) missingFields.push('Dirección');
    if (!deliveryAddress.contact?.trim()) missingFields.push('Número de contacto');
    
    console.log('❌ Campos faltantes:', missingFields);
    
    if (missingFields.length > 0) {
      alert(`Error procesando la compra: Los campos de dirección son obligatorios\n\nCampos faltantes:\n• ${missingFields.join('\n• ')}\n\nHaz clic en "Agregar dirección" para completar los datos.`);
      return;
    }

    // Validar comprobante si es transferencia
    if (paymentMethod === 'transfer' && !transferProof) {
      alert('Por favor sube el comprobante de transferencia antes de continuar');
      return;
    }

    setProcessing(true);

    try {
      console.log('🛒 Procesando checkout con flujo existente...');
      console.log('📦 Items del carrito:', cartItems);
      console.log('📍 Dirección de entrega:', deliveryAddress);
      
      // Debug: verificar total antes de enviar
      const calculatedTotal = cartItems.reduce((sum, item) => {
        const price = Number(item.priceCents) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      console.log('💰 Total calculado en frontend:', calculatedTotal);

      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('❌ No hay token de sesión');
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Preparar comprobante de transferencia si existe
      let transferProofData = null;
      if (paymentMethod === 'transfer' && transferProof) {
        // Leer el archivo como base64
        const reader = new FileReader();
        transferProofData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(transferProof);
        });
      }

      // Usar el flujo de checkout existente que ya funciona
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
          customerEmail: user.email,
          deliveryAddress: {
            address: deliveryAddress.address,
            tower: deliveryAddress.tower,
            contact: deliveryAddress.contact,
            deliveryNotes: deliveryAddress.deliveryNotes
          },
          paymentMethod: paymentMethod,
          orderNotes: orderNotes,
          transferProof: transferProofData,
          cartItems: cartItems // Enviar los items reales del carrito
        })
      });

      const result = await response.json();
      console.log('📋 Respuesta del checkout:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Error en el checkout');
      }

      if (result.success) {
        // Preguntar si quiere guardar la dirección solo si es la primera compra
        const hasAddresses = savedAddresses && savedAddresses.length > 0;
        
        if (!hasAddresses) {
          const shouldSave = window.confirm(
            '¿Deseas guardar esta dirección para futuras compras?\n\n' +
            'Podrás editarla o eliminarla desde tu perfil.'
          );
          
          if (shouldSave) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              if (user) {
                const { error: saveError } = await supabase
                  .from('user_addresses')
                  .insert({
                    user_id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
                    phone: deliveryAddress.contact,
                    address: deliveryAddress.address,
                    tower: deliveryAddress.tower || '',
                    city: 'Santiago', // Por defecto
                    state: 'RM', // Por defecto
                    zip_code: '', // No requerido
                    instructions: deliveryAddress.deliveryNotes || '',
                    is_default: true
                  });
                
                if (saveError) {
                  console.error('Error guardando dirección:', saveError);
                } else {
                  console.log('✅ Dirección guardada en la base de datos');
                  // Recargar direcciones
                  await loadUserProfile();
                }
              }
            } catch (error) {
              console.error('Error guardando dirección:', error);
            }
          }
        }
        
        // Preparar datos del carrito para la página de confirmación
        const cartData = {
          items: cartItems,
          totalCents: cartItems.reduce((sum, item) => sum + (item.totalCents || 0), 0),
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
          customerEmail: user.email
        };
        
        console.log('💾 Guardando datos del carrito:', cartData);
        console.log('📦 Items del carrito:', cartItems);
        console.log('💰 Total calculado:', cartData.totalCents);
        
        // Guardar datos del carrito en sessionStorage para la página de confirmación
        sessionStorage.setItem('orderData', JSON.stringify(cartData));
        
        // Verificar que se guardó correctamente
        const savedData = sessionStorage.getItem('orderData');
        console.log('✅ Datos guardados en sessionStorage:', savedData);
        
        // Limpiar carrito
        localStorage.removeItem('cart');
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart: [] } }));
        
        // Redirigir a página de confirmación
        window.location.href = `/gracias?order=${result.orderCode}`;
      } else {
        throw new Error(result.error || 'Error procesando la compra');
      }
    } catch (err: any) {
      console.error('Error en checkout:', err);
      alert('Error procesando la compra: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0E1626] to-[#101828] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0E1626] to-[#101828] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Error</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 active:scale-95 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0E1626] to-[#101828] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-white/60 mb-6">Agrega algunos productos para continuar</p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 active:scale-95 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continuar comprando
          </a>
        </div>
      </div>
    );
  }

      const totalCents = cartItems.reduce((sum, item) => sum + (item.totalCents || 0), 0);
      const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="checkout-container min-h-screen bg-gradient-to-b from-[#0E1626] to-[#101828] pb-40">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              // Intentar volver con history, si no funciona, redirigir a home
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = '/';
              }
            }}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">Finalizar Compra</h1>
        </div>

        <div className="space-y-4">
          {/* Resumen del carrito */}
          <CartSummary
            items={cartItems}
            onUpdateQuantity={(itemId, quantity) => {
              console.log('🛒 Actualizando cantidad:', itemId, quantity);
              
              // Actualizar en localStorage
              const stored = localStorage.getItem('cart');
              if (stored) {
                const cart = JSON.parse(stored);
                const itemIndex = cart.findIndex((item: any) => item.id === itemId);
                
                if (itemIndex >= 0) {
                  if (quantity <= 0) {
                    // Eliminar item si cantidad es 0
                    cart.splice(itemIndex, 1);
                    console.log('🗑️ Item eliminado del carrito');
                  } else {
                    // Actualizar cantidad
                    cart[itemIndex].quantity = quantity;
                    console.log('📝 Cantidad actualizada:', cart[itemIndex]);
                  }
                  
                  // Guardar en localStorage
                  localStorage.setItem('cart', JSON.stringify(cart));
                  
                  // Recargar items del carrito
                  fetchCartItems();
                  
                  // Disparar evento de actualización
                  window.dispatchEvent(new CustomEvent('cart-updated', { 
                    detail: { cart } 
                  }));
                }
              }
            }}
            onRemoveItem={(itemId) => {
              console.log('🗑️ Eliminando item:', itemId);
              
              // Eliminar del localStorage
              const stored = localStorage.getItem('cart');
              if (stored) {
                const cart = JSON.parse(stored);
                const filteredCart = cart.filter((item: any) => item.id !== itemId);
                
                localStorage.setItem('cart', JSON.stringify(filteredCart));
                console.log('✅ Item eliminado del carrito');
                
                // Recargar items del carrito
                fetchCartItems();
                
                // Disparar evento de actualización
                window.dispatchEvent(new CustomEvent('cart-updated', { 
                  detail: { cart: filteredCart } 
                }));
              }
            }}
            subtotal={totalCents / 100}
            total={totalCents / 100}
          />

          {/* Información de entrega */}
          <SimpleDeliveryInfo
            address={deliveryAddress}
            onAddressChange={handleAddressChange}
            onSaveAddress={saveNewAddress}
          />

          {/* Método de pago */}
          <PaymentMethod
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            onProofUpload={handleProofUpload}
            uploadedProof={transferProof}
          />

          {/* Notas del pedido */}
          <OrderNotes
            notes={orderNotes}
            onNotesChange={setOrderNotes}
          />
        </div>

        {/* Barra de confirmación */}
        <ConfirmBar
          total={totalCents / 100}
          onCheckout={handleCheckout}
          processing={processing}
        />
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react'
import { formatPrice } from '@lib/money'

interface CartData {
  success: boolean
  items: any[]
  totalCents: number
  itemCount: number
}

interface CartWidgetProps {
  className?: string
}

export default function CartWidget({ className = "" }: CartWidgetProps) {
  const [cartData, setCartData] = useState<CartData>({
    success: true,
    items: [],
    totalCents: 0,
    itemCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart/get')
      const data = await response.json()
      setCartData(data)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
    
    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = (event: CustomEvent) => {
      setCartData(prev => ({
        ...prev,
        itemCount: event.detail.itemCount,
        totalCents: event.detail.totalCents
      }))
    }

    window.addEventListener('cart-updated', handleCartUpdate as EventListener)
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchCart, 30000)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener)
      clearInterval(interval)
    }
  }, [])

  // Manejar scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  return (
    <>
      {/* Botón del carrito */}
      <button
        onClick={openCart}
        className={`
          flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-gray-100 
          transition-colors duration-200 group min-h-11
          ${className}
        `}
      >
        {/* Icono del carrito con badge */}
        <div className="relative">
          <svg 
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" 
            />
          </svg>
          
          {/* Badge con cantidad */}
          {cartData.itemCount > 0 && (
            <span className="
              absolute -top-2 -right-2 bg-red-500 text-white text-xs 
              rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
              font-bold
            ">
              {cartData.itemCount > 99 ? '99+' : cartData.itemCount}
            </span>
          )}
        </div>

        {/* Información del carrito - solo visible en desktop */}
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {cartData.itemCount === 0 ? 'Carrito vacío' : 
             cartData.itemCount === 1 ? '1 producto' : 
             `${cartData.itemCount} productos`}
          </span>
          {cartData.totalCents > 0 && (
            <span className="text-xs text-gray-500 group-hover:text-blue-500">
              {formatPrice(cartData.totalCents)}
            </span>
          )}
        </div>
      </button>

      {/* Drawer/Modal del carrito */}
      <div className={`
        fixed inset-0 z-50
        ${isOpen ? "pointer-events-auto" : "pointer-events-none"}
      `}>
        {/* Backdrop */}
        <div 
          className={`
            absolute inset-0 bg-black/40 transition-opacity
            ${isOpen ? "opacity-100" : "opacity-0"}
          `} 
          onClick={closeCart}
        />
        
        {/* Panel del carrito */}
        <aside className={`
          absolute right-0 top-0 h-dvh w-full sm:w-[420px] bg-white shadow-xl 
          transition-transform
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Carrito ({cartData.itemCount})
            </h2>
            <button
              onClick={closeCart}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del carrito */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartData.items.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.product?.imageUrl || '/images/placeholder-product.jpg'}
                        alt={item.product?.name || 'Producto'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {item.product?.name || 'Producto'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatPrice(item.product?.priceCents * item.quantity || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con total y botones */}
          {cartData.items.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(cartData.totalCents)}
                </span>
              </div>
              <div className="space-y-2">
                <a
                  href="/carrito"
                  className="w-full min-h-11 bg-blue-600 text-white rounded-lg font-medium 
                           hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Ver carrito completo
                </a>
                <a
                  href="/carrito"
                  className="w-full min-h-11 border border-gray-300 text-gray-700 rounded-lg font-medium 
                           hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Continuar comprando
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}



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

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  return (
    <a 
      href="/carrito" 
      className={`
        flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
        transition-colors duration-200 group
        ${className}
      `}
    >
      {/* Icono del carrito con badge */}
      <div className="relative">
        <svg 
          className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" 
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
            font-bold animate-pulse
          ">
            {cartData.itemCount > 99 ? '99+' : cartData.itemCount}
          </span>
        )}
      </div>

      {/* Información del carrito */}
      <div className="flex flex-col">
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
    </a>
  )
}



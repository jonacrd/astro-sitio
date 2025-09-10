import { useState } from 'react'

interface CheckoutButtonProps {
  disabled?: boolean
  className?: string
}

export default function CheckoutButton({ 
  disabled = false, 
  className = "" 
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: ''
  })

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName.trim() || !formData.customerEmail.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // Redirigir a página de confirmación
        window.location.href = `/gracias?order=${data.orderCode}`
      } else {
        alert(data.error || 'Error al procesar la orden')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('Error al procesar la orden')
    } finally {
      setLoading(false)
    }
  }

  if (showForm) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4">Datos de contacto</h3>
        
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="customerEmail"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                      className="opacity-25"
                    />
                    <path 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    />
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Confirmar pedido'
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      disabled={disabled}
      className={`
        w-full bg-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg
        hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      Proceder al checkout
    </button>
  )
}

import type { APIRoute } from 'astro'
import { prisma } from '@/lib/db'

// Función para enviar email (simulada si no hay RESEND_API_KEY)
async function sendOrderEmail(orderData: any, customerData: any) {
  const emailContent = `
    Nueva Orden Recibida
    
    Número de Orden: ${orderData.orderCode}
    Cliente: ${customerData.name}
    Email: ${customerData.email}
    Total: $${(orderData.totalCents / 100).toFixed(2)}
    
    Productos:
    ${orderData.items.map((item: any) => 
      `- ${item.name} x${item.quantity} - $${(item.priceCents / 100).toFixed(2)}`
    ).join('\n')}
  `

  if (import.meta.env.RESEND_API_KEY) {
    // TODO: Implementar envío real con Resend
    console.log('Enviando email con Resend:', emailContent)
  } else {
    console.info('Email simulado - Nueva orden:', {
      orderCode: orderData.orderCode,
      customer: customerData.name,
      total: orderData.totalCents
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { items, customer } = body

    // Validar datos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se proporcionaron productos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!customer || !customer.name || !customer.email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Datos del cliente requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verificar stock y calcular total
    let totalCents = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return new Response(JSON.stringify({
          success: false,
          error: `Producto con ID ${item.productId} no encontrado`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (product.stock < item.quantity) {
        return new Response(JSON.stringify({
          success: false,
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      totalCents += product.priceCents * item.quantity
      orderItems.push({
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: item.quantity
      })
    }

    // Generar código de orden único
    const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Crear la orden en la base de datos
    const order = await prisma.order.create({
      data: {
        orderCode,
        cartId: `demo-${Date.now()}`, // ID temporal para demo
        totalCents,
        customerName: customer.name,
        customerEmail: customer.email,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    })

    // Descontar stock de los productos
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Enviar email de notificación
    await sendOrderEmail(order, customer)

    return new Response(JSON.stringify({
      success: true,
      data: {
        orderId: order.id,
        orderCode: order.orderCode,
        total: order.totalCents,
        message: 'Orden creada exitosamente'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al procesar la orden'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}


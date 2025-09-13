import type { APIRoute } from 'astro'
import { prisma } from '@/lib/db'

export const GET: APIRoute = async () => {
  try {
    // Obtener fecha de hoy
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Obtener estadísticas en paralelo
    const [
      leadsToday,
      ordersToday,
      lowStockProducts,
      totalRevenueToday,
      recentOrders,
      recentLeads
    ] = await Promise.all([
      // Leads de hoy
      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),

      // Órdenes de hoy
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),

      // Productos con stock bajo (menos de 10 unidades)
      prisma.product.count({
        where: {
          stock: {
            lt: 10
          }
        }
      }),

      // Revenue de hoy
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        _sum: {
          totalCents: true
        }
      }),

      // Últimas 10 órdenes
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        }
      }),

      // Últimos 10 leads
      prisma.lead.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    const revenueToday = totalRevenueToday._sum.totalCents || 0

    // Calcular estadísticas adicionales
    const totalProducts = await prisma.product.count()
    const totalLeads = await prisma.lead.count()
    const totalOrders = await prisma.order.count()

    return new Response(JSON.stringify({
      success: true,
      data: {
        // Métricas principales
        leads_today: leadsToday,
        orders_today: ordersToday,
        revenue_today: revenueToday,
        low_stock: lowStockProducts,

        // Estadísticas generales
        total_products: totalProducts,
        total_leads: totalLeads,
        total_orders: totalOrders,

        // Datos detallados
        recent_orders: recentOrders.map(order => ({
          id: order.id,
          orderCode: order.orderCode,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          totalCents: order.totalCents,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents
          }))
        })),

        recent_leads: recentLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          whatsapp: lead.whatsapp,
          source: lead.source,
          status: lead.status,
          createdAt: lead.createdAt
        })),

        // Metadatos
        last_updated: new Date().toISOString(),
        demo_mode: true
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener las estadísticas'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

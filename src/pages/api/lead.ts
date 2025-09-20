import type { APIRoute } from 'astro'
import { prisma } from '@/lib/db'

// Función para enviar lead a Google Sheets
async function sendToGoogleSheets(leadData: any) {
  const sheetsUrl = import.meta.env.SHEETS_WEBAPP_URL
  
  if (!sheetsUrl) {
    console.info('SHEETS_WEBAPP_URL no configurado, saltando envío a Google Sheets')
    return
  }

  try {
    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: leadData.name,
        email: leadData.email,
        whatsapp: leadData.whatsapp,
        source: leadData.source,
        timestamp: new Date().toISOString()
      })
    })

    if (response.ok) {
      console.log('Lead enviado exitosamente a Google Sheets')
    } else {
      console.error('Error al enviar lead a Google Sheets:', response.statusText)
    }
  } catch (error) {
    console.error('Error de conexión con Google Sheets:', error)
  }
}

// Función para enviar email de notificación (simulada si no hay RESEND_API_KEY)
async function sendLeadEmail(leadData: any) {
  const emailContent = `
    Nuevo Lead Recibido
    
    Nombre: ${leadData.name}
    Email: ${leadData.email}
    WhatsApp: ${leadData.whatsapp}
    Fuente: ${leadData.source}
    Fecha: ${new Date().toLocaleString()}
  `

  if (import.meta.env.RESEND_API_KEY) {
    // TODO: Implementar envío real con Resend
    console.log('Enviando email con Resend:', emailContent)
  } else {
    console.info('Email simulado - Nuevo lead:', {
      name: leadData.name,
      email: leadData.email,
      whatsapp: leadData.whatsapp
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { name, email, whatsapp } = body

    // Validar datos requeridos
    if (!name || !email || !whatsapp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nombre, email y WhatsApp son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Crear el lead en la base de datos
    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      source: 'demo'
    }

    const lead = await prisma.lead.upsert({
      where: { email: leadData.email },
      update: {
        name: leadData.name,
        whatsapp: leadData.whatsapp,
        status: 'updated',
        updatedAt: new Date()
      },
      create: leadData
    })

    // Enviar a Google Sheets (asíncrono, no bloquea la respuesta)
    sendToGoogleSheets(leadData).catch(console.error)

    // Enviar email de notificación (asíncrono)
    sendLeadEmail(leadData).catch(console.error)

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        whatsapp: lead.whatsapp,
        source: lead.source,
        status: lead.status,
        message: 'Lead guardado exitosamente'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error saving lead:', error)
    
    // Si es error de duplicado, manejarlo de manera más amigable
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este email ya está registrado'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al guardar el lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}



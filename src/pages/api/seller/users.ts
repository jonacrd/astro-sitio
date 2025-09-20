import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Lista de usuarios de vendedores con credenciales simples
    const users = [
      { username: 'user1', password: '1', name: 'Juan Pérez', sellerId: 's1', storeName: 'Carnes del Zulia', active: true },
      { username: 'user2', password: '2', name: 'María González', sellerId: 's2', storeName: 'Postres y Dulces', active: true },
      { username: 'user3', password: '3', name: 'Carlos López', sellerId: 's3', storeName: 'Licores Premium', active: false },
      { username: 'user4', password: '4', name: 'Ana Rodríguez', sellerId: 's4', storeName: 'Belleza y Estilo', active: true },
      { username: 'user5', password: '5', name: 'Pedro Martínez', sellerId: 's5', storeName: 'AutoMecánica Pro', active: true },
      { username: 'user6', password: '6', name: 'Laura Sánchez', sellerId: 's6', storeName: 'Sabores Tradicionales', active: true },
      { username: 'user7', password: '7', name: 'Roberto Torres', sellerId: 's7', storeName: 'Comidas Rápidas Express', active: true },
      { username: 'user8', password: '8', name: 'Carmen Flores', sellerId: 's8', storeName: 'Almuerzos Ejecutivos', active: true },
      { username: 'user9', password: '9', name: 'Diego Herrera', sellerId: 's9', storeName: 'Parrilla y Mariscos', active: true }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: users,
      message: 'Usuarios de vendedores creados. Usa username/password para login.'
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios de vendedores:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor' 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

import type { APIRoute } from 'astro';

// Datos mock de usuarios de vendedores
const SELLER_USERS = [
  { id:'u1', username:'user1', password:'1', name:'Juan Pérez', phone:'+56912345678', email:'user1@carnesdelzulia.com', sellerId:'s1', role:'seller', active:true },
  { id:'u2', username:'user2', password:'2', name:'María González', phone:'+56912345679', email:'user2@postresydulces.com', sellerId:'s2', role:'seller', active:true },
  { id:'u3', username:'user3', password:'3', name:'Carlos López', phone:'+56912345680', email:'user3@licorespremium.com', sellerId:'s3', role:'seller', active:false },
  { id:'u4', username:'user4', password:'4', name:'Ana Rodríguez', phone:'+56912345681', email:'user4@bellezayestilo.com', sellerId:'s4', role:'seller', active:true },
  { id:'u5', username:'user5', password:'5', name:'Pedro Martínez', phone:'+56912345682', email:'user5@automecanicapro.com', sellerId:'s5', role:'seller', active:true },
  { id:'u6', username:'user6', password:'6', name:'Laura Sánchez', phone:'+56912345683', email:'user6@saborestradicionales.com', sellerId:'s6', role:'seller', active:true },
  { id:'u7', username:'user7', password:'7', name:'Roberto Torres', phone:'+56912345684', email:'user7@comidasrapidasexpress.com', sellerId:'s7', role:'seller', active:true },
  { id:'u8', username:'user8', password:'8', name:'Carmen Flores', phone:'+56912345685', email:'user8@almuerzosejecutivos.com', sellerId:'s8', role:'seller', active:true },
  { id:'u9', username:'user9', password:'9', name:'Diego Herrera', phone:'+56912345686', email:'user9@parrillaymariscos.com', sellerId:'s9', role:'seller', active:true }
];

const SELLERS = [
  { id:'s1', storeName:'Carnes del Zulia', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[8,20], tue:[8,20], wed:[8,20], thu:[8,20], fri:[8,21], sat:[9,19], sun:[9,18] } },
  { id:'s2', storeName:'Postres y Dulces', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[9,19], tue:[9,19], wed:[9,19], thu:[9,19], fri:[9,20], sat:[10,18], sun:[10,17] } },
  { id:'s3', storeName:'Licores Premium', onlineManual:false, timezone:'America/Santiago', hoursJson:{ mon:[10,22], tue:[10,22], wed:[10,22], thu:[10,22], fri:[10,23], sat:[11,23], sun:[12,20] } },
  { id:'s4', storeName:'Belleza y Estilo', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[9,19], tue:[9,19], wed:[9,19], thu:[9,19], fri:[9,20], sat:[9,18], sun:null } },
  { id:'s5', storeName:'AutoMecánica Pro', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[8,18], tue:[8,18], wed:[8,18], thu:[8,18], fri:[8,18], sat:[8,14], sun:null } },
  { id:'s6', storeName:'Sabores Tradicionales', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[7,21], tue:[7,21], wed:[7,21], thu:[7,21], fri:[7,22], sat:[8,22], sun:[8,20] } },
  { id:'s7', storeName:'Comidas Rápidas Express', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[10,22], tue:[10,22], wed:[10,22], thu:[10,22], fri:[10,23], sat:[11,23], sun:[12,20] } },
  { id:'s8', storeName:'Almuerzos Ejecutivos', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[11,15], tue:[11,15], wed:[11,15], thu:[11,15], fri:[11,15], sat:[12,16], sun:null } },
  { id:'s9', storeName:'Parrilla y Mariscos', onlineManual:true, timezone:'America/Santiago', hoursJson:{ mon:[18,23], tue:[18,23], wed:[18,23], thu:[18,23], fri:[18,24], sat:[18,24], sun:[18,22] } }
];

function isOpen(hours:any, now=new Date()){
  const key = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
  const span = hours?.[key];
  if(!span) return false;
  const h = now.getHours() + now.getMinutes()/60;
  return h >= span[0] && h < span[1];
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Username y password son requeridos' 
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Buscar usuario
    const user = SELLER_USERS.find(u => u.username === username && u.password === password && u.active);
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciales inválidas' 
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Buscar vendedor asociado
    const seller = SELLERS.find(s => s.id === user.sellerId);
    
    const result = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        sellerId: user.sellerId,
        role: user.role
      },
      seller: seller ? {
        id: seller.id,
        storeName: seller.storeName,
        online: seller.onlineManual,
        open: isOpen(seller.hoursJson),
        available: isOpen(seller.hoursJson) && seller.onlineManual
      } : null
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en login de vendedor:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor' 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

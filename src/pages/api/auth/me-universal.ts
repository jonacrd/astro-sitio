import type { APIRoute } from 'astro';
import { getUserId } from '@lib/session';
import { userRepo } from '@lib/repos';

// Datos mock de usuarios de vendedores
const SELLER_USERS = [
  { id:'u1', username:'user1', password:'1', name:'Juan Pérez', phone:'+56912345678', email:'user1@carnesdelzulia.com', sellerId:'s1', role:'seller', active:true },
  { id:'u2', username:'user2', password:'2', name:'María González', phone:'+56912345679', email:'user2@postresydulces.com', sellerId:'s2', role:'seller', active:true },
  { id:'u3', username:'user3', password:'3', name:'Carlos López', phone:'+56912345680', email:'user3@licorespremium.com', sellerId:'s3', role:'seller', active:false },
  { id:'u4', username:'user4', password:'4', name:'Ana Rodríguez', phone:'+56912345681', email:'user4@bellezayestilo.com', sellerId:'s4', role:'seller', active:true },
  { id:'u5', username:'user5', password:'5', name:'Pedro Martínez', phone:'+56912345682', email:'user5@automecanicapro.com', sellerId:'s5', role:'seller', active:false },
  { id:'u6', username:'user6', password:'6', name:'Laura Sánchez', phone:'+56912345683', email:'user6@saborestradicionales.com', sellerId:'s6', role:'seller', active:true },
  { id:'u7', username:'user7', password:'7', name:'Roberto Torres', phone:'+56912345684', email:'user7@comidasrapidasexpress.com', sellerId:'s7', role:'seller', active:true },
  { id:'u8', username:'user8', password:'8', name:'Carmen Flores', phone:'+56912345685', email:'user8@almuerzosejecutivos.com', sellerId:'s8', role:'seller', active:true },
  { id:'u9', username:'user9', password:'9', name:'Diego Herrera', phone:'+56912345686', email:'user9@parrillaymariscos.com', sellerId:'s9', role:'seller', active:true }
];

export const GET: APIRoute = async (ctx) => {
  try {
    const uid = getUserId(ctx);
    if (!uid) return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });

    // Primero intentar con usuarios normales
    const user = await userRepo.findById(uid);
    if (user) {
      // Devolver usuario sin passwordHash
      const { passwordHash, ...userSafe } = user;
      return new Response(JSON.stringify({ user: userSafe }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Si no encuentra usuario normal, buscar en vendedores
    const sellerUser = SELLER_USERS.find(u => u.id === uid);
    if (sellerUser) {
      // Devolver vendedor sin password
      const { password, ...sellerSafe } = sellerUser;
      return new Response(JSON.stringify({ user: sellerSafe }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
    
    return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (error) {
    console.error('Me error:', error);
    return new Response(JSON.stringify({ user: null }), { 
      headers: { 'content-type': 'application/json' } 
    });
  }
};


import type { APIRoute } from 'astro';
import { setSession } from '@lib/session';
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

export const POST: APIRoute = async (ctx) => {
  try {
    const { phone, password } = await ctx.request.json();
    if (!phone || !password) return new Response('Bad Request', { status: 400 });

    // Primero intentar con usuarios normales (por teléfono)
    const user = await userRepo.findByPhone(phone);
    if (user && user.passwordHash === password) {
      setSession(ctx, user.id);
      return new Response(JSON.stringify({ id: user.id, role: user.role }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Si no encuentra usuario normal, buscar en vendedores (por username)
    const sellerUser = SELLER_USERS.find(u => u.username === phone && u.password === password && u.active);
    if (sellerUser) {
      setSession(ctx, sellerUser.id);
      return new Response(JSON.stringify({ 
        id: sellerUser.id, 
        role: sellerUser.role,
        sellerId: sellerUser.sellerId,
        name: sellerUser.name
      }), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
    
    return new Response('Invalid credentials', { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};


#!/usr/bin/env node

/**
 * Script para crear vendedores con productos lógicos según su tipo de negocio
 * Ejecutar con: node scripts/create-logical-sellers.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de vendedores y compradores
const sellers = [
  {
    email: 'minimarket.la.esquina@gmail.com',
    password: 'minimarket123',
    name: 'Carlos Mendoza',
    phone: '+584121234567',
    business: 'Minimarket La Esquina',
    type: 'minimarket'
  },
  {
    email: 'autoservicio.rapido@gmail.com', 
    password: 'autos123',
    name: 'Roberto Silva',
    phone: '+584121234568',
    business: 'AutoServicio Rápido',
    type: 'autos'
  },
  {
    email: 'belleza.estilo@gmail.com',
    password: 'belleza123', 
    name: 'María Elena',
    phone: '+584121234569',
    business: 'Belleza y Estilo',
    type: 'belleza'
  },
  {
    email: 'techstore.digital@gmail.com',
    password: 'tech123',
    name: 'Diego Ramírez', 
    phone: '+584121234570',
    business: 'TechStore Digital',
    type: 'tecnologia'
  },
  {
    email: 'carniceria.fresca@gmail.com',
    password: 'carne123',
    name: 'José González',
    phone: '+584121234571', 
    business: 'Carnicería La Fresca',
    type: 'carnes'
  }
];

const buyers = [
  {
    email: 'comprador1@gmail.com',
    password: 'comprador123',
    name: 'Ana García',
    phone: '+584121234572'
  },
  {
    email: 'comprador2@gmail.com', 
    password: 'comprador123',
    name: 'Luis Martínez',
    phone: '+584121234573'
  },
  {
    email: 'comprador3@gmail.com',
    password: 'comprador123', 
    name: 'Carmen López',
    phone: '+584121234574'
  }
];

// Productos por categoría de negocio
const productsByBusiness = {
  minimarket: [
    { title: 'Arroz 1kg', description: 'Arroz blanco de primera calidad', category: 'minimarket', priceCents: 2500 },
    { title: 'Aceite 1L', description: 'Aceite vegetal para cocinar', category: 'minimarket', priceCents: 3200 },
    { title: 'Azúcar 1kg', description: 'Azúcar blanca refinada', category: 'minimarket', priceCents: 1800 },
    { title: 'Harina PAN 1kg', description: 'Harina de maíz precocida', category: 'minimarket', priceCents: 2200 },
    { title: 'Leche 1L', description: 'Leche entera pasteurizada', category: 'minimarket', priceCents: 2800 },
    { title: 'Detergente 1kg', description: 'Detergente en polvo', category: 'minimarket', priceCents: 4500 },
    { title: 'Papel Higiénico 4u', description: 'Papel higiénico suave', category: 'minimarket', priceCents: 3800 },
    { title: 'Café 500g', description: 'Café molido tostado', category: 'minimarket', priceCents: 5500 }
  ],
  
  autos: [
    { title: 'Cambio de Aceite', description: 'Cambio de aceite de motor completo', category: 'servicios', priceCents: 15000 },
    { title: 'Revisión de Motor', description: 'Revisión completa del motor', category: 'servicios', priceCents: 25000 },
    { title: 'Instalación de Alarma', description: 'Instalación de alarma para vehículo', category: 'servicios', priceCents: 80000 },
    { title: 'Limpieza de Inyectores', description: 'Limpieza profunda de inyectores', category: 'servicios', priceCents: 30000 },
    { title: 'Alineación y Balanceo', description: 'Alineación y balanceo de ruedas', category: 'servicios', priceCents: 20000 },
    { title: 'Cambio de Filtros', description: 'Cambio de filtros de aire y combustible', category: 'servicios', priceCents: 12000 }
  ],
  
  belleza: [
    { title: 'Corte de Cabello', description: 'Corte de cabello profesional', category: 'servicios', priceCents: 8000 },
    { title: 'Manicure Completa', description: 'Manicure con esmaltado', category: 'servicios', priceCents: 6000 },
    { title: 'Pedicure Completa', description: 'Pedicure con esmaltado', category: 'servicios', priceCents: 7000 },
    { title: 'Tinte de Cabello', description: 'Tinte profesional de cabello', category: 'servicios', priceCents: 15000 },
    { title: 'Tratamiento Facial', description: 'Tratamiento facial hidratante', category: 'servicios', priceCents: 12000 },
    { title: 'Depilación', description: 'Depilación con cera', category: 'servicios', priceCents: 10000 }
  ],
  
  tecnologia: [
    { title: 'Audífonos In‑Ear', description: 'Audífonos inalámbricos de alta calidad', category: 'tecnologia', priceCents: 45000 },
    { title: 'Cargador USB 20W', description: 'Cargador rápido USB-C 20W', category: 'tecnologia', priceCents: 12000 },
    { title: 'Cable Lightning', description: 'Cable Lightning 1 metro', category: 'tecnologia', priceCents: 8000 },
    { title: 'Funda para iPhone', description: 'Funda protectora para iPhone', category: 'tecnologia', priceCents: 15000 },
    { title: 'Power Bank 10000mAh', description: 'Batería externa 10000mAh', category: 'tecnologia', priceCents: 35000 },
    { title: 'Adaptador USB-C', description: 'Adaptador USB-C a USB-A', category: 'tecnologia', priceCents: 5000 }
  ],
  
  carnes: [
    { title: 'Carne Molida 1kg', description: 'Carne molida fresca', category: 'minimarket', priceCents: 12000 },
    { title: 'Pollo Entero 1.5kg', description: 'Pollo fresco entero', category: 'minimarket', priceCents: 15000 },
    { title: 'Lomo de Cerdo 1kg', description: 'Lomo de cerdo fresco', category: 'minimarket', priceCents: 18000 },
    { title: 'Jamón Serrano 200g', description: 'Jamón serrano importado', category: 'minimarket', priceCents: 25000 },
    { title: 'Salchichón 200g', description: 'Salchichón artesanal', category: 'minimarket', priceCents: 8000 },
    { title: 'Chorizo 500g', description: 'Chorizo casero', category: 'minimarket', priceCents: 12000 }
  ]
};

async function createLogicalSellers() {
  try {
    console.log('🚀 Creando vendedores con productos lógicos...');
    
    const allUsers = [];
    
    // 1. Crear vendedores
    for (const seller of sellers) {
      console.log(`\n👤 Creando vendedor: ${seller.business}`);
      
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: seller.email,
        password: seller.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error(`❌ Error creando usuario ${seller.email}:`, authError);
        continue;
      }
      
      const userId = authData.user.id;
      
      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: seller.name,
          phone: seller.phone,
          is_seller: true
        });
      
      if (profileError) {
        console.error(`❌ Error creando perfil para ${seller.email}:`, profileError);
        continue;
      }
      
      // Crear productos para este vendedor
      const businessProducts = productsByBusiness[seller.type] || [];
      console.log(`📦 Agregando ${businessProducts.length} productos de ${seller.type}...`);
      
      for (const productData of businessProducts) {
        // Crear producto
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (productError) {
          console.error(`❌ Error creando producto ${productData.title}:`, productError);
          continue;
        }
        
        // Agregar a vendedor
        const { error: sellerProductError } = await supabase
          .from('seller_products')
          .insert({
            seller_id: userId,
            product_id: product.id,
            price_cents: productData.priceCents,
            stock: Math.floor(Math.random() * 20) + 5, // Stock entre 5-25
            active: true
          });
        
        if (sellerProductError) {
          console.error(`❌ Error agregando producto a vendedor:`, sellerProductError);
        }
      }
      
      // Crear estado online
      await supabase
        .from('seller_status')
        .insert({
          seller_id: userId,
          online: Math.random() > 0.3 // 70% probabilidad de estar online
        });
      
      allUsers.push({
        email: seller.email,
        password: seller.password,
        name: seller.name,
        type: 'Vendedor',
        business: seller.business
      });
      
      console.log(`✅ Vendedor ${seller.business} creado exitosamente`);
    }
    
    // 2. Crear compradores
    console.log('\n🛒 Creando compradores...');
    
    for (const buyer of buyers) {
      console.log(`👤 Creando comprador: ${buyer.name}`);
      
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: buyer.email,
        password: buyer.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error(`❌ Error creando comprador ${buyer.email}:`, authError);
        continue;
      }
      
      const userId = authData.user.id;
      
      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: buyer.name,
          phone: buyer.phone,
          is_seller: false
        });
      
      if (profileError) {
        console.error(`❌ Error creando perfil para ${buyer.email}:`, profileError);
        continue;
      }
      
      allUsers.push({
        email: buyer.email,
        password: buyer.password,
        name: buyer.name,
        type: 'Comprador'
      });
      
      console.log(`✅ Comprador ${buyer.name} creado exitosamente`);
    }
    
    // 3. Mostrar resumen
    console.log('\n🎉 ¡Usuarios creados exitosamente!');
    console.log('\n📋 RESUMEN DE USUARIOS:');
    console.log('='.repeat(80));
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Contraseña: ${user.password}`);
      console.log(`   Tipo: ${user.type}`);
      if (user.business) {
        console.log(`   Negocio: ${user.business}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('✅ Todos los usuarios están listos para usar');
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  }
}

createLogicalSellers().catch(console.error);




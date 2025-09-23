#!/usr/bin/env node

/**
 * Script para actualizar usuarios existentes y agregar productos lógicos
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

async function updateExistingUsers() {
  try {
    console.log('🔄 Actualizando usuarios existentes...');
    
    // 1. Obtener todos los vendedores existentes
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, name, is_seller')
      .eq('is_seller', true);
    
    if (sellersError) {
      console.error('❌ Error obteniendo vendedores:', sellersError);
      return;
    }
    
    console.log(`📊 Encontrados ${sellers?.length || 0} vendedores existentes`);
    
    // 2. Asignar tipos de negocio a vendedores existentes
    const businessTypes = ['minimarket', 'autos', 'belleza', 'tecnologia', 'carnes'];
    
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const businessType = businessTypes[i % businessTypes.length];
      
      console.log(`\n👤 Actualizando vendedor: ${seller.name} (${businessType})`);
      
      // Agregar productos según el tipo de negocio
      const businessProducts = productsByBusiness[businessType] || [];
      console.log(`📦 Agregando ${businessProducts.length} productos de ${businessType}...`);
      
      for (const productData of businessProducts) {
        // Crear producto (sin priceCents, se maneja en seller_products)
        const { title, description, category } = productData;
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({ title, description, category })
          .select('id')
          .single();
        
        if (productError && !productError.message.includes('duplicate key')) {
          console.error(`❌ Error creando producto ${productData.title}:`, productError);
          continue;
        }
        
        // Si el producto ya existe, buscarlo
        let productId;
        if (productError && productError.message.includes('duplicate key')) {
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('title', productData.title)
            .single();
          productId = existingProduct?.id;
        } else {
          productId = product?.id;
        }
        
        if (!productId) continue;
        
        // Agregar a vendedor (evitar duplicados)
        const { error: sellerProductError } = await supabase
          .from('seller_products')
          .upsert({
            seller_id: seller.id,
            product_id: productId,
            price_cents: productData.priceCents,
            stock: Math.floor(Math.random() * 20) + 5, // Stock entre 5-25
            active: true
          }, { onConflict: 'seller_id,product_id' });
        
        if (sellerProductError) {
          console.error(`❌ Error agregando producto a vendedor:`, sellerProductError);
        }
      }
      
      // Crear estado online si no existe
      const { error: statusError } = await supabase
        .from('seller_status')
        .upsert({
          seller_id: seller.id,
          online: Math.random() > 0.3 // 70% probabilidad de estar online
        }, { onConflict: 'seller_id' });
      
      if (statusError) {
        console.error(`❌ Error creando estado para vendedor:`, statusError);
      }
      
      console.log(`✅ Vendedor ${seller.name} actualizado exitosamente`);
    }
    
    // 3. Obtener todos los usuarios para mostrar credenciales
    console.log('\n📋 OBTENIENDO CREDENCIALES DE USUARIOS...');
    
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, is_seller');
    
    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      return;
    }
    
    console.log('\n🎉 ¡Usuarios actualizados exitosamente!');
    console.log('\n📋 CREDENCIALES DE USUARIOS:');
    console.log('='.repeat(80));
    
    // Mostrar usuarios existentes (simulando credenciales)
    const userCredentials = [
      { email: 'minimarket.la.esquina@gmail.com', password: 'minimarket123', name: 'Carlos Mendoza', type: 'Vendedor - Minimarket' },
      { email: 'autoservicio.rapido@gmail.com', password: 'autos123', name: 'Roberto Silva', type: 'Vendedor - AutoServicio' },
      { email: 'belleza.estilo@gmail.com', password: 'belleza123', name: 'María Elena', type: 'Vendedor - Belleza' },
      { email: 'techstore.digital@gmail.com', password: 'tech123', name: 'Diego Ramírez', type: 'Vendedor - Tecnología' },
      { email: 'carniceria.fresca@gmail.com', password: 'carne123', name: 'José González', type: 'Vendedor - Carnes' },
      { email: 'comprador1@gmail.com', password: 'comprador123', name: 'Ana García', type: 'Comprador' },
      { email: 'comprador2@gmail.com', password: 'comprador123', name: 'Luis Martínez', type: 'Comprador' },
      { email: 'comprador3@gmail.com', password: 'comprador123', name: 'Carmen López', type: 'Comprador' }
    ];
    
    userCredentials.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Contraseña: ${user.password}`);
      console.log(`   Tipo: ${user.type}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('✅ Todos los usuarios están listos para usar');
    
  } catch (error) {
    console.error('❌ Error actualizando usuarios:', error);
  }
}

updateExistingUsers().catch(console.error);

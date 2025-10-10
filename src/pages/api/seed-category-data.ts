import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async () => {
  try {
    // Usar service role key para insertar datos
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        error: 'Variables de entorno faltantes',
        details: 'PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Datos de ejemplo para cada categoría
    const sampleProducts = [
      // Postres
      {
        title: 'Torta de Chocolate',
        price_cents: 15000, // $150
        category: 'postres',
        stock: 5,
        image_url: '/images/products/postres/torta-chocolate.jpg',
        description: 'Deliciosa torta de chocolate casera'
      },
      {
        title: 'Cupcakes de Vainilla',
        price_cents: 3000, // $30
        category: 'postres',
        stock: 12,
        image_url: '/images/products/postres/cupcakes.jpg',
        description: 'Cupcakes esponjosos de vainilla'
      },
      {
        title: 'Helado de Fresa',
        price_cents: 5000, // $50
        category: 'postres',
        stock: 8,
        image_url: '/images/products/postres/helado-fresa.jpg',
        description: 'Helado artesanal de fresa'
      },
      
      // Minimarkets
      {
        title: 'Leche Liquida Soprole 1lt',
        price_cents: 1200, // $12
        category: 'minimarkets',
        stock: 20,
        image_url: '/images/products/minimarket/leche.jpg',
        description: 'Leche fresca 1 litro'
      },
      {
        title: 'Pan de Molde',
        price_cents: 2500, // $25
        category: 'minimarkets',
        stock: 15,
        image_url: '/images/products/minimarket/pan.jpg',
        description: 'Pan de molde fresco'
      },
      {
        title: 'Huevos Frescos x12',
        price_cents: 3000, // $30
        category: 'minimarkets',
        stock: 10,
        image_url: '/images/products/minimarket/huevos.jpg',
        description: 'Huevos frescos de gallina'
      },
      
      // Medicinas
      {
        title: 'Paracetamol 500mg',
        price_cents: 2000, // $20
        category: 'medicinas',
        stock: 50,
        image_url: '/images/products/medicinas/paracetamol.jpg',
        description: 'Analgésico y antipirético'
      },
      {
        title: 'Vitamina C',
        price_cents: 8000, // $80
        category: 'medicinas',
        stock: 25,
        image_url: '/images/products/medicinas/vitamina-c.jpg',
        description: 'Suplemento de vitamina C'
      },
      
      // Carnicería
      {
        title: 'Carne Molida 1kg',
        price_cents: 8000, // $80
        category: 'carniceria',
        stock: 5,
        image_url: '/images/products/carniceria/carne-molida.jpg',
        description: 'Carne molida fresca'
      },
      {
        title: 'Pollo Entero',
        price_cents: 12000, // $120
        category: 'carniceria',
        stock: 3,
        image_url: '/images/products/carniceria/pollo.jpg',
        description: 'Pollo fresco entero'
      },
      
      // Servicios
      {
        title: 'Limpieza de Hogar',
        price_cents: 25000, // $250
        category: 'servicios',
        stock: 1,
        image_url: '/images/products/servicios/limpieza.jpg',
        description: 'Servicio de limpieza profesional'
      },
      {
        title: 'Reparación de Electrodomésticos',
        price_cents: 15000, // $150
        category: 'servicios',
        stock: 1,
        image_url: '/images/products/servicios/reparacion.jpg',
        description: 'Reparación de electrodomésticos'
      },
      
      // Mascotas
      {
        title: 'Comida para Perros 5kg',
        price_cents: 18000, // $180
        category: 'mascotas',
        stock: 8,
        image_url: '/images/products/mascotas/comida-perros.jpg',
        description: 'Alimento balanceado para perros'
      },
      {
        title: 'Arena para Gatos',
        price_cents: 5000, // $50
        category: 'mascotas',
        stock: 12,
        image_url: '/images/products/mascotas/arena-gatos.jpg',
        description: 'Arena absorbente para gatos'
      },
      
      // Niños
      {
        title: 'Pañales Talla M x50',
        price_cents: 12000, // $120
        category: 'ninos',
        stock: 6,
        image_url: '/images/products/ninos/panales.jpg',
        description: 'Pañales desechables talla M'
      },
      {
        title: 'Juguete Educativo',
        price_cents: 8000, // $80
        category: 'ninos',
        stock: 4,
        image_url: '/images/products/ninos/juguete.jpg',
        description: 'Juguete educativo para niños'
      }
    ];

    // Crear vendedores de ejemplo
    const sampleVendors = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Dulces María',
        phone: '+56912345678',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Minimarket El Vecino',
        phone: '+56987654321',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Farmacia San José',
        phone: '+56911223344',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Carnicería Don Juan',
        phone: '+56955667788',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Servicios del Hogar',
        phone: '+56999887766',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Pet Shop Amigos',
        phone: '+56933445566',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Bebé Store',
        phone: '+56977889900',
        is_active: true
      }
    ];

    // Insertar vendedores
    const { error: vendorsError } = await supabase
      .from('profiles')
      .upsert(sampleVendors, { onConflict: 'id' });

    if (vendorsError) {
      console.error('Error insertando vendedores:', vendorsError);
    }

    // Asignar vendedores a productos
    const productsWithVendors = sampleProducts.map((product, index) => ({
      ...product,
      seller_id: sampleVendors[index % sampleVendors.length].id
    }));

    // Insertar productos
    const { error: productsError } = await supabase
      .from('products')
      .upsert(productsWithVendors, { onConflict: 'id' });

    if (productsError) {
      console.error('Error insertando productos:', productsError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Datos de ejemplo insertados correctamente',
      vendors: sampleVendors.length,
      products: productsWithVendors.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error insertando datos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

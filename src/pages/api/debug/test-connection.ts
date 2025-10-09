import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {},
    tests: []
  };

  try {
    // 1. Verificar variables de entorno
    diagnostics.env = {
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada',
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada',
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada',
      NODE_VERSION: process.version
    };

    // 2. Test de conexión básica a Supabase
    diagnostics.tests.push({ name: 'Test 1: Crear cliente Supabase', status: 'running' });
    
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      diagnostics.tests[0].status = 'failed';
      diagnostics.tests[0].error = 'Variables de entorno no configuradas';
      throw new Error('Variables de entorno no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    diagnostics.tests[0].status = 'passed';
    diagnostics.tests[0].message = 'Cliente creado exitosamente';

    // 3. Test de consulta simple
    diagnostics.tests.push({ name: 'Test 2: Consulta a tabla profiles', status: 'running' });
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (error) {
        diagnostics.tests[1].status = 'failed';
        diagnostics.tests[1].error = error.message;
        diagnostics.tests[1].details = error;
      } else {
        diagnostics.tests[1].status = 'passed';
        diagnostics.tests[1].message = `Tabla profiles accesible - ${count || 0} registros`;
      }
    } catch (e: any) {
      diagnostics.tests[1].status = 'failed';
      diagnostics.tests[1].error = e.message;
      diagnostics.tests[1].type = e.constructor.name;
    }

    // 4. Test de consulta a productos
    diagnostics.tests.push({ name: 'Test 3: Consulta a tabla products', status: 'running' });
    try {
      const { data, error, count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (error) {
        diagnostics.tests[2].status = 'failed';
        diagnostics.tests[2].error = error.message;
      } else {
        diagnostics.tests[2].status = 'passed';
        diagnostics.tests[2].message = `Tabla products accesible - ${count || 0} registros`;
      }
    } catch (e: any) {
      diagnostics.tests[2].status = 'failed';
      diagnostics.tests[2].error = e.message;
      diagnostics.tests[2].type = e.constructor.name;
    }

    // 5. Test de consulta a seller_products (la que falla)
    diagnostics.tests.push({ name: 'Test 4: Consulta a seller_products', status: 'running' });
    try {
      const { data, error } = await supabase
        .from('seller_products')
        .select('seller_id, product_id, price_cents, stock, active')
        .eq('active', true)
        .limit(5);

      if (error) {
        diagnostics.tests[3].status = 'failed';
        diagnostics.tests[3].error = error.message;
        diagnostics.tests[3].details = error;
      } else {
        diagnostics.tests[3].status = 'passed';
        diagnostics.tests[3].message = `Encontrados ${data?.length || 0} productos activos`;
        diagnostics.tests[3].sample = data;
      }
    } catch (e: any) {
      diagnostics.tests[3].status = 'failed';
      diagnostics.tests[3].error = e.message;
      diagnostics.tests[3].type = e.constructor.name;
      diagnostics.tests[3].stack = e.stack;
    }

    // 6. Test de consulta compleja con JOINs (como en el feed)
    diagnostics.tests.push({ name: 'Test 5: Consulta compleja con JOINs', status: 'running' });
    try {
      const { data, error } = await supabase
        .from('seller_products')
        .select(`
          seller_id,
          product_id,
          price_cents,
          stock,
          product:products!inner(
            id,
            title
          ),
          seller:profiles!seller_products_seller_id_fkey(
            id,
            name
          )
        `)
        .eq('active', true)
        .limit(3);

      if (error) {
        diagnostics.tests[4].status = 'failed';
        diagnostics.tests[4].error = error.message;
        diagnostics.tests[4].details = error;
      } else {
        diagnostics.tests[4].status = 'passed';
        diagnostics.tests[4].message = `Consulta compleja exitosa - ${data?.length || 0} resultados`;
        diagnostics.tests[4].sample = data;
      }
    } catch (e: any) {
      diagnostics.tests[4].status = 'failed';
      diagnostics.tests[4].error = e.message;
      diagnostics.tests[4].type = e.constructor.name;
      diagnostics.tests[4].stack = e.stack;
    }

    // Resumen
    const passed = diagnostics.tests.filter((t: any) => t.status === 'passed').length;
    const failed = diagnostics.tests.filter((t: any) => t.status === 'failed').length;
    
    diagnostics.summary = {
      total: diagnostics.tests.length,
      passed,
      failed,
      success: failed === 0
    };

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    diagnostics.criticalError = {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    };

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
};


// =============================================
// SCRIPT DE TESTS MANUALES - MÓDULO SOCIAL
// =============================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE_URL = 'http://localhost:4321/api/social';

// =============================================
// FUNCIONES DE TEST
// =============================================

async function testExpressPostCreation() {
  console.log('🧪 Testing Express Post Creation...');
  
  try {
    // Simular autenticación (en producción sería un token real)
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return;
    }
    
    const expressPostData = {
      title: 'iPhone 14 Pro - Excelente Estado',
      description: 'iPhone 14 Pro en perfecto estado, solo 6 meses de uso. Incluye cargador original y funda.',
      price_cents: 899000,
      category: 'tecnologia',
      contact_method: 'whatsapp',
      contact_value: '+56912345678',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1676250268490-121121212121?auto=format&fit=crop&w=400&h=300&q=80',
          media_type: 'image',
          sort_order: 0
        },
        {
          url: 'https://images.unsplash.com/photo-1676250268490-121121212122?auto=format&fit=crop&w=400&h=300&q=80',
          media_type: 'image',
          sort_order: 1
        }
      ],
      location_text: 'Santiago, Chile',
      external_disclaimer_accepted: true
    };
    
    const response = await fetch(`${API_BASE_URL}/express`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`
      },
      body: JSON.stringify(expressPostData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Express post created successfully:', result.data.id);
      return result.data.id;
    } else {
      console.log('❌ Express post creation failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Express post creation error:', error.message);
    return null;
  }
}

async function testExpressPostListing() {
  console.log('🧪 Testing Express Post Listing...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/express?status=active&limit=10`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Express posts listed successfully:', result.data.posts.length, 'posts found');
      return result.data.posts;
    } else {
      console.log('❌ Express post listing failed:', result.error);
      return [];
    }
    
  } catch (error) {
    console.log('❌ Express post listing error:', error.message);
    return [];
  }
}

async function testQuestionCreation() {
  console.log('🧪 Testing Question Creation...');
  
  try {
    // Simular autenticación
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return;
    }
    
    const questionData = {
      body: '¿Alguien sabe de un buen mecánico que arregle motos en Santiago? Necesito alguien confiable y con buenos precios. Mi moto es una Honda CB 250 y tiene problemas con el motor.',
      tags: ['mecanico', 'motos', 'santiago', 'honda']
    };
    
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`
      },
      body: JSON.stringify(questionData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Question created successfully:', result.data.id);
      return result.data.id;
    } else {
      console.log('❌ Question creation failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Question creation error:', error.message);
    return null;
  }
}

async function testQuestionListing() {
  console.log('🧪 Testing Question Listing...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/questions?status=open&limit=10`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Questions listed successfully:', result.data.questions.length, 'questions found');
      return result.data.questions;
    } else {
      console.log('❌ Question listing failed:', result.error);
      return [];
    }
    
  } catch (error) {
    console.log('❌ Question listing error:', error.message);
    return [];
  }
}

async function testExpirationEndpoint() {
  console.log('🧪 Testing Expiration Endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/expire-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Expiration executed successfully:', result.data.expired_count, 'posts expired');
      return result.data;
    } else {
      console.log('❌ Expiration execution failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Expiration execution error:', error.message);
    return null;
  }
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...');
  
  try {
    // Simular autenticación
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return;
    }
    
    const questionData = {
      body: '¿Dónde puedo encontrar un buen electricista en Valparaíso? Necesito alguien que arregle problemas eléctricos en mi casa. El problema es con las luces del living que parpadean constantemente.',
      tags: ['electricista', 'valparaiso', 'hogar']
    };
    
    // Intentar crear múltiples preguntas para probar rate limiting
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch(`${API_BASE_URL}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          body: JSON.stringify({
            ...questionData,
            body: questionData.body + ` (Test ${i + 1})`
          })
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const successCount = results.filter(r => r.success).length;
    const rateLimitedCount = results.filter(r => r.error?.code === 'RATE_LIMIT_EXCEEDED').length;
    
    console.log(`✅ Rate limiting test completed: ${successCount} successful, ${rateLimitedCount} rate limited`);
    
  } catch (error) {
    console.log('❌ Rate limiting test error:', error.message);
  }
}

async function testDatabaseQueries() {
  console.log('🧪 Testing Database Queries...');
  
  try {
    // Test 1: Verificar que las tablas existen
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['express_posts', 'express_media', 'questions', 'answers']);
    
    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      return;
    }
    
    console.log('✅ Tables exist:', tables.map(t => t.table_name));
    
    // Test 2: Verificar RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['express_posts', 'questions']);
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies found:', policies.length);
    }
    
    // Test 3: Verificar índices
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .in('tablename', ['express_posts', 'questions']);
    
    if (indexesError) {
      console.log('❌ Error checking indexes:', indexesError.message);
    } else {
      console.log('✅ Indexes found:', indexes.length);
    }
    
  } catch (error) {
    console.log('❌ Database queries test error:', error.message);
  }
}

// =============================================
// FUNCIÓN PRINCIPAL DE TESTS
// =============================================

async function runAllTests() {
  console.log('🚀 Starting Social Module Tests...\n');
  
  // Test 1: Database setup
  await testDatabaseQueries();
  console.log('');
  
  // Test 2: Express Posts
  const expressPostId = await testExpressPostCreation();
  await testExpressPostListing();
  console.log('');
  
  // Test 3: Questions
  const questionId = await testQuestionCreation();
  await testQuestionListing();
  console.log('');
  
  // Test 4: Expiration
  await testExpirationEndpoint();
  console.log('');
  
  // Test 5: Rate Limiting
  await testRateLimiting();
  console.log('');
  
  console.log('✅ All tests completed!');
  
  // Resumen
  console.log('\n📊 Test Summary:');
  console.log('- Express Posts: Creation and listing');
  console.log('- Questions: Creation and listing');
  console.log('- Expiration: Automatic post expiration');
  console.log('- Rate Limiting: User request limits');
  console.log('- Database: Tables, policies, and indexes');
}

// =============================================
// EJECUTAR TESTS
// =============================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };




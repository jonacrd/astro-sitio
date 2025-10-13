#!/usr/bin/env node

/**
 * SCRIPT DE TESTING DE CONCURRENCIA
 * 
 * Este script prueba la capacidad de la aplicación para manejar
 * múltiples usuarios comprando simultáneamente.
 * 
 * Uso:
 *   node test-concurrency.js [opciones]
 * 
 * Opciones:
 *   --users=N      Número de usuarios concurrentes (default: 20)
 *   --seller=ID    ID del vendedor a probar
 *   --product=ID   ID del producto a probar
 *   --stock=N      Stock inicial del producto (default: 10)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Configuración
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('   Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Parse argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=')
  acc[key.replace('--', '')] = value
  return acc
}, {})

const CONCURRENT_USERS = parseInt(args.users || '20', 10)
const INITIAL_STOCK = parseInt(args.stock || '10', 10)
const TEST_SELLER_ID = args.seller
const TEST_PRODUCT_ID = args.product || 'test-product-' + Date.now()

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset)
}

// Función principal
async function testConcurrency() {
  log('cyan', '\n🧪 INICIANDO TEST DE CONCURRENCIA\n')
  log('blue', `📊 Configuración:`)
  console.log(`   - Usuarios concurrentes: ${CONCURRENT_USERS}`)
  console.log(`   - Stock inicial: ${INITIAL_STOCK}`)
  console.log(`   - Producto ID: ${TEST_PRODUCT_ID}`)
  console.log(`   - Vendedor ID: ${TEST_SELLER_ID || '(se creará uno de prueba)'}`)
  
  // Paso 1: Setup
  log('yellow', '\n📋 Paso 1: Preparando entorno de prueba...')
  
  const sellerId = TEST_SELLER_ID || await createTestSeller()
  const productId = await createTestProduct(sellerId)
  
  log('green', '✅ Entorno preparado')
  console.log(`   - Vendedor: ${sellerId}`)
  console.log(`   - Producto: ${productId}`)
  console.log(`   - Stock: ${INITIAL_STOCK}`)
  
  // Paso 2: Verificar stock inicial
  const { data: initialProduct } = await supabase
    .from('seller_products')
    .select('stock')
    .eq('seller_id', sellerId)
    .eq('product_id', productId)
    .single()
  
  log('blue', `\n📦 Stock inicial confirmado: ${initialProduct.stock}`)
  
  // Paso 3: Crear usuarios y carritos
  log('yellow', '\n👥 Paso 2: Creando usuarios de prueba...')
  
  const users = await createTestUsers(CONCURRENT_USERS)
  
  log('green', `✅ ${users.length} usuarios creados`)
  
  // Paso 4: Preparar carritos
  log('yellow', '\n🛒 Paso 3: Preparando carritos...')
  
  await Promise.all(
    users.map(userId => prepareCart(userId, sellerId, productId))
  )
  
  log('green', `✅ ${users.length} carritos preparados`)
  
  // Paso 5: Ejecutar compras concurrentes
  log('magenta', `\n🚀 Paso 4: Ejecutando ${CONCURRENT_USERS} compras SIMULTÁNEAS...\n`)
  
  const startTime = Date.now()
  
  const results = await Promise.allSettled(
    users.map((userId, index) => 
      purchaseWithTracking(userId, sellerId, index + 1, CONCURRENT_USERS)
    )
  )
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  // Paso 6: Analizar resultados
  log('cyan', `\n📊 RESULTADOS DEL TEST (${duration}s):\n`)
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success)
  const failed = results.filter(r => r.status === 'fulfilled' && !r.value?.success)
  const errors = results.filter(r => r.status === 'rejected')
  
  console.log('Compras exitosas:  ', colors.green, successful.length, colors.reset)
  console.log('Compras rechazadas:', colors.yellow, failed.length, colors.reset)
  console.log('Errores de sistema:', colors.red, errors.length, colors.reset)
  
  // Mostrar errores
  if (failed.length > 0) {
    log('yellow', '\n⚠️  Compras rechazadas (esperado si stock < usuarios):')
    failed.slice(0, 3).forEach(r => {
      console.log('   -', r.value?.error || 'Error desconocido')
    })
    if (failed.length > 3) {
      console.log(`   ... y ${failed.length - 3} más`)
    }
  }
  
  if (errors.length > 0) {
    log('red', '\n❌ Errores de sistema (NO esperado):')
    errors.slice(0, 3).forEach(r => {
      console.log('   -', r.reason?.message || r.reason)
    })
    if (errors.length > 3) {
      console.log(`   ... y ${errors.length - 3} más`)
    }
  }
  
  // Paso 7: Verificar integridad de datos
  log('cyan', '\n🔍 Verificando integridad de datos...\n')
  
  const { data: finalProduct } = await supabase
    .from('seller_products')
    .select('stock')
    .eq('seller_id', sellerId)
    .eq('product_id', productId)
    .single()
  
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_cents')
    .eq('seller_id', sellerId)
  
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('qty')
    .in('order_id', orders.map(o => o.id))
  
  const totalSold = orderItems?.reduce((sum, item) => sum + item.qty, 0) || 0
  const expectedStock = INITIAL_STOCK - totalSold
  
  console.log('Stock inicial:    ', INITIAL_STOCK)
  console.log('Unidades vendidas:', totalSold)
  console.log('Stock esperado:   ', expectedStock)
  console.log('Stock real:       ', finalProduct.stock)
  
  // Paso 8: Verificar race conditions
  log('cyan', '\n🎯 VERIFICACIÓN DE RACE CONDITIONS:\n')
  
  const hasRaceCondition = finalProduct.stock !== expectedStock
  const hasOverselling = finalProduct.stock < 0
  const correctPurchaseCount = successful.length === Math.min(INITIAL_STOCK, CONCURRENT_USERS)
  
  if (hasRaceCondition) {
    log('red', '❌ RACE CONDITION DETECTADA!')
    console.log('   Stock real no coincide con stock esperado')
    console.log('   Esto indica que múltiples compras modificaron el stock incorrectamente')
  } else {
    log('green', '✅ No hay race conditions')
  }
  
  if (hasOverselling) {
    log('red', '❌ SOBREVENTA DETECTADA!')
    console.log('   Stock negativo: se vendieron más unidades de las disponibles')
  } else {
    log('green', '✅ No hay sobreventa')
  }
  
  if (!correctPurchaseCount) {
    log('yellow', '⚠️  Número de compras exitosas inesperado')
    console.log(`   Esperado: ${Math.min(INITIAL_STOCK, CONCURRENT_USERS)}`)
    console.log(`   Real: ${successful.length}`)
  } else {
    log('green', '✅ Número correcto de compras exitosas')
  }
  
  // Paso 9: Métricas de rendimiento
  log('cyan', '\n⚡ MÉTRICAS DE RENDIMIENTO:\n')
  
  const avgTimePerPurchase = (duration / CONCURRENT_USERS).toFixed(3)
  const purchasesPerSecond = (CONCURRENT_USERS / duration).toFixed(2)
  
  console.log('Tiempo total:           ', duration, 's')
  console.log('Tiempo promedio/compra: ', avgTimePerPurchase, 's')
  console.log('Compras por segundo:    ', purchasesPerSecond, 'rps')
  
  // Paso 10: Conclusión
  log('cyan', '\n📝 CONCLUSIÓN:\n')
  
  if (!hasRaceCondition && !hasOverselling && correctPurchaseCount) {
    log('green', '✅ SISTEMA APROBADO')
    console.log('   El sistema maneja correctamente la concurrencia')
    console.log(`   Capacidad verificada: ${CONCURRENT_USERS} usuarios simultáneos`)
  } else {
    log('red', '❌ SISTEMA REQUIERE CORRECCIONES')
    console.log('   Problemas detectados en manejo de concurrencia')
    console.log('   Revisar ANALISIS_CAPACIDAD_USUARIOS.md para soluciones')
    console.log('   Aplicar fix-concurrency-issues.sql')
  }
  
  // Paso 11: Limpieza (opcional)
  if (!TEST_SELLER_ID) {
    log('yellow', '\n🧹 Limpiando datos de prueba...')
    await cleanup(sellerId)
    log('green', '✅ Limpieza completada')
  }
  
  log('cyan', '\n✨ Test finalizado\n')
  
  // Exit code
  process.exit(hasRaceCondition || hasOverselling ? 1 : 0)
}

// Funciones auxiliares

async function createTestSeller() {
  const email = `test-seller-${Date.now()}@example.com`
  
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password: 'test123456',
    email_confirm: true,
  })
  
  if (error) throw error
  
  // Crear perfil de vendedor
  await supabase.from('profiles').upsert({
    id: user.user.id,
    name: 'Test Seller',
    is_seller: true,
  })
  
  return user.user.id
}

async function createTestProduct(sellerId) {
  const productId = TEST_PRODUCT_ID
  
  // Crear producto en catálogo
  await supabase.from('products').upsert({
    id: productId,
    title: 'Test Product for Concurrency',
    description: 'Used for testing',
    category: 'test',
    price_cents: 10000,
    active: true,
  })
  
  // Crear producto del vendedor con stock
  await supabase.from('seller_products').upsert({
    seller_id: sellerId,
    product_id: productId,
    price_cents: 10000,
    stock: INITIAL_STOCK,
    active: true,
  })
  
  return productId
}

async function createTestUsers(count) {
  const users = []
  
  for (let i = 0; i < count; i++) {
    const email = `test-user-${Date.now()}-${i}@example.com`
    
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: 'test123456',
      email_confirm: true,
    })
    
    if (error) {
      console.error(`Error creando usuario ${i}:`, error.message)
      continue
    }
    
    users.push(user.user.id)
  }
  
  return users
}

async function prepareCart(userId, sellerId, productId) {
  // Crear carrito
  const { data: cart } = await supabase
    .from('carts')
    .upsert({
      user_id: userId,
      seller_id: sellerId,
    }, {
      onConflict: 'user_id,seller_id'
    })
    .select()
    .single()
  
  // Agregar producto al carrito
  await supabase.from('cart_items').insert({
    cart_id: cart.id,
    product_id: productId,
    title: 'Test Product',
    qty: 1,
    price_cents: 10000,
  })
}

async function purchaseWithTracking(userId, sellerId, userNum, totalUsers) {
  const barWidth = 40
  const progress = Math.floor((userNum / totalUsers) * barWidth)
  const bar = '█'.repeat(progress) + '░'.repeat(barWidth - progress)
  
  process.stdout.write(`\r[${bar}] ${userNum}/${totalUsers} `)
  
  try {
    const { data, error } = await supabase.rpc('place_order_safe', {
      p_user_id: userId,
      p_seller_id: sellerId,
      p_payment_method: 'cash',
    })
    
    if (error) throw error
    
    return data
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

async function cleanup(sellerId) {
  // Eliminar órdenes
  await supabase.from('orders').delete().eq('seller_id', sellerId)
  
  // Eliminar productos del vendedor
  await supabase.from('seller_products').delete().eq('seller_id', sellerId)
  
  // Eliminar usuario vendedor
  await supabase.auth.admin.deleteUser(sellerId)
}

// Ejecutar test
testConcurrency().catch(err => {
  log('red', '\n❌ Error fatal:', err.message)
  console.error(err)
  process.exit(1)
})


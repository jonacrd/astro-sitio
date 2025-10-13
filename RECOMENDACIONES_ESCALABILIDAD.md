# 🚀 Recomendaciones de Escalabilidad

## 📋 Índice
1. [Connection Pooling](#connection-pooling)
2. [Optimizaciones de Código](#optimizaciones-de-código)
3. [Caché Strategy](#caché-strategy)
4. [Monitoring y Alertas](#monitoring-y-alertas)
5. [Testing de Carga](#testing-de-carga)

---

## 1. Connection Pooling

### 🔴 Problema Actual
- Cada función serverless de Vercel abre una nueva conexión a PostgreSQL
- Supabase Free: solo 15 conexiones simultáneas
- Resultado: errores "remaining connection slots reserved" en picos

### ✅ Solución: Supavisor (Connection Pooler de Supabase)

#### Paso 1: Habilitar Supavisor en Supabase

1. Ve a tu proyecto en Supabase
2. Settings → Database → Connection Pooling
3. Habilita "PgBouncer" o "Supavisor"
4. Copia la nueva connection string:

```
# Connection String CON pooling
postgresql://postgres.xxxxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Paso 2: Actualizar Variables de Entorno

**En Vercel:**
```env
# Antigua (directa, sin pooling)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Nueva con pooling (usar en funciones serverless)
DATABASE_POOLER_URL=postgresql://postgres.xxxxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Paso 3: Configurar Cliente Supabase con Pooling

```typescript
// src/lib/supabase-pooled.ts
import { createClient } from '@supabase/supabase-js'

export const supabasePooled = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // ⚠️ IMPORTANTE para serverless
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
)
```

#### Paso 4: Usar en API Routes

```typescript
// src/pages/api/checkout.ts
import { supabasePooled } from '@/lib/supabase-pooled'

export const POST: APIRoute = async ({ request }) => {
  // Usar cliente con pooling para operaciones DB
  const { data, error } = await supabasePooled.rpc('place_order_safe', {
    p_user_id: userId,
    p_seller_id: sellerId,
    p_payment_method: paymentMethod,
  })
  
  // ...
}
```

### 📊 Resultados Esperados

| Métrica | Antes | Después |
|---------|-------|---------|
| Conexiones efectivas | 15 | 60-100 |
| Usuarios concurrentes | 10-15 | 50-80 |
| Timeout errors | Frecuentes | Raros |

---

## 2. Optimizaciones de Código

### 🔧 A. Retry Logic con Exponential Backoff

```typescript
// src/lib/retry-logic.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 100
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Retry solo en errores específicos
      if (
        error.code === '40P01' || // Deadlock
        error.code === '40001' || // Serialization failure
        error.message?.includes('remaining connection slots')
      ) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Otros errores: throw inmediato
      throw error
    }
  }
  
  throw lastError!
}
```

**Uso:**
```typescript
// En checkout.ts
import { withRetry } from '@/lib/retry-logic'

const result = await withRetry(async () => {
  return await supabasePooled.rpc('place_order_safe', { ... })
}, 3, 100)
```

---

### 🔧 B. Rate Limiting en Frontend

```typescript
// src/lib/rate-limiter.ts
class RateLimiter {
  private tokens: Map<string, number> = new Map()
  private lastRefill: Map<string, number> = new Map()
  
  constructor(
    private maxTokens: number,
    private refillRate: number // tokens por segundo
  ) {}
  
  async acquire(key: string): Promise<boolean> {
    const now = Date.now()
    const lastRefillTime = this.lastRefill.get(key) || now
    const elapsedSeconds = (now - lastRefillTime) / 1000
    
    // Refill tokens
    const currentTokens = Math.min(
      this.maxTokens,
      (this.tokens.get(key) || this.maxTokens) + elapsedSeconds * this.refillRate
    )
    
    if (currentTokens >= 1) {
      this.tokens.set(key, currentTokens - 1)
      this.lastRefill.set(key, now)
      return true
    }
    
    return false
  }
}

// Limitar a 1 compra cada 3 segundos por usuario
export const checkoutLimiter = new RateLimiter(1, 1/3)
```

**Uso en componente:**
```typescript
// src/components/react/CheckoutButton.tsx
import { checkoutLimiter } from '@/lib/rate-limiter'

const handleCheckout = async () => {
  if (!await checkoutLimiter.acquire(userId)) {
    toast.error('Por favor espera unos segundos antes de intentar de nuevo')
    return
  }
  
  // Proceder con checkout...
}
```

---

### 🔧 C. Optimistic UI Updates

```typescript
// src/components/react/Checkout.tsx
const handleCheckout = async () => {
  const optimisticOrderId = crypto.randomUUID()
  
  // 1. Update UI inmediatamente
  setOrderStatus('processing')
  
  try {
    // 2. API call en background
    const { data } = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items, sellerId })
    }).then(r => r.json())
    
    // 3. Confirmar con datos reales
    setOrderStatus('success')
    setRealOrderId(data.orderId)
    
  } catch (error) {
    // 4. Revertir en caso de error
    setOrderStatus('error')
    toast.error('Error procesando orden')
  }
}
```

---

## 3. Caché Strategy

### 🗄️ A. Redis/Upstash para Caché de Productos

**Setup:**
```bash
# Crear cuenta en upstash.com
# Copiar UPSTASH_REDIS_REST_URL y TOKEN
```

```typescript
// src/lib/redis-cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCachedProducts(sellerId: string) {
  const cacheKey = `seller:${sellerId}:products`
  
  // Intentar obtener del caché
  const cached = await redis.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Si no está en caché, obtener de DB
  const { data: products } = await supabase
    .from('seller_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('seller_id', sellerId)
    .eq('active', true)
  
  // Guardar en caché por 5 minutos
  await redis.setex(cacheKey, 300, products)
  
  return products
}

export async function invalidateProductsCache(sellerId: string) {
  await redis.del(`seller:${sellerId}:products`)
}
```

**Uso:**
```typescript
// src/pages/api/products/by-seller.ts
import { getCachedProducts } from '@/lib/redis-cache'

export const GET: APIRoute = async ({ url }) => {
  const sellerId = url.searchParams.get('sellerId')
  const products = await getCachedProducts(sellerId!)
  return new Response(JSON.stringify(products))
}
```

---

### 🗄️ B. Caché de Sesión con Cookies

```typescript
// src/lib/session-cache.ts
export function getCachedUser(request: Request) {
  const cookies = request.headers.get('cookie')
  const userCookie = cookies?.split(';')
    .find(c => c.trim().startsWith('user='))
  
  if (userCookie) {
    const userData = JSON.parse(
      decodeURIComponent(userCookie.split('=')[1])
    )
    
    // Validar que no expiró
    if (userData.exp > Date.now()) {
      return userData
    }
  }
  
  return null
}
```

---

## 4. Monitoring y Alertas

### 📊 A. Configurar Vercel Analytics

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'

export default defineConfig({
  adapter: vercel({
    analytics: true, // Habilitar Web Analytics
    speedInsights: true, // Habilitar Speed Insights
  }),
})
```

---

### 📊 B. Logging Estructurado

```typescript
// src/lib/logger.ts
interface LogData {
  level: 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
  timestamp?: string
}

export function log({ level, message, context }: LogData) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  
  // En desarrollo: console
  if (import.meta.env.DEV) {
    console[level](logEntry)
    return
  }
  
  // En producción: enviar a servicio de logging
  // Opciones: Datadog, LogRocket, Sentry, etc.
  fetch('https://logs.yourdomain.com/api/log', {
    method: 'POST',
    body: JSON.stringify(logEntry),
  }).catch(() => {}) // Fire and forget
}
```

**Uso:**
```typescript
// En checkout.ts
import { log } from '@/lib/logger'

try {
  const result = await supabase.rpc('place_order_safe', { ... })
  
  log({
    level: 'info',
    message: 'Order placed successfully',
    context: {
      orderId: result.orderId,
      sellerId,
      userId,
      totalCents: result.totalCents,
    }
  })
  
} catch (error) {
  log({
    level: 'error',
    message: 'Checkout failed',
    context: {
      error: error.message,
      sellerId,
      userId,
    }
  })
}
```

---

### 📊 C. Alertas de Supabase

**Configurar en Supabase Dashboard:**

1. Settings → Monitoring
2. Crear alerta para:
   - Conexiones > 80% del límite
   - Latencia de queries > 500ms
   - Errores en funciones RPC > 5%

**Webhook de alerta:**
```typescript
// src/pages/api/alerts/supabase-webhook.ts
export const POST: APIRoute = async ({ request }) => {
  const alert = await request.json()
  
  // Enviar a Slack, Discord, Email, etc.
  if (alert.type === 'connection_limit') {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Supabase: ${alert.message}`,
      })
    })
  }
  
  return new Response('OK')
}
```

---

## 5. Testing de Carga

### 🧪 A. Script con Artillery

**Instalar:**
```bash
npm install -g artillery
```

**Crear test:**
```yaml
# load-test.yml
config:
  target: 'https://tu-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 5 # 5 usuarios por segundo
      name: Warm up
    - duration: 120
      arrivalRate: 20 # 20 usuarios por segundo
      name: Ramp up
    - duration: 180
      arrivalRate: 50 # 50 usuarios por segundo (pico)
      name: Sustained load
  processor: './test-helpers.js'

scenarios:
  - name: 'Browse and checkout'
    flow:
      # 1. Login
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ $randomEmail() }}'
            password: 'test123'
          capture:
            - json: '$.user.id'
              as: 'userId'
      
      # 2. Browse products
      - get:
          url: '/api/products/list'
      
      # 3. Add to cart
      - post:
          url: '/api/cart/add'
          json:
            productId: '{{ $randomProduct() }}'
            qty: 1
      
      # 4. Checkout
      - post:
          url: '/api/checkout'
          json:
            sellerId: '{{ $randomSeller() }}'
            paymentMethod: 'cash'
```

**Ejecutar:**
```bash
artillery run load-test.yml --output report.json
artillery report report.json
```

---

### 🧪 B. Test de Race Condition

```javascript
// test-race-condition.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
)

async function testRaceCondition() {
  const sellerId = 'xxx-seller-id'
  const productId = 'xxx-product-id'
  
  // Setup: Crear producto con stock = 10
  await supabase.from('seller_products').upsert({
    seller_id: sellerId,
    product_id: productId,
    stock: 10,
    price_cents: 10000,
    active: true,
  })
  
  // Simular 20 compras concurrentes de 1 unidad cada una
  const purchases = Array.from({ length: 20 }, async (_, i) => {
    const userId = `user-${i}`
    
    // Agregar al carrito
    await supabase.from('carts').upsert({
      user_id: userId,
      seller_id: sellerId,
    })
    
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: productId,
      title: 'Test Product',
      qty: 1,
      price_cents: 10000,
    })
    
    // Checkout
    const { data, error } = await supabase.rpc('place_order_safe', {
      p_user_id: userId,
      p_seller_id: sellerId,
      p_payment_method: 'cash',
    })
    
    return { userId, success: data?.success, error }
  })
  
  const results = await Promise.all(purchases)
  
  // Verificar resultados
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`✅ Compras exitosas: ${successful.length}`)
  console.log(`❌ Compras fallidas: ${failed.length}`)
  
  // Verificar stock final
  const { data: finalProduct } = await supabase
    .from('seller_products')
    .select('stock')
    .eq('seller_id', sellerId)
    .eq('product_id', productId)
    .single()
  
  console.log(`📦 Stock final: ${finalProduct.stock}`)
  console.log(`📊 Esperado: 0 (si solo 10 compras exitosas)`)
  
  // Assertions
  if (successful.length !== 10) {
    console.error('❌ ERROR: Debería haber exactamente 10 compras exitosas')
  }
  
  if (finalProduct.stock !== 0) {
    console.error('❌ ERROR: Stock debería ser 0')
  }
  
  if (successful.length === 10 && finalProduct.stock === 0) {
    console.log('✅ TEST PASADO: No hay race condition')
  }
}

testRaceCondition()
```

**Ejecutar:**
```bash
node test-race-condition.js
```

---

### 🧪 C. Monitoring en Tiempo Real

```typescript
// src/pages/api/metrics/realtime.ts
import { supabase } from '@/lib/supabaseClient'

export const GET: APIRoute = async () => {
  // Obtener métricas en tiempo real
  const metrics = await Promise.all([
    // Conexiones activas
    supabase.rpc('pg_stat_activity_count'),
    
    // Órdenes en los últimos 5 minutos
    supabase
      .from('orders')
      .select('count')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    
    // Stock bajo
    supabase
      .from('seller_products')
      .select('count')
      .eq('active', true)
      .lte('stock', 5),
  ])
  
  return new Response(JSON.stringify({
    activeConnections: metrics[0].data,
    recentOrders: metrics[1].count,
    lowStockProducts: metrics[2].count,
    timestamp: new Date().toISOString(),
  }))
}
```

---

## 📝 Checklist de Implementación

### ✅ Fase 1: Fixes Críticos (Hoy)
- [ ] Aplicar `fix-concurrency-issues.sql`
- [ ] Actualizar código para usar `place_order_safe`
- [ ] Habilitar connection pooling en Supabase
- [ ] Testing manual con 5-10 usuarios concurrentes

### ✅ Fase 2: Optimizaciones (Esta Semana)
- [ ] Implementar retry logic
- [ ] Agregar rate limiting en frontend
- [ ] Configurar logging estructurado
- [ ] Setup de alertas en Supabase

### ✅ Fase 3: Escalabilidad (Próximas 2 Semanas)
- [ ] Implementar Redis cache
- [ ] Optimistic UI updates
- [ ] Testing de carga con Artillery
- [ ] Monitoreo en tiempo real

### ✅ Fase 4: Producción (Próximo Mes)
- [ ] Upgrade a plan Pro de Supabase
- [ ] CDN para assets estáticos
- [ ] Read replicas (si es necesario)
- [ ] Disaster recovery plan

---

## 📚 Recursos Adicionales

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Artillery Load Testing](https://www.artillery.io/docs/guides/getting-started/core-concepts)
- [PostgreSQL SELECT FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)

---

**Última actualización:** ${new Date().toISOString()}


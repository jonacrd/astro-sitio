# 🔧 Solución a Errores de Sistema de Puntos

## 🚨 Problemas Identificados

### **Error 1: Relación de Clave Foránea en `points_history`**
```
Error obteniendo historial:
{
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'points_history' and 'user_id' in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'points_history' and 'user_id' in the schema cache"
}
```

### **Error 2: Relación de Clave Foránea en `user_points`**
```
Error obteniendo resumen:
{
  code: 'PGRST200', 
  details: "Searched for a foreign key relationship between 'user_points' and 'user_id' in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'user_points' and 'user_id' in the schema cache"
}
```

## 🔍 Causa del Problema

Los errores ocurren porque:
1. **Las tablas no existen** en la base de datos
2. **Las relaciones de claves foráneas** no están configuradas correctamente
3. **Los endpoints intentan hacer JOINs** que Supabase no puede resolver
4. **Las políticas RLS** no están configuradas

## ✅ Soluciones Implementadas

### **1. Script de Corrección de Tablas**
- **Archivo**: `scripts/fix-points-tables.sql`
- **Función**: Crea todas las tablas necesarias con relaciones correctas
- **Ejecutar en**: Supabase SQL Editor

### **2. Endpoints Corregidos**
- **`/api/points/history.ts`**: Eliminado JOIN problemático
- **`/api/points/summary.ts`**: Simplificado consulta
- **Resultado**: Consultas directas sin JOINs complejos

### **3. Script de Pruebas**
- **Archivo**: `scripts/test-points-endpoints.js`
- **Función**: Verifica que las tablas y endpoints funcionen
- **Ejecutar**: `node scripts/test-points-endpoints.js`

## 🚀 Pasos para Solucionar

### **Paso 1: Ejecutar Script de Corrección**
```sql
-- En Supabase SQL Editor
scripts/fix-points-tables.sql
```

### **Paso 2: Verificar Tablas Creadas**
El script creará:
- ✅ `user_points` - Puntos por usuario y vendedor
- ✅ `points_history` - Historial de transacciones
- ✅ `point_redemptions` - Canjes de puntos
- ✅ `seller_rewards_config` - Configuración por vendedor
- ✅ `seller_reward_tiers` - Niveles de recompensa

### **Paso 3: Probar Endpoints**
```bash
cd astro-sitio
node scripts/test-points-endpoints.js
```

### **Paso 4: Verificar en la Aplicación**
- Ir a `/mis-pedidos`
- Verificar que se carguen los puntos
- Probar canje de puntos
- Revisar historial en perfil

## 📋 Tablas que se Crearán

### **1. user_points**
```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'order',
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);
```

### **2. points_history**
```sql
CREATE TABLE points_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  transaction_type VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. point_redemptions**
```sql
CREATE TABLE point_redemptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  points_used INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE
);
```

### **4. seller_rewards_config**
```sql
CREATE TABLE seller_rewards_config (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT false,
  points_per_peso DECIMAL(10,4) DEFAULT 0.0286,
  minimum_purchase_cents INTEGER DEFAULT 500000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);
```

### **5. seller_reward_tiers**
```sql
CREATE TABLE seller_reward_tiers (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id),
  tier_name VARCHAR(100) NOT NULL,
  minimum_purchase_cents INTEGER NOT NULL,
  points_multiplier DECIMAL(10,4) DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, tier_name)
);
```

## 🔒 Políticas RLS Configuradas

### **Para user_points**
- Usuarios pueden ver sus propios puntos
- Usuarios pueden actualizar sus propios puntos
- Sistema puede crear puntos

### **Para points_history**
- Usuarios pueden ver su propio historial
- Vendedores pueden ver historial de su tienda
- Sistema puede crear historial

### **Para point_redemptions**
- Usuarios pueden ver sus propias redenciones
- Vendedores pueden ver redenciones de su tienda
- Usuarios pueden crear redenciones

### **Para seller_rewards_config**
- Vendedores pueden gestionar su propia configuración
- Usuarios pueden ver configuraciones activas

### **Para seller_reward_tiers**
- Vendedores pueden gestionar sus propios niveles
- Usuarios pueden ver niveles activos

## 🎯 Resultado Esperado

Después de ejecutar el script:

1. **✅ Las tablas se crean** con todas las relaciones correctas
2. **✅ Los endpoints funcionan** sin errores de JOIN
3. **✅ La vista "Mis Pedidos"** carga correctamente
4. **✅ El historial de puntos** se muestra en el perfil
5. **✅ El canje de puntos** funciona correctamente
6. **✅ Las políticas RLS** protegen los datos

## 🔄 Verificación

### **Comprobar en Supabase Dashboard**
1. Ir a Table Editor
2. Verificar que existen las 5 tablas
3. Revisar que tienen datos de prueba

### **Comprobar en la Aplicación**
1. Ir a `/mis-pedidos`
2. Verificar que no hay errores en consola
3. Verificar que se muestran los puntos
4. Probar canje de puntos

### **Comprobar Endpoints**
```bash
# Probar endpoint de historial
curl "https://tu-proyecto.supabase.dev/api/points/history?userId=test-user-id"

# Probar endpoint de resumen  
curl "https://tu-proyecto.supabase.dev/api/points/summary?userId=test-user-id"
```

## 📞 Si Persisten los Errores

1. **Verificar variables de entorno**:
   - `PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Verificar permisos en Supabase**:
   - Service role key tiene permisos completos
   - RLS está habilitado pero configurado correctamente

3. **Revisar logs de Supabase**:
   - Ir a Logs en el dashboard
   - Buscar errores relacionados con las tablas

4. **Ejecutar script de prueba**:
   ```bash
   node scripts/test-points-endpoints.js
   ```

---

## ✨ Resumen

Los errores se deben a **tablas faltantes** en la base de datos. La solución es ejecutar el script `fix-points-tables.sql` en Supabase SQL Editor, que creará todas las tablas necesarias con las relaciones correctas y políticas RLS apropiadas.

**¡Una vez ejecutado el script, el sistema de puntos funcionará perfectamente!** 🎉











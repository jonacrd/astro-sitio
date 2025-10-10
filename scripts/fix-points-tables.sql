-- Script para corregir las tablas de puntos y sus relaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar y crear tabla user_points si no existe
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'order',
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

-- 2. Verificar y crear tabla points_history si no existe
CREATE TABLE IF NOT EXISTS points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  transaction_type VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verificar y crear tabla point_redemptions si no existe
CREATE TABLE IF NOT EXISTS point_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- 4. Verificar y crear tabla seller_rewards_config si no existe
CREATE TABLE IF NOT EXISTS seller_rewards_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  points_per_peso DECIMAL(10,4) DEFAULT 0.0286,
  minimum_purchase_cents INTEGER DEFAULT 500000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- 5. Verificar y crear tabla seller_reward_tiers si no existe
CREATE TABLE IF NOT EXISTS seller_reward_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  minimum_purchase_cents INTEGER NOT NULL,
  points_multiplier DECIMAL(10,4) DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, tier_name)
);

-- 6. Habilitar RLS en todas las tablas
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para user_points
DROP POLICY IF EXISTS "Users can view own points" ON user_points;
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points" ON user_points;
CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create points" ON user_points;
CREATE POLICY "System can create points" ON user_points
  FOR INSERT WITH CHECK (true);

-- 8. Crear políticas RLS para points_history
DROP POLICY IF EXISTS "Users can view own points history" ON points_history;
CREATE POLICY "Users can view own points history" ON points_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view points history for their store" ON points_history;
CREATE POLICY "Sellers can view points history for their store" ON points_history
  FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "System can create points history" ON points_history;
CREATE POLICY "System can create points history" ON points_history
  FOR INSERT WITH CHECK (true);

-- 9. Crear políticas RLS para point_redemptions
DROP POLICY IF EXISTS "Users can view own redemptions" ON point_redemptions;
CREATE POLICY "Users can view own redemptions" ON point_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view redemptions for their store" ON point_redemptions;
CREATE POLICY "Sellers can view redemptions for their store" ON point_redemptions
  FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create redemptions" ON point_redemptions;
CREATE POLICY "Users can create redemptions" ON point_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Crear políticas RLS para seller_rewards_config
DROP POLICY IF EXISTS "Sellers can manage own rewards config" ON seller_rewards_config;
CREATE POLICY "Sellers can manage own rewards config" ON seller_rewards_config
  FOR ALL USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can view active rewards config" ON seller_rewards_config;
CREATE POLICY "Users can view active rewards config" ON seller_rewards_config
  FOR SELECT USING (is_active = true);

-- 11. Crear políticas RLS para seller_reward_tiers
DROP POLICY IF EXISTS "Sellers can manage own reward tiers" ON seller_reward_tiers;
CREATE POLICY "Sellers can manage own reward tiers" ON seller_reward_tiers
  FOR ALL USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can view active reward tiers" ON seller_reward_tiers;
CREATE POLICY "Users can view active reward tiers" ON seller_reward_tiers
  FOR SELECT USING (is_active = true);

-- 12. Insertar configuración por defecto para vendedores existentes
INSERT INTO seller_rewards_config (seller_id, is_active, points_per_peso, minimum_purchase_cents)
SELECT DISTINCT 
  o.seller_id,
  false as is_active,
  0.0286 as points_per_peso,
  500000 as minimum_purchase_cents
FROM orders o
WHERE o.seller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seller_rewards_config src 
    WHERE src.seller_id = o.seller_id
  )
ON CONFLICT (seller_id) DO NOTHING;

-- 13. Insertar niveles por defecto
INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT DISTINCT 
  o.seller_id,
  'Bronce' as tier_name,
  500000 as minimum_purchase_cents,
  1.0 as points_multiplier,
  'Nivel básico - 1 punto por cada 35 pesos'
FROM orders o
WHERE o.seller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seller_reward_tiers srt 
    WHERE srt.seller_id = o.seller_id AND srt.tier_name = 'Bronce'
  )
ON CONFLICT (seller_id, tier_name) DO NOTHING;

INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT DISTINCT 
  o.seller_id,
  'Plata' as tier_name,
  1000000 as minimum_purchase_cents,
  1.2 as points_multiplier,
  'Nivel intermedio - 20% más puntos'
FROM orders o
WHERE o.seller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seller_reward_tiers srt 
    WHERE srt.seller_id = o.seller_id AND srt.tier_name = 'Plata'
  )
ON CONFLICT (seller_id, tier_name) DO NOTHING;

INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT DISTINCT 
  o.seller_id,
  'Oro' as tier_name,
  2000000 as minimum_purchase_cents,
  1.5 as points_multiplier,
  'Nivel premium - 50% más puntos'
FROM orders o
WHERE o.seller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seller_reward_tiers srt 
    WHERE srt.seller_id = o.seller_id AND srt.tier_name = 'Oro'
  )
ON CONFLICT (seller_id, tier_name) DO NOTHING;

-- 14. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_seller_id ON user_points(seller_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_seller_id ON points_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_points_history_order_id ON points_history(order_id);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_user_id ON point_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_order_id ON point_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_rewards_config_seller_id ON seller_rewards_config(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reward_tiers_seller_id ON seller_reward_tiers(seller_id);

-- 15. Mostrar resumen de tablas creadas
SELECT 
  'user_points' as tabla,
  COUNT(*) as registros
FROM user_points
UNION ALL
SELECT 
  'points_history' as tabla,
  COUNT(*) as registros
FROM points_history
UNION ALL
SELECT 
  'point_redemptions' as tabla,
  COUNT(*) as registros
FROM point_redemptions
UNION ALL
SELECT 
  'seller_rewards_config' as tabla,
  COUNT(*) as registros
FROM seller_rewards_config
UNION ALL
SELECT 
  'seller_reward_tiers' as tabla,
  COUNT(*) as registros
FROM seller_reward_tiers;









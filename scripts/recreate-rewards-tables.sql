-- Borrar y recrear tablas del sistema de recompensas con tipos correctos
-- Ejecutar en Supabase SQL Editor

-- 1. BORRAR tablas existentes (en orden correcto por dependencias)
DROP TABLE IF EXISTS point_redemptions CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS seller_reward_tiers CASCADE;
DROP TABLE IF EXISTS seller_rewards_config CASCADE;

-- 2. RECREAR seller_rewards_config con tipos correctos
CREATE TABLE seller_rewards_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  points_per_peso DECIMAL(10,4) DEFAULT 0.0286,
  minimum_purchase_cents INTEGER DEFAULT 500000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- 3. RECREAR seller_reward_tiers con tipos correctos
CREATE TABLE seller_reward_tiers (
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

-- 4. RECREAR point_redemptions
CREATE TABLE point_redemptions (
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

-- 5. RECREAR points_history
CREATE TABLE points_history (
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

-- 6. HABILITAR RLS
ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- 7. CREAR POLÍTICAS RLS
CREATE POLICY "Sellers can manage own rewards config" ON seller_rewards_config
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active rewards config" ON seller_rewards_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage own reward tiers" ON seller_reward_tiers
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active reward tiers" ON seller_reward_tiers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own redemptions" ON point_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view redemptions for their store" ON point_redemptions
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can create redemptions" ON point_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own points history" ON points_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view points history for their store" ON points_history
  FOR SELECT USING (auth.uid() = seller_id);












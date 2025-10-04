-- Crear tablas del sistema de recompensas
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de configuración de puntos por vendedor
CREATE TABLE IF NOT EXISTS seller_rewards_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  points_per_peso DECIMAL(10,4) DEFAULT 0.0286, -- 1 punto = 35 pesos (1/35)
  minimum_purchase_cents INTEGER DEFAULT 500000, -- 5000 pesos mínimo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- 2. Tabla de niveles de recompensa por vendedor
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

-- 3. Tabla de canje de puntos
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

-- 4. Tabla de historial de puntos
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

-- Habilitar RLS
ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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









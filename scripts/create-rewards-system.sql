-- Sistema de Recompensas con Puntos
-- Crear tablas para el sistema de puntos

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
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, cancelled
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
  transaction_type VARCHAR(20) NOT NULL, -- earned, spent, expired, bonus
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para seller_rewards_config
CREATE POLICY "Sellers can manage own rewards config" ON seller_rewards_config
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active rewards config" ON seller_rewards_config
  FOR SELECT USING (is_active = true);

-- Políticas RLS para seller_reward_tiers
CREATE POLICY "Sellers can manage own reward tiers" ON seller_reward_tiers
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active reward tiers" ON seller_reward_tiers
  FOR SELECT USING (is_active = true);

-- Políticas RLS para point_redemptions
CREATE POLICY "Users can view own redemptions" ON point_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view redemptions for their store" ON point_redemptions
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can create redemptions" ON point_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para points_history
CREATE POLICY "Users can view own points history" ON points_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view points history for their store" ON points_history
  FOR SELECT USING (auth.uid() = seller_id);

-- Función para calcular puntos
CREATE OR REPLACE FUNCTION calculate_points(
  purchase_cents INTEGER,
  seller_id_param UUID
) RETURNS INTEGER AS $$
DECLARE
  config_record seller_rewards_config%ROWTYPE;
  total_points INTEGER := 0;
BEGIN
  -- Obtener configuración del vendedor
  SELECT * INTO config_record 
  FROM seller_rewards_config 
  WHERE seller_id = seller_id_param AND is_active = true;
  
  -- Si no hay configuración activa, no se otorgan puntos
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Verificar compra mínima
  IF purchase_cents < config_record.minimum_purchase_cents THEN
    RETURN 0;
  END IF;
  
  -- Calcular puntos (1 punto = 35 pesos)
  total_points := FLOOR(purchase_cents * config_record.points_per_peso);
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Función para aplicar puntos a un pedido
CREATE OR REPLACE FUNCTION apply_points_to_order(
  order_id_param UUID,
  points_to_use INTEGER
) RETURNS INTEGER AS $$
DECLARE
  order_record orders%ROWTYPE;
  user_points INTEGER;
  discount_cents INTEGER;
BEGIN
  -- Obtener información del pedido
  SELECT * INTO order_record FROM orders WHERE id = order_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Obtener puntos del usuario
  SELECT COALESCE(SUM(points_earned - points_spent), 0) INTO user_points
  FROM points_history 
  WHERE user_id = order_record.user_id;
  
  -- Verificar que el usuario tenga suficientes puntos
  IF user_points < points_to_use THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;
  
  -- Calcular descuento (1 punto = 35 pesos)
  discount_cents := points_to_use * 35;
  
  -- Crear registro de canje
  INSERT INTO point_redemptions (user_id, seller_id, order_id, points_used, discount_cents, status)
  VALUES (order_record.user_id, order_record.seller_id, order_id_param, points_to_use, discount_cents, 'applied');
  
  -- Registrar en historial
  INSERT INTO points_history (user_id, seller_id, order_id, points_spent, transaction_type, description)
  VALUES (order_record.user_id, order_record.seller_id, order_id_param, points_to_use, 'spent', 'Points redeemed for order discount');
  
  -- Actualizar total del pedido
  UPDATE orders 
  SET total_cents = total_cents - discount_cents
  WHERE id = order_id_param;
  
  RETURN discount_cents;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuración por defecto para vendedores existentes
INSERT INTO seller_rewards_config (seller_id, is_active, points_per_peso, minimum_purchase_cents)
SELECT 
  id as seller_id,
  false as is_active,
  0.0286 as points_per_peso, -- 1 punto = 35 pesos
  500000 as minimum_purchase_cents -- 5000 pesos mínimo
FROM auth.users 
WHERE id IN (
  SELECT DISTINCT seller_id FROM orders
)
ON CONFLICT (seller_id) DO NOTHING;

-- Insertar niveles por defecto
INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT 
  id as seller_id,
  'Bronce' as tier_name,
  500000 as minimum_purchase_cents, -- 5000 pesos
  1.0 as points_multiplier,
  'Nivel básico - 1 punto por cada 35 pesos' as description
FROM auth.users 
WHERE id IN (
  SELECT DISTINCT seller_id FROM orders
)
ON CONFLICT (seller_id, tier_name) DO NOTHING;

INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT 
  id as seller_id,
  'Plata' as tier_name,
  1000000 as minimum_purchase_cents, -- 10000 pesos
  1.2 as points_multiplier,
  'Nivel intermedio - 20% más puntos' as description
FROM auth.users 
WHERE id IN (
  SELECT DISTINCT seller_id FROM orders
)
ON CONFLICT (seller_id, tier_name) DO NOTHING;

INSERT INTO seller_reward_tiers (seller_id, tier_name, minimum_purchase_cents, points_multiplier, description)
SELECT 
  id as seller_id,
  'Oro' as tier_name,
  2000000 as minimum_purchase_cents, -- 20000 pesos
  1.5 as points_multiplier,
  'Nivel premium - 50% más puntos' as description
FROM auth.users 
WHERE id IN (
  SELECT DISTINCT seller_id FROM orders
)
ON CONFLICT (seller_id, tier_name) DO NOTHING;

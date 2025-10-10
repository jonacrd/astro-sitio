-- Arreglar políticas RLS para el sistema de recompensas
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Sellers can manage own rewards config" ON seller_rewards_config;
DROP POLICY IF EXISTS "Users can view active rewards config" ON seller_rewards_config;
DROP POLICY IF EXISTS "Sellers can manage own reward tiers" ON seller_reward_tiers;
DROP POLICY IF EXISTS "Users can view active reward tiers" ON seller_reward_tiers;

-- 2. Crear políticas RLS para seller_rewards_config
CREATE POLICY "Sellers can manage own rewards config" ON seller_rewards_config
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active rewards config" ON seller_rewards_config
  FOR SELECT USING (is_active = true);

-- 3. Crear políticas RLS para seller_reward_tiers
CREATE POLICY "Sellers can manage own reward tiers" ON seller_reward_tiers
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can view active reward tiers" ON seller_reward_tiers
  FOR SELECT USING (is_active = true);

-- 4. Verificar que las tablas tengan RLS habilitado
ALTER TABLE seller_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_reward_tiers ENABLE ROW LEVEL SECURITY;













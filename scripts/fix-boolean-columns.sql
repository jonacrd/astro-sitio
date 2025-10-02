-- Arreglar tipos de datos para campos booleanos
-- Ejecutar en Supabase SQL Editor

-- 1. Cambiar is_active en seller_reward_tiers de smallint a boolean
ALTER TABLE seller_reward_tiers 
ALTER COLUMN is_active TYPE BOOLEAN USING (is_active::text::boolean);

-- 2. Cambiar is_active en seller_rewards_config de smallint a boolean (si existe)
ALTER TABLE seller_rewards_config 
ALTER COLUMN is_active TYPE BOOLEAN USING (is_active::text::boolean);

-- 3. Establecer valores por defecto
ALTER TABLE seller_reward_tiers 
ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE seller_rewards_config 
ALTER COLUMN is_active SET DEFAULT false;








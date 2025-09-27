-- Arreglar constraints únicos para el sistema de recompensas
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar constraint único a seller_rewards_config
ALTER TABLE seller_rewards_config 
ADD CONSTRAINT seller_rewards_config_seller_id_unique UNIQUE (seller_id);

-- 2. Agregar constraint único a seller_reward_tiers
ALTER TABLE seller_reward_tiers 
ADD CONSTRAINT seller_reward_tiers_seller_id_tier_name_unique UNIQUE (seller_id, tier_name);





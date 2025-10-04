-- Script para limpiar todas las direcciones guardadas

-- 1. Ver cuántas direcciones hay actualmente
SELECT 
  COUNT(*) as total_direcciones,
  COUNT(DISTINCT user_id) as usuarios_con_direcciones
FROM user_addresses;

-- 2. ELIMINAR TODAS LAS DIRECCIONES (CUIDADO: ESTO BORRA TODO)
-- Descomentar para ejecutar:
DELETE FROM user_addresses;

-- 3. Verificar que se eliminaron
SELECT COUNT(*) as direcciones_restantes FROM user_addresses;

-- 4. Reiniciar la secuencia de IDs si existe
-- ALTER SEQUENCE user_addresses_id_seq RESTART WITH 1;

SELECT '✅ Todas las direcciones han sido eliminadas' as resultado;



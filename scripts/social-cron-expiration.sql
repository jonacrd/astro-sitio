-- =============================================
-- CRON DE EXPIRACIÓN AUTOMÁTICA - EXPRESS POSTS
-- =============================================

-- Función para marcar posts como expirados
CREATE OR REPLACE FUNCTION expire_express_posts()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Marcar posts como expirados
    UPDATE express_posts 
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at <= now();
    
    -- Contar cuántos se expiraron
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log de la operación (opcional)
    INSERT INTO public.system_logs (
        event_type, 
        message, 
        metadata
    ) VALUES (
        'express_posts_expired',
        'Expired ' || expired_count || ' express posts',
        jsonb_build_object('expired_count', expired_count, 'executed_at', now())
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CONFIGURACIÓN PARA SUPABASE SCHEDULED JOBS
-- =============================================

-- Nota: Para configurar en Supabase Dashboard:
-- 1. Ir a Database > Functions
-- 2. Crear nueva función: expire_express_posts()
-- 3. Ir a Database > Extensions > pg_cron
-- 4. Ejecutar: SELECT cron.schedule('expire-express-posts', '*/10 * * * *', 'SELECT expire_express_posts();');

-- =============================================
-- FUNCIÓN ALTERNATIVA CON WEBHOOK
-- =============================================

-- Función que puede ser llamada desde Edge Functions
CREATE OR REPLACE FUNCTION expire_express_posts_webhook()
RETURNS JSON AS $$
DECLARE
    expired_count INTEGER;
    result JSON;
BEGIN
    -- Ejecutar expiración
    SELECT expire_express_posts() INTO expired_count;
    
    -- Retornar resultado en formato JSON
    result := jsonb_build_object(
        'success', true,
        'expired_count', expired_count,
        'executed_at', now(),
        'message', 'Express posts expiration completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN DE LIMPIEZA ADICIONAL
-- =============================================

-- Limpiar posts expirados hace más de 7 días
CREATE OR REPLACE FUNCTION cleanup_old_expired_posts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar posts expirados hace más de 7 días
    DELETE FROM express_posts 
    WHERE status = 'expired' 
    AND expires_at < now() - interval '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VISTA PARA MONITOREO
-- =============================================

-- Vista para monitorear el estado de los posts
CREATE OR REPLACE VIEW express_posts_status_summary AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_post,
    MAX(created_at) as newest_post,
    COUNT(*) FILTER (WHERE expires_at <= now()) as expired_now
FROM express_posts 
GROUP BY status
ORDER BY status;

-- =============================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =============================================

-- Índice para consultas de expiración
CREATE INDEX IF NOT EXISTS idx_express_posts_expires_active 
    ON express_posts(expires_at) 
    WHERE status = 'active';

-- Índice para limpieza de posts antiguos
CREATE INDEX IF NOT EXISTS idx_express_posts_expires_expired 
    ON express_posts(expires_at) 
    WHERE status = 'expired';

-- =============================================
-- CONFIGURACIÓN DE ALERTAS (OPCIONAL)
-- =============================================

-- Función para enviar alertas cuando hay muchos posts expirando
CREATE OR REPLACE FUNCTION check_expiring_posts_alert()
RETURNS JSON AS $$
DECLARE
    expiring_soon_count INTEGER;
    result JSON;
BEGIN
    -- Contar posts que expiran en la próxima hora
    SELECT COUNT(*) INTO expiring_soon_count
    FROM express_posts 
    WHERE status = 'active' 
    AND expires_at BETWEEN now() AND now() + interval '1 hour';
    
    -- Si hay más de 100 posts expirando, generar alerta
    IF expiring_soon_count > 100 THEN
        result := jsonb_build_object(
            'alert', true,
            'expiring_soon_count', expiring_soon_count,
            'message', 'High volume of posts expiring soon',
            'timestamp', now()
        );
    ELSE
        result := jsonb_build_object(
            'alert', false,
            'expiring_soon_count', expiring_soon_count,
            'timestamp', now()
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DOCUMENTACIÓN DE USO
-- =============================================

/*
CONFIGURACIÓN EN SUPABASE:

1. CRON JOB (Recomendado):
   - Ejecutar cada 10 minutos: */10 * * * *
   - Función: expire_express_posts()

2. EDGE FUNCTION (Alternativo):
   - Crear función en Supabase Edge Functions
   - Llamar desde cron externo (GitHub Actions, etc.)
   - Endpoint: /api/social/expire-posts

3. WEBHOOK (Para integración externa):
   - Endpoint: /api/social/expire-posts
   - Método: POST
   - Headers: Authorization: Bearer <service_role_key>

MONITOREO:
- Vista: express_posts_status_summary
- Función: check_expiring_posts_alert()
- Logs en system_logs (si existe la tabla)
*/






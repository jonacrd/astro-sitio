-- =============================================
-- SCRIPT COMPLETO PARA SISTEMA DE HISTORIAS
-- =============================================
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. CREAR TABLA EXPRESS_POSTS (si no existe)
CREATE TABLE IF NOT EXISTS express_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
    description TEXT CHECK (length(description) <= 1000),
    price_cents INTEGER CHECK (price_cents >= 0),
    category TEXT CHECK (category IN ('comida', 'tecnologia', 'hogar', 'servicios', 'vehiculos', 'otros')),
    contact_method TEXT NOT NULL CHECK (contact_method IN ('whatsapp', 'telefono', 'email', 'directo')),
    contact_value TEXT NOT NULL CHECK (length(contact_value) >= 3),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'removed')),
    external_disclaimer_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours',
    location_text TEXT CHECK (length(location_text) <= 100),
    media_count INTEGER DEFAULT 0 CHECK (media_count >= 0 AND media_count <= 10),
    type TEXT DEFAULT 'post' CHECK (type IN ('post', 'story'))
);

-- 2. CREAR TABLA STORIES
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT CHECK (length(content) <= 500),
    media_url TEXT NOT NULL CHECK (media_url ~ '^https?://'),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    background_color TEXT DEFAULT '#000000' CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
    text_color TEXT DEFAULT '#FFFFFF' CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
    font_size INTEGER DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 72),
    text_position TEXT DEFAULT 'center' CHECK (text_position IN ('top', 'center', 'bottom')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- 3. CREAR TABLA STORY_VIEWS
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, viewer_id)
);

-- 4. CREAR TABLA STORY_REACTIONS
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, user_id)
);

-- 5. CREAR TABLA STORY_REPLIES
CREATE TABLE IF NOT EXISTS story_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 200),
    media_url TEXT CHECK (media_url ~ '^https?://'),
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREAR TABLA EXPRESS_MEDIA (si no existe)
CREATE TABLE IF NOT EXISTS express_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL CHECK (url ~ '^https?://'),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREAR TABLA EXPRESS_REACTIONS (si no existe)
CREATE TABLE IF NOT EXISTS express_reactions (
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'save')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id, reaction)
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para express_posts
CREATE INDEX IF NOT EXISTS idx_express_posts_status_expires 
    ON express_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_express_posts_created_desc 
    ON express_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_express_posts_author 
    ON express_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_express_posts_category 
    ON express_posts(category) WHERE status = 'active';

-- Índices para stories
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status_expires ON stories(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stories_created_desc ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at) WHERE status = 'active';

-- Índices para story_views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at);

-- Índices para story_reactions
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_type ON story_reactions(reaction_type);

-- Índices para story_replies
CREATE INDEX IF NOT EXISTS idx_story_replies_story_id ON story_replies(story_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_author_id ON story_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_created_desc ON story_replies(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE express_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_reactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - EXPRESS_POSTS
-- =============================================

-- Lectura: Cualquiera puede leer posts activos
CREATE POLICY "express_posts_read_active" ON express_posts
    FOR SELECT USING (status = 'active');

-- Lectura: Autor puede leer sus propios posts
CREATE POLICY "express_posts_read_own" ON express_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "express_posts_insert" ON express_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Actualización: Solo el autor puede editar
CREATE POLICY "express_posts_update_own" ON express_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Eliminación: Solo el autor puede eliminar
CREATE POLICY "express_posts_delete_own" ON express_posts
    FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- POLÍTICAS RLS - STORIES
-- =============================================

-- Lectura: Cualquiera puede leer historias activas
CREATE POLICY "stories_read_active" ON stories
    FOR SELECT USING (status = 'active' AND expires_at > now());

-- Lectura: Autor puede leer sus propias historias
CREATE POLICY "stories_read_own" ON stories
    FOR SELECT USING (auth.uid() = author_id);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "stories_insert" ON stories
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Actualización: Solo el autor puede editar
CREATE POLICY "stories_update_own" ON stories
    FOR UPDATE USING (auth.uid() = author_id);

-- Eliminación: Solo el autor puede eliminar
CREATE POLICY "stories_delete_own" ON stories
    FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- POLÍTICAS RLS - STORY_VIEWS
-- =============================================

-- Lectura: Solo el autor de la historia puede ver las vistas
CREATE POLICY "story_views_read_author" ON story_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_views.story_id 
            AND stories.author_id = auth.uid()
        )
    );

-- Inserción: Solo usuarios autenticados
CREATE POLICY "story_views_insert" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =============================================
-- POLÍTICAS RLS - STORY_REACTIONS
-- =============================================

-- Lectura: Cualquiera puede leer reacciones
CREATE POLICY "story_reactions_read" ON story_reactions
    FOR SELECT USING (true);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "story_reactions_insert" ON story_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Actualización: Solo el usuario propietario
CREATE POLICY "story_reactions_update" ON story_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Eliminación: Solo el usuario propietario
CREATE POLICY "story_reactions_delete" ON story_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - STORY_REPLIES
-- =============================================

-- Lectura: Cualquiera puede leer respuestas
CREATE POLICY "story_replies_read" ON story_replies
    FOR SELECT USING (true);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "story_replies_insert" ON story_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Actualización: Solo el autor
CREATE POLICY "story_replies_update_own" ON story_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Eliminación: Solo el autor
CREATE POLICY "story_replies_delete_own" ON story_replies
    FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para actualizar views_count automáticamente
CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE stories 
        SET views_count = views_count + 1 
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stories 
        SET views_count = views_count - 1 
        WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar views_count
DROP TRIGGER IF EXISTS trigger_update_story_views_count ON story_views;
CREATE TRIGGER trigger_update_story_views_count
    AFTER INSERT OR DELETE ON story_views
    FOR EACH ROW EXECUTE FUNCTION update_story_views_count();

-- Función para marcar historias como expiradas
CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE stories 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at <= now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener historias activas
CREATE OR REPLACE FUNCTION get_active_stories(user_id UUID)
RETURNS TABLE (
    story_id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    background_color TEXT,
    text_color TEXT,
    font_size INTEGER,
    text_position TEXT,
    views_count INTEGER,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    has_viewed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as story_id,
        s.author_id,
        p.name as author_name,
        p.avatar_url as author_avatar,
        s.content,
        s.media_url,
        s.media_type,
        s.background_color,
        s.text_color,
        s.font_size,
        s.text_position,
        s.views_count,
        s.created_at,
        s.expires_at,
        EXISTS(
            SELECT 1 FROM story_views sv 
            WHERE sv.story_id = s.id 
            AND sv.viewer_id = user_id
        ) as has_viewed
    FROM stories s
    JOIN profiles p ON p.id = s.author_id
    WHERE s.status = 'active' 
    AND s.expires_at > now()
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE express_posts IS 'Publicaciones express de venta con expiración 24h';
COMMENT ON TABLE stories IS 'Historias que expiran a las 24 horas';
COMMENT ON TABLE story_views IS 'Tracking de vistas de historias';
COMMENT ON TABLE story_reactions IS 'Reacciones a historias';
COMMENT ON TABLE story_replies IS 'Respuestas a historias';

COMMENT ON FUNCTION expire_old_stories() IS 'Marca historias expiradas como inactivas';
COMMENT ON FUNCTION get_active_stories(UUID) IS 'Obtiene historias activas con información del autor';

-- =============================================
-- CONFIGURACIÓN DE STORAGE
-- =============================================

-- Crear bucket para historias si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

-- Políticas para storage
CREATE POLICY "stories_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "stories_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "stories_author_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "stories_author_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Crear tabla user_consents si no existe
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_key TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, consent_key)
);

-- Habilitar RLS en user_consents
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_consents
CREATE POLICY "user_consents_read_own" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_consents_insert" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insertar consentimientos para historias (solo si la tabla existe)
DO $$
BEGIN
    -- Verificar si la tabla user_consents existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents' AND table_schema = 'public') THEN
        -- Insertar consentimientos para historias
        INSERT INTO user_consents (user_id, consent_key, metadata) 
        SELECT 
            id, 
            'stories_creation',
            '{"version": "1.0", "features": ["media_upload", "story_replies", "story_reactions"]}'::jsonb
        FROM auth.users 
        WHERE id NOT IN (SELECT user_id FROM user_consents WHERE consent_key = 'stories_creation')
        ON CONFLICT (user_id, consent_key) DO NOTHING;
        
        RAISE NOTICE '✅ Consentimientos de historias insertados';
    ELSE
        RAISE NOTICE '⚠️ Tabla user_consents no existe, saltando inserción de consentimientos';
    END IF;
END $$;

-- =============================================
-- FINALIZACIÓN
-- =============================================

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de historias configurado exitosamente!';
    RAISE NOTICE '📱 Tablas creadas: express_posts, stories, story_views, story_reactions, story_replies';
    RAISE NOTICE '🔒 Políticas RLS configuradas para todas las tablas';
    RAISE NOTICE '☁️ Bucket de storage "stories" configurado';
    RAISE NOTICE '⚡ Funciones auxiliares creadas';
    RAISE NOTICE '🎉 ¡Sistema listo para usar!';
END $$;

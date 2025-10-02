-- =============================================
-- SISTEMA DE HISTORIAS (STORIES) - 24 HORAS
-- =============================================
-- Extensión del sistema social existente para historias que expiran

-- 1. Agregar columna type a express_posts para distinguir stories
ALTER TABLE express_posts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'post' CHECK (type IN ('post', 'story'));

-- 2. Agregar columna story_views para tracking de vistas
ALTER TABLE express_posts ADD COLUMN IF NOT EXISTS story_views INTEGER DEFAULT 0 CHECK (story_views >= 0);

-- 3. Crear tabla específica para historias (stories)
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT CHECK (length(content) <= 500), -- Texto opcional en la historia
    media_url TEXT NOT NULL CHECK (url ~ '^https?://'), -- URL del media principal
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    background_color TEXT DEFAULT '#000000' CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
    text_color TEXT DEFAULT '#FFFFFF' CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
    font_size INTEGER DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 72),
    text_position TEXT DEFAULT 'center' CHECK (text_position IN ('top', 'center', 'bottom')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours',
    -- Índices automáticos
    CONSTRAINT stories_author_fk FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Crear tabla para tracking de vistas de historias
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    -- Un usuario solo puede ver una historia una vez
    UNIQUE(story_id, viewer_id)
);

-- 5. Crear tabla para reacciones a historias
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Un usuario solo puede reaccionar una vez por historia
    UNIQUE(story_id, user_id)
);

-- 6. Crear tabla para respuestas a historias (replies)
CREATE TABLE IF NOT EXISTS story_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 200),
    media_url TEXT CHECK (url ~ '^https?://'), -- Media opcional en la respuesta
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Índices automáticos
    CONSTRAINT story_replies_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT story_replies_author_fk FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

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
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;

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

-- Función para obtener historias activas de usuarios seguidos
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

COMMENT ON TABLE stories IS 'Historias que expiran a las 24 horas';
COMMENT ON TABLE story_views IS 'Tracking de vistas de historias';
COMMENT ON TABLE story_reactions IS 'Reacciones a historias';
COMMENT ON TABLE story_replies IS 'Respuestas a historias';

COMMENT ON FUNCTION expire_old_stories() IS 'Marca historias expiradas como inactivas';
COMMENT ON FUNCTION get_active_stories(UUID) IS 'Obtiene historias activas con información del autor';

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar consentimientos para historias
INSERT INTO user_consents (user_id, consent_key, metadata) 
SELECT 
    id, 
    'stories_creation',
    '{"version": "1.0", "features": ["media_upload", "story_replies", "story_reactions"]}'::jsonb
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_consents WHERE consent_key = 'stories_creation')
ON CONFLICT (user_id, consent_key) DO NOTHING;




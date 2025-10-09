-- =============================================
-- SCRIPT SIMPLIFICADO PARA SISTEMA DE HISTORIAS
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

-- 6. CREAR TABLA EXPRESS_MEDIA
CREATE TABLE IF NOT EXISTS express_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL CHECK (url ~ '^https?://'),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREAR TABLA EXPRESS_REACTIONS
CREATE TABLE IF NOT EXISTS express_reactions (
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'save')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id, reaction)
);

-- =============================================
-- ÍNDICES BÁSICOS
-- =============================================

-- Índices para express_posts
CREATE INDEX IF NOT EXISTS idx_express_posts_status_expires 
    ON express_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_express_posts_created_desc 
    ON express_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_express_posts_author 
    ON express_posts(author_id);

-- Índices para stories
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status_expires ON stories(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stories_created_desc ON stories(created_at DESC);

-- Índices para story_views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

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
-- POLÍTICAS RLS BÁSICAS
-- =============================================

-- Políticas para express_posts
CREATE POLICY "express_posts_read_active" ON express_posts
    FOR SELECT USING (status = 'active');

CREATE POLICY "express_posts_read_own" ON express_posts
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "express_posts_insert" ON express_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "express_posts_update_own" ON express_posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "express_posts_delete_own" ON express_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para stories
CREATE POLICY "stories_read_active" ON stories
    FOR SELECT USING (status = 'active' AND expires_at > now());

CREATE POLICY "stories_read_own" ON stories
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "stories_insert" ON stories
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "stories_update_own" ON stories
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "stories_delete_own" ON stories
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para story_views
CREATE POLICY "story_views_read_author" ON story_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = story_views.story_id 
            AND stories.author_id = auth.uid()
        )
    );

CREATE POLICY "story_views_insert" ON story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Políticas para story_reactions
CREATE POLICY "story_reactions_read" ON story_reactions
    FOR SELECT USING (true);

CREATE POLICY "story_reactions_insert" ON story_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_reactions_update" ON story_reactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "story_reactions_delete" ON story_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para story_replies
CREATE POLICY "story_replies_read" ON story_replies
    FOR SELECT USING (true);

CREATE POLICY "story_replies_insert" ON story_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "story_replies_update_own" ON story_replies
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "story_replies_delete_own" ON story_replies
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para express_media
CREATE POLICY "express_media_read" ON express_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.status = 'active'
        )
    );

CREATE POLICY "express_media_insert" ON express_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.author_id = auth.uid()
        )
    );

-- Políticas para express_reactions
CREATE POLICY "express_reactions_read" ON express_reactions
    FOR SELECT USING (true);

CREATE POLICY "express_reactions_insert" ON express_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "express_reactions_update" ON express_reactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "express_reactions_delete" ON express_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCIONES BÁSICAS
-- =============================================

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

-- Función para actualizar views_count
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

-- =============================================
-- CONFIGURACIÓN DE STORAGE
-- =============================================

-- Crear bucket para historias
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








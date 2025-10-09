-- =============================================
-- MIGRACIONES MÓDULO SOCIAL - EXPRESS POSTS & QUESTIONS
-- =============================================

-- Tabla: express_posts
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
    media_count INTEGER DEFAULT 0 CHECK (media_count >= 0 AND media_count <= 10)
);

-- Tabla: express_media
CREATE TABLE IF NOT EXISTS express_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL CHECK (url ~ '^https?://'),
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: express_reactions
CREATE TABLE IF NOT EXISTS express_reactions (
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'save')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id, reaction)
);

-- Tabla: express_reports
CREATE TABLE IF NOT EXISTS express_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES express_posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (length(reason) >= 10 AND length(reason) <= 500),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, reporter_id) -- Un usuario solo puede reportar una vez el mismo post
);

-- Tabla: questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(body) >= 280 AND length(body) <= 500),
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 5),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'removed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: answers
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(body) >= 10 AND length(body) <= 1000),
    is_ai BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: user_consents
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_key TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, consent_key)
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

-- Índices para express_media
CREATE INDEX IF NOT EXISTS idx_express_media_post_id 
    ON express_media(post_id);

CREATE INDEX IF NOT EXISTS idx_express_media_sort_order 
    ON express_media(post_id, sort_order);

-- Índices para questions
CREATE INDEX IF NOT EXISTS idx_questions_created_desc 
    ON questions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_status 
    ON questions(status) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_questions_tags_gin 
    ON questions USING GIN(tags);

-- Índices para answers
CREATE INDEX IF NOT EXISTS idx_answers_question_id 
    ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_answers_author 
    ON answers(author_id);

-- Índices para user_consents
CREATE INDEX IF NOT EXISTS idx_user_consents_user_key 
    ON user_consents(user_id, consent_key);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE express_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

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
-- POLÍTICAS RLS - EXPRESS_MEDIA
-- =============================================

-- Lectura: Cualquiera puede leer media de posts activos
CREATE POLICY "express_media_read" ON express_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.status = 'active'
        )
    );

-- Inserción: Solo el autor del post
CREATE POLICY "express_media_insert" ON express_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.author_id = auth.uid()
        )
    );

-- Actualización: Solo el autor del post
CREATE POLICY "express_media_update" ON express_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.author_id = auth.uid()
        )
    );

-- Eliminación: Solo el autor del post
CREATE POLICY "express_media_delete" ON express_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM express_posts 
            WHERE express_posts.id = express_media.post_id 
            AND express_posts.author_id = auth.uid()
        )
    );

-- =============================================
-- POLÍTICAS RLS - EXPRESS_REACTIONS
-- =============================================

-- Lectura: Cualquiera puede leer reacciones
CREATE POLICY "express_reactions_read" ON express_reactions
    FOR SELECT USING (true);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "express_reactions_insert" ON express_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Actualización: Solo el usuario propietario
CREATE POLICY "express_reactions_update" ON express_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Eliminación: Solo el usuario propietario
CREATE POLICY "express_reactions_delete" ON express_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - EXPRESS_REPORTS
-- =============================================

-- Lectura: Solo el reportero puede leer sus reportes
CREATE POLICY "express_reports_read_own" ON express_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "express_reports_insert" ON express_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =============================================
-- POLÍTICAS RLS - QUESTIONS
-- =============================================

-- Lectura: Cualquiera puede leer preguntas no eliminadas
CREATE POLICY "questions_read" ON questions
    FOR SELECT USING (status != 'removed');

-- Inserción: Solo usuarios autenticados
CREATE POLICY "questions_insert" ON questions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Actualización: Solo el autor
CREATE POLICY "questions_update_own" ON questions
    FOR UPDATE USING (auth.uid() = author_id);

-- Eliminación: Solo el autor
CREATE POLICY "questions_delete_own" ON questions
    FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- POLÍTICAS RLS - ANSWERS
-- =============================================

-- Lectura: Cualquiera puede leer respuestas
CREATE POLICY "answers_read" ON answers
    FOR SELECT USING (true);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "answers_insert" ON answers
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Actualización: Solo el autor
CREATE POLICY "answers_update_own" ON answers
    FOR UPDATE USING (auth.uid() = author_id);

-- Eliminación: Solo el autor
CREATE POLICY "answers_delete_own" ON answers
    FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- POLÍTICAS RLS - USER_CONSENTS
-- =============================================

-- Lectura: Solo el usuario propietario
CREATE POLICY "user_consents_read_own" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

-- Inserción: Solo usuarios autenticados
CREATE POLICY "user_consents_insert" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para actualizar media_count automáticamente
CREATE OR REPLACE FUNCTION update_express_posts_media_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE express_posts 
        SET media_count = media_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE express_posts 
        SET media_count = media_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar media_count
CREATE TRIGGER trigger_update_media_count
    AFTER INSERT OR DELETE ON express_media
    FOR EACH ROW EXECUTE FUNCTION update_express_posts_media_count();

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE express_posts IS 'Publicaciones express de venta con expiración 24h';
COMMENT ON TABLE express_media IS 'Medios adjuntos a publicaciones express';
COMMENT ON TABLE express_reactions IS 'Reacciones (like/save) de usuarios a posts';
COMMENT ON TABLE express_reports IS 'Reportes de publicaciones inapropiadas';
COMMENT ON TABLE questions IS 'Preguntas de la comunidad';
COMMENT ON TABLE answers IS 'Respuestas a preguntas de la comunidad';
COMMENT ON TABLE user_consents IS 'Consentimientos de usuarios para funcionalidades';

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar consentimientos base
INSERT INTO user_consents (user_id, consent_key, metadata) 
SELECT 
    id, 
    'express_posts_creation',
    '{"version": "1.0", "features": ["external_contact", "media_upload"]}'::jsonb
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_consents WHERE consent_key = 'express_posts_creation')
ON CONFLICT (user_id, consent_key) DO NOTHING;












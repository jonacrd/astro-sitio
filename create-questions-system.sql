-- Script para crear el sistema de preguntas y respuestas del vecindario

-- 1. Crear tabla de preguntas
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100), -- Opcional: ubicación específica
    is_urgent BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de respuestas
CREATE TABLE IF NOT EXISTS question_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    contact_info VARCHAR(200), -- Número de teléfono, dirección, etc.
    is_verified BOOLEAN DEFAULT false, -- Si el usuario verificó el servicio
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de votos en respuestas
CREATE TABLE IF NOT EXISTS answer_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    answer_id UUID NOT NULL REFERENCES question_answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_id, user_id) -- Un usuario solo puede votar una vez por respuesta
);

-- 4. Crear tabla de categorías de preguntas
CREATE TABLE IF NOT EXISTS question_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insertar categorías predefinidas
INSERT INTO question_categories (id, name, icon, description) VALUES
('plomeria', 'Plomería', '🔧', 'Reparaciones de tuberías, grifos, baños'),
('electricidad', 'Electricidad', '⚡', 'Instalaciones eléctricas, reparaciones'),
('limpieza', 'Limpieza', '🧹', 'Servicios de limpieza, aseo'),
('jardineria', 'Jardinería', '🌱', 'Cuidado de jardines, poda, paisajismo'),
('construccion', 'Construcción', '🏗️', 'Obras, remodelaciones, albañilería'),
('tecnologia', 'Tecnología', '💻', 'Reparación de computadores, celulares'),
('transporte', 'Transporte', '🚗', 'Mudanzas, envíos, transporte'),
('salud', 'Salud', '🏥', 'Servicios médicos, veterinarios'),
('educacion', 'Educación', '📚', 'Clases particulares, tutorías'),
('otros', 'Otros', '❓', 'Otras consultas y servicios')
ON CONFLICT (id) DO NOTHING;

-- 6. Habilitar RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para questions
CREATE POLICY "Users can view all questions" ON questions
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own questions" ON questions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" ON questions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions" ON questions
FOR DELETE USING (auth.uid() = user_id);

-- 8. Políticas RLS para question_answers
CREATE POLICY "Users can view all answers" ON question_answers
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own answers" ON question_answers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" ON question_answers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers" ON question_answers
FOR DELETE USING (auth.uid() = user_id);

-- 9. Políticas RLS para answer_votes
CREATE POLICY "Users can view all votes" ON answer_votes
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON answer_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON answer_votes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON answer_votes
FOR DELETE USING (auth.uid() = user_id);

-- 10. Políticas RLS para question_categories
CREATE POLICY "Users can view all categories" ON question_categories
FOR SELECT USING (true);

-- 11. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_is_resolved ON questions(is_resolved);

CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_user_id ON question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_created_at ON question_answers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_answers_upvotes ON question_answers(upvotes DESC);

CREATE INDEX IF NOT EXISTS idx_answer_votes_answer_id ON answer_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_user_id ON answer_votes(user_id);

-- 12. Función para actualizar contadores de votos
CREATE OR REPLACE FUNCTION update_answer_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE question_answers SET upvotes = upvotes + 1 WHERE id = NEW.answer_id;
        ELSE
            UPDATE question_answers SET downvotes = downvotes + 1 WHERE id = NEW.answer_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Restar el voto anterior
        IF OLD.vote_type = 'upvote' THEN
            UPDATE question_answers SET upvotes = upvotes - 1 WHERE id = OLD.answer_id;
        ELSE
            UPDATE question_answers SET downvotes = downvotes - 1 WHERE id = OLD.answer_id;
        END IF;
        -- Sumar el nuevo voto
        IF NEW.vote_type = 'upvote' THEN
            UPDATE question_answers SET upvotes = upvotes + 1 WHERE id = NEW.answer_id;
        ELSE
            UPDATE question_answers SET downvotes = downvotes + 1 WHERE id = NEW.answer_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE question_answers SET upvotes = upvotes - 1 WHERE id = OLD.answer_id;
        ELSE
            UPDATE question_answers SET downvotes = downvotes - 1 WHERE id = OLD.answer_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Crear trigger para actualizar contadores
CREATE TRIGGER trigger_update_answer_vote_count
    AFTER INSERT OR UPDATE OR DELETE ON answer_votes
    FOR EACH ROW EXECUTE FUNCTION update_answer_vote_count();

-- 14. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Triggers para updated_at
CREATE TRIGGER trigger_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_question_answers_updated_at
    BEFORE UPDATE ON question_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Verificar que todo se creó correctamente
SELECT 'Tablas creadas:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%question%';

SELECT 'Categorías insertadas:' as status;
SELECT * FROM question_categories ORDER BY name;




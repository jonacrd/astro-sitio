-- Configuración de tablas para búsqueda unificada con FTS
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas FTS a products si no existen
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- 2. Agregar columnas FTS a express_posts si no existen
ALTER TABLE express_posts 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- 3. Agregar columnas FTS a questions si no existen
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- 4. Crear índices GIN para FTS
CREATE INDEX IF NOT EXISTS products_fts_idx ON products USING gin(fts_vector);
CREATE INDEX IF NOT EXISTS express_posts_fts_idx ON express_posts USING gin(fts_vector);
CREATE INDEX IF NOT EXISTS questions_fts_idx ON questions USING gin(fts_vector);

-- 5. Función para actualizar FTS vector
CREATE OR REPLACE FUNCTION update_fts_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Para products
  IF TG_TABLE_NAME = 'products' THEN
    NEW.fts_vector = to_tsvector('spanish', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' ||
      COALESCE(NEW.category, '')
    );
  END IF;
  
  -- Para express_posts
  IF TG_TABLE_NAME = 'express_posts' THEN
    NEW.fts_vector = to_tsvector('spanish', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.content, '')
    );
  END IF;
  
  -- Para questions
  IF TG_TABLE_NAME = 'questions' THEN
    NEW.fts_vector = to_tsvector('spanish', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.content, '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Triggers para actualizar FTS automáticamente
DROP TRIGGER IF EXISTS products_fts_trigger ON products;
CREATE TRIGGER products_fts_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_fts_vector();

DROP TRIGGER IF EXISTS express_posts_fts_trigger ON express_posts;
CREATE TRIGGER express_posts_fts_trigger
  BEFORE INSERT OR UPDATE ON express_posts
  FOR EACH ROW EXECUTE FUNCTION update_fts_vector();

DROP TRIGGER IF EXISTS questions_fts_trigger ON questions;
CREATE TRIGGER questions_fts_trigger
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_fts_vector();

-- 7. Actualizar FTS vectors existentes
UPDATE products SET fts_vector = to_tsvector('spanish', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' ||
  COALESCE(category, '')
);

UPDATE express_posts SET fts_vector = to_tsvector('spanish', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '')
);

UPDATE questions SET fts_vector = to_tsvector('spanish', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '')
);

-- 8. Crear tabla de configuración de búsqueda
CREATE TABLE IF NOT EXISTS search_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO search_config (key, value) VALUES 
  ('default_language', 'spanish'),
  ('max_results', '30'),
  ('boost_open_stores', '0.2'),
  ('boost_products', '0.8'),
  ('boost_posts', '0.6'),
  ('boost_questions', '0.4')
ON CONFLICT (key) DO NOTHING;

-- 9. Función para búsqueda unificada (opcional, para uso directo en SQL)
CREATE OR REPLACE FUNCTION unified_search(
  search_query TEXT,
  limit_results INTEGER DEFAULT 30
)
RETURNS TABLE (
  type TEXT,
  id UUID,
  title TEXT,
  snippet TEXT,
  seller TEXT,
  open_now BOOLEAN,
  has_delivery BOOLEAN,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  -- Productos
  SELECT 
    'product'::TEXT as type,
    p.id,
    p.title,
    LEFT(p.description, 150) as snippet,
    s.name as seller,
    s.is_open as open_now,
    (s.delivery_type IS NOT NULL) as has_delivery,
    (0.8 + CASE WHEN s.is_open THEN 0.2 ELSE 0 END) as rank
  FROM products p
  JOIN seller_products sp ON p.id = sp.product_id
  JOIN sellers s ON sp.seller_id = s.id
  WHERE p.fts_vector @@ plainto_tsquery('spanish', search_query)
  
  UNION ALL
  
  -- Posts express
  SELECT 
    'post'::TEXT as type,
    ep.id,
    ep.title,
    LEFT(ep.content, 150) as snippet,
    s.name as seller,
    s.is_open as open_now,
    (s.delivery_type IS NOT NULL) as has_delivery,
    (0.6 + CASE WHEN s.is_open THEN 0.2 ELSE 0 END) as rank
  FROM express_posts ep
  JOIN sellers s ON ep.seller_id = s.id
  WHERE ep.fts_vector @@ plainto_tsquery('spanish', search_query)
    AND ep.expires_at > NOW()
  
  UNION ALL
  
  -- Preguntas
  SELECT 
    'question'::TEXT as type,
    q.id,
    q.title,
    LEFT(q.content, 150) as snippet,
    p.name as seller,
    FALSE as open_now,
    FALSE as has_delivery,
    0.4 as rank
  FROM questions q
  JOIN profiles p ON q.user_id = p.id
  WHERE q.fts_vector @@ plainto_tsquery('spanish', search_query)
  
  ORDER BY rank DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- 10. Verificar configuración
SELECT 'FTS configuration completed successfully' as status;





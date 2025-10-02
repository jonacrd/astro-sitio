-- =============================================
-- CONFIGURACIÓN DE STORAGE PARA HISTORIAS
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

-- =============================================
-- POLÍTICAS RLS PARA STORAGE
-- =============================================

-- Política para lectura pública de historias
CREATE POLICY "stories_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'stories');

-- Política para subida de historias (solo usuarios autenticados)
CREATE POLICY "stories_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización de historias (solo el autor)
CREATE POLICY "stories_author_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para eliminación de historias (solo el autor)
CREATE POLICY "stories_author_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- FUNCIONES AUXILIARES PARA STORAGE
-- =============================================

-- Función para obtener URL pública de una historia
CREATE OR REPLACE FUNCTION get_story_public_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT storage.public_url('stories', file_path)
  );
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un archivo de historia existe
CREATE OR REPLACE FUNCTION story_file_exists(file_path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'stories' 
    AND name = file_path
  );
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar archivos huérfanos de historias
CREATE OR REPLACE FUNCTION cleanup_orphaned_story_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Encontrar archivos que no tienen referencia en la tabla stories
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'stories'
    AND created_at < now() - interval '25 hours' -- Más de 24 horas + buffer
  LOOP
    -- Verificar si el archivo tiene referencia en stories
    IF NOT EXISTS (
      SELECT 1 FROM stories 
      WHERE media_url LIKE '%' || file_record.name || '%'
    ) THEN
      -- Eliminar archivo huérfano
      DELETE FROM storage.objects 
      WHERE bucket_id = 'stories' 
      AND name = file_record.name;
      
      deleted_count := deleted_count + 1;
    END IF;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =============================================

-- Función para limpiar archivos cuando se elimina una historia
CREATE OR REPLACE FUNCTION cleanup_story_files_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Extraer nombre del archivo de la URL
  DECLARE
    file_name TEXT;
  BEGIN
    -- Extraer el nombre del archivo de la URL
    file_name := split_part(OLD.media_url, '/', array_length(string_to_array(OLD.media_url, '/'), 1));
    
    -- Eliminar archivo del storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'stories' 
    AND name LIKE '%' || file_name || '%';
    
    RETURN OLD;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar archivos al eliminar historia
CREATE TRIGGER trigger_cleanup_story_files
  AFTER DELETE ON stories
  FOR EACH ROW EXECUTE FUNCTION cleanup_story_files_on_delete();

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índice para búsquedas por bucket
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects(bucket_id);

-- Índice para búsquedas por fecha de creación
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at 
ON storage.objects(created_at);

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON FUNCTION get_story_public_url(TEXT) IS 'Obtiene URL pública de un archivo de historia';
COMMENT ON FUNCTION story_file_exists(TEXT) IS 'Verifica si un archivo de historia existe en storage';
COMMENT ON FUNCTION cleanup_orphaned_story_files() IS 'Limpia archivos huérfanos de historias';
COMMENT ON FUNCTION cleanup_story_files_on_delete() IS 'Limpia archivos cuando se elimina una historia';

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Crear carpeta base para historias
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES (
  'stories',
  'index.html',
  auth.uid(),
  '{"contentType": "text/html"}'::jsonb
)
ON CONFLICT (bucket_id, name) DO NOTHING;




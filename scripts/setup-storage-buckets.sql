-- Script para configurar buckets de Storage en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Crear bucket para comprobantes de transferencia
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear políticas RLS para el bucket de comprobantes
-- Política para permitir que los usuarios suban sus propios comprobantes
CREATE POLICY "Users can upload their own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para permitir que los usuarios vean sus propios comprobantes
CREATE POLICY "Users can view their own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[2] OR
    EXISTS (
      SELECT 1 FROM orders o
      JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = auth.uid() OR o.seller_id = auth.uid()
      AND p.transfer_receipt_url LIKE '%' || name
    )
  )
);

-- Política para permitir que los vendedores vean comprobantes de sus pedidos
CREATE POLICY "Sellers can view receipts from their orders" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM orders o
    JOIN payments p ON p.order_id = o.id
    WHERE o.seller_id = auth.uid()
    AND p.transfer_receipt_url LIKE '%' || name
  )
);

-- 3. Crear bucket para avatares de usuario (opcional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para avatares
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Crear bucket para imágenes de productos (opcional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para imágenes de productos
CREATE POLICY "Sellers can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM seller_products sp
    WHERE sp.seller_id = auth.uid()
    AND sp.image_url LIKE '%' || name
  )
);

CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 5. Función helper para obtener URL pública de Storage
CREATE OR REPLACE FUNCTION get_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para limpiar archivos huérfanos (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_receipts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Buscar archivos en storage que no tienen referencias en payments
  FOR file_record IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'receipts'
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.transfer_receipt_url LIKE '%' || file_record.name
    )
    AND created_at < NOW() - INTERVAL '7 days' -- Solo archivos más antiguos de 7 días
  LOOP
    -- Eliminar archivo del storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'receipts' AND name = file_record.name;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear vista para monitorear uso de storage
CREATE OR REPLACE VIEW storage_usage_summary AS
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::BIGINT as total_size_bytes,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- 8. Función para obtener estadísticas de storage
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size_mb NUMERIC,
  oldest_file TIMESTAMPTZ,
  newest_file TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sus.bucket_id::TEXT,
    sus.file_count,
    ROUND((sus.total_size_bytes::NUMERIC / 1024 / 1024)::NUMERIC, 2),
    sus.oldest_file,
    sus.newest_file
  FROM storage_usage_summary sus;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para actualizar metadata de archivos
CREATE OR REPLACE FUNCTION update_file_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar metadata con información adicional
  NEW.metadata = COALESCE(NEW.metadata, '{}'::JSONB) || 
    jsonb_build_object(
      'uploaded_by', auth.uid(),
      'uploaded_at', NOW()
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_file_metadata_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION update_file_metadata();

-- 10. Comentarios para documentación
COMMENT ON BUCKET receipts IS 'Bucket para almacenar comprobantes de transferencia bancaria';
COMMENT ON BUCKET avatars IS 'Bucket para almacenar avatares de usuarios';
COMMENT ON BUCKET product-images IS 'Bucket para almacenar imágenes de productos';

COMMENT ON FUNCTION get_public_url(TEXT, TEXT) IS 'Función helper para obtener URLs públicas de archivos en storage';
COMMENT ON FUNCTION cleanup_orphaned_receipts() IS 'Función para limpiar archivos huérfanos en el bucket de comprobantes';
COMMENT ON FUNCTION get_storage_stats() IS 'Función para obtener estadísticas de uso de storage';

-- 11. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at ON storage.objects(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);

-- 12. Configurar límites de tamaño por bucket (opcional)
-- Estos se pueden configurar también desde el dashboard de Supabase

-- Ejemplo de uso:
-- SELECT get_public_url('receipts', 'user123/receipt.jpg');
-- SELECT * FROM get_storage_stats();
-- SELECT cleanup_orphaned_receipts();







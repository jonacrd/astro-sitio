-- =====================================================
-- SOPORTE PARA PRODUCTOS PERSONALIZADOS
-- Permite a vendedores crear sus propios productos
-- =====================================================

-- 1. Agregar columna created_by a products (para saber quién creó el producto)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- 2. Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_products_created_by 
ON products(created_by) 
WHERE created_by IS NOT NULL;

-- 3. Crear bucket de storage para imágenes de productos (si no existe)
-- Ejecutar en el panel de Supabase Storage, no aquí:
-- Bucket name: product-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- 4. Política RLS para product-images bucket
-- Las políticas de storage se configuran en el panel de Supabase Storage

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'created_by';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. CREAR BUCKET EN SUPABASE STORAGE:
--    - Ve a Storage en Supabase Dashboard
--    - Click en "New bucket"
--    - Name: product-images
--    - Public: ✅ Sí (para que las URLs sean accesibles)
--    - Click "Save"

-- 2. CONFIGURAR POLÍTICAS RLS PARA EL BUCKET:
--    En el bucket product-images, agrega estas políticas:
--
--    a) INSERT Policy (Subir):
--       Policy name: "Sellers can upload product images"
--       Target roles: authenticated
--       Policy definition:
--       ```
--       bucket_id = 'product-images' 
--       AND auth.uid() = (storage.foldername(name))[1]::uuid
--       ```
--
--    b) SELECT Policy (Ver):
--       Policy name: "Anyone can view product images"
--       Target roles: public
--       Policy definition:
--       ```
--       bucket_id = 'product-images'
--       ```
--
--    c) DELETE Policy (Eliminar):
--       Policy name: "Sellers can delete their own images"
--       Target roles: authenticated
--       Policy definition:
--       ```
--       bucket_id = 'product-images' 
--       AND auth.uid() = (storage.foldername(name))[1]::uuid
--       ```

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================


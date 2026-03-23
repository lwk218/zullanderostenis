-- ============================================
-- SEGURIDAD REAL: Row Level Security (RLS)
-- Ejecuta este script en Supabase > SQL Editor
-- ============================================

-- 1. TABLA: products
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Borrar policies existentes (si las hay) para evitar conflictos
DROP POLICY IF EXISTS "Public read active products" ON products;
DROP POLICY IF EXISTS "Admins read all products" ON products;
DROP POLICY IF EXISTS "Admins insert products" ON products;
DROP POLICY IF EXISTS "Admins update products" ON products;
DROP POLICY IF EXISTS "Admins delete products" ON products;

-- Cualquiera puede leer productos ACTIVOS (catálogo público)
CREATE POLICY "Public read active products" ON products
  FOR SELECT
  USING (active = true);

-- Admins pueden leer TODOS los productos (activos e inactivos)
CREATE POLICY "Admins read all products" ON products
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Solo admins pueden crear productos
CREATE POLICY "Admins insert products" ON products
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Solo admins pueden actualizar productos
CREATE POLICY "Admins update products" ON products
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Solo admins pueden eliminar productos
CREATE POLICY "Admins delete products" ON products
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );


-- 2. TABLA: admin_users
-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users check own admin status" ON admin_users;

-- Un usuario autenticado solo puede leer SU PROPIO registro
-- (para verificar si es admin). Nadie puede insertar/actualizar/borrar.
CREATE POLICY "Users check own admin status" ON admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- NO se crean policies de INSERT/UPDATE/DELETE para admin_users.
-- Solo se gestionan admins desde el Dashboard de Supabase directamente.


-- 3. STORAGE: bucket "products"
-- Ve a Supabase Dashboard > Storage > products > Policies y configura:
--
-- READ (SELECT):  Público (ya debería estar si el bucket es público)
--
-- UPLOAD (INSERT): Solo admins autenticados:
--   CREATE POLICY "Admins upload images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'products'
--     AND auth.uid() IN (SELECT user_id FROM public.admin_users)
--   );
--
-- DELETE: Solo admins autenticados:
--   CREATE POLICY "Admins delete images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'products'
--     AND auth.uid() IN (SELECT user_id FROM public.admin_users)
--   );
--
-- UPDATE: Solo admins autenticados:
--   CREATE POLICY "Admins update images"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'products'
--     AND auth.uid() IN (SELECT user_id FROM public.admin_users)
--   )
--   WITH CHECK (
--     bucket_id = 'products'
--     AND auth.uid() IN (SELECT user_id FROM public.admin_users)
--   );


-- ============================================
-- VERIFICACIÓN: Corre esto para confirmar que RLS está activo
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('products', 'admin_users');

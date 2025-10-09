-- Arreglar políticas RLS para el sistema de delivery
-- Ejecutar en Supabase SQL Editor

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE public.couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications DISABLE ROW LEVEL SECURITY;

-- O crear políticas más permisivas para testing
-- ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para testing
-- CREATE POLICY "Allow all operations on couriers" ON public.couriers FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on deliveries" ON public.deliveries FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on delivery_offers" ON public.delivery_offers FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on delivery_notifications" ON public.delivery_notifications FOR ALL USING (true);

-- Insertar datos de prueba
INSERT INTO public.couriers (id, user_id, name, phone, is_active, is_available) 
VALUES (
  gen_random_uuid(),
  'test@test.com',
  'Repartidor Test',
  '+56912345678',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Verificar que las tablas existen y tienen datos
SELECT 'couriers' as table_name, count(*) as count FROM public.couriers
UNION ALL
SELECT 'deliveries' as table_name, count(*) as count FROM public.deliveries
UNION ALL
SELECT 'delivery_offers' as table_name, count(*) as count FROM public.delivery_offers
UNION ALL
SELECT 'delivery_notifications' as table_name, count(*) as count FROM public.delivery_notifications;


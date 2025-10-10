-- Sistema de Delivery Completo para Town
-- Crear tablas para múltiples repartidores y comunicación bidireccional

-- Tabla de repartidores
CREATE TABLE IF NOT EXISTS public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  last_lat DECIMAL(10, 8),
  last_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  courier_id UUID REFERENCES public.couriers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'offer_sent', 'assigned', 'pickup_confirmed', 'en_route', 'delivered', 'no_courier', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de ofertas de delivery
CREATE TABLE IF NOT EXISTS public.delivery_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(id),
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de notificaciones de delivery
CREATE TABLE IF NOT EXISTS public.delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('offer', 'accepted', 'declined', 'assigned', 'pickup_confirmed', 'en_route', 'delivered', 'cancelled')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_couriers_available ON public.couriers(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_offers_status ON public.delivery_offers(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_user ON public.delivery_notifications(user_id, is_read);

-- RLS Policies
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para couriers
CREATE POLICY "Couriers can view their own data" ON public.couriers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update their own data" ON public.couriers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create couriers" ON public.couriers
  FOR INSERT WITH CHECK (true);

-- Políticas para deliveries
CREATE POLICY "Users can view deliveries they're involved in" ON public.deliveries
  FOR SELECT USING (
    auth.uid() = seller_id OR 
    auth.uid() = courier_id OR
    EXISTS (
      SELECT 1 FROM public.couriers 
      WHERE id = courier_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can create deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update deliveries" ON public.deliveries
  FOR UPDATE USING (true);

-- Políticas para delivery_offers
CREATE POLICY "Couriers can view their offers" ON public.delivery_offers
  FOR SELECT USING (
    auth.uid() = courier_id OR
    EXISTS (
      SELECT 1 FROM public.couriers 
      WHERE id = courier_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage offers" ON public.delivery_offers
  FOR ALL USING (true);

-- Políticas para notifications
CREATE POLICY "Users can view their notifications" ON public.delivery_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.delivery_notifications
  FOR INSERT WITH CHECK (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear notificaciones automáticas
CREATE OR REPLACE FUNCTION notify_delivery_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar al vendedor
  INSERT INTO public.delivery_notifications (delivery_id, user_id, type, message)
  VALUES (
    NEW.id,
    NEW.seller_id,
    NEW.status,
    CASE NEW.status
      WHEN 'assigned' THEN 'Tu pedido ha sido asignado a un repartidor'
      WHEN 'pickup_confirmed' THEN 'El repartidor ha confirmado la recogida'
      WHEN 'en_route' THEN 'Tu pedido está en camino'
      WHEN 'delivered' THEN 'Tu pedido ha sido entregado'
      ELSE 'Estado del pedido actualizado'
    END
  );
  
  -- Notificar al comprador (si existe en orders)
  -- Esto se implementará cuando tengamos la tabla orders
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para notificaciones automáticas
CREATE TRIGGER delivery_status_notifications
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_delivery_update();

-- Función para asignar delivery automáticamente
CREATE OR REPLACE FUNCTION assign_delivery_automatically()
RETURNS TRIGGER AS $$
DECLARE
  available_courier RECORD;
BEGIN
  -- Solo procesar si es un nuevo delivery
  IF NEW.status = 'pending' THEN
    -- Buscar el primer courier disponible
    SELECT * INTO available_courier
    FROM public.couriers
    WHERE is_active = true AND is_available = true
    ORDER BY updated_at ASC
    LIMIT 1;
    
    IF available_courier IS NOT NULL THEN
      -- Crear oferta
      INSERT INTO public.delivery_offers (delivery_id, courier_id, expires_at)
      VALUES (NEW.id, available_courier.id, now() + interval '60 seconds');
      
      -- Actualizar estado del delivery
      UPDATE public.deliveries
      SET status = 'offer_sent'
      WHERE id = NEW.id;
      
      -- Notificar al courier
      INSERT INTO public.delivery_notifications (delivery_id, user_id, type, message)
      VALUES (NEW.id, available_courier.user_id, 'offer', 'Tienes una nueva oferta de delivery');
    ELSE
      -- No hay couriers disponibles
      UPDATE public.deliveries
      SET status = 'no_courier'
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para asignación automática
CREATE TRIGGER auto_assign_delivery
  AFTER INSERT ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION assign_delivery_automatically();




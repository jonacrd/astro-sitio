-- Sistema de Delivery Simple - Solo tablas esenciales
-- Ejecutar en Supabase SQL Editor

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

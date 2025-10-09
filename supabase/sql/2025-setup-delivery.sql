-- SQL para crear tablas de delivery en Supabase
-- Solo ejecutar si DELIVERY_ENABLED=true y se quiere usar Supabase

-- Tabla de repartidores
create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  is_active boolean default true,
  is_available boolean default false,
  last_lat decimal,
  last_lng decimal,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de deliveries
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  seller_id uuid not null references auth.users(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,
  status text not null default 'pending' check (status in (
    'pending', 'offer_sent', 'assigned', 'pickup_confirmed', 
    'en_route', 'delivered', 'no_courier', 'cancelled'
  )),
  pickup_address text not null,
  pickup_lat decimal,
  pickup_lng decimal,
  dropoff_address text not null,
  dropoff_lat decimal,
  dropoff_lng decimal,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de ofertas
create table if not exists public.delivery_offers (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  courier_id uuid not null references public.couriers(id) on delete cascade,
  status text not null default 'offered' check (status in (
    'offered', 'accepted', 'declined', 'expired'
  )),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_couriers_available on public.couriers(is_active, is_available);
create index if not exists idx_deliveries_status on public.deliveries(status);
create index if not exists idx_delivery_offers_delivery on public.delivery_offers(delivery_id);
create index if not exists idx_delivery_offers_courier on public.delivery_offers(courier_id);
create index if not exists idx_delivery_offers_expires on public.delivery_offers(expires_at);

-- RLS Policies
alter table public.couriers enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_offers enable row level security;

-- Políticas para couriers
create policy "Couriers can view their own data" on public.couriers
  for select using (auth.uid() = user_id);

create policy "Couriers can update their own data" on public.couriers
  for update using (auth.uid() = user_id);

create policy "Couriers can insert their own data" on public.couriers
  for insert with check (auth.uid() = user_id);

-- Políticas para deliveries (solo vendedores y repartidores asignados)
create policy "Sellers can view their deliveries" on public.deliveries
  for select using (auth.uid() = seller_id);

create policy "Assigned couriers can view deliveries" on public.deliveries
  for select using (auth.uid() = courier_id);

create policy "System can manage deliveries" on public.deliveries
  for all using (true); -- Para el sistema interno

-- Políticas para ofertas (solo repartidores asignados)
create policy "Couriers can view their offers" on public.delivery_offers
  for select using (auth.uid() = courier_id);

create policy "Couriers can update their offers" on public.delivery_offers
  for update using (auth.uid() = courier_id);

create policy "System can manage offers" on public.delivery_offers
  for all using (true); -- Para el sistema interno

-- Función para actualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
create trigger update_couriers_updated_at before update on public.couriers
  for each row execute function update_updated_at_column();

create trigger update_deliveries_updated_at before update on public.deliveries
  for each row execute function update_updated_at_column();



-- Crear tabla para direcciones de usuario
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    instructions text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON public.user_addresses(is_default);

-- RLS (Row Level Security)
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias direcciones
CREATE POLICY "Users can view own addresses" ON public.user_addresses
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses" ON public.user_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses" ON public.user_addresses
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses" ON public.user_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER set_user_addresses_updated_at
    BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Función para asegurar que solo una dirección sea por defecto
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está marcando como por defecto, quitar el flag de otras direcciones
    IF NEW.is_default = true THEN
        UPDATE public.user_addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asegurar una sola dirección por defecto
CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE ON public.user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_default_address();



-- =============================================
-- FIX SELLER TABLES - CREAR TABLAS FALTANTES
-- =============================================

-- Tabla: sellers
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
    description TEXT CHECK (length(description) <= 500),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
    phone TEXT CHECK (length(phone) >= 8),
    email TEXT CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    address TEXT CHECK (length(address) <= 200),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: seller_products (relación entre sellers y products)
CREATE TABLE IF NOT EXISTS public.seller_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seller_id, product_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers(status);
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id ON public.seller_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_product_id ON public.seller_products(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_active ON public.seller_products(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sellers
CREATE POLICY "Sellers are viewable by everyone" ON public.sellers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own seller profile" ON public.sellers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile" ON public.sellers
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para seller_products
CREATE POLICY "Seller products are viewable by everyone" ON public.seller_products
    FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their own products" ON public.seller_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = seller_products.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_sellers_updated_at
    BEFORE UPDATE ON public.sellers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_seller_products_updated_at
    BEFORE UPDATE ON public.seller_products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();












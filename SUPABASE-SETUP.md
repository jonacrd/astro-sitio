# Configuración de Supabase

## 1. Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Variables de entorno para Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration (opcional)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Modo de datos
DATA_MODE=mock
```

## 2. Obtener las claves de Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Ve a Settings > API
3. Copia:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Crear las tablas en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos por vendedor
CREATE TABLE seller_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  price_cents INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, product_id)
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

CREATE POLICY "Anyone can view seller products" ON seller_products FOR SELECT USING (true);
```

## 4. Ejecutar el seed

Una vez configurado el `.env` y creadas las tablas:

```bash
npm run seed
```

Esto creará:
- 6 usuarios (4 vendedores + 2 compradores)
- 30 productos en múltiples categorías
- Stock asignado a cada vendedor

## 5. Verificar el seed

Puedes verificar en Supabase Dashboard:
- **Authentication > Users**: 6 usuarios creados
- **Table Editor > profiles**: Perfiles de usuarios
- **Table Editor > products**: 30 productos
- **Table Editor > seller_products**: Stock por vendedor

## Credenciales de prueba

### Vendedores:
- **Deli Comidas**: `vendedor.comidas@town.dev` / `Password123!`
- **Mini Abarrotes**: `vendedor.minimarket@town.dev` / `Password123!`
- **Mecánica Express**: `vendedor.mecanica@town.dev` / `Password123!`
- **Tech Store**: `vendedor.tech@town.dev` / `Password123!`

### Compradores:
- **Cliente A**: `cliente.a@town.dev` / `Password123!`
- **Cliente B**: `cliente.b@town.dev` / `Password123!`






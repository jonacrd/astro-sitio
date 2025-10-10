-- Crear tabla para logs de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Crear función para crear la tabla si no existe
CREATE OR REPLACE FUNCTION create_whatsapp_logs_table()
RETURNS void AS $$
BEGIN
  -- La tabla ya se crea arriba, esta función es para compatibilidad
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Política para que solo el service role pueda insertar
CREATE POLICY "Service role can manage whatsapp_logs" ON whatsapp_logs
FOR ALL USING (auth.role() = 'service_role');

-- Índice para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);




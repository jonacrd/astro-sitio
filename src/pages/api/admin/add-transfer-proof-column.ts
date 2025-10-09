import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const instructions = `
# 🔧 Instrucciones para Agregar Columna transfer_proof

## Problema
La columna 'transfer_proof' no existe en la tabla 'orders', causando el error:
"column order.transfer_proof does not exist"

## Solución
Ejecuta este SQL en el Dashboard de Supabase:

## SQL a Ejecutar
\`\`\`sql
-- Verificar si la columna ya existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'transfer_proof';

-- Si no existe, agregarla:
ALTER TABLE orders ADD COLUMN transfer_proof TEXT;

-- Agregar comentario
COMMENT ON COLUMN orders.transfer_proof IS 'Comprobante de transferencia bancaria en formato base64';
\`\`\`

## Pasos:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a SQL Editor
4. Ejecuta el SQL de arriba
5. Verifica que la columna se creó correctamente

## Verificación
Después de ejecutar el SQL, puedes verificar que funciona visitando:
https://astro-sitio.vercel.app/dashboard/pedidos

## Alternativa Rápida
Si tienes acceso a psql o Supabase CLI:
\`\`\`bash
psql -h [HOST] -p 5432 -d postgres -U postgres
ALTER TABLE orders ADD COLUMN transfer_proof TEXT;
\`\`\`
`;

  return new Response(instructions, {
    headers: { 
      'content-type': 'text/plain; charset=utf-8'
    }
  });
};
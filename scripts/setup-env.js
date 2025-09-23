#!/usr/bin/env node

/**
 * Script para configurar las variables de entorno
 * Ejecutar con: node scripts/setup-env.js
 */

import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '.env');

if (existsSync(envPath)) {
  console.log('✅ Archivo .env ya existe');
  process.exit(0);
}

const envContent = `# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_url_here
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Para desarrollo local
NODE_ENV=development
`;

try {
  writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente');
  console.log('📝 Por favor configura las variables de Supabase en el archivo .env');
} catch (error) {
  console.error('❌ Error creando archivo .env:', error.message);
  process.exit(1);
}
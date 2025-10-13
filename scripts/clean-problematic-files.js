#!/usr/bin/env node

/**
 * Script para limpiar archivos problemáticos
 */

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');

// Lista de archivos problemáticos conocidos
const problematicFiles = [
  'src/pages/api/auth/login-simple.ts',
  'src/pages/api/auth/me-simple.ts',
  'src/pages/api/auth/register-simple.ts',
  'src/pages/api/auth/login-universal.ts',
  'src/pages/api/auth/me-universal.ts',
  'src/pages/api/auth/register-universal.ts'
];

// Contenido stub
const stubContent = `import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase Auth. Use /api/auth/supabase endpoints instead.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase Auth. Use /api/auth/supabase endpoints instead.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};
`;

async function cleanProblematicFiles() {
  console.log('🧹 Limpiando archivos problemáticos...');

  for (const filePath of problematicFiles) {
    const fullPath = join(projectRoot, filePath);
    
    if (existsSync(fullPath)) {
      try {
        // Eliminar archivo problemático
        unlinkSync(fullPath);
        console.log(`🗑️  Eliminado: ${filePath}`);
        
        // Crear stub
        writeFileSync(fullPath, stubContent);
        console.log(`✅ Stub creado: ${filePath}`);
      } catch (error) {
        console.log(`❌ Error procesando ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  }

  console.log('🎉 Limpieza completada!');
}

cleanProblematicFiles().catch(console.error);















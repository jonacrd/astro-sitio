#!/usr/bin/env node

/**
 * Script para reemplazar todos los archivos problemáticos con stubs
 */

import { writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');

// Contenido stub para reemplazar archivos problemáticos
const stubContent = `import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase implementation. Please use the new Supabase endpoints.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({
    success: false,
    error: 'This endpoint has been replaced with Supabase implementation. Please use the new Supabase endpoints.'
  }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' }
  });
};
`;

function findProblematicFiles(dir) {
  const problematicFiles = [];
  
  function scanDirectory(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') && !item.includes('supabase') && !item.includes('cart') && !item.includes('search') && !item.includes('feed') && !item.includes('debug')) {
        // Leer el archivo para verificar si tiene imports problemáticos
        try {
          const content = require('fs').readFileSync(fullPath, 'utf8');
          if (content.includes('@lib/session') || 
              content.includes('@lib/db') || 
              content.includes('prisma') || 
              content.includes('bcryptjs') ||
              content.includes('setSession') ||
              content.includes('getUserId') ||
              content.includes('userRepo')) {
            problematicFiles.push(fullPath);
          }
        } catch (error) {
          // Ignorar errores de lectura
        }
      }
    }
  }
  
  scanDirectory(dir);
  return problematicFiles;
}

async function replaceAllProblematic() {
  console.log('🔧 Reemplazando todos los archivos problemáticos...');

  const apiDir = join(projectRoot, 'src/pages/api');
  const problematicFiles = findProblematicFiles(apiDir);

  console.log(`📁 Encontrados ${problematicFiles.length} archivos problemáticos:`);
  problematicFiles.forEach(file => console.log(`  - ${file}`));

  for (const filePath of problematicFiles) {
    try {
      writeFileSync(filePath, stubContent);
      console.log(`✅ Reemplazado: ${filePath}`);
    } catch (error) {
      console.log(`❌ Error reemplazando ${filePath}: ${error.message}`);
    }
  }

  console.log('🎉 Reemplazo completado!');
}

replaceAllProblematic().catch(console.error);






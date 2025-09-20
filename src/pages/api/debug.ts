import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    // Información básica del entorno
    const envInfo = {
      vercel: process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      isVercel,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      databaseUrlStart: process.env.DATABASE_URL?.substring(0, 20) + '...',
    };

    // Intentar conexión a base de datos si estamos en Vercel
    if (isVercel && process.env.DATABASE_URL) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Test básico de conexión
        await prisma.$connect();
        await prisma.$disconnect();
        
        envInfo.dbConnection = 'SUCCESS';
      } catch (dbError) {
        envInfo.dbConnection = 'ERROR';
        envInfo.dbError = dbError.message;
      }
    }

    return new Response(JSON.stringify(envInfo, null, 2), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};


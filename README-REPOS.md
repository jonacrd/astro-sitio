# Sistema de Repositorios - Modo Mock/Prisma

## 🎯 Objetivo

Este proyecto ahora funciona **sin Prisma por defecto** y permite alternar entre modo mock y Prisma según las necesidades de desarrollo.

## 🚀 Inicio Rápido

### Desarrollo Rápido (Modo Mock - Recomendado)

```bash
# 1. Configurar modo mock (ya está configurado por defecto)
echo "DATA_MODE=mock" >> .env

# 2. Iniciar servidor
npm run dev

# 3. Acceder a http://localhost:4321/
```

**✅ Ventajas del modo mock:**
- Sin configuración de base de datos
- Sin errores de Prisma
- Datos de ejemplo precargados
- Desarrollo ultra rápido

### Con Prisma Local

```bash
# 1. Configurar modo Prisma
echo "DATA_MODE=prisma" >> .env
echo "DATABASE_URL=file:./prisma/dev.db" >> .env

# 2. Aplicar migraciones
npx prisma generate
npx prisma db push

# 3. Iniciar servidor
npm run dev
```

### En Vercel (Producción)

```bash
# 1. Configurar variables de entorno en Vercel:
# DATA_MODE=prisma
# DATABASE_URL=postgresql://...

# 2. Deploy automático
```

## 📁 Arquitectura

### Sistema de Repositorios

```
src/lib/repos/
├── index.ts          # Interfaces y carga dinámica
├── mockImpl.ts       # Implementación mock (datos en memoria)
└── prismaImpl.ts     # Implementación Prisma (solo runtime server)
```

### Interfaces Unificadas

- **ProductRepo** - Gestión de productos
- **SellerRepo** - Gestión de vendedores  
- **SellerProductRepo** - Inventario por vendedor
- **UserRepo** - Gestión de usuarios
- **CategoryRepo** - Gestión de categorías

### Datos Mock

Los datos mock se cargan desde `src/data/products.json` y se mantienen en memoria durante la sesión del servidor.

## 🔧 Configuración

### Variables de Entorno

```env
# Modo de datos: 'mock' (por defecto) o 'prisma'
DATA_MODE=mock

# Solo necesario cuando DATA_MODE=prisma
DATABASE_URL=file:./prisma/dev.db
```

### Carga Dinámica

El sistema carga automáticamente la implementación correcta según `DATA_MODE`:

```typescript
// En src/lib/repos/index.ts
if (DATA_MODE === 'prisma') {
  const { prismaProductRepo, ... } = await import('./prismaImpl');
  // Usar implementación Prisma
} else {
  const { mockProductRepo, ... } = await import('./mockImpl');
  // Usar implementación mock
}
```

## 🎯 Funcionalidades

### ✅ Modo Mock (Por Defecto)

- **Sin dependencias de Prisma** en el cliente
- **Datos en memoria** desde `src/data/products.json`
- **Inventario persistente** durante la sesión
- **Funciona sin base de datos**
- **Desarrollo ultra rápido**

### ✅ Modo Prisma

- **Carga dinámica** solo en runtime server
- **Error claro** si falta DATABASE_URL
- **No se importa Prisma** en el cliente
- **Compatible** con PostgreSQL/SQLite

## 🧪 Pruebas

### Verificar Modo Mock

```bash
# 1. Iniciar servidor
npm run dev

# 2. Probar endpoint de búsqueda
curl "http://localhost:4321/api/products/search?q=completo"

# 3. Debería devolver datos mock:
# [{"id":"prod-1","title":"Completo italiano","category":"comida",...}]
```

### Verificar Modo Prisma

```bash
# 1. Cambiar a modo Prisma
echo "DATA_MODE=prisma" > .env

# 2. Configurar base de datos
echo "DATABASE_URL=file:./prisma/dev.db" >> .env

# 3. Aplicar migraciones
npx prisma generate
npx prisma db push

# 4. Iniciar servidor
npm run dev
```

## 🎉 Beneficios Logrados

1. **✅ Desarrollo rápido** - Sin configuración de BD
2. **✅ Sin errores de Prisma** - Modo mock por defecto
3. **✅ Alternancia fácil** - Cambio con variable de entorno
4. **✅ Cliente ligero** - No incluye Prisma en bundle
5. **✅ Compatibilidad** - Funciona en desarrollo y producción
6. **✅ No rompe UI** - Carrito y frontend intactos

## 📋 Estado Actual

- **✅ Sistema de repositorios implementado**
- **✅ Modo mock funcionando**
- **✅ Modo Prisma implementado**
- **✅ Endpoints actualizados**
- **✅ Dashboard funcionando**
- **✅ Sin errores de Prisma en modo mock**
- **✅ ProductCard funcionando correctamente**
- **✅ Datos mock con estructura correcta**
- **✅ Página principal y catálogo funcionando**
- **✅ Sistema de autenticación funcionando**
- **✅ Registro y login de usuarios funcionando**
- **✅ Endpoint de seller profile funcionando**
- **✅ Error JavaScript "btnSeller is not defined" solucionado**

## 🚀 Próximos Pasos

1. **Probar funcionalidades completas** en modo mock
2. **Configurar Prisma** cuando sea necesario
3. **Deploy a Vercel** con modo Prisma
4. **Agregar más datos mock** según necesidades

---

**¡El proyecto ahora arranca en modo mock sin errores de Prisma!** 🎉

# 🔧 Solución: Feed no carga en Desarrollo

## Problema
El feed muestra productos en **producción** pero no en **desarrollo local**.

Error en consola:
```
GET http://localhost:4321/api/feed/simple 500 (Internal Server Error)
GET http://localhost:4321/api/feed/products?page=1&limit=20 500 (Internal Server Error)
Error: TypeError: fetch failed
```

## ✅ Solución Rápida (Probar en orden)

### 1. **Reiniciar el Servidor de Desarrollo**
El cambio más común es que el servidor necesita reiniciarse después de cambios en `.env`:

```bash
# En la terminal donde corre el servidor:
# Presiona Ctrl+C para detener

# Luego reinicia:
npm run dev
```

### 2. **Verificar Versión de Node.js**
Node.js 18+ tiene fetch nativo. Versiones anteriores pueden fallar:

```bash
node --version
```

**Debe ser >= 18.0.0**. Si no, actualiza Node.js:
- Descarga desde: https://nodejs.org/
- O usa nvm: `nvm install 18` y `nvm use 18`

### 3. **Usar el Diagnóstico Automático**
He creado una página que prueba todas las conexiones:

1. Abre en tu navegador: http://localhost:4321/debug-feed
2. El diagnóstico se ejecutará automáticamente
3. Te mostrará exactamente qué está fallando

### 4. **Limpiar Caché y Reinstalar**
Si los pasos anteriores no funcionan:

```bash
# Detener servidor (Ctrl+C)

# Limpiar todo
rm -rf node_modules
rm package-lock.json

# Reinstalar
npm install

# Reiniciar
npm run dev
```

### 5. **Verificar Firewall/Antivirus**
Algunos antivirus bloquean conexiones del servidor de desarrollo a APIs externas:

- Temporalmente desactiva el firewall/antivirus
- Prueba si el feed carga
- Si funciona, agrega excepción para Node.js

## 🔍 Diagnóstico Manual

Si quieres ver exactamente qué está fallando, prueba este endpoint directamente:

```
http://localhost:4321/api/debug/test-connection
```

Te dará un JSON con:
- ✅ Estado de variables de entorno
- ✅ Pruebas de conexión a Supabase
- ✅ Pruebas de consultas a cada tabla
- ✅ Mensajes de error específicos

## 📋 Checklist

- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor de desarrollo reiniciado
- [ ] Node.js versión >= 18
- [ ] No hay errores en el diagnóstico
- [ ] Firewall/antivirus no está bloqueando

## 💡 Por qué funciona en producción

En producción (Vercel):
- Variables de entorno están en la configuración del proyecto
- Node.js actualizado automáticamente
- Red optimizada para APIs
- Sin firewall local

En desarrollo:
- Variables de entorno en archivo `.env` local
- Versión de Node.js del sistema
- Red local puede tener restricciones
- Firewall/antivirus pueden interferir

## 🚀 Siguiente Paso

**Ejecuta el diagnóstico ahora:**

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev

# Luego abre en el navegador:
http://localhost:4321/debug-feed
```

La página te dirá exactamente cuál es el problema y cómo solucionarlo.




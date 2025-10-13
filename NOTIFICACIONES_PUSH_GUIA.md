# 🔔 Guía Completa: Notificaciones Push en Town

## 🚨 PROBLEMAS DETECTADOS

### 1. **iOS NO PREGUNTA POR PERMISOS DE NOTIFICACIONES**

**Causa:** iOS tiene limitaciones severas con notificaciones push en navegadores web.

#### ❌ **Limitaciones de iOS:**
- **Safari en iPhone**: NO soporta Web Push API (no funciona)
- **Chrome/Firefox en iPhone**: Usan el motor de Safari (no funciona)
- **Única opción en iOS**: Instalar como PWA (Progressive Web App)

#### ✅ **Solución para iOS:**

**OPCIÓN 1: Instalar como PWA (Recomendado)**
1. Abrir el sitio en Safari
2. Tocar el botón "Compartir" (icono de flecha hacia arriba)
3. Desplazarse y tocar "Agregar a pantalla de inicio"
4. Abrir la app desde la pantalla de inicio
5. **AHORA SÍ** pedirá permisos de notificaciones

**OPCIÓN 2: Usar notificaciones nativas**
- Implementar push notifications usando un servicio como OneSignal o Firebase
- Requiere desarrollo adicional en iOS

---

### 2. **VENDEDOR NO RECIBE NOTIFICACIÓN DE PEDIDO**

**Posibles causas:**
1. El vendedor no ha activado notificaciones
2. El Edge Function no está configurado correctamente
3. Las claves VAPID no están configuradas
4. El vendedor no está suscrito a notificaciones push

---

## 🔧 PASOS PARA SOLUCIONAR

### **PASO 1: Verificar si el Edge Function está desplegado**

1. Ve a Supabase Dashboard → Edge Functions
2. Busca `send-push-notification`
3. Verifica que esté desplegado y activo

### **PASO 2: Configurar claves VAPID en Supabase**

1. Ve a Supabase Dashboard → Project Settings → Edge Functions
2. Busca la función `send-push-notification`
3. Agrega estos **Secrets**:
   ```
   VAPID_PUBLIC_KEY=BLIN_3ixEukqa9oJeknk549vgbk-1C9DqBNsNgUaCte4SCc7a6xUZv589gIOGr9PHDsBDliy4S87xBRmIoSlrVI
   VAPID_PRIVATE_KEY=[tu clave privada]
   ```

   **⚠️ IMPORTANTE:** La clave privada NUNCA debe exponerse en el código.

### **PASO 3: Verificar tabla push_subscriptions**

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Ver todas las suscripciones
SELECT 
  id,
  user_id,
  subscription->>'endpoint' as endpoint,
  created_at
FROM push_subscriptions
ORDER BY created_at DESC;

-- Ver suscripciones por usuario específico
SELECT * FROM push_subscriptions
WHERE user_id = '[ID_DEL_VENDEDOR]';
```

### **PASO 4: Probar notificación manualmente**

Ejecuta este código en la consola del navegador (como vendedor):

```javascript
// 1. Verificar suscripción
navigator.serviceWorker.ready.then(async (registration) => {
  const subscription = await registration.pushManager.getSubscription();
  console.log('Suscripción:', subscription);
  
  if (subscription) {
    console.log('✅ Estás suscrito a notificaciones');
  } else {
    console.log('❌ NO estás suscrito a notificaciones');
  }
});

// 2. Probar notificación local
navigator.serviceWorker.ready.then((registration) => {
  registration.showNotification('🧪 Prueba de notificación', {
    body: 'Si ves esto, las notificaciones funcionan',
    icon: '/favicon.svg',
    badge: '/favicon.svg'
  });
});
```

---

## 📱 DIAGNÓSTICO AUTOMÁTICO

He agregado un **componente de diagnóstico** en la página principal (esquina inferior derecha).

Este componente muestra:
- ✅/❌ Soporte del navegador
- ✅/❌ Permisos de notificaciones
- ✅/❌ Service Worker registrado
- ✅/❌ Suscripción push activa
- ✅/❌ Suscripción guardada en DB

---

## 🔍 CÓMO ACTIVAR NOTIFICACIONES (USUARIOS)

### **Para Android (Chrome/Firefox/Edge):**
1. Entrar a la página
2. Se mostrará un popup pidiendo permiso para notificaciones
3. Click en "Permitir"
4. ✅ Listo!

### **Para iOS (Safari):**
1. Abrir el sitio en Safari
2. Tocar botón "Compartir" 
3. "Agregar a pantalla de inicio"
4. Abrir la app desde el ícono en la pantalla de inicio
5. Ahora sí aparecerá el popup de permisos
6. Click en "Permitir"
7. ✅ Listo!

### **Para Desktop (Chrome/Firefox/Edge/Safari):**
1. Entrar a la página
2. Se mostrará un popup pidiendo permiso
3. Click en "Permitir"
4. ✅ Listo!

---

## 🧪 CÓMO PROBAR NOTIFICACIONES

### **Escenario 1: Cliente hace un pedido → Vendedor recibe notificación**

1. **Como cliente (navegador normal):**
   - Agregar productos al carrito
   - Ir a checkout
   - Completar datos de entrega
   - Hacer pedido

2. **Como vendedor (debe estar suscrito a notificaciones):**
   - Deberías recibir notificación: "🛒 ¡Nuevo Pedido Recibido!"

### **Escenario 2: Vendedor confirma pedido → Cliente recibe notificación**

1. **Como vendedor:**
   - Ir a `/vendedor/pedidos`
   - Click en un pedido "pending"
   - Click en "Confirmar Pedido"

2. **Como cliente (debe estar suscrito a notificaciones):**
   - Deberías recibir notificación: "✅ ¡Pedido Confirmado!"

### **Escenario 3: Vendedor marca como entregado → Cliente recibe notificación**

1. **Como vendedor:**
   - Ir a `/vendedor/pedidos`
   - Click en un pedido "confirmed"
   - Click en "Marcar como Entregado"

2. **Como cliente:**
   - Deberías recibir notificación: "📦 ¡Tu pedido ha llegado!"

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### **Problema: "No se puede suscribir a notificaciones"**
**Solución:**
1. Verifica que estés usando HTTPS (no HTTP)
2. En localhost, debe ser `https://localhost` o `http://localhost` (sin www)

### **Problema: "Service Worker no se registra"**
**Solución:**
1. Verifica que el archivo `public/sw.js` existe
2. Limpia la caché del navegador (Ctrl+Shift+Delete)
3. Desregistra service workers antiguos:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```
4. Recarga la página

### **Problema: "Notificación no llega al móvil"**
**Solución:**
1. Verifica que el usuario esté suscrito (ver diagnóstico)
2. Verifica que la suscripción esté en la base de datos
3. Verifica que el Edge Function esté desplegado
4. Verifica los logs del Edge Function en Supabase

### **Problema: "iOS no pide permisos"**
**Solución:**
- iOS requiere instalar como PWA (ver arriba)
- No funciona en navegador normal en iOS

---

## 📊 FLUJO TÉCNICO COMPLETO

```
1. Usuario entra al sitio
   ↓
2. Service Worker se registra (sw.js)
   ↓
3. Usuario hace login
   ↓
4. Se pide permiso de notificaciones
   ↓ (si acepta)
5. Se crea suscripción push
   ↓
6. Se guarda en tabla push_subscriptions
   ↓
7. Cuando ocurre un evento (pedido, confirmación, etc.)
   ↓
8. Backend llama a Edge Function send-push-notification
   ↓
9. Edge Function busca suscripciones del usuario
   ↓
10. Edge Function envía notificación push
   ↓
11. Service Worker recibe la notificación
   ↓
12. Service Worker muestra la notificación en el dispositivo
```

---

## 🎯 CHECKLIST FINAL

### **Para que las notificaciones funcionen, TODOS estos deben ser ✅:**

#### **Configuración de Supabase:**
- [ ] Tabla `push_subscriptions` creada
- [ ] Edge Function `send-push-notification` desplegada
- [ ] Secrets `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` configurados
- [ ] APIs de checkout y update orders llaman al Edge Function

#### **Configuración del Frontend:**
- [ ] Service Worker registrado (`/sw.js`)
- [ ] Manifest PWA configurado (`/manifest.json`)
- [ ] VAPID public key en `src/lib/vapid-config.ts`

#### **Para cada usuario (Cliente/Vendedor):**
- [ ] Ha iniciado sesión
- [ ] Ha aceptado permisos de notificaciones
- [ ] Tiene una suscripción activa en `push_subscriptions`

---

## 🆘 SI TODO FALLA

1. **Abre el diagnóstico** (esquina inferior derecha)
2. **Toma captura de pantalla**
3. **Revisa la consola del navegador** (F12)
4. **Revisa los logs del Edge Function** en Supabase
5. **Verifica la tabla `push_subscriptions`** en Supabase

---

## 📝 NOTAS IMPORTANTES

- **iOS**: Solo funciona con PWA instalada, no en navegador
- **Android**: Funciona en todos los navegadores modernos
- **Desktop**: Funciona en Chrome, Edge, Firefox, Safari (macOS 16+)
- **HTTPS**: Requerido en producción (localhost funciona sin HTTPS)
- **Permisos**: Una vez denegados, el usuario debe cambiarlos manualmente en configuración del navegador









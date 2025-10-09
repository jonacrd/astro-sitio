# 🔑 CONFIGURACIÓN DE ONESIGNAL

## PASOS PARA CONFIGURAR:

### 1. Crear archivo `.env` en la carpeta `astro-sitio`

Crea un archivo llamado `.env` (sin extensión, solo `.env`) en la raíz de `astro-sitio/` con este contenido:

```env
# OneSignal Push Notifications
PUBLIC_ONESIGNAL_APP_ID=270896d8-ba2e-40bc-8f3b-c1e6efd258a1
ONESIGNAL_REST_API_KEY=os_v2_app_e4ejnwf2fzalzdz3yhto7usyusef5yk3avlcu4umoy7adwyxujdr7kerrk7mfe6myvfiv3762hga7e7xbzxu2zhanilwfo2gtmsl5rga

# Supabase (si no las tienes ya)
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 2. En Vercel (para producción)

Cuando subas el proyecto a Vercel, agrega estas variables de entorno:

- `PUBLIC_ONESIGNAL_APP_ID` = `270896d8-ba2e-40bc-8f3b-c1e6efd258a1`
- `ONESIGNAL_REST_API_KEY` = `os_v2_app_e4ejnwf2fzalzdz3yhto7usyusef5yk3avlcu4umoy7adwyxujdr7kerrk7mfe6myvfiv3762hga7e7xbzxu2zhanilwfo2gtmsl5rga`

### 3. En OneSignal

#### Configurar Web Platform:
1. Ve a **Settings** → **Platforms**
2. Click en **Web**
3. Configura:
   - **Site Name**: `Town`
   - **Site URL (development)**: `http://localhost:4321`
   - **Site URL (production)**: Tu URL de Vercel
   - **Auto Resubscribe**: ON
   - **Default Icon**: Sube tu logo o pon la URL

4. Click en **Save**

### 4. Probar Notificaciones

1. Abre el proyecto: `http://localhost:4321`
2. OneSignal te pedirá permiso para notificaciones → **Acepta**
3. Inicia sesión como **vendedor**
4. En otra ventana (incógnito), inicia sesión como **comprador**
5. Haz un pedido
6. El **vendedor** debería recibir una notificación en el navegador 🔔

---

## ✅ LISTO
Una vez que crees el archivo `.env` con estas claves, reinicia el servidor de desarrollo.





# Sistema de Avatares por Género y Tipo de Usuario

## 📋 Resumen

Este sistema muestra avatares personalizados según el tipo de usuario (comprador/vendedor) y su género, con imágenes por defecto para aquellos que aún no han configurado una foto de perfil.

## 🎨 Iconos Disponibles

Los iconos se encuentran en `/public/`:

- **`male-icon.png`**: Avatar por defecto para usuarios masculinos
- **`female-icon.png`**: Avatar por defecto para usuarios femeninos
- **`store-icon.png`**: Avatar por defecto para vendedores/tiendas

## 🔄 Lógica de Selección de Avatar

La función `getUserAvatar()` en `src/lib/avatar-utils.ts` sigue esta prioridad:

1. **Avatar personalizado**: Si el usuario tiene `avatar_url` configurado, se usa ese.
2. **Avatar de Google**: Si el usuario inició sesión con Google y tiene `picture` en metadata, se usa ese.
3. **Avatar por defecto**:
   - **Vendedor** (`is_seller = true`) → `store-icon.png`
   - **Género femenino** → `female-icon.png`
   - **Género masculino** → `male-icon.png`
   - **Sin género** → `male-icon.png` (por defecto)

## 📊 Campo `gender` en la Base de Datos

### Estructura

```sql
-- Tabla: profiles
gender VARCHAR(20) NULL
```

### Valores válidos

- `'male'` / `'m'` / `'hombre'` / `'masculino'` → Avatar masculino
- `'female'` / `'f'` / `'mujer'` / `'femenino'` → Avatar femenino
- `NULL` / `''` → Avatar masculino (por defecto)

### Sincronización con Google

Si el usuario inicia sesión con Google, el sistema sincroniza automáticamente el campo `gender` desde `user_metadata.gender`:

**Archivo**: `BaseLayout.astro`
**Función**: `syncUserGender()`

Esta función:
1. Se ejecuta al cargar cualquier página
2. Verifica si el usuario tiene `user_metadata.gender`
3. Actualiza `profiles.gender` automáticamente

```javascript
const googleGender = user.user_metadata?.gender;

if (googleGender) {
  await supabase
    .from('profiles')
    .update({ gender: googleGender })
    .eq('id', user.id);
}
```

## 📂 Componentes Actualizados

### `SimpleAuthButton.tsx`

El botón de autenticación en el header ahora muestra:
- Avatar del usuario (imagen circular)
- Si es vendedor: `store-icon.png`
- Si es comprador: `male-icon.png` o `female-icon.png` según género

**Cambios**:
- Se carga `avatar_url`, `is_seller`, `gender` desde `profiles`
- Se usa `getUserAvatar()` para determinar la imagen correcta
- Se agregó `onError` para fallback a `/male-icon.png`

```tsx
<img 
  src={avatarUrl} 
  alt="Avatar" 
  className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
  onError={(e) => {
    e.currentTarget.src = '/male-icon.png';
  }}
/>
```

### `perfil.astro`

La página de perfil ahora:
- Carga `avatar_url`, `gender`, `is_seller` desde `profiles`
- Usa `getUserAvatar()` para mostrar el avatar correcto
- Incluye fallback si la imagen no carga

**Cambios**:
```javascript
const avatarUrl = getUserAvatar({
  avatar_url: profile.avatar_url,
  is_seller: profile.is_seller,
  gender: profile.gender,
  raw_user_meta_data: user.user_metadata
});
avatarElement.src = avatarUrl;
```

## 🚀 Despliegue

### 1. Ejecutar el script SQL

Ejecuta el script en el SQL Editor de Supabase:

```bash
astro-sitio/actualizar-gender-google.sql
```

Esto agregará la columna `gender` a la tabla `profiles` si no existe.

### 2. Subir los iconos

Asegúrate de que estos archivos existan en `/public/`:
- `male-icon.png`
- `female-icon.png`
- `store-icon.png`

### 3. Desplegar cambios

```bash
git add .
git commit -m "Implementar sistema de avatares por género y tipo de usuario"
git push origin main
```

## 🧪 Pruebas

### Caso 1: Usuario nuevo con Google (masculino)
1. Registrarse con Google (cuenta masculina)
2. El sistema sincroniza `gender = 'male'` automáticamente
3. El avatar debe ser `male-icon.png`

### Caso 2: Usuario nuevo con Google (femenino)
1. Registrarse con Google (cuenta femenina)
2. El sistema sincroniza `gender = 'female'` automáticamente
3. El avatar debe ser `female-icon.png`

### Caso 3: Vendedor sin foto
1. Un vendedor (`is_seller = true`) sin `avatar_url`
2. El avatar debe ser `store-icon.png`

### Caso 4: Usuario con avatar personalizado
1. Un usuario que configuró su `avatar_url`
2. El avatar debe ser su imagen personalizada
3. El género no afecta porque la imagen personalizada tiene prioridad

## 📝 Notas Técnicas

### Metadatos de Google OAuth

Cuando un usuario inicia sesión con Google, Supabase almacena información en `user_metadata`:

```json
{
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "email": "user@example.com",
  "email_verified": true,
  "full_name": "John Doe",
  "iss": "https://accounts.google.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "provider_id": "123456789...",
  "sub": "123456789...",
  "gender": "male"  // Este campo solo existe si Google lo provee
}
```

⚠️ **Importante**: No todos los usuarios de Google tienen `gender` en sus metadatos. Solo aquellos que configuraron su género en su perfil de Google.

### Orden de prioridad de imágenes

1. `avatar_url` (foto personalizada del usuario)
2. `raw_user_meta_data.picture` (foto de Google)
3. `raw_user_meta_data.avatar_url` (foto de Google, campo alternativo)
4. Avatar por defecto según `is_seller` y `gender`

## 🔧 Mantenimiento

### Actualizar manualmente el género de un usuario

Si necesitas actualizar el género de un usuario manualmente:

```sql
UPDATE profiles 
SET gender = 'female' 
WHERE id = 'usuario-uuid-aqui';
```

### Ver usuarios sin género definido

```sql
SELECT 
  p.id,
  p.name,
  p.email,
  p.is_seller,
  p.gender,
  p.avatar_url
FROM profiles p
WHERE p.gender IS NULL OR p.gender = '';
```

### Forzar re-sincronización para todos los usuarios

Puedes crear un script de migración que recorra todos los usuarios con `raw_user_meta_data.gender` y actualice `profiles.gender`.

## 🐛 Troubleshooting

### Avatar no se actualiza
- **Limpia el caché del navegador** (Ctrl+F5)
- **Verifica que el archivo PNG existe** en `/public/`
- **Revisa la consola** para errores de carga de imagen

### Gender siempre es NULL
- **Verifica que la columna existe**: `SELECT gender FROM profiles LIMIT 1;`
- **Verifica que Google provee el gender**: Mira `user_metadata` en Supabase Dashboard
- **Ejecuta manualmente**: `UPDATE profiles SET gender = 'male' WHERE id = 'user-id';`

### Store icon no aparece para vendedores
- **Verifica `is_seller`**: `SELECT id, name, is_seller FROM profiles WHERE is_seller = true;`
- **Asegúrate de que el componente carga `is_seller`** desde la base de datos

## 📚 Referencias

- `src/lib/avatar-utils.ts` - Utilidades para obtener avatares
- `src/components/react/SimpleAuthButton.tsx` - Botón de autenticación con avatar
- `src/pages/perfil.astro` - Página de perfil con avatar
- `src/layouts/BaseLayout.astro` - Script de sincronización de género
- `actualizar-gender-google.sql` - Script de migración SQL

---

✅ **Sistema implementado y listo para producción**








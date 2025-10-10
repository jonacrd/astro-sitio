# 🤖 Cómo Activar la IA en la Búsqueda

## Estado Actual
La búsqueda inteligente con IA está **totalmente implementada** pero requiere una clave de OpenAI para funcionar al 100%.

## Sin IA configurada (modo actual):
- ✅ Búsqueda básica por texto funciona
- ✅ Corrección local de ~50 errores comunes
- ✅ Búsqueda por categorías
- ❌ Sin análisis semántico avanzado
- ❌ Sin sugerencias inteligentes

## Con IA configurada:
- ✅ Todo lo anterior +
- ✅ Corrección inteligente de cualquier error
- ✅ Sugerencias de categorías relacionadas
- ✅ Entendimiento de intenciones
- ✅ Búsqueda semántica avanzada
- ✅ Sinónimos y variaciones automáticas

## 🔧 Pasos para Activar:

### 1. Obtén una clave de OpenAI
1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva clave API
5. Copia la clave (empieza con `sk-`)

### 2. Configura las variables de entorno

Opción A - Desarrollo Local:
```bash
# Crea un archivo .env en la raíz del proyecto astro-sitio
cd astro-sitio
cp env.openai.example .env
```

Luego edita `.env` y agrega tu clave:
```env
OPENAI_API_KEY=sk-tu-clave-real-aqui
OPENAI_MODEL=gpt-4o-mini
```

Opción B - Producción (Vercel):
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-tu-clave-real-aqui`
4. Redeploy

### 3. Reinicia el servidor
```bash
npm run dev
```

### 4. Prueba la búsqueda
- Escribe "peeros" → debería corregir a "perros calientes"
- Escribe "piza" → debería corregir a "pizza"
- Debería sugerir categorías relacionadas automáticamente

## 💰 Costo aproximado
- Modelo: GPT-4o-mini (muy económico)
- ~$0.0001 por búsqueda
- 1000 búsquedas ≈ $0.10 USD

## 🔍 Verificar si está funcionando
Abre la consola del navegador (F12) y busca algo. Deberías ver:
```
🤖 Búsqueda con IA: tu_búsqueda
🤖 IA procesó búsqueda: { original, corrected, intent, relatedCategories }
```

Si ves esto, ¡la IA está funcionando! 🎉

## 🚨 Sin clave de OpenAI
El sistema seguirá funcionando con búsqueda básica + corrección local.
No mostrará errores, solo funcionalidad reducida.




# 🔧 Guía para Obtener Token Permanente de WhatsApp

## 🎯 **PROBLEMA ACTUAL:**
- Solo tienes **token temporal** (90 días)
- **Limitaciones de sandbox** - Solo plantillas básicas
- **Números limitados** - Solo números verificados

## ✅ **SOLUCIÓN: Token Permanente**

### **PASO 1: Publicar tu App en Meta**

1. **Ve a:** [Meta for Developers](https://developers.facebook.com/)
2. **Selecciona tu app** de WhatsApp Business
3. **Ve a:** App Review > Permissions and Features
4. **Solicita permisos** para:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. **Completa el proceso** de revisión de Meta

### **PASO 2: Obtener Token Permanente**

Una vez que Meta apruebe tu app:
1. **Ve a:** WhatsApp > API Setup
2. **Genera token permanente** (no temporal)
3. **Copia el token** y Phone Number ID

### **PASO 3: Configurar en tu App**

1. **Ve a:** `/configure-permanent-token`
2. **Pega tu token permanente**
3. **Pega tu Phone Number ID**
4. **Prueba las plantillas**

### **PASO 4: Actualizar Variables de Entorno**

```bash
# En tu archivo .env
WHATSAPP_TOKEN=tu_token_permanente_aqui
WHATSAPP_PHONE_ID=tu_phone_number_id_aqui
```

### **PASO 5: Deploy a Producción**

```bash
git add .
git commit -m "Configurar token permanente WhatsApp"
git push origin main
```

## 🔍 **VERIFICACIÓN:**

### **Token Temporal vs Permanente:**
- **Temporal:** `EAA1Dzgz00SIBPukOaVGjPZAilsypFebOSp2c5cKlZB0XdQ2P7Xq8jdISXCCZBSm7QjLoPpVwbDM3KpzKNBhYdT6yoKAH8EgMJxx9hIvMi5RZA3Xe56ylG8mf7PEnlkfmcwNZCvAoDRRNUA56CHGPGvZAfnc0yEDLjAIcyagUZBAB7EZAXROs4PYtNutBlNjySOWYZApNt7rDOSYw0mVvJi7XDGA4P29mVl8yoZB0zeXbVunDG99pq6XjaIiZA5B`
- **Permanente:** `EAA1Dzgz00SIBPoF0a7b4z6UO3QTisGPYRatPPFs4TPAI94wNieiwCaJZCDRyGkz2344JCZBSj1PhQUUZAuaxwMYa1x2vg39gDolOLiNgzYdysPfqZC5FyQlvQRqcM8wXtGdZB0pckDg7vO2Ta20yDitbwlhCZAybU8zpb0uKOZAdWvGufFLfwu5d6r85OIPscH3nWx4PaptKLKuHATVjvPJWY6rIa0zMXVhVSN4GAy0GstvJKZBtCzSZADGoZD`

### **Plantillas Disponibles:**
- ✅ `hello_world` - Básica (temporal y permanente)
- ✅ `order_management_1` - Para vendedor (solo permanente)
- ✅ `order_confirmed` - Para comprador (solo permanente)
- ✅ `order_on_the_way` - En camino (solo permanente)
- ✅ `order_delivered` - Entregado (solo permanente)

## 🚀 **PRÓXIMOS PASOS:**

1. **Solicita revisión** en Meta for Developers
2. **Espera aprobación** (puede tomar días)
3. **Genera token permanente**
4. **Configura en tu app**
5. **Prueba plantillas personalizadas**

## 📞 **SOPORTE:**

Si necesitas ayuda con el proceso de Meta:
- **Documentación:** [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- **Soporte:** [Meta for Developers Support](https://developers.facebook.com/support/)

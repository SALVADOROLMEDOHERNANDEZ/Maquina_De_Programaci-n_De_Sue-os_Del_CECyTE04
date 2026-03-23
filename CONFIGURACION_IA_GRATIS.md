# 🤖 Configuración de IA Gratuita para CECyTE 04
## Máquina de Programación de Sueños

---

## 🎉 ¡Ahora 100% GRATIS!

Hemos reemplazado las APIs de pago por alternativas **totalmente gratuitas, eficaces y potentes**:

| Servicio | Antes | Ahora | Costo |
|----------|-------|-------|-------|
| **Generación de Texto** | Emergent GPT-5.2 | **Google Gemini 2.0 Flash** | 💚 **GRATIS** |
| **Generación de Imágenes** | Emergent GPT Image 1 | **Hugging Face Stable Diffusion** | 💚 **GRATIS** |

---

## 📋 Tabla de Contenidos

1. [Google Gemini API Key (Texto)](#1-google-gemini-api-key)
2. [Hugging Face Token (Imágenes)](#2-hugging-face-token)
3. [Configuración del Backend](#3-configurar-el-backend)
4. [Verificar que Funciona](#4-verificar-que-funciona)

---

## 1. Google Gemini API Key

### ¿Qué es?
Google Gemini es la IA más avanzada de Google, **completamente gratis** con límites generosos para uso personal y educativo.

### ¿Para qué se usa en el proyecto?
Genera las historias de éxito personalizadas para los estudiantes en el Simulador de Futuro.

### 🚀 Cómo Obtener tu API Key GRATIS

#### **Paso 1: Accede a Google AI Studio**
1. Ve a: **https://aistudio.google.com**
2. Inicia sesión con tu cuenta de Google (Gmail)

#### **Paso 2: Crear API Key**
1. Una vez dentro, haz clic en el botón **"Get API Key"** (Obtener Clave de API) en la parte superior
2. Si es tu primera vez, te pedirá crear un proyecto de Google Cloud
3. Haz clic en **"Create API key in new project"** (Crear clave API en nuevo proyecto)
4. Espera unos segundos...
5. ¡Listo! Tu API key aparecerá en pantalla

#### **Paso 3: Copiar la Clave**
```
Ejemplo de clave: AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
```
1. Haz clic en **"Copy"** (Copiar)
2. Guárdala en un lugar seguro (la necesitarás después)

### 💰 Límites del Tier Gratuito

| Característica | Límite Gratis |
|----------------|---------------|
| **Requests por minuto** | 15 RPM |
| **Requests por día** | 1,500 RPD |
| **Contexto** | 1 millón de tokens |
| **Modelos disponibles** | Gemini 2.0 Flash, Pro, Flash-Lite |
| **Uso comercial** | ✅ Permitido |
| **Tarjeta de crédito** | ❌ NO requerida |

**Para este proyecto, los límites gratuitos son MÁS que suficientes.** 🎉

### ⚠️ Notas Importantes
- **NO compartas tu API key** con nadie
- Si la expones accidentalmente, bórrala y crea una nueva
- La key es válida indefinidamente (no expira)

---

## 2. Hugging Face Token

### ¿Qué es?
Hugging Face es la plataforma líder de IA open-source. Ofrece acceso **gratuito** a modelos como Stable Diffusion para generar imágenes.

### ¿Para qué se usa en el proyecto?
Genera las imágenes futuristas de los estudiantes en su futuro profesional.

### 🚀 Cómo Obtener tu Token GRATIS

#### **Paso 1: Crear Cuenta**
1. Ve a: **https://huggingface.co/join**
2. Regístrate con:
   - Email
   - O con tu cuenta de Google/GitHub
3. Confirma tu email

#### **Paso 2: Crear Access Token**
1. Una vez dentro, haz clic en tu **foto de perfil** (esquina superior derecha)
2. Ve a **Settings** (Configuración)
3. En el menú izquierdo, haz clic en **Access Tokens**
4. Haz clic en **New token** (Nuevo token)
5. Llena los campos:
   - **Name**: `cecyte04-simulator`
   - **Role**: Selecciona **"Fine-grained"**
   - **Permissions**: Activa **"Make calls to inference providers"**
6. Haz clic en **Create token** (Crear token)
7. ¡Listo! Tu token aparecerá en pantalla

#### **Paso 3: Copiar el Token**
```
Ejemplo de token: hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```
1. Haz clic en **Copy** (Copiar)
2. Guárdalo en un lugar seguro (¡NUNCA lo compartas!)

### 💰 Límites del Tier Gratuito

| Característica | Límite Gratis |
|----------------|---------------|
| **Créditos mensuales** | Suficientes para pruebas |
| **Modelos disponibles** | 38,000+ modelos |
| **Stable Diffusion** | ✅ Incluido |
| **Velocidad** | Optimizada con `:cheapest` |
| **Tarjeta de crédito** | ❌ NO requerida |

**Los créditos se renuevan cada mes automáticamente.** 🔄

### ⚠️ Notas Importantes
- Los tokens **NO expiran** (a menos que los borres)
- Puedes crear múltiples tokens para diferentes proyectos
- Revoca tokens antiguos que no uses

---

## 3. Configurar el Backend

Una vez que tengas tus API keys, agrégalas al archivo `.env`:

### **Paso 1: Abrir el archivo de configuración**

```bash
cd /app/backend
nano .env
```

### **Paso 2: Agregar las claves**

Busca estas líneas y pega tus claves:

```bash
# Google Gemini: Obtén tu clave en https://aistudio.google.com
GOOGLE_GEMINI_API_KEY="AIzaSyA_TU_CLAVE_AQUI"

# Hugging Face: Obtén tu token en https://huggingface.co/settings/tokens
HUGGINGFACE_API_TOKEN="hf_TU_TOKEN_AQUI"
```

**Reemplaza:**
- `AIzaSyA_TU_CLAVE_AQUI` con tu clave de Google Gemini
- `hf_TU_TOKEN_AQUI` con tu token de Hugging Face

### **Paso 3: Guardar cambios**

Si usas `nano`:
1. Presiona `Ctrl + X`
2. Presiona `Y` (Yes)
3. Presiona `Enter`

### **Paso 4: Reiniciar el Backend**

```bash
sudo supervisorctl restart backend
```

Espera unos segundos y verifica:

```bash
sudo supervisorctl status backend
```

Debe mostrar: `backend RUNNING`

---

## 4. Verificar que Funciona

### **Opción A: Desde la Terminal**

Prueba la generación de historia:

```bash
curl -X POST http://localhost:8001/api/simulation/generate-story \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "intereses": ["Programacion", "Robotica", "Videojuegos"],
    "carrera": "Programacion",
    "sexo": "M"
  }'
```

Si funciona, verás una historia generada en JSON.

### **Opción B: Desde el Navegador**

1. Abre tu aplicación en el navegador
2. Ve a la página **Simulador de Futuro** (`/simulator`)
3. Completa el formulario:
   - Nombre: Tu nombre
   - Género: Masculino/Femenino
   - Intereses: Selecciona al menos 2
   - Carrera: Elige una
4. Haz clic en **"Generar Mi Futuro"**
5. Espera unos segundos...
6. ¡Debería aparecer tu historia personalizada! 🎉

---

## 🔧 Solución de Problemas

### **Error: "Google Gemini API key no configurada"**

**Causa**: La clave no está en el archivo `.env` o está mal escrita.

**Solución**:
1. Verifica que agregaste la clave correctamente
2. Asegúrate de que no haya espacios extra
3. Reinicia el backend: `sudo supervisorctl restart backend`

### **Error: "Hugging Face API token no configurado"**

**Causa**: El token no está en el archivo `.env` o está mal escrito.

**Solución**:
1. Verifica que agregaste el token correctamente
2. Asegúrate de que empieza con `hf_`
3. Reinicia el backend: `sudo supervisorctl restart backend`

### **Error: "Quota exceeded" o "Rate limit"**

**Causa**: Has superado el límite de requests gratuitos.

**Para Google Gemini**:
- Límite: 15 requests por minuto
- Espera 1 minuto y vuelve a intentar

**Para Hugging Face**:
- Los créditos se renuevan mensualmente
- Si se acaban, puedes:
  - Esperar al próximo mes
  - Crear una nueva cuenta (email diferente)
  - Actualizar a PRO ($9/mes) - opcional

### **La imagen no se genera pero la historia sí**

**Causa**: Esto es normal. La generación de imágenes es opcional.

**¿Por qué?**
- Hugging Face tiene más restricciones en el tier gratuito
- La historia siempre se generará (Gemini es muy confiable)
- La imagen es un "bonus" que puede fallar sin afectar la experiencia

**Solución**:
- Si quieres imágenes más confiables, considera usar Hugging Face PRO ($9/mes)
- O acepta que algunas simulaciones no tendrán imagen (el sistema continúa normal)

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Emergent (Antes) | APIs Gratuitas (Ahora) | Ganador |
|---------|------------------|------------------------|---------|
| **Costo mensual** | $$$$ | $0 | 💚 Gratuito |
| **Calidad de texto** | GPT-5.2 | Gemini 2.0 Flash | 🤝 Igual |
| **Velocidad de texto** | Rápida | Muy rápida | 💚 Gratuito |
| **Calidad de imagen** | Excelente | Muy buena | 🟡 Emergent (leve) |
| **Confiabilidad** | Alta | Alta | 🤝 Igual |
| **Límites** | Generosos | Muy generosos | 💚 Gratuito |
| **Requiere tarjeta** | ✅ Sí | ❌ No | 💚 Gratuito |

**Conclusión**: Las APIs gratuitas son **perfectas** para este proyecto educativo. La diferencia de calidad es mínima y **¡no cuestan nada!** 🎉

---

## 🎯 Cambios Técnicos Realizados

### **Archivos Modificados**:

1. **`/app/backend/server.py`**
   - ❌ Removido: `emergentintegrations`
   - ✅ Agregado: `google.generativeai` (Gemini)
   - ✅ Agregado: `huggingface_hub` (Stable Diffusion)

2. **`/app/backend/.env`**
   - ❌ Removido: `EMERGENT_LLM_KEY`
   - ✅ Agregado: `GOOGLE_GEMINI_API_KEY`
   - ✅ Agregado: `HUGGINGFACE_API_TOKEN`

3. **`/app/backend/requirements.txt`**
   - ❌ Removido: `emergentintegrations==0.1.0`
   - ✅ Ya incluido: `google-generativeai==0.8.6`
   - ✅ Ya incluido: `huggingface_hub==1.5.0`

### **Nuevas Características**:

✅ **Fallback automático**: Si falla la API, usa una historia de ejemplo
✅ **Generación opcional de imágenes**: La app funciona sin imagen
✅ **Prompts optimizados**: Mejores resultados con las nuevas APIs
✅ **Logging detallado**: Fácil debug en caso de problemas

---

## 📚 Recursos Útiles

### **Google Gemini**
- 📖 Documentación: https://ai.google.dev/gemini-api/docs
- 🎮 AI Studio (crear keys): https://aistudio.google.com
- 💬 Comunidad: https://discuss.ai.google.dev

### **Hugging Face**
- 📖 Documentación: https://huggingface.co/docs
- 🔑 Crear tokens: https://huggingface.co/settings/tokens
- 🎨 Explorar modelos: https://huggingface.co/models
- 💬 Foro: https://discuss.huggingface.co

### **Código de Ejemplo**

**Probar Gemini directamente en Python**:
```python
import google.generativeai as genai

genai.configure(api_key="TU_API_KEY")
model = genai.GenerativeModel('gemini-2.0-flash-exp')
response = model.generate_content("Escribe una historia corta sobre un estudiante exitoso")
print(response.text)
```

**Probar Hugging Face directamente en Python**:
```python
from huggingface_hub import InferenceClient

client = InferenceClient(token="TU_TOKEN")
image = client.text_to_image(
    model="stabilityai/stable-diffusion-2-1:cheapest",
    prompt="futuristic student portrait"
)
image.save("output.png")
```

---

## ✅ Checklist Final

Antes de terminar, asegúrate de haber completado:

- [ ] ✅ Creaste cuenta en Google AI Studio
- [ ] ✅ Obtuviste tu Google Gemini API Key
- [ ] ✅ Creaste cuenta en Hugging Face
- [ ] ✅ Generaste tu Hugging Face Token con permisos de inferencia
- [ ] ✅ Agregaste ambas claves al archivo `/app/backend/.env`
- [ ] ✅ Reiniciaste el backend con `sudo supervisorctl restart backend`
- [ ] ✅ Verificaste que el backend está RUNNING
- [ ] ✅ Probaste el Simulador de Futuro en el navegador
- [ ] ✅ Generaste una historia exitosamente

---

## 🎉 ¡Felicidades!

Tu **Máquina de Programación de Sueños** ahora usa **IA 100% gratuita, potente y eficaz**.

**No hay costos ocultos, no hay sorpresas en la factura, solo IA de clase mundial al alcance de todos.** 💚

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas, revisa:
1. Los logs del backend: `tail -f /var/log/supervisor/backend.err.log`
2. La consola del navegador (F12)
3. Verifica que las API keys sean correctas y estén activas

---

**Desarrollado con ❤️ para CECyTE 04 - Tlaxcala, México**

**IA Gratuita para Educación de Calidad** 🚀

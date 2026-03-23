# 🚀 Guía de Instalación Completa - Máquina de Programación de Sueños CECyTE 04

## 📋 Requisitos Previos

### Software necesario:
- **Node.js** v18+ (v20.20.0 recomendado) - [Descargar](https://nodejs.org/)
- **Python** 3.9+ (3.11 recomendado) - [Descargar](https://python.org/)
- **MongoDB** 6.0+ - [Descargar](https://mongodb.com/try/download/community)
- **Git** - [Descargar](https://git-scm.com/)
- **Yarn** - Instalación: `npm install -g yarn`

### API Keys GRATUITAS (Necesarias para el Simulador de Futuro):
- **Google Gemini API Key** - [Obtener gratis](https://aistudio.google.com)
- **Hugging Face Token** - [Obtener gratis](https://huggingface.co/settings/tokens)

> 📘 **Nota:** Este proyecto usa IA 100% gratuita (Google Gemini + Hugging Face)

---

## 🎯 Instalación Rápida (Copy-Paste)

### Para Linux/Mac:

```bash
# Clonar repositorio
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p uploads/models

# Frontend (en otra terminal)
cd frontend
yarn install --ignore-engines

# Iniciar servicios (2 terminales)
# Terminal 1 (Backend):
cd backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 (Frontend):
cd frontend && yarn start
```

### Para Windows:

```bash
# Clonar repositorio
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
mkdir uploads\models

# Frontend (en otra terminal)
cd frontend
yarn install --ignore-engines

# Iniciar servicios (2 terminales)
# Terminal 1 (Backend):
cd backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 (Frontend):
cd frontend && yarn start
```

---

## 📥 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04
```

---

## 🔧 Paso 2: Configurar el Backend (Python/FastAPI)

### 2.1 Crear entorno virtual

**Linux/Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

### 2.2 Instalar dependencias

```bash
pip install -r requirements.txt
```

**Tiempo estimado:** 2-3 minutos

### 2.3 Crear carpeta para modelos 3D

**Linux/Mac:**
```bash
mkdir -p uploads/models
```

**Windows:**
```bash
mkdir uploads\models
```

### 2.4 Configurar variables de entorno

**Opción A - Crear archivo `.env` manualmente:**

Crea el archivo `backend/.env` y pega este contenido:

```env
# MongoDB (Local)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cecyte04_dreams"
CORS_ORIGINS="*"

# ═══════════════════════════════════════════════════════
# API KEYS GRATUITAS (¡Obligatorio para IA!)
# ═══════════════════════════════════════════════════════

# Google Gemini (Para generación de historias) - GRATIS
# Obtener en: https://aistudio.google.com
GOOGLE_GEMINI_API_KEY=""

# Hugging Face (Para generación de imágenes) - GRATIS
# Obtener en: https://huggingface.co/settings/tokens
HUGGINGFACE_API_TOKEN=""

# ═══════════════════════════════════════════════════════
# Credenciales de Admin
# ═══════════════════════════════════════════════════════
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="cecyte04admin"
ADMIN_EMAILS="olmedohernandezsalvador@gmail.com"

# ═══════════════════════════════════════════════════════
# Servicios Opcionales (SendGrid y Twilio)
# ═══════════════════════════════════════════════════════

# SendGrid (Opcional - para envío de emails)
SENDGRID_API_KEY=""
SENDER_EMAIL=""

# Twilio (Opcional - para WhatsApp)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""
```

**Opción B - Usar comando (Linux/Mac):**

```bash
cd backend
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cecyte04_dreams"
CORS_ORIGINS="*"

# API Keys Gratuitas (Agregar después)
GOOGLE_GEMINI_API_KEY=""
HUGGINGFACE_API_TOKEN=""

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="cecyte04admin"
ADMIN_EMAILS="olmedohernandezsalvador@gmail.com"

SENDGRID_API_KEY=""
SENDER_EMAIL=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""
EOF
```

> ⚠️ **IMPORTANTE:** Debes agregar tus API keys gratuitas después. Ver [Paso 6](#-paso-6-obtener-api-keys-gratuitas-obligatorio).

---

## 🎨 Paso 3: Configurar el Frontend (React)

### 3.1 Instalar dependencias

```bash
cd ../frontend
yarn install --ignore-engines
```

> **Nota:** Usamos `--ignore-engines` debido a que `camera-controls` requiere Node 22+, pero funciona perfectamente con Node 20.

**Tiempo estimado:** 3-5 minutos

### 3.2 Verificar archivo `.env` (Ya existe)

El archivo `frontend/.env` ya existe con la configuración correcta:

```bash
cat frontend/.env
```

Debe contener:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Para producción**, cambia la URL:
```env
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

---

## 🗄️ Paso 4: Configurar MongoDB

### 4.1 Iniciar MongoDB

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Iniciar automáticamente
```

**Mac:**
```bash
brew services start mongodb-community
```

**Windows:**
- MongoDB se inicia automáticamente si lo instalaste como servicio
- O busca "MongoDB Compass" y conéctate a `mongodb://localhost:27017`

### 4.2 Verificar conexión

```bash
mongosh
```

Deberías ver:
```
test>
```

Escribe `exit` para salir.

---

## ▶️ Paso 5: Ejecutar el Proyecto

### 5.1 Iniciar el Backend

**Terminal 1 (Backend):**

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Windows:**
```bash
cd backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Salida esperada:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Backend disponible en:** `http://localhost:8001`

### 5.2 Iniciar el Frontend

**Terminal 2 (Frontend):**

```bash
cd frontend
yarn start
```

**Salida esperada:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://10.x.x.x:3000
```

✅ **Frontend disponible en:** `http://localhost:3000`

### 5.3 Verificar que todo funciona

**1. Verificar Backend:**
```bash
curl http://localhost:8001/api/health
```

Debe retornar:
```json
{"status":"healthy","service":"cecyte04-dreams-api"}
```

**2. Abrir Frontend:**
- Navega a `http://localhost:3000`
- Deberías ver la landing page de CECyTE 04

---

## 🔑 Paso 6: Obtener API Keys Gratuitas (OBLIGATORIO)

Para que el **Simulador de Futuro** funcione, necesitas obtener API keys gratuitas (10 minutos):

### 6.1 Google Gemini API Key (Para historias de texto)

**Paso a paso:**

1. **Ir a Google AI Studio:**
   ```
   https://aistudio.google.com
   ```

2. **Iniciar sesión** con tu cuenta de Google (Gmail)

3. **Hacer clic en "Get API Key"** (esquina superior derecha)

4. **Crear API key:**
   - "Create API key in new project"
   - Espera unos segundos...
   - ¡Aparecerá tu clave!

5. **Copiar la clave:**
   ```
   Ejemplo: AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
   ```

6. **Agregar al `.env`:**
   ```bash
   nano backend/.env
   # Buscar: GOOGLE_GEMINI_API_KEY=""
   # Cambiar a: GOOGLE_GEMINI_API_KEY="AIzaSyA_tu_clave_aqui"
   # Guardar: Ctrl+X, Y, Enter
   ```

**Límites gratuitos:**
- 15 requests por minuto
- 1,500 requests por día
- ✅ Suficiente para una escuela

### 6.2 Hugging Face Token (Para imágenes)

**Paso a paso:**

1. **Crear cuenta en Hugging Face:**
   ```
   https://huggingface.co/join
   ```

2. **Ir a Access Tokens:**
   ```
   https://huggingface.co/settings/tokens
   ```

3. **Crear nuevo token:**
   - Clic en "New token"
   - **Name:** `cecyte04-simulator`
   - **Role:** Fine-grained
   - **Permissions:** ✅ "Make calls to inference providers"
   - Clic en "Create token"

4. **Copiar el token:**
   ```
   Ejemplo: hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
   ```

5. **Agregar al `.env`:**
   ```bash
   nano backend/.env
   # Buscar: HUGGINGFACE_API_TOKEN=""
   # Cambiar a: HUGGINGFACE_API_TOKEN="hf_tu_token_aqui"
   # Guardar: Ctrl+X, Y, Enter
   ```

### 6.3 Reiniciar el Backend

```bash
# Detener backend (Ctrl+C en la terminal del backend)
# Volver a iniciar:
cd backend
source venv/bin/activate  # o venv\Scripts\activate en Windows
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 6.4 Probar el Simulador

1. Ir a `http://localhost:3000/simulator`
2. Completar el formulario
3. Generar tu futuro
4. ✅ ¡Debería funcionar!

> 📘 **Guía detallada:** Ver `/app/CONFIGURACION_IA_GRATIS.md`

---

## 🎮 Uso de la Aplicación

### Rutas Principales:

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page principal |
| `/simulator` | Simulador de futuro con IA |
| `/tour` | Tour virtual 3D del plantel |
| `/especialidades` | Lista de especialidades |
| `/dashboard` | Dashboard del usuario |
| `/admin` | Panel de administración |

### 🔐 Acceso al Panel de Administración

**URL:** `http://localhost:3000/admin`

**Opción 1 - Credenciales:**
- Usuario: `admin`
- Contraseña: `cecyte04admin`

**Opción 2 - Google Auth:**
- Email configurado en `ADMIN_EMAILS`

### 📦 Subir Modelos 3D

1. Acceder al panel admin
2. Ir a "Modelos 3D"
3. Subir archivo (GLTF, GLB, FBX, OBJ)
4. Activar el modelo
5. Ver en `/tour`

> 📘 **Guía completa:** Ver `/app/GUIA_USO_MODELOS_3D.md`

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "MongoDB connection failed"

**Causa:** MongoDB no está corriendo

**Solución:**
```bash
# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community

# Windows
# Buscar "Services" → MongoDB Server → Start
```

### ❌ Error: "Module not found: camera-controls"

**Causa:** Dependencias no instaladas correctamente

**Solución:**
```bash
cd frontend
yarn install --ignore-engines
```

### ❌ Error: "Google Gemini API key no configurada"

**Causa:** No agregaste tu API key en `.env`

**Solución:**
1. Obtén tu key en: https://aistudio.google.com
2. Agrégala en `backend/.env`
3. Reinicia el backend

### ❌ Frontend muestra página en blanco

**Causa:** Backend no está corriendo o URL incorrecta

**Solución:**
1. Verifica que backend esté en puerto 8001
2. Revisa `frontend/.env`: `REACT_APP_BACKEND_URL=http://localhost:8001`
3. Abre consola del navegador (F12) para ver errores

### ❌ Error: "CORS policy"

**Causa:** Configuración de CORS

**Solución:**
```bash
nano backend/.env
# Verificar: CORS_ORIGINS="*"
# Reiniciar backend
```

### ❌ Modelos 3D no cargan

**Causa:** Varios posibles

**Solución:**
1. Verifica formato (GLTF, GLB, FBX, OBJ)
2. Máximo 100MB por archivo
3. Revisa consola del navegador (F12)
4. Ver guía: `/app/GUIA_USO_MODELOS_3D.md`

---

## 🌐 Despliegue en Producción

### Opción 1: Railway (Recomendado - Más fácil)

**1. Preparar proyecto:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**2. Configurar en Railway:**
- Ir a [Railway.app](https://railway.app)
- "New Project" → "Deploy from GitHub repo"
- Seleccionar tu repositorio
- Railway detectará automáticamente backend y frontend

**3. Variables de entorno:**
Agregar en Railway:
```
MONGO_URL=mongodb://...
DB_NAME=cecyte04_dreams
GOOGLE_GEMINI_API_KEY=tu_key
HUGGINGFACE_API_TOKEN=tu_token
```

### Opción 2: Vercel (Frontend) + Render (Backend)

**Frontend en Vercel:**
```bash
cd frontend
npm install -g vercel
vercel deploy
```

**Backend en Render:**
1. Conectar GitHub a Render
2. Crear Web Service
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Opción 3: VPS (Control total)

**Servidor Ubuntu/Debian:**

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias
sudo apt install -y python3-pip python3-venv nodejs npm mongodb git nginx

# 3. Instalar Yarn
sudo npm install -g yarn

# 4. Clonar repositorio
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# 5. Configurar backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Crear .env con configuración de producción

# 6. Configurar frontend
cd ../frontend
yarn install --ignore-engines
# Editar .env con URL de producción
yarn build

# 7. Instalar PM2
sudo npm install -g pm2

# 8. Iniciar servicios
cd ../backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name cecyte04-backend
cd ../frontend
pm2 start "yarn start" --name cecyte04-frontend

# 9. Configurar PM2 para inicio automático
pm2 startup
pm2 save

# 10. Configurar Nginx (opcional - para dominio)
sudo nano /etc/nginx/sites-available/cecyte04
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cecyte04 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📁 Estructura del Proyecto

```
Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04/
├── backend/
│   ├── server.py              # API principal (FastAPI)
│   ├── requirements.txt       # Dependencias Python
│   ├── .env                   # Variables de entorno
│   └── uploads/
│       └── models/           # Modelos 3D subidos
├── frontend/
│   ├── src/
│   │   ├── pages/            # Páginas React
│   │   │   ├── LandingPage.js
│   │   │   ├── FutureSimulator.js
│   │   │   ├── VirtualTour.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Especialidades.js
│   │   │   └── AdminPanel.js
│   │   ├── components/       # Componentes UI
│   │   ├── context/          # Contextos React
│   │   └── App.js
│   ├── package.json
│   └── .env
├── INSTALL.md                 # Esta guía
├── README.md                  # Documentación principal
├── CONFIGURACION_IA_GRATIS.md # Guía de API keys
├── GUIA_USO_MODELOS_3D.md    # Guía de modelos 3D
└── RESUMEN_TRABAJO_COMPLETADO.md
```

---

## 📚 Tecnologías y Dependencias

### Backend (Python 3.11)
```
fastapi==0.110.1          # Framework web
uvicorn==0.25.0           # Servidor ASGI
motor==3.3.1              # MongoDB async driver
python-dotenv==1.2.1      # Variables de entorno
pydantic==2.12.5          # Validación de datos
httpx==0.28.1             # HTTP client
python-multipart==0.0.22  # Multipart forms
aiofiles==25.1.0          # Archivos async

# IA Gratuita
google-generativeai==0.8.6    # Google Gemini
huggingface_hub==1.5.0        # Hugging Face
pillow==12.1.1                # Procesamiento imágenes

# Opcional
sendgrid==6.12.5          # Emails
twilio==9.10.3            # WhatsApp
```

### Frontend (React 19 / Node 20)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.5.1",
  "framer-motion": "^12.36.0",
  
  "three": "^0.183.2",
  "@react-three/fiber": "^9.5.0",
  "@react-three/drei": "^10.7.7",
  
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.507.0",
  "sonner": "^2.0.3",
  
  "@craco/craco": "^7.1.0"
}
```

---

## 🎯 Características del Sistema

### ✨ Simulador de Futuro
- Generación de historias personalizadas con **Google Gemini**
- Generación de imágenes con **Stable Diffusion**
- Avatares 3D basados en nombre y género
- Envío por email/WhatsApp (opcional)

### 🏫 Tour Virtual 3D
- Exploración de instalaciones del plantel
- Tarjetas interactivas de especialidades
- Soporte multi-formato: **GLTF, GLB, FBX, OBJ**
- Auto-centrado y escalado de modelos
- Manejo robusto de errores

### 🛠️ Panel de Administración
- Carga de modelos 3D del plantel
- Editor de posiciones 3D de tarjetas
- Gestión de especialidades
- Autenticación dual (credenciales + Google)

### 🎯 5 Especialidades
1. **Programación** (Cyan) - Software y aplicaciones
2. **Electrónica** (Lime) - Circuitos y automatización
3. **Contabilidad** (Purple) - Finanzas y gestión fiscal
4. **Administración** (Red) - Liderazgo empresarial
5. **Enfermería** (Green) - Salud comunitaria

---

## 📞 Soporte y Recursos

### Documentación del Proyecto:
- 📘 `/app/CONFIGURACION_IA_GRATIS.md` - Guía de API keys
- 🔧 `/app/CAMBIOS_MODELOS_3D.md` - Cambios técnicos
- 👨‍🏫 `/app/GUIA_USO_MODELOS_3D.md` - Guía de administrador
- 📊 `/app/RESUMEN_TRABAJO_COMPLETADO.md` - Resumen ejecutivo

### Enlaces Útiles:
- **Google Gemini:** https://aistudio.google.com
- **Hugging Face:** https://huggingface.co
- **GitHub Issues:** https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04/issues
- **Email:** olmedohernandezsalvador@gmail.com

---

## 🎓 Información del Plantel

**CECyTE 04** - Centro de Estudios Científicos y Tecnológicos del Estado de Tlaxcala

📍 **Ubicación:** Tlaxcala, México  
🌍 **Coordenadas:** 19°30'33.77"N 98°27'52.86"W

---

## 📄 Licencia

Desarrollado con ❤️ para **CECyTE 04** - Tlaxcala, México

**IA Gratuita • Modelos 3D • Educación de Calidad** 🎓✨

---

## ✅ Checklist de Instalación

Marca cada paso conforme lo completes:

- [ ] Node.js instalado (v18+)
- [ ] Python instalado (3.9+)
- [ ] MongoDB instalado y corriendo
- [ ] Repositorio clonado
- [ ] Backend configurado (entorno virtual + dependencias)
- [ ] Frontend configurado (yarn install)
- [ ] Archivo `.env` creado en backend
- [ ] Google Gemini API Key obtenida
- [ ] Hugging Face Token obtenido
- [ ] API Keys agregadas a `.env`
- [ ] Backend iniciado (puerto 8001)
- [ ] Frontend iniciado (puerto 3000)
- [ ] Simulador probado y funcionando
- [ ] Panel admin accesible

**¡Si marcaste todo, felicidades! Tu instalación está completa.** 🎉

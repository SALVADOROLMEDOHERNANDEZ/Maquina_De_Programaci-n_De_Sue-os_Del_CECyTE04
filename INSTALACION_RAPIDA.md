# 🚀 Guía de Instalación Rápida - Comandos Copy-Paste

## 🎯 Esta guía contiene TODOS los comandos listos para copiar y pegar

---

## 📋 Requisitos Previos (Instalar primero)

### 1. Node.js v18+ (Recomendado v20)
```bash
# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Mac
brew install node@20

# Windows: Descargar desde https://nodejs.org/
```

### 2. Python 3.9+ (Recomendado 3.11)
```bash
# Linux
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# Mac
brew install python@3.11

# Windows: Descargar desde https://python.org/
```

### 3. MongoDB 6.0+
```bash
# Linux (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Mac
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

# Windows: Descargar desde https://mongodb.com/try/download/community
```

### 4. Yarn
```bash
npm install -g yarn
```

---

## 🔥 INSTALACIÓN COMPLETA - LINUX/MAC

### Copiar y pegar TODO este bloque:

```bash
# ════════════════════════════════════════════════════════════════
# INSTALACIÓN COMPLETA - CECyTE 04 Máquina de Programación de Sueños
# ════════════════════════════════════════════════════════════════

echo "🚀 Iniciando instalación..."

# 1. CLONAR REPOSITORIO
echo "📥 Clonando repositorio..."
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# 2. CONFIGURAR BACKEND
echo "🔧 Configurando backend..."
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear carpeta para modelos 3D
mkdir -p uploads/models

# Crear archivo .env
cat > .env << 'EOF'
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cecyte04_dreams"
CORS_ORIGINS="*"

# ═══════════════════════════════════════════════════════════
# API KEYS GRATUITAS - Agregar después de obtenerlas
# ═══════════════════════════════════════════════════════════

# Google Gemini (Historias de texto) - https://aistudio.google.com
GOOGLE_GEMINI_API_KEY=""

# Hugging Face (Generación de imágenes) - https://huggingface.co/settings/tokens
HUGGINGFACE_API_TOKEN=""

# ═══════════════════════════════════════════════════════════
# Credenciales de Admin
# ═══════════════════════════════════════════════════════════
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="cecyte04admin"
ADMIN_EMAILS="olmedohernandezsalvador@gmail.com"

# ═══════════════════════════════════════════════════════════
# Servicios Opcionales
# ═══════════════════════════════════════════════════════════
SENDGRID_API_KEY=""
SENDER_EMAIL=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""
EOF

echo "✅ Backend configurado"

# 3. CONFIGURAR FRONTEND
echo "🎨 Configurando frontend..."
cd ../frontend

# Instalar dependencias (ignorar advertencia de Node version)
yarn install --ignore-engines

echo "✅ Frontend configurado"

# 4. VERIFICAR INSTALACIÓN
cd ..
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ INSTALACIÓN COMPLETA"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Ubicación: $(pwd)"
echo ""
echo "⚠️  SIGUIENTE PASO: Obtener API Keys gratuitas"
echo ""
echo "1. Google Gemini API Key:"
echo "   → https://aistudio.google.com"
echo ""
echo "2. Hugging Face Token:"
echo "   → https://huggingface.co/settings/tokens"
echo ""
echo "3. Agregar las keys a: backend/.env"
echo ""
echo "4. Para iniciar:"
echo "   Terminal 1: ./scripts/start-backend.sh"
echo "   Terminal 2: ./scripts/start-frontend.sh"
echo ""
echo "📘 Ver guía completa: CONFIGURACION_IA_GRATIS.md"
echo "════════════════════════════════════════════════════════════"
```

### Scripts de inicio (Opcional - Para facilitar ejecución)

```bash
# Crear scripts de inicio
mkdir -p scripts

# Script para iniciar backend
cat > scripts/start-backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
echo "🚀 Iniciando backend en http://localhost:8001"
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
EOF

# Script para iniciar frontend
cat > scripts/start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
echo "🎨 Iniciando frontend en http://localhost:3000"
yarn start
EOF

# Dar permisos de ejecución
chmod +x scripts/start-backend.sh
chmod +x scripts/start-frontend.sh

echo "✅ Scripts creados en ./scripts/"
```

---

## 🔥 INSTALACIÓN COMPLETA - WINDOWS

### Copiar y pegar TODO este bloque en PowerShell:

```powershell
# ════════════════════════════════════════════════════════════════
# INSTALACIÓN COMPLETA - CECyTE 04 Máquina de Programación de Sueños
# ════════════════════════════════════════════════════════════════

Write-Host "🚀 Iniciando instalación..." -ForegroundColor Green

# 1. CLONAR REPOSITORIO
Write-Host "📥 Clonando repositorio..." -ForegroundColor Cyan
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# 2. CONFIGURAR BACKEND
Write-Host "🔧 Configurando backend..." -ForegroundColor Cyan
cd backend

# Crear entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
python -m pip install --upgrade pip
pip install -r requirements.txt

# Crear carpeta para modelos 3D
New-Item -ItemType Directory -Force -Path "uploads\models"

# Crear archivo .env
@"
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cecyte04_dreams"
CORS_ORIGINS="*"

# ═══════════════════════════════════════════════════════════
# API KEYS GRATUITAS - Agregar después de obtenerlas
# ═══════════════════════════════════════════════════════════

# Google Gemini (Historias de texto) - https://aistudio.google.com
GOOGLE_GEMINI_API_KEY=""

# Hugging Face (Generación de imágenes) - https://huggingface.co/settings/tokens
HUGGINGFACE_API_TOKEN=""

# ═══════════════════════════════════════════════════════════
# Credenciales de Admin
# ═══════════════════════════════════════════════════════════
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="cecyte04admin"
ADMIN_EMAILS="olmedohernandezsalvador@gmail.com"

# ═══════════════════════════════════════════════════════════
# Servicios Opcionales
# ═══════════════════════════════════════════════════════════
SENDGRID_API_KEY=""
SENDER_EMAIL=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""
"@ | Out-File -FilePath .env -Encoding UTF8

Write-Host "✅ Backend configurado" -ForegroundColor Green

# 3. CONFIGURAR FRONTEND
Write-Host "🎨 Configurando frontend..." -ForegroundColor Cyan
cd ..\frontend

# Instalar dependencias
yarn install --ignore-engines

Write-Host "✅ Frontend configurado" -ForegroundColor Green

# 4. VERIFICAR INSTALACIÓN
cd ..
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "✅ INSTALACIÓN COMPLETA" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 Ubicación: $PWD" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  SIGUIENTE PASO: Obtener API Keys gratuitas" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Google Gemini API Key:"
Write-Host "   → https://aistudio.google.com"
Write-Host ""
Write-Host "2. Hugging Face Token:"
Write-Host "   → https://huggingface.co/settings/tokens"
Write-Host ""
Write-Host "3. Agregar las keys a: backend\.env"
Write-Host ""
Write-Host "4. Para iniciar (2 terminales):"
Write-Host "   Terminal 1: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
Write-Host "   Terminal 2: cd frontend && yarn start"
Write-Host ""
Write-Host "📘 Ver guía completa: CONFIGURACION_IA_GRATIS.md"
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
```

---

## ▶️ INICIAR SERVICIOS (Después de instalar)

### Linux/Mac:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Windows:

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
yarn start
```

---

## 🔑 CONFIGURAR API KEYS (OBLIGATORIO)

### 1. Obtener Google Gemini API Key

```bash
# 1. Abrir navegador en:
https://aistudio.google.com

# 2. Iniciar sesión con Gmail
# 3. Clic en "Get API Key"
# 4. "Create API key in new project"
# 5. Copiar la key generada
```

### 2. Obtener Hugging Face Token

```bash
# 1. Abrir navegador en:
https://huggingface.co/settings/tokens

# 2. Crear cuenta o login
# 3. Clic en "New token"
# 4. Seleccionar "Fine-grained"
# 5. Activar "Make calls to inference providers"
# 6. Copiar el token generado
```

### 3. Agregar las keys al archivo .env

**Linux/Mac:**
```bash
nano backend/.env

# Buscar estas líneas:
# GOOGLE_GEMINI_API_KEY=""
# HUGGINGFACE_API_TOKEN=""

# Cambiar a (con tus claves reales):
# GOOGLE_GEMINI_API_KEY="AIzaSyA_tu_clave_aqui"
# HUGGINGFACE_API_TOKEN="hf_tu_token_aqui"

# Guardar: Ctrl+X, Y, Enter
```

**Windows:**
```powershell
notepad backend\.env

# Buscar estas líneas:
# GOOGLE_GEMINI_API_KEY=""
# HUGGINGFACE_API_TOKEN=""

# Cambiar a (con tus claves reales):
# GOOGLE_GEMINI_API_KEY="AIzaSyA_tu_clave_aqui"
# HUGGINGFACE_API_TOKEN="hf_tu_token_aqui"

# Guardar y cerrar
```

### 4. Reiniciar Backend

```bash
# Detener backend (Ctrl+C en la terminal del backend)
# Volver a iniciar (ver comandos arriba)
```

---

## ✅ VERIFICAR INSTALACIÓN

### 1. Verificar Backend

```bash
curl http://localhost:8001/api/health
```

**Salida esperada:**
```json
{"status":"healthy","service":"cecyte04-dreams-api"}
```

### 2. Verificar Frontend

Abrir navegador en:
```
http://localhost:3000
```

Deberías ver la landing page de CECyTE 04.

### 3. Probar Simulador de Futuro

```
http://localhost:3000/simulator
```

Completa el formulario y genera tu futuro. Si funciona, ¡todo está correcto!

---

## 🔧 COMANDOS ÚTILES

### Ver logs de MongoDB
```bash
# Linux
sudo journalctl -u mongod -f

# Mac
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Limpiar base de datos (Reset)
```bash
mongosh
use cecyte04_dreams
db.dropDatabase()
exit
```

### Actualizar dependencias
```bash
# Backend
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
yarn upgrade
```

### Ver procesos corriendo
```bash
# Linux/Mac
ps aux | grep -E "uvicorn|node"

# Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"}
```

### Detener todos los servicios
```bash
# Linux/Mac
pkill -f uvicorn
pkill -f "yarn start"

# Windows PowerShell
Stop-Process -Name "python" -Force
Stop-Process -Name "node" -Force
```

---

## 🐛 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Backend no inicia

```bash
# Verificar Python
python3 --version  # Debe ser 3.9+

# Verificar dependencias
cd backend
source venv/bin/activate
pip list | grep -E "fastapi|uvicorn|motor"

# Reinstalar si falta algo
pip install -r requirements.txt
```

### Frontend no compila

```bash
# Limpiar caché
cd frontend
rm -rf node_modules yarn.lock
yarn install --ignore-engines
```

### MongoDB no conecta

```bash
# Verificar estado
# Linux
sudo systemctl status mongod

# Mac
brew services list | grep mongodb

# Iniciar si está detenido
# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

### Puerto ocupado

```bash
# Ver qué usa el puerto 8001
# Linux/Mac
lsof -i :8001
kill -9 <PID>

# Ver qué usa el puerto 3000
lsof -i :3000
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

---

## 📦 INSTALACIÓN EN SERVIDOR (VPS/Cloud)

### Ubuntu/Debian Server:

```bash
# ════════════════════════════════════════════════════════════════
# INSTALACIÓN EN SERVIDOR UBUNTU/DEBIAN
# ════════════════════════════════════════════════════════════════

# 1. ACTUALIZAR SISTEMA
sudo apt update && sudo apt upgrade -y

# 2. INSTALAR DEPENDENCIAS
sudo apt install -y python3 python3-pip python3-venv nodejs npm git nginx mongodb

# 3. INSTALAR YARN
sudo npm install -g yarn

# 4. CLONAR REPOSITORIO
cd /var/www
sudo git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git cecyte04
cd cecyte04
sudo chown -R $USER:$USER .

# 5. CONFIGURAR BACKEND
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Crear .env con configuración de producción

# 6. CONFIGURAR FRONTEND
cd ../frontend
yarn install --ignore-engines
# Editar .env con URL de producción
yarn build

# 7. INSTALAR PM2 (Process Manager)
sudo npm install -g pm2

# 8. INICIAR SERVICIOS
cd ../backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name cecyte04-backend

# Para frontend en producción, usar build servido por nginx
# Ver configuración nginx abajo

# 9. CONFIGURAR PM2 STARTUP
pm2 startup
pm2 save

# 10. CONFIGURAR NGINX
sudo nano /etc/nginx/sites-available/cecyte04
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend (build estático)
    root /var/www/cecyte04/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/cecyte04 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Opcional: Configurar SSL con Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 📝 NOTAS IMPORTANTES

1. **Node.js Version:** El proyecto usa Node 20 pero funciona con 18+
2. **Yarn es Obligatorio:** No usar npm, solo yarn para el frontend
3. **Flag --ignore-engines:** Necesario por dependencia camera-controls
4. **API Keys:** El simulador NO funcionará sin las API keys gratuitas
5. **MongoDB:** Debe estar corriendo antes de iniciar el backend
6. **Puertos:** Backend usa 8001, Frontend usa 3000
7. **CORS:** Configurado para aceptar cualquier origen en desarrollo

---

## 🎉 ¡Listo!

Si completaste todos los pasos:
- ✅ Backend corriendo en http://localhost:8001
- ✅ Frontend corriendo en http://localhost:3000
- ✅ MongoDB conectado
- ✅ API keys configuradas
- ✅ Simulador funcionando

**¡Tu instalación está completa!** 🚀

---

**Desarrollado con ❤️ para CECyTE 04 - Tlaxcala, México**

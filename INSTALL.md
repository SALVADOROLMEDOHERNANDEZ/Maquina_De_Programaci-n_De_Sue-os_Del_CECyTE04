# 🚀 Guía de Instalación - Máquina de Programación de Sueños CECyTE 04

## 📋 Requisitos Previos

### Software necesario:
- **Node.js** v18 o superior - [Descargar](https://nodejs.org/)
- **Python** 3.9 o superior - [Descargar](https://python.org/)
- **MongoDB** 6.0 o superior - [Descargar](https://mongodb.com/try/download/community)
- **Git** - [Descargar](https://git-scm.com/)
- **Yarn** (gestor de paquetes) - Se instala con: `npm install -g yarn`

---

## 📥 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04
```

---

## 🔧 Paso 2: Configurar el Backend (Python/FastAPI)

### 2.1 Crear entorno virtual
```bash
cd backend
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Mac/Linux:
source venv/bin/activate
```

### 2.2 Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2.3 Crear archivo de configuración `.env`
Crea un archivo `backend/.env` con el siguiente contenido:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cecyte04_dreams"
CORS_ORIGINS="*"

# API Key de Emergent para OpenAI (GPT-5.2 y GPT Image 1)
EMERGENT_LLM_KEY=tu_emergent_llm_key_aqui

# Credenciales de Admin (puedes cambiarlas)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=cecyte04admin

# Emails de administradores (separados por coma)
ADMIN_EMAILS=olmedohernandezsalvador@gmail.com

# SendGrid (opcional - para envío de emails)
SENDGRID_API_KEY=tu_sendgrid_api_key
SENDER_EMAIL=noreply@tudominio.com

# Twilio (opcional - para WhatsApp)
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 2.4 Crear carpeta para modelos 3D
```bash
mkdir -p uploads/models
```

---

## 🎨 Paso 3: Configurar el Frontend (React)

### 3.1 Instalar dependencias
```bash
cd ../frontend
yarn install
```

### 3.2 Crear archivo de configuración `.env`
Crea un archivo `frontend/.env` con el siguiente contenido:

```env
# Para desarrollo local:
REACT_APP_BACKEND_URL=http://localhost:8001

# Para producción (cambiar por tu dominio):
# REACT_APP_BACKEND_URL=https://tu-dominio.com
```

---

## 🗄️ Paso 4: Configurar MongoDB

### 4.1 Iniciar MongoDB
```bash
# En Windows (si instalaste como servicio, ya está corriendo)
# En Mac:
brew services start mongodb-community

# En Linux:
sudo systemctl start mongod
```

### 4.2 Verificar conexión
```bash
mongosh
# Deberías ver el prompt de MongoDB
```

---

## ▶️ Paso 5: Ejecutar el Proyecto

### 5.1 Iniciar el Backend
```bash
cd backend
# Activar entorno virtual si no está activo
source venv/bin/activate  # o venv\Scripts\activate en Windows

# Iniciar servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

El backend estará disponible en: `http://localhost:8001`

### 5.2 Iniciar el Frontend (en otra terminal)
```bash
cd frontend
yarn start
```

El frontend estará disponible en: `http://localhost:3000`

---

## 🔑 Paso 6: Obtener API Keys

### Emergent LLM Key (para GPT-5.2 y generación de imágenes)
1. Regístrate en [Emergent](https://emergent.sh)
2. Ve a tu perfil → Universal Key
3. Copia la key y pégala en `backend/.env`

### SendGrid (opcional - para emails)
1. Regístrate en [SendGrid](https://sendgrid.com)
2. Crea una API Key en Settings → API Keys
3. Verifica tu dominio de envío

### Twilio (opcional - para WhatsApp)
1. Regístrate en [Twilio](https://twilio.com)
2. Obtén tu Account SID y Auth Token
3. Configura WhatsApp Sandbox

---

## 🌐 Despliegue en Producción

### Opción 1: Railway (Recomendado)
1. Conecta tu repositorio de GitHub a [Railway](https://railway.app)
2. Crea dos servicios: Backend y Frontend
3. Configura las variables de entorno
4. Railway desplegará automáticamente

### Opción 2: Vercel + Render
- **Frontend en Vercel:**
  ```bash
  cd frontend
  vercel deploy
  ```
- **Backend en Render:**
  - Conecta el repositorio
  - Configura como servicio Python

### Opción 3: VPS (DigitalOcean, AWS, etc.)
```bash
# Instalar dependencias del sistema
sudo apt update
sudo apt install python3-pip nodejs npm mongodb nginx

# Clonar y configurar como en los pasos anteriores
# Usar PM2 para mantener los servicios corriendo
npm install -g pm2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name backend
pm2 start "yarn start" --name frontend --cwd ./frontend
```

---

## 📁 Estructura del Proyecto

```
Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04/
├── backend/
│   ├── server.py           # API principal (FastAPI)
│   ├── requirements.txt    # Dependencias Python
│   ├── .env               # Variables de entorno
│   └── uploads/
│       └── models/        # Modelos 3D subidos
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas de la app
│   │   │   ├── LandingPage.js
│   │   │   ├── FutureSimulator.js
│   │   │   ├── VirtualTour.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Especialidades.js
│   │   │   └── AdminPanel.js
│   │   ├── context/       # Contextos React
│   │   │   └── AuthContext.js
│   │   ├── components/    # Componentes UI
│   │   └── App.js         # Componente principal
│   ├── package.json
│   └── .env
├── memory/
│   └── PRD.md             # Documentación del proyecto
└── README.md
```

---

## 🔐 Acceso al Panel de Administración

**URL:** `/admin`

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `cecyte04admin`

**También puedes acceder como admin con Google Auth:**
- Configura tu email en `ADMIN_EMAILS` en el backend

---

## 📚 Dependencias del Proyecto

### Backend (Python)
```
fastapi==0.109.0
uvicorn==0.27.0
motor==3.3.2
python-dotenv==1.0.0
pydantic==2.5.3
httpx==0.26.0
python-multipart==0.0.6
aiofiles==23.2.1
sendgrid==6.11.0
twilio==8.10.0
emergentintegrations
```

### Frontend (Node.js)
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.21.1",
  "framer-motion": "^10.18.0",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.12",
  "@react-three/drei": "^9.92.7",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.303.0",
  "sonner": "^1.3.1"
}
```

---

## 🐛 Solución de Problemas Comunes

### Error: "MongoDB connection failed"
- Verifica que MongoDB esté corriendo
- Revisa la URL en `MONGO_URL`

### Error: "CORS policy"
- Asegúrate de que `CORS_ORIGINS` incluya tu dominio frontend

### Error: "LLM API key not configured"
- Agrega tu `EMERGENT_LLM_KEY` en el archivo `.env`

### El frontend no carga
- Verifica que `REACT_APP_BACKEND_URL` apunte al backend correcto

---

## 📞 Soporte

- **GitHub Issues:** [Crear issue](https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04/issues)
- **Email:** olmedohernandezsalvador@gmail.com

---

## 📄 Licencia

Este proyecto fue desarrollado para CECyTE 04 - Tlaxcala, México.

Coordenadas: 19°30'33.77"N 98°27'52.86"W

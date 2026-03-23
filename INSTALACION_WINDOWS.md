# 🪟 Guía de Instalación para Windows - CECyTE 04

## ❌ Problema: "El término 'yarn' no se reconoce"

Este error significa que **Yarn no está instalado** en tu sistema Windows.

---

## ✅ Solución Completa (Windows)

### Opción 1: Instalar Yarn con npm (Recomendado)

**Paso 1: Verificar que Node.js está instalado**

Abre **PowerShell** o **CMD** y ejecuta:

```powershell
node --version
npm --version
```

**Salida esperada:**
```
v20.x.x
10.x.x
```

**Si NO tienes Node.js:**
1. Descargar desde: https://nodejs.org/
2. Instalar la versión LTS (v20.x)
3. Reiniciar PowerShell
4. Verificar de nuevo

**Paso 2: Instalar Yarn globalmente**

```powershell
npm install -g yarn
```

**Paso 3: Verificar instalación**

```powershell
yarn --version
```

**Salida esperada:**
```
1.22.x
```

**Paso 4: Si sigue sin funcionar, cerrar y reabrir PowerShell**

```powershell
# Cerrar PowerShell completamente
# Abrir PowerShell nuevo
yarn --version
```

---

### Opción 2: Usar npm en lugar de Yarn

Si prefieres no instalar Yarn, puedes usar **npm** (viene con Node.js):

**En lugar de:**
```powershell
yarn install --ignore-engines
```

**Usar:**
```powershell
npm install --legacy-peer-deps
```

⚠️ **IMPORTANTE:** Si usas npm, el proyecto puede tener algunos warnings, pero debería funcionar.

---

## 🚀 Instalación Completa en Windows (Paso a Paso)

### Requisitos Previos:

1. **Node.js v20.x** - https://nodejs.org/
2. **Python 3.11** - https://www.python.org/
3. **MySQL 8.0** - https://dev.mysql.com/downloads/installer/
4. **Git** - https://git-scm.com/

---

### Paso 1: Clonar el Repositorio

Abre **PowerShell** o **Git Bash**:

```powershell
# Navegar a tu carpeta de proyectos
cd C:\Users\tu_usuario\Documents

# Clonar (reemplazar con tu URL)
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git

# Entrar al proyecto
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04
```

---

### Paso 2: Configurar Backend

**2.1 Crear entorno virtual:**

```powershell
cd backend
python -m venv venv
```

**2.2 Activar entorno virtual:**

```powershell
.\venv\Scripts\Activate.ps1
```

**Si sale error de políticas de ejecución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

Deberías ver `(venv)` al inicio de tu línea de comandos.

**2.3 Instalar dependencias:**

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**2.4 Configurar variables de entorno:**

```powershell
# Copiar plantilla
copy .env.example .env

# Editar con Notepad
notepad .env
```

**Completar con tus valores:**
```env
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="tu_contraseña"
MYSQL_DATABASE="cecyte04_dreams"

GOOGLE_GEMINI_API_KEY="tu_key_de_gemini"
HUGGINGFACE_API_TOKEN="tu_token_de_huggingface"
```

Guardar y cerrar Notepad.

**2.5 Inicializar Base de Datos:**

Asegúrate de que MySQL esté corriendo:
- Buscar "Services" en Windows
- Encontrar "MySQL80" o "MySQL"
- Clic derecho > Start (si no está corriendo)

Luego:
```powershell
python init_database.py
```

---

### Paso 3: Configurar Frontend

**Opción A - Con Yarn (Recomendado):**

```powershell
# Volver a la raíz del proyecto
cd ..
cd frontend

# Instalar Yarn si no lo tienes
npm install -g yarn

# Instalar dependencias
yarn install --ignore-engines
```

**Opción B - Con npm:**

```powershell
cd ..
cd frontend

# Instalar dependencias
npm install --legacy-peer-deps
```

---

### Paso 4: Iniciar la Aplicación

**Necesitas 2 terminales de PowerShell:**

**Terminal 1 - Backend:**

```powershell
cd C:\ruta\a\tu\proyecto\backend
.\venv\Scripts\Activate.ps1
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**

```powershell
cd C:\ruta\a\tu\proyecto\frontend

# Con Yarn:
yarn start

# O con npm:
npm start
```

**Salida esperada:**

**Backend:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Frontend:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
```

---

### Paso 5: Abrir en Navegador

Abre tu navegador en:
```
http://localhost:3000
```

Deberías ver la landing page de CECyTE 04 🎉

---

## 🔧 Solución de Problemas Comunes en Windows

### ❌ Error: "cannot be loaded because running scripts is disabled"

**Problema:** Políticas de ejecución de PowerShell

**Solución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Error: "Python no se reconoce"

**Problema:** Python no está en PATH

**Solución:**
1. Reinstalar Python
2. Durante instalación, marcar "Add Python to PATH" ✓
3. Reiniciar PowerShell

### ❌ Error: "MySQL connection failed"

**Problema:** MySQL no está corriendo

**Solución:**
1. Presionar `Win + R`
2. Escribir `services.msc`
3. Buscar "MySQL80"
4. Clic derecho > Start

### ❌ Error: "Port 3000 already in use"

**Problema:** Otro proceso usa el puerto 3000

**Solución:**
```powershell
# Ver qué usa el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplazar PID)
taskkill /PID 1234 /F
```

### ❌ Error: "node-gyp rebuild failed"

**Problema:** Falta Visual Studio Build Tools

**Solución:**
Instalar Visual Studio Build Tools:
```powershell
npm install -g windows-build-tools
```

O descargar desde: https://visualstudio.microsoft.com/downloads/

---

## 📦 Comandos Útiles para Windows

### Verificar versiones instaladas:

```powershell
node --version
npm --version
yarn --version
python --version
mysql --version
```

### Limpiar caché si hay problemas:

```powershell
# Backend
cd backend
rmdir /s /q __pycache__
rmdir /s /q venv
python -m venv venv

# Frontend
cd frontend
rmdir /s /q node_modules
rmdir /s /q build
yarn install --ignore-engines
```

### Ver logs de MySQL:

```powershell
# Ubicación típica
C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
```

---

## 🎯 Resumen de Comandos (Windows)

### Primera vez (instalación):

```powershell
# 1. Clonar repositorio
git clone tu-repo-url
cd proyecto

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
notepad .env  # Completar
python init_database.py

# 3. Frontend
cd ..\frontend
npm install -g yarn
yarn install --ignore-engines
```

### Día a día (iniciar proyecto):

**Terminal 1:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn server:app --reload
```

**Terminal 2:**
```powershell
cd frontend
yarn start
```

---

## 🌐 Desplegar en Hostinger desde Windows

### Opción 1: Usar Git

```powershell
# Agregar cambios
git add .
git commit -m "Update"
git push origin main

# Luego en servidor Hostinger (VPS):
git pull origin main
```

### Opción 2: FTP/SFTP

1. Usar FileZilla o WinSCP
2. Conectar a tu servidor Hostinger
3. Subir archivos (excepto node_modules, venv)
4. Ejecutar comandos de instalación en servidor

### Opción 3: phpMyAdmin para BD

1. Exportar desde local:
   - MySQL Workbench > Data Export
   - Seleccionar database
   - Export to Self-Contained File

2. Importar en Hostinger:
   - Panel Hostinger > phpMyAdmin
   - Seleccionar BD
   - Import > Elegir archivo .sql

---

## 📁 Estructura de Carpetas en Windows

```
C:\Users\tu_usuario\Documents\
└── Maquina_De_Programacion_De_Suenos_Del_CECyTE04\
    ├── backend\
    │   ├── venv\                    (NO subir a Git)
    │   ├── .env                     (NO subir a Git)
    │   ├── .env.example
    │   ├── server.py
    │   ├── database_schema.sql
    │   ├── init_database.py
    │   └── requirements.txt
    │
    └── frontend\
        ├── node_modules\            (NO subir a Git)
        ├── build\                   (NO subir a Git)
        ├── src\
        ├── public\
        ├── package.json
        └── yarn.lock
```

---

## ✅ Checklist de Instalación en Windows

- [ ] Node.js instalado (v20.x)
- [ ] Python instalado (3.11)
- [ ] MySQL instalado y corriendo
- [ ] Git instalado
- [ ] Yarn instalado (`npm install -g yarn`)
- [ ] Repositorio clonado
- [ ] Backend: venv creado
- [ ] Backend: dependencias instaladas
- [ ] Backend: .env configurado
- [ ] Backend: BD inicializada
- [ ] Frontend: node_modules instalado
- [ ] Backend iniciado (puerto 8001)
- [ ] Frontend iniciado (puerto 3000)
- [ ] Navegador abierto en localhost:3000

---

## 💡 Tips para Windows

1. **Usar PowerShell o Windows Terminal** (no CMD)
2. **Ejecutar como Administrador** si hay errores de permisos
3. **Desactivar antivirus temporalmente** si bloquea instalaciones
4. **Usar rutas sin espacios** (evitar "Mis Documentos")
5. **Mantener PowerShell abierto** mientras trabajas

---

## 🆘 Si Todo Falla

**Opción 1: Usar WSL (Windows Subsystem for Linux)**

```powershell
# Instalar WSL
wsl --install

# Reiniciar Windows
# Abrir Ubuntu
# Seguir instrucciones de Linux en INSTALL.md
```

**Opción 2: Usar Docker**

```powershell
# Instalar Docker Desktop
# Crear Dockerfile y docker-compose.yml
# (Consultar documentación de Docker)
```

---

**¡Todo listo para desarrollar en Windows!** 🎉

**Desarrollado con ❤️ para CECyTE 04 - Tlaxcala, México**

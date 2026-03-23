# 🔧 SOLUCIÓN RÁPIDA - Errores de Instalación Windows

## ✅ SOLUCIÓN: Error de Dependencias Python

### Problema:
```
ERROR: ResolutionImpossible: for help visit https://pip.pypa.io/en/latest/topics/dependency-resolution/#dealing-with-dependency-conflicts
```

### Solución Paso a Paso:

**1. Cerrar todas las terminales de PowerShell**

**2. Abrir PowerShell COMO ADMINISTRADOR:**
- Buscar "PowerShell" en el menú inicio
- Clic derecho > "Ejecutar como administrador"

**3. Navegar al proyecto:**
```powershell
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04\backend
```

**4. Eliminar entorno virtual viejo:**
```powershell
Remove-Item -Recurse -Force venv
```

**5. Crear nuevo entorno virtual:**
```powershell
python -m venv venv
```

**6. Activar entorno virtual:**
```powershell
.\venv\Scripts\Activate.ps1
```

Si da error de políticas:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**7. Actualizar pip:**
```powershell
python -m pip install --upgrade pip
```

**8. Instalar dependencias (NUEVO requirements.txt simplificado):**
```powershell
pip install --no-cache-dir fastapi uvicorn python-multipart python-dotenv aiomysql PyMySQL google-generativeai huggingface-hub pillow httpx requests aiohttp aiofiles pydantic email-validator python-jose passlib bcrypt cryptography oauthlib requests-oauthlib sendgrid twilio python-dateutil PyYAML
```

**9. Verificar instalación:**
```powershell
pip list | Select-String -Pattern "fastapi|aiomysql|google-generativeai|huggingface"
```

Deberías ver:
```
aiomysql             0.2.0
fastapi              0.110.x
google-generativeai  0.8.x
huggingface-hub      1.5.x
```

---

## ✅ SOLUCIÓN: Error Hot Module Replacement (Frontend)

### Problema:
```
ERROR
[HMR] Hot Module Replacement is disabled.
```

### Causas posibles:
1. **Backend no está corriendo** (más probable)
2. Backend en puerto incorrecto
3. Problema de CORS

### Solución:

**Paso 1: Verificar Backend**

Abrir NUEVA PowerShell (Terminal 1):
```powershell
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04\backend
.\venv\Scripts\Activate.ps1
```

Deberías ver `(venv)` al inicio de la línea.

**Paso 2: Verificar .env**
```powershell
# Ver contenido del .env
Get-Content .env
```

Debe contener (mínimo):
```env
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="tu_contraseña"
MYSQL_DATABASE="cecyte04_dreams"

GOOGLE_GEMINI_API_KEY="AIzaSyA..."
HUGGINGFACE_API_TOKEN="hf_..."
```

**Paso 3: Verificar MySQL está corriendo**
```powershell
# Ver servicios MySQL
Get-Service -Name "*mysql*"
```

Si dice "Stopped":
```powershell
# Iniciar MySQL como administrador
Start-Service MySQL80
```

O:
1. Presionar `Win + R`
2. Escribir `services.msc`
3. Buscar "MySQL80"
4. Clic derecho > Iniciar

**Paso 4: Inicializar Base de Datos**
```powershell
python init_database.py
```

Debe salir:
```
✅ Conectado a MySQL
✅ Base de datos creada/verificada
✅ Tabla creada: users
...
```

Si da error de conexión MySQL, verificar contraseña en .env

**Paso 5: Iniciar Backend**
```powershell
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Debe aparecer:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

**NO CERRAR ESTA TERMINAL**

**Paso 6: Probar Backend**

Abrir OTRA PowerShell:
```powershell
curl http://localhost:8001/api/health
```

Debe retornar:
```json
{"status":"healthy","service":"cecyte04-dreams-api","database":"MySQL","connection":"OK"}
```

**Paso 7: Reiniciar Frontend**

En la terminal del frontend (donde corriste `yarn start`):
1. Presionar `Ctrl + C` para detener
2. Ejecutar de nuevo:
```powershell
yarn start
```

**Paso 8: Limpiar caché del navegador**
1. Abrir `http://localhost:3000`
2. Presionar `Ctrl + Shift + R` (recarga forzada)
3. O presionar `F12` > Application > Clear storage > Clear site data

---

## ⚠️ Warnings del Frontend (NORMAL)

Estos warnings son **NORMALES** y no afectan la funcionalidad:

```
Failed to parse source map from '@mediapipe/tasks-vision'
```
→ Es un warning de una librería de terceros, no afecta.

```
React Hook useEffect has a missing dependency
```
→ Es una advertencia de ESLint, no crítica.

```
[DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE]
```
→ Warning de deprecación, no afecta funcionamiento.

**IGNORAR ESTOS WARNINGS** - La app funcionará correctamente.

---

## 📋 Checklist de Verificación

Antes de abrir el navegador, verificar:

- [ ] **MySQL corriendo**
  ```powershell
  Get-Service MySQL80
  # Debe mostrar "Running"
  ```

- [ ] **Backend iniciado** (Terminal 1)
  ```powershell
  # En backend con venv activado
  uvicorn server:app --host 0.0.0.0 --port 8001 --reload
  # Debe mostrar "Application startup complete"
  ```

- [ ] **Endpoint de health funciona**
  ```powershell
  curl http://localhost:8001/api/health
  # Debe retornar JSON con status="healthy"
  ```

- [ ] **Frontend compilado** (Terminal 2)
  ```powershell
  # En frontend
  yarn start
  # Debe mostrar "webpack compiled with 2 warnings" (OK)
  ```

- [ ] **Puerto 3000 abierto**
  - Abrir `http://localhost:3000`
  - Presionar F12 > Console
  - NO debe haber errores en rojo

---

## 🎯 Comandos Completos (Copy-Paste)

### Setup Backend (Una sola vez):

```powershell
# Navegar al backend
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04\backend

# Eliminar venv viejo si existe
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue

# Crear nuevo venv
python -m venv venv

# Activar
.\venv\Scripts\Activate.ps1

# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias
pip install --no-cache-dir fastapi uvicorn python-multipart python-dotenv aiomysql PyMySQL google-generativeai huggingface-hub pillow httpx requests aiohttp aiofiles pydantic email-validator python-jose passlib bcrypt cryptography oauthlib requests-oauthlib sendgrid twilio python-dateutil PyYAML

# Inicializar BD
python init_database.py
```

### Iniciar Aplicación (Cada vez):

**Terminal 1 - Backend:**
```powershell
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04\backend
.\venv\Scripts\Activate.ps1
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04\frontend
yarn start
```

Esperar a que compile (30-60 segundos).

**Navegador:**
```
http://localhost:3000
```

---

## 🆘 Si Sigue sin Funcionar

### Opción 1: Usar npm en lugar de yarn

```powershell
cd frontend
npm install --legacy-peer-deps
npm start
```

### Opción 2: Limpiar todo y empezar de nuevo

**Backend:**
```powershell
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --no-cache-dir -r requirements.txt
```

**Frontend:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
yarn install --ignore-engines
```

### Opción 3: Verificar puertos

```powershell
# Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Ver qué usa el puerto 8001
netstat -ano | findstr :8001

# Si están ocupados, matar el proceso
taskkill /PID <PID_NUMBER> /F
```

---

## 📸 Cómo Debe Verse Correctamente

**Terminal 1 (Backend):**
```
(venv) PS C:\...\backend> uvicorn server:app --reload
INFO:     Will watch for changes in these directories: [...]
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [...]
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Terminal 2 (Frontend):**
```
PS C:\...\frontend> yarn start
yarn run v1.22.22
$ craco start
Starting the development server...

Compiled with warnings.
  [algunos warnings aquí - IGNORAR]

webpack compiled with 2 warnings
```

**Navegador (http://localhost:3000):**
- Landing page de CECyTE 04 visible
- Sin errores en consola (F12)

---

## ✅ Está Funcionando Cuando:

1. Backend muestra: `Application startup complete`
2. Frontend muestra: `webpack compiled with 2 warnings` (OK)
3. Navegador muestra la landing page
4. No hay errores rojos en consola del navegador (F12)

---

**Si después de seguir estos pasos sigue sin funcionar, comparte:**
1. Screenshot de la terminal del backend
2. Screenshot de la consola del navegador (F12 > Console)
3. Contenido del archivo `.env` (SIN las API keys reales)

**¡Con esta guía debería funcionar!** 🎉

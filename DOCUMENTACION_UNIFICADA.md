# Documentacion Unificada

## Proyecto
Maquina de Programacion de Suenos - CECyTE 04 es una aplicacion web educativa con:
- simulador de futuro con IA
- tour virtual 3D
- publicaciones con likes y comentarios
- panel de administracion
- gestion de modelos 3D y tarjetas

## Estado Actual
Esta guia resume la documentacion dispersa del repositorio y prioriza el estado actual del codigo.

Notas importantes:
- la base de datos actual es `MySQL`, no MongoDB
- el backend actual usa `FastAPI`
- el frontend actual usa `React`
- la IA configurada en el proyecto usa `Google Gemini`
- varias guias antiguas siguen existiendo en el repo, pero contienen partes historicas o ya superadas

## Modulos Principales

### 1. Simulador de Futuro
- genera historias o contenido personalizado con IA
- puede apoyarse en imagen generada por IA
- usa datos del usuario y configuraciones del backend

### 2. Tour Virtual 3D
- carga modelos 3D del plantel
- soporta `GLTF`, `GLB`, `FBX` y `OBJ`
- permite controlar posiciones de tarjetas
- incluye avatar, colisiones, varias vistas e iluminacion mejorada

### 3. Publicaciones
- feed publico para ver publicaciones
- permite likes y comentarios para usuarios autenticados
- las publicaciones se suben desde admin
- los admins pueden ocultar o eliminar publicaciones

### 4. Panel de Administracion
- login administrativo
- gestion de multimedia y publicaciones
- gestion de modelos 3D
- activacion/desactivacion de modelos
- edicion de posiciones de tarjetas 3D
- herramientas de migracion y estadisticas

## Stack Tecnologico

### Frontend
- React 19
- React Router
- Tailwind CSS
- Framer Motion
- Three.js
- @react-three/fiber
- @react-three/drei
- Sonner

### Backend
- FastAPI
- Uvicorn
- aiomysql
- PyMySQL
- python-dotenv
- aiofiles
- httpx

### Base de Datos
- MySQL
- compatible con phpMyAdmin
- compatible con despliegue en Hostinger

### IA
- Google Gemini

## Estructura General
```text
backend/
  server.py
  database_schema.sql
  init_database.py
  migrations.py
  requirements.txt
  .env.example
  uploads/

frontend/
  src/
    pages/
    components/
    context/
  package.json

README.md
DOCUMENTACION_UNIFICADA.md
```

## Instalacion Rapida

### Requisitos
- Node.js 18+ o 20 recomendado
- Python 3.10+ o 3.11 recomendado
- MySQL
- Yarn

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

En Linux/Mac:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Base de datos
1. Copiar `backend/.env.example` a `backend/.env`
2. Configurar `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
3. Inicializar la BD:

```bash
cd backend
python init_database.py
```

### Frontend
```bash
cd frontend
yarn install
```

### Ejecutar proyecto
Backend:
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Frontend:
```bash
cd frontend
yarn start
```

## Variables de Entorno Clave
Archivo base: `backend/.env.example`

Variables principales:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `CORS_ORIGINS`
- `GOOGLE_GEMINI_API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_EMAILS`

Opcionales:
- `SENDGRID_API_KEY`
- `SENDER_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`

## Base de Datos
El esquema principal vive en:
- `backend/database_schema.sql`

Tablas importantes:
- `users`
- `user_sessions`
- `admin_sessions`
- `especialidades`
- `simulations`
- `multimedia`
- `models_3d`
- `tarjeta_positions`
- `publication_likes`
- `publication_comments`

## Flujo Administrativo

### Publicaciones
- se suben desde el panel admin
- pueden ocultarse o eliminarse
- el feed publico no debe usarse para subir publicaciones

### Modelos 3D
- se suben desde admin
- se pueden activar o desactivar
- el tour puede usar multiples modelos

### Tarjetas 3D
- sus posiciones se editan desde admin
- se guardan en bloque en backend

## Rutas Relevantes

### Frontend
- `/`
- `/dashboard`
- `/tour`
- `/publicaciones`
- `/admin`

### Backend destacadas
- autenticacion: `/api/auth/*`
- publicaciones: `/api/publications/*`
- multimedia publica: `/api/multimedia/public`
- multimedia admin: `/api/admin/multimedia`
- modelos 3D: `/api/models/*`
- tarjetas: `/api/tarjetas/*`

## IA en el Proyecto
La configuracion documentada del proyecto contempla:
- texto con `Google Gemini`
- imagen con `Google Gemini`

Si la salida de texto se siente simple, normalmente no es solo el token:
- modelo o configuracion basica
- prompts poco especificos
- poco contexto
- falta de formato de salida

## Despliegue

### Desarrollo local
- backend en `8001`
- frontend en `3000`

### Produccion
Para mantener backend Python, Hostinger normalmente implica VPS.

Recomendaciones:
- subir backend con variables de entorno correctas
- configurar MySQL de Hostinger
- importar `database_schema.sql` o correr `init_database.py`
- definir `CORS_ORIGINS`
- verificar cookies y auth en entorno real

## Testing Recomendado

### Publicaciones
- cargar feed
- crear publicacion desde admin
- dar like con usuario autenticado
- comentar
- ocultar/eliminar desde admin

### Tour Virtual
- cargar tour
- verificar modelos activos
- probar colisiones
- probar vistas
- validar posicion de tarjetas

### Admin
- login admin
- subir multimedia
- subir modelo 3D
- guardar posiciones de tarjetas

## Problemas Conocidos de la Documentacion Antigua
Los `.md` viejos cubren temas utiles, pero varios tienen uno o mas de estos problemas:
- repiten contenido
- documentan estados anteriores del proyecto
- mencionan MongoDB aunque el proyecto actual usa MySQL
- mencionan proveedores de IA anteriores
- separan en demasiados archivos lo que hoy puede vivir en una sola guia

## Archivos que esta guia reemplaza conceptualmente
Sin borrarlos, esta guia resume principalmente:
- `README.md`
- `INSTALL.md`
- `INSTALACION_RAPIDA.md`
- `INSTALACION_WINDOWS.md`
- `MIGRACION_MYSQL.md`
- `IMPORTAR_PHPMYADMIN.md`
- `CONFIGURACION_IA_GRATIS.md`
- `GUIA_USO_MODELOS_3D.md`
- `MEJORAS_TOUR_VIRTUAL.md`
- `CAMBIOS_MODELOS_3D.md`
- `CAMBIOS_VERSION_3.0.md`
- `TESTING_VERSION_3.0.md`
- `DOCUMENTACION_TECNICA.md`
- `IMPLEMENTACION_*`
- `VERIFICACION_*`
- `ESTADO_REPOSITORIO_MASTER.md`
- `LIMPIEZA_GIT.md`

## Recomendacion
Usar este archivo como referencia principal del proyecto y dejar los demas `.md` como historico hasta que decidas archivarlos o eliminarlos.

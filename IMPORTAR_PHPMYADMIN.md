# 📊 Guía de Importación en phpMyAdmin

## Descripción
Este archivo contiene instrucciones para importar la base de datos `cecyte04_dreams` en phpMyAdmin, compatible con:
- ✅ MySQL 5.7+
- ✅ MySQL 8.0+
- ✅ Hostinger, GoDaddy, Bluehost, SiteGround
- ✅ phpMyAdmin 4.8+

## 📋 Requisitos Previos
1. Acceso a phpMyAdmin de tu hosting
2. Archivo `database_schema.sql` en tu máquina local
3. Permisos de administrador en la base de datos

## Pasos de Importación

### 1️⃣ Acceder a phpMyAdmin
```
https://tu-hosting.com/phpmyadmin
```
Usuario y contraseña de tu panel de control

### 2️⃣ Crear nueva base de datos (Opcional)
Si no existe `cecyte04_dreams`:
1. Haz clic en "Nueva base de datos"
2. Nombre: `cecyte04_dreams`
3. Cotejamiento: `utf8mb4_unicode_ci`
4. Clic en "Crear"

### 3️⃣ Importar Esquema
1. Selecciona la base de datos `cecyte04_dreams`
2. Haz clic en la pestaña **"Importar"**
3. Haz clic en **"Elegir archivo"** y selecciona `database_schema.sql`
4. Desplázate hasta abajo y haz clic en **"Importar"**

### 4️⃣ Verificar la Importación
Deberías ver las siguientes tablas:
- ✅ users
- ✅ user_sessions
- ✅ admin_sessions
- ✅ session_cleanup_log
- ✅ especialidades
- ✅ simulations
- ✅ models_3d
- ✅ tarjeta_positions
- ✅ badges
- ✅ user_badges
- ✅ quiz_completions
- ✅ contributions
- ✅ user_points
- ✅ multimedia

## 🔧 Configuración de Variables de Entorno

Después de importar, configura en `.env`:

```bash
# Base de Datos
DB_HOST=tu-host-mysql.com
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=cecyte04_dreams
DB_CHARSET=utf8mb4

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_admin_hasheada    # SHA256
ADMIN_EMAILS=tu_email@cecyte04.edu.mx

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# API Key Gemini
GOOGLE_GEMINI_API_KEY=tu_api_key
```

## 🔐 Generar Hash SHA256 para Admin

En Python:
```python
import hashlib
password = "tu_contraseña"
hash_sha256 = hashlib.sha256(password.encode()).hexdigest()
print(hash_sha256)
```

En Node.js:
```javascript
const crypto = require('crypto');
const password = "tu_contraseña";
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
```

## 🗄️ Características de la Base de Datos

### Optimizaciones Implementadas:

1. **Prevención de Duplicados de Sesiones**
   - UNIQUE constraint en `user_id` (user_sessions)
   - UNIQUE constraint en `username` (admin_sessions)
   - Uso de `ON DUPLICATE KEY UPDATE` en inserciones

2. **Limpieza Automática**
   - Procedimiento almacenado: `cleanup_expired_sessions()`
   - Evento: `cleanup_sessions_event` (cada 6 horas)
   - Tabla de auditoría: `session_cleanup_log`

3. **Índices Optimizados**
   - `idx_session_token` - Búsquedas rápidas de sesiones
   - `idx_expires_at` - Filtrado de sesiones activas
   - `idx_updated_at` - Tracking de sesiones recientes
   - `idx_tipo, idx_categoria, idx_visible` - Multimedia

4. **Foreign Keys**
   - Integridad referencial garantizada
   - Cascadas de eliminación automáticas cuando procede

## 📊 Estadísticas Disponibles

El endpoint `/api/admin/statistics` retorna:
- Total de usuarios (sin admins)
- Contenido multimedia visible
- Total de vistas en multimedia
- Simulaciones generadas
- Sesiones activas ahora
- Modelos 3D activos
- Desglose multimedia por tipo
- Contribuciones pendientes
- Top 5 usuarios por puntos

## 🐛 Solución de Problemas

### Error: "Sintaxis SQL"
- Asegúrate de importar el archivo completo sin modificaciones
- Verifica que phpMyAdmin soporte versión de MySQL

### Error: "Base de datos existe"
- Selecciona "Reemplazar" si se solicita duplicar
- O usa un nombre diferente

### Error: "Permiso denegado"
- Verifica permisos de usuario en hosting
- Contacta soporte de hosting si es necesario

### Eventos no se crean automáticamente
- Algunos hostings requieren `event_scheduler=ON`
- Solicita activación a soporte del hosting
- O ejecuta: `SET GLOBAL event_scheduler = ON;`

## 📝 Próximos Pasos

1. **Configurar credenciales de admin:**
   ```sql
   -- En phpMyAdmin, ejecuta en SQL:
   INSERT INTO admin_sessions (token, username, expires_at) 
   VALUES ('temp_token', 'admin', DATE_ADD(NOW(), INTERVAL 24 HOUR));
   ```

2. **Verificar que el backend está conectado:**
   - Prueba endpoint: `GET /api/auth/me`
   - Debe retornar usuario actual

3. **Cargar especialidades iniciales:**
   - Ya vienen precargadas (Programación, Mantenimiento Industrial)
   - Puedes agregar más en AdminPanel

## 🚀 Deploy Recomendado

1. Importar BD en hosting
2. Configurar variables de entorno
3. Ejecutar backend (FastAPI)
4. Ejecutar frontend (React)
5. Verificar en: `https://tu-dominio.com`

---

**Última actualización:** 10 abril 2026  
**Versión BD:** 2.0 (Optimización de sesiones)  
**Compatible con:** MySQL 5.7+ | phpMyAdmin 4.8+

# 🔄 Guía de Migración: MongoDB → MySQL/phpMyAdmin

## 📋 Resumen de Cambios

**El proyecto ahora usa MySQL en lugar de MongoDB para ser compatible con Hostinger y phpMyAdmin.**

---

## ✅ Lo que se ha Actualizado

### 1. **Backend (`server.py`)**
- ✅ Reescrito completamente (1048 líneas)
- ✅ Cambiado de `motor` (MongoDB) a `aiomysql` (MySQL)
- ✅ Todas las queries convertidas a SQL
- ✅ Connection pool para mejor rendimiento
- ✅ Manejo de JSON fields para MySQL

### 2. **Esquema de Base de Datos**
- ✅ Creado `database_schema.sql` completo
- ✅ 7 tablas definidas con relaciones
- ✅ Indices para optimización
- ✅ Datos iniciales (5 especialidades)

### 3. **Variables de Entorno (`.env`)**
- ❌ Removido: `MONGO_URL`, `DB_NAME`
- ✅ Agregado: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

### 4. **Dependencias (`requirements.txt`)**
- ❌ Removido: `motor` (MongoDB async driver)
- ✅ Agregado: `aiomysql==0.2.0`
- ✅ Agregado: `PyMySQL==1.1.1`

### 5. **Script de Inicialización**
- ✅ Creado `init_database.py`
- ✅ Inicializa todas las tablas automáticamente
- ✅ Inserta datos iniciales

---

## 📊 Esquema de Base de Datos

### Tablas Creadas:

```sql
cecyte04_dreams/
├── users               # Usuarios del sistema
├── user_sessions       # Sesiones activas
├── admin_sessions      # Sesiones de administradores
├── especialidades      # 5 carreras (datos precargados)
├── simulations         # Simulaciones generadas
├── models_3d           # Modelos 3D del plantel
└── tarjeta_positions   # Posiciones en tour 3D
```

### Campos JSON en MySQL:

Algunas columnas usan tipo `JSON` de MySQL:
- `especialidades.habilidades` → Array de strings
- `especialidades.campo_laboral` → Array de strings  
- `especialidades.posicion_3d` → Objeto {x, y, z}
- `simulations.intereses` → Array de strings
- `simulations.avatar_config` → Objeto completo
- `tarjeta_positions.position` → Objeto {x, y, z}
- `tarjeta_positions.rotation` → Objeto {x, y, z}

---

## 🚀 Instalación en Local

### Requisitos Previos:

1. **MySQL 8.0+** instalado y corriendo
2. **Python 3.9+**
3. **Dependencias actualizadas**

### Paso 1: Instalar MySQL

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
- Descargar desde: https://dev.mysql.com/downloads/installer/
- O usar XAMPP/WAMP que incluye phpMyAdmin

### Paso 2: Configurar Usuario MySQL (Opcional)

```bash
# Conectar a MySQL
sudo mysql -u root

# Dentro de MySQL:
CREATE USER 'cecyte04'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON cecyte04_dreams.* TO 'cecyte04'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Actualizar .env

```bash
cd /app/backend
nano .env
```

Configurar con tus credenciales:

```env
# MySQL Local
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"           # o "cecyte04" si creaste usuario
MYSQL_PASSWORD=""           # tu contraseña
MYSQL_DATABASE="cecyte04_dreams"
```

### Paso 4: Instalar Dependencias Python

```bash
cd /app/backend
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install aiomysql PyMySQL
```

### Paso 5: Inicializar Base de Datos

```bash
cd /app/backend
python3 init_database.py
```

**Salida esperada:**
```
============================================================
🚀 INICIALIZADOR DE BASE DE DATOS - CECyTE 04
============================================================
✅ Conectado a MySQL
✅ Base de datos creada/verificada
✅ Tabla creada: users
✅ Tabla creada: user_sessions
...
✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE
============================================================
```

### Paso 6: Iniciar Backend

```bash
cd /app/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Paso 7: Verificar

```bash
curl http://localhost:8001/api/health
```

Debe retornar:
```json
{
  "status": "healthy",
  "service": "cecyte04-dreams-api",
  "database": "MySQL",
  "connection": "OK"
}
```

---

## 🌐 Despliegue en Hostinger

### Configuración en Hostinger:

Hostinger proporciona acceso a MySQL y phpMyAdmin automáticamente.

#### **Paso 1: Obtener Credenciales MySQL**

1. Ir a **Panel de Control Hostinger**
2. Ir a **Bases de Datos** → **MySQL**
3. Crear nueva base de datos:
   - Nombre: `cecyte04_dreams`
   - Usuario: (se crea automáticamente)
   - Contraseña: (anotar)

4. Anotar las credenciales:
   ```
   Host: mysql-xxxxx.servers.hostinger.com
   Puerto: 3306
   Usuario: u123456789_cecyte04
   Contraseña: tu_contraseña_segura
   Base de datos: u123456789_cecyte04_dreams
   ```

#### **Paso 2: Importar Esquema con phpMyAdmin**

1. En Hostinger, ir a **phpMyAdmin**
2. Seleccionar tu base de datos
3. Ir a pestaña **"Importar"**
4. Subir el archivo `/app/backend/database_schema.sql`
5. Clic en **"Continuar"**

✅ Todas las tablas y datos iniciales se crearán automáticamente

#### **Paso 3: Configurar Variables de Entorno**

En tu servidor Hostinger, actualizar `.env`:

```env
# MySQL Hostinger
MYSQL_HOST="mysql-xxxxx.servers.hostinger.com"
MYSQL_PORT="3306"
MYSQL_USER="u123456789_cecyte04"
MYSQL_PASSWORD="tu_contraseña_segura"
MYSQL_DATABASE="u123456789_cecyte04_dreams"
```

#### **Paso 4: Desplegar Aplicación**

Opciones para desplegar en Hostinger:

**Opción A: Hosting Compartido (Solo Frontend)**
- Hostinger shared hosting solo soporta PHP/HTML/CSS/JS estáticos
- Necesitarás otro servicio para el backend Python (FastAPI)

**Opción B: VPS Hostinger (Frontend + Backend)**

```bash
# Conectar por SSH
ssh root@tu-vps-ip

# Instalar dependencias
sudo apt update
sudo apt install python3-pip python3-venv nodejs npm nginx mysql-client

# Clonar repositorio
cd /var/www
git clone tu-repo.git cecyte04
cd cecyte04

# Configurar backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar .env con credenciales Hostinger
nano .env

# Inicializar BD (si no usaste phpMyAdmin)
python3 init_database.py

# Frontend
cd ../frontend
npm install yarn -g
yarn install --ignore-engines
yarn build

# Configurar PM2
npm install -g pm2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name cecyte04-backend

# Configurar Nginx (ver archivo de configuración abajo)
```

#### **Paso 5: Verificar Conexión**

```bash
# Test desde servidor
curl http://localhost:8001/api/health

# Test con credenciales MySQL
mysql -h mysql-xxxxx.servers.hostinger.com -u u123456789_cecyte04 -p
# Ingresar contraseña
USE u123456789_cecyte04_dreams;
SHOW TABLES;
```

---

## 🔍 Verificar Datos con phpMyAdmin

### Acceder a phpMyAdmin:

1. Panel Hostinger → **phpMyAdmin**
2. Seleccionar base de datos `cecyte04_dreams`

### Verificar Tablas:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Ver especialidades precargadas
SELECT * FROM especialidades;

-- Ver usuarios registrados
SELECT user_id, email, name, is_admin FROM users;

-- Ver simulaciones creadas
SELECT simulation_id, nombre, carrera, created_at FROM simulations ORDER BY created_at DESC LIMIT 10;

-- Ver modelos 3D subidos
SELECT model_id, nombre, format, is_active FROM models_3d;
```

---

## 🆚 Diferencias MongoDB vs MySQL

### En el Código:

**ANTES (MongoDB):**
```python
# Conexión
client = AsyncIOMotorClient(mongo_url)
db = client['database_name']
collection = db['users']

# Insert
await collection.insert_one({"user_id": "123", "name": "Juan"})

# Find
user = await collection.find_one({"user_id": "123"})

# Update
await collection.update_one(
    {"user_id": "123"},
    {"$set": {"name": "Juan Carlos"}}
)

# Delete
await collection.delete_one({"user_id": "123"})
```

**AHORA (MySQL):**
```python
# Conexión
pool = await aiomysql.create_pool(
    host='localhost', user='root', db='database_name'
)
conn = await pool.acquire()
cursor = await conn.cursor(aiomysql.DictCursor)

# Insert
await cursor.execute(
    "INSERT INTO users (user_id, name) VALUES (%s, %s)",
    ("123", "Juan")
)

# Select
await cursor.execute("SELECT * FROM users WHERE user_id = %s", ("123",))
user = await cursor.fetchone()

# Update
await cursor.execute(
    "UPDATE users SET name = %s WHERE user_id = %s",
    ("Juan Carlos", "123")
)

# Delete
await cursor.execute("DELETE FROM users WHERE user_id = %s", ("123",))
```

### Ventajas de MySQL/phpMyAdmin:

✅ **Compatible con Hostinger** (hosting compartido incluye MySQL)
✅ **phpMyAdmin** pre-instalado (interfaz gráfica)
✅ **Relaciones SQL** (foreign keys, joins)
✅ **Backups fáciles** (export SQL con 1 clic)
✅ **Familiar** para mayoría de desarrolladores
✅ **Herramientas** (MySQL Workbench, DBeaver, etc.)

### Consideraciones:

⚠️ **JSON fields**: MySQL soporta JSON pero con sintaxis diferente a MongoDB
⚠️ **Esquema fijo**: Debes definir columnas (no como MongoDB que es schema-less)
✅ **Performance**: Similar para esta escala de proyecto

---

## 🐛 Solución de Problemas

### Error: "Can't connect to MySQL server"

**Causa**: MySQL no está corriendo o credenciales incorrectas

**Solución:**
```bash
# Verificar estado
sudo systemctl status mysql

# Iniciar MySQL
sudo systemctl start mysql

# Verificar conexión manual
mysql -h localhost -u root -p
```

### Error: "Access denied for user"

**Causa**: Contraseña incorrecta o usuario sin permisos

**Solución:**
```bash
# Reset contraseña root
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nueva_password';
FLUSH PRIVILEGES;
EXIT;

# Actualizar .env con nueva contraseña
```

### Error: "Table doesn't exist"

**Causa**: Base de datos no inicializada

**Solución:**
```bash
cd /app/backend
python3 init_database.py
```

### phpMyAdmin: "Error importing file"

**Causa**: Archivo SQL muy grande o timeout

**Solución:**
```bash
# Importar desde terminal
mysql -u usuario -p database_name < database_schema.sql

# O dividir el archivo en partes más pequeñas
```

---

## 📝 Scripts Útiles

### Backup de Base de Datos:

```bash
# Backup completo
mysqldump -u root -p cecyte04_dreams > backup_$(date +%Y%m%d).sql

# Backup solo estructura
mysqldump -u root -p --no-data cecyte04_dreams > schema_only.sql

# Backup solo datos
mysqldump -u root -p --no-create-info cecyte04_dreams > data_only.sql
```

### Restaurar Backup:

```bash
mysql -u root -p cecyte04_dreams < backup_20250128.sql
```

### Limpiar Base de Datos:

```bash
# Conectar a MySQL
mysql -u root -p

# Eliminar BD
DROP DATABASE IF EXISTS cecyte04_dreams;

# Volver a crear
CREATE DATABASE cecyte04_dreams CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Salir e inicializar
EXIT;
python3 init_database.py
```

---

## 📚 Documentación Adicional

- **MySQL Documentation**: https://dev.mysql.com/doc/
- **phpMyAdmin Manual**: https://docs.phpmyadmin.net/
- **aiomysql Documentation**: https://aiomysql.readthedocs.io/
- **Hostinger Tutorials**: https://support.hostinger.com/

---

## ✅ Checklist de Migración

- [ ] MySQL instalado y corriendo
- [ ] Credenciales configuradas en `.env`
- [ ] Dependencias Python instaladas (`aiomysql`, `PyMySQL`)
- [ ] Base de datos inicializada (`init_database.py`)
- [ ] Backend iniciado sin errores
- [ ] Endpoint `/api/health` responde "OK"
- [ ] phpMyAdmin accesible (si aplica)
- [ ] Tablas visibles en phpMyAdmin
- [ ] Datos iniciales (5 especialidades) cargados
- [ ] Frontend conecta correctamente al backend
- [ ] Simulador de futuro funciona
- [ ] Tour 3D funciona
- [ ] Panel admin accesible

---

**¡Migración completa! Ahora tu proyecto es 100% compatible con Hostinger y phpMyAdmin.** 🎉

---

**Desarrollado con ❤️ para CECyTE 04 - Tlaxcala, México**

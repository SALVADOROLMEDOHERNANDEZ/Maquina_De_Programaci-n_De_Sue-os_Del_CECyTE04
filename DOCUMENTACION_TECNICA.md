╔══════════════════════════════════════════════════════════════════════════════╗
║               DOCUMENTACIÓN TÉCNICA - SISTEMA DE MIGRACIONES                  ║
║                          CECyTE 04 - Dream Machine                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 TABLA DE CONTENIDOS
═════════════════════════════════════════════════════════════════════════════════

1. Arquitectura del Sistema
2. Estructura de Archivos
3. API Endpoints
4. Base de Datos
5. Componentes Frontend
6. Flujo de Ejecución
7. Manejo de Errores
8. Testing
9. Deployment


1️⃣  ARQUITECTURA DEL SISTEMA
═════════════════════════════════════════════════════════════════════════════════

COMPONENTES:
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  FRONTEND (React)                                                │
│  ├── MigrationManager.jsx (UI)                                   │
│  └── AdminPanel.js (Integración)                                 │
│                                                                   │
│  ↓↑ HTTP/REST                                                    │
│                                                                   │
│  BACKEND (FastAPI)                                               │
│  ├── server.py (Endpoints)                                       │
│  └── migrations.py (Lógica)                                      │
│                                                                   │
│  ↓↑ MySQL                                                        │
│                                                                   │
│  DATABASE (MySQL)                                                │
│  ├── schema_migrations (Control)                                 │
│  └── Otras tablas (Datos)                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

FLUJO GENERAL:
1. Admin accede a MigrationManager
2. Llena formulario y ejecuta
3. Frontend envía POST a /admin/migrations/execute
4. Backend parsea SQL y ejecuta
5. BD registra cambio en schema_migrations
6. Resultado se muestra al admin


2️⃣  ESTRUCTURA DE ARCHIVOS
═════════════════════════════════════════════════════════════════════════════════

BACKEND:
backend/
├── migrations.py .................. Módulo de migraciones (SQL)
├── server.py ....................... FastAPI con endpoints
└── requirements.txt ................ Dependencias Python

FRONTEND:
frontend/src/
├── components/admin/
│   ├── MigrationManager.jsx ........ Componente principal
│   ├── StatsDashboard.jsx ......... Dashboard de stats
│   └── MediaManager.jsx ........... Gestor de multimedia
└── pages/
    └── AdminPanel.js .............. Página de admin

DOCUMENTACIÓN:
├── MIGRACIONES_INICIO_RAPIDO.md .... Guía de inicio (5 min)
├── MIGRACIONES_BD_GUIA_COMPLETA.md . Guía detallada
└── DOCUMENTACION_TECNICA.md ........ Este archivo


3️⃣  API ENDPOINTS
═════════════════════════════════════════════════════════════════════════════════

ENDPOINT 1: Ejecutar Migración
──────────────────────────────

POST /api/admin/migrations/execute

Autenticación: Requiere ADMIN_TOKEN

Body:
{
  "version": "001",
  "description": "Agregar teléfono a usuarios",
  "sql_commands": "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);",
  "migration_type": "custom"
}

Response (Success):
{
  "success": true,
  "version": "001",
  "message": "✅ Migración 001 ejecutada correctamente",
  "timestamp": "2026-04-17T14:30:00+00:00"
}

Response (Failure):
{
  "success": false,
  "version": "001",
  "error": "Error al ejecutar: Syntax error in SQL",
  "timestamp": "2026-04-17T14:30:00+00:00"
}

Códigos HTTP:
  ✅ 200: Success
  ❌ 400: Validación fallida
  ❌ 403: No autorizado (no admin)
  ❌ 500: Error de servidor


ENDPOINT 2: Crear Migración por Tipo
────────────────────────────────────

POST /api/admin/migrations/create-by-type

Body:
{
  "version": "001",
  "description": "Agregar teléfono",
  "migration_type": "add_column",
  "table": "users",
  "column": "phone_number",
  "data_type": "VARCHAR(20)",
  "nullable": true
}

Response:
{
  "success": true,
  "version": "001",
  "migration_type": "add_column",
  "sql_generated": "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);",
  "message": "✅ Migración 001 ejecutada correctamente"
}


ENDPOINT 3: Obtener Historial
─────────────────────────────

GET /api/admin/migrations/history?limit=50

Response:
{
  "total": 5,
  "limit": 50,
  "migrations": [
    {
      "id": 1,
      "version": "001",
      "description": "Agregar teléfono",
      "status": "success",
      "executed_at": "2026-04-17T14:30:00+00:00",
      "error_message": null,
      "rollback_available": true
    },
    ...
  ]
}


ENDPOINT 4: Obtener Migraciones Pendientes
──────────────────────────────────────────

GET /api/admin/migrations/pending

Response:
{
  "executed_migrations": ["001", "002", "003"],
  "total_executed": 3,
  "last_sync": "2026-04-17T14:35:00+00:00"
}


ENDPOINT 5: Validar Schema
───────────────────────────

POST /api/admin/migrations/validate

Response:
{
  "validation": {
    "timestamp": "2026-04-17T14:35:00+00:00",
    "database": "cecyte04_dreams",
    "tables": {
      "users": {
        "status": "ok",
        "column_count": 15,
        "columns": ["user_id", "email", "name", "phone_number", ...]
      },
      "simulations": {...},
      ...
    },
    "errors": []
  },
  "timestamp": "2026-04-17T14:35:00+00:00",
  "status": "valid"
}


ENDPOINT 6: Obtener Templates
──────────────────────────────

GET /api/admin/migrations/templates

Response:
{
  "templates": {
    "add_user_field": {
      "description": "Agregar campo de teléfono a usuarios",
      "sql": "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);",
      "version": "001"
    },
    ...
  },
  "docs": {
    "add_column": "ALTER TABLE table_name ADD COLUMN column_name DATA_TYPE;",
    ...
  }
}


4️⃣  BASE DE DATOS - TABLA schema_migrations
═════════════════════════════════════════════════════════════════════════════════

ESTRUCTURA:
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rollback_available BOOLEAN DEFAULT TRUE,
    status ENUM('success', 'failed', 'pending') DEFAULT 'success',
    error_message TEXT,
    INDEX idx_version (version),
    INDEX idx_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CAMPOS:
  id: Identificador único
  version: Número de versión (001, 002, etc)
  description: Descripción del cambio
  executed_at: Cuándo se ejecutó
  rollback_available: Si se puede revertir
  status: success/failed/pending
  error_message: Mensaje de error si falló

EJEMPLO DE REGISTRO:
id: 1
version: 001
description: Agregar teléfono a usuarios
executed_at: 2026-04-17 14:30:00
rollback_available: TRUE
status: success
error_message: NULL


5️⃣  COMPONENTES FRONTEND
═════════════════════════════════════════════════════════════════════════════════

COMPONENTE: MigrationManager.jsx
────────────────────────────────

Estados:
  - activeTab: Tab activa (execute, history, templates, validate)
  - migrations: Historial de migraciones
  - loading: Estado de carga
  - formData: Datos del formulario
  - result: Resultado de ejecución
  - validated: Resultado de validación

Props: Ninguna (se conecta al backend directamente)

Métodos principales:
  - executeMigration(): POST a /admin/migrations/execute
  - loadMigrationHistory(): GET a /admin/migrations/history
  - validateSchema(): POST a /admin/migrations/validate
  - loadTemplates(): GET a /admin/migrations/templates
  - loadTemplate(): Carga un template en el formulario
  - copyToClipboard(): Copia SQL al portapapeles

Tabs:
  1. Execute: Formulario para ejecutar migración
  2. History: Lista de migraciones ejecutadas
  3. Templates: Templates predefinidos
  4. Validate: Validación de schema

INTEGRACIÓN EN ADMINPANEL:
  import MigrationManager from '../components/admin/MigrationManager';
  
  {activeTab === 'migrations' && (
    <div>
      <MigrationManager />
    </div>
  )}


6️⃣  FLUJO DE EJECUCIÓN
═════════════════════════════════════════════════════════════════════════════════

FLUJO PASO A PASO:

┌─ FRONTEND: Admin hace click en "Ejecutar Migración"
│
├─ Valida formulario
│  ✓ Versión no vacía
│  ✓ Descripción no vacía
│  ✓ SQL no vacío
│  └─ Si algo falta → Muestra error ❌
│
├─ POST /api/admin/migrations/execute
│  {version, description, sql_commands, migration_type}
│
└─ BACKEND: Recibe solicitud

   ├─ Verifica autenticación (require_admin)
   │  └─ Si no admin → 403 Forbidden ❌
   │
   ├─ Conecta a MySQL
   │  └─ Si falla → 500 Error ❌
   │
   ├─ Crea tabla schema_migrations si no existe
   │
   ├─ Verifica si version ya fue ejecutada
   │  └─ Si existe → Error de versión duplicada ❌
   │
   ├─ Divide SQL por punto y coma
   │
   ├─ Ejecuta cada comando SQL
   │  ├─ Si es exitoso → Commit ✅
   │  └─ Si falla → Rollback automático ❌
   │
   ├─ Registra en schema_migrations
   │  {version, description, status, executed_at, error_message}
   │
   └─ Retorna resultado


CÓDIGO DE LA FUNCIÓN (server.py):

async def execute_migration_endpoint(request, migration_data):
    admin = await require_admin(request)
    
    migration_manager = DatabaseMigration(db_config)
    migration_manager.connect()
    
    try:
        migration_manager.create_migrations_table()
        
        success, message = migration_manager.execute_migration(
            migration_data.version,
            migration_data.sql_commands,
            migration_data.description
        )
        
        return {
            "success": success,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    finally:
        migration_manager.disconnect()


7️⃣  MANEJO DE ERRORES
═════════════════════════════════════════════════════════════════════════════════

TIPO 1: SQL Syntax Error
────────────────────────
Causa: SQL mal escrito
Ejemplo: "ALTER TABLE users ADD phone_number VARCHAR(20)" (sin ; ni COLUMN)

Acción automática:
  1. Captura la excepción de MySQL
  2. Registra error en schema_migrations
  3. Revierte con ROLLBACK
  4. Retorna mensaje de error
  
Solución:
  • Revisar sintaxis del SQL
  • Usar validador SQL online
  • Consultar documentación SQL


TIPO 2: Migración duplicada
──────────────────────────
Causa: Version ya fue ejecutada
Ejemplo: Ejecutar versión "001" dos veces

Acción automática:
  1. Detecta versión duplicada
  2. Retorna error "Ya fue ejecutada"
  3. NO ejecuta SQL

Solución:
  • Usar otra versión (002, 003, etc)


TIPO 3: Tabla/columna no existe
───────────────────────────────
Causa: Nombre incorrecto o tabla eliminada
Ejemplo: ALTER TABLE users_old ADD COLUMN phone; (users_old no existe)

Acción automática:
  1. MySQL lanza error
  2. Se registra el error
  3. Se revierte automáticamente
  
Solución:
  • Verificar nombre de tabla en schema_migrations
  • Usar endpoint /validate para ver estructura actual


TIPO 4: Constraint violation
────────────────────────────
Causa: Violar restricción de foreign key
Ejemplo: ADD FOREIGN KEY de tabla que no existe

Acción automática:
  1. MySQL rechaza operación
  2. Se registra error
  3. Se revierte
  
Solución:
  • Crear tabla referenciada primero
  • Verificar que tipos de dato coincidan


MANEJO EN CÓDIGO (migrations.py):

def execute_migration(self, version, sql_commands, description):
    try:
        # Verificar versión
        if version in self.get_executed_migrations():
            return False, f"Migración {version} ya fue ejecutada"
        
        # Ejecutar SQL
        commands = sql_commands.split(';')
        for command in commands:
            if command.strip():
                self.cursor.execute(command)
                self.connection.commit()
        
        # Registrar éxito
        self.record_migration(version, description, True)
        return True, f"✅ Migración {version} ejecutada"
        
    except MySQLError as e:
        # Rollback automático
        self.connection.rollback()
        # Registrar error
        self.record_migration(version, description, False, str(e))
        return False, f"Error: {str(e)}"


8️⃣  TESTING
═════════════════════════════════════════════════════════════════════════════════

PRUEBA 1: Agregar columna
─────────────────────────
Version: 001
SQL: ALTER TABLE users ADD COLUMN test_field VARCHAR(50);

Validación:
  ✅ Migración registrada en schema_migrations
  ✅ Columna existe en tabla users
  ✅ Datos existentes intactos
  ✅ Puede hacer REVERT sin problemas


PRUEBA 2: Migración duplicada
─────────────────────────────
Ejecutar versión 001 dos veces

Validación:
  ✅ Segunda ejecución rechazada
  ✅ Mensaje de error claro
  ✅ BD sin cambios


PRUEBA 3: SQL inválido
──────────────────────
SQL: "INVALID SQL HERE"

Validación:
  ✅ Error capturado
  ✅ Registrado en schema_migrations con status=failed
  ✅ BD sin cambios
  ✅ Puede intentar de nuevo


PRUEBA 4: Foreign key constraint
────────────────────────────────
SQL: ALTER TABLE simulations ADD FOREIGN KEY (nonexistent_table_id)

Validación:
  ✅ Error capturado
  ✅ Rollback automático
  ✅ BD consistente


TEST SCRIPT PYTHON:

import asyncio
from migrations import DatabaseMigration

async def test_migrations():
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'cecyte04_dreams'
    }
    
    migration = DatabaseMigration(db_config)
    migration.connect()
    migration.create_migrations_table()
    
    # Test 1: Ejecutar migración
    success, msg = migration.execute_migration(
        "test_001",
        "ALTER TABLE users ADD COLUMN test_field VARCHAR(50);",
        "Test migration"
    )
    assert success == True
    print(f"✅ Test 1 passed: {msg}")
    
    # Test 2: Migración duplicada
    success, msg = migration.execute_migration(
        "test_001",
        "ALTER TABLE users ADD COLUMN test_field2 VARCHAR(50);",
        "Test duplicate"
    )
    assert success == False
    print(f"✅ Test 2 passed: {msg}")
    
    # Test 3: Limpiar
    migration.cursor.execute("ALTER TABLE users DROP COLUMN test_field")
    migration.connection.commit()
    
    migration.disconnect()
    print("✅ All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_migrations())


9️⃣  DEPLOYMENT
═════════════════════════════════════════════════════════════════════════════════

PASO 1: Preparar ambiente
─────────────────────────
1. Copiar migrations.py al directorio backend/
2. pip install mysql-connector-python
3. Verificar variables de entorno (.env):
   - MYSQL_HOST
   - MYSQL_USER
   - MYSQL_PASSWORD
   - MYSQL_DATABASE


PASO 2: Inicializar BD
─────────────────────
1. Ejecutar script init_database.py
2. Esto crea la tabla schema_migrations
3. Cargar schema.sql para estructura inicial


PASO 3: Desplegar frontend
──────────────────────────
1. Importar MigrationManager en AdminPanel.js
2. Agregar tab de migraciones
3. Build: npm run build
4. Servir desde backend o CDN


PASO 4: Verificar funcionamiento
────────────────────────────────
1. Acceder al panel de admin
2. Ir a Migraciones BD
3. Ejecutar una migración de prueba
4. Verificar en Historial
5. Validar schema


CHECKLIST PRE-PRODUCTION:
  ☐ Backup de BD
  ☐ Verificar conexión MySQL
  ☐ Probar endpoints con Postman
  ☐ Probar UI en navegador
  ☐ Validar schema
  ☐ Prueba de migración simple
  ☐ Prueba de error handling
  ☐ CORS configurado correctamente
  ☐ Autenticación funcionando
  ☐ Logs configurados


════════════════════════════════════════════════════════════════════════════════
ARCHIVO: migrations.py
════════════════════════════════════════════════════════════════════════════════

CLASES PRINCIPALES:

class DatabaseMigration:
  def __init__(db_config)
  def connect()
  def disconnect()
  def create_migrations_table()
  def get_executed_migrations()
  def record_migration(version, description, success, error_msg)
  def execute_migration(version, sql_commands, description)
  def get_migration_history()
  def rollback_migration(version, rollback_sql)
  def validate_schema()

class MigrationBuilder:
  @staticmethod create_migration(version, description, type, details)
  @staticmethod _build_add_column(details)
  @staticmethod _build_modify_column(details)
  @staticmethod _build_drop_column(details)
  @staticmethod _build_add_table(details)
  @staticmethod _build_add_index(details)


════════════════════════════════════════════════════════════════════════════════
MONITOREO Y LOGS
════════════════════════════════════════════════════════════════════════════════

LOGS A VERIFICAR:
  1. server.py logging:
     logger.error(f"Migration execution error: {e}")
  
  2. schema_migrations table:
     SELECT * FROM schema_migrations ORDER BY executed_at DESC;
  
  3. DB Event logs (si está habilitado)

QUERIES ÚTILES:
  # Ver todas las migraciones
  SELECT * FROM schema_migrations ORDER BY executed_at DESC;
  
  # Ver solo las exitosas
  SELECT * FROM schema_migrations WHERE status='success';
  
  # Ver errores
  SELECT * FROM schema_migrations WHERE status='failed';
  
  # Contar migraciones
  SELECT COUNT(*) as total FROM schema_migrations;
  
  # Última migración
  SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 1;


════════════════════════════════════════════════════════════════════════════════
SOPORTE Y MANTENIMIENTO
════════════════════════════════════════════════════════════════════════════════

PROBLEMAS COMUNES Y SOLUCIONES:

P: "Connection refused"
R: Verificar que MySQL está corriendo y credentials en .env son correctas

P: "Table already exists"
R: Usar CREATE TABLE IF NOT EXISTS

P: "Duplicate entry"
R: Versión ya fue ejecutada, usar versión diferente

P: "Access denied for user"
R: Verificar permisos del usuario MySQL


MEJORAS FUTURAS:
  • UI para crear SQL visualmente
  • Sincronización automática de versiones
  • Rollback automático de múltiples migraciones
  • Exportar historial de migraciones
  • Comparar schemas entre ambientes
  • Predicción de conflictos
  • Integración con Git


════════════════════════════════════════════════════════════════════════════════
REFERENCIAS
════════════════════════════════════════════════════════════════════════════════

Documentación MySQL:
  https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

Migraciones en otros frameworks:
  • Laravel Migrations
  • Django Migrations  
  • Flyway
  • Liquibase

FastAPI:
  https://fastapi.tiangolo.com/

React:
  https://react.dev

════════════════════════════════════════════════════════════════════════════════
Documento generado: 17/04/2026
Última actualización: 17/04/2026
Versión: 1.0
════════════════════════════════════════════════════════════════════════════════

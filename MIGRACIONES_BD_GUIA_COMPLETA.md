╔══════════════════════════════════════════════════════════════════════════════╗
║                    GUÍA DEL SISTEMA DE MIGRACIONES BD                         ║
║                          CECyTE 04 - Dream Machine                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

📚 ÍNDICE
═════════════════════════════════════════════════════════════════════════════════

1. ¿QUÉ ES EL SISTEMA DE MIGRACIONES?
2. PROBLEMAS QUE RESUELVE
3. CÓMO ACCEDER
4. TABS Y FUNCIONALIDADES
5. TIPOS DE MIGRACIONES
6. GUÍA PASO A PASO
7. TEMPLATES DISPONIBLES
8. CASOS DE USO COMUNES
9. SOLUCIÓN DE PROBLEMAS


1️⃣  ¿QUÉ ES EL SISTEMA DE MIGRACIONES?
═════════════════════════════════════════════════════════════════════════════════

El Sistema de Migraciones es una herramienta que te permite hacer cambios en la
estructura de la base de datos (schema) de forma SEGURA, sin perder datos.

▪ ANTES (sin migraciones):
  ❌ Tenías que borrar la BD completa
  ❌ Importar el nuevo schema
  ❌ Perder TODOS los registros y datos de usuarios
  ❌ Mucho trabajo manual

▪ AHORA (con migraciones):
  ✅ Ejecutar cambios sin afectar datos
  ✅ Historial de todos los cambios
  ✅ Revertir cambios si es necesario
  ✅ Cambios rastreables y documentados
  ✅ Seguridad y estabilidad


2️⃣  PROBLEMAS QUE RESUELVE
═════════════════════════════════════════════════════════════════════════════════

PROBLEMA 1: Agregar un nuevo campo a usuarios
   ❌ ANTES: Borrar la BD y reimportarla
   ✅ AHORA: Una migración de 30 segundos

PROBLEMA 2: Modificar tipo de datos de una columna
   ❌ ANTES: Exportar datos, borrar BD, cambiar schema, reimportar
   ✅ AHORA: Una línea de SQL en una migración

PROBLEMA 3: Arreglar errores en el schema
   ❌ ANTES: Perder todos los datos históricos
   ✅ AHORA: Revertir la migración problema, todos los datos intactos

PROBLEMA 4: Documentar cambios
   ❌ ANTES: ¿Cuándo se agregó tal columna? ¿Quién lo hizo?
   ✅ AHORA: Historial completo con timestamps y descripciones


3️⃣  CÓMO ACCEDER
═════════════════════════════════════════════════════════════════════════════════

1. Ir a: http://localhost:3000 (o tu URL de frontend)
2. Iniciar sesión como ADMIN
3. Ir al Panel de Admin
4. Click en el botón "🔧 Migraciones BD"
5. ¡Listo! Estás en el Sistema de Migraciones


4️⃣  TABS Y FUNCIONALIDADES
═════════════════════════════════════════════════════════════════════════════════

TAB 1: ▶ EJECUTAR MIGRACIÓN
────────────────────────────────────────────
Aquí es donde EJECUTAS los cambios en la BD.

Campos a completar:
  ▪ Versión: Identificador único (001, 002, 003)
  ▪ Descripción: Qué hace este cambio
  ▪ Comandos SQL: Los comandos que se ejecutarán
  ▪ Tipo: custom (SQL personalizado)

Ejemplo:
  ┌─ VERSIÓN: 001
  │  DESCRIPCIÓN: Agregar teléfono a usuarios
  │  SQL: ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
  └─

⚠️  IMPORTANTE:
    • Haz BACKUP antes de ejecutar
    • Cada comando debe terminar en punto y coma (;)
    • Si algo sale mal, el cambio se revierte automáticamente


TAB 2: 📋 HISTORIAL
────────────────────────────────────────────
Aquí VES el historial de todas las migraciones ejecutadas.

Información mostrada:
  ▪ Versión (001, 002, etc)
  ▪ Descripción del cambio
  ▪ Estado (SUCCESS o FAILED)
  ▪ Fecha y hora de ejecución
  ▪ Mensaje de error (si hubo)

✅ SUCCESS = El cambio se aplicó correctamente
❌ FAILED = Hubo un error, se revirtió automáticamente


TAB 3: 📝 TEMPLATES
────────────────────────────────────────────
Templates predefinidos para operaciones comunes.

Disponibles:
  ✓ Agregar columna nueva
  ✓ Modificar tipo de columna
  ✓ Crear tabla de backup
  ✓ Crear tabla de auditoría
  ✓ Crear índices de performance
  ✓ Y más...

Uso: Click en "Usar" → Se carga en el formulario → Personaliza → Ejecuta


TAB 4: ✓ VALIDAR SCHEMA
────────────────────────────────────────────
Valida que tu BD sea correcta y esté intacta.

Verifica:
  ✓ Todas las tablas existen
  ✓ Todas las columnas están presentes
  ✓ Tipos de datos son correctos
  ✓ Relaciones entre tablas

Genera un REPORTE completo de la estructura actual.


5️⃣  TIPOS DE MIGRACIONES
═════════════════════════════════════════════════════════════════════════════════

TIPO 1: AGREGAR COLUMNA
──────────────────────
Añade un nuevo campo a una tabla existente.

Ejemplo:
  ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
  ALTER TABLE users ADD COLUMN birth_date DATE;
  ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT FALSE;

Casos de uso:
  • Agregar campo de teléfono
  • Agregar fecha de nacimiento
  • Agregar flag de verificación
  • Agregar campo de dirección


TIPO 2: MODIFICAR COLUMNA
─────────────────────────
Cambia las propiedades de una columna existente.

Ejemplo:
  ALTER TABLE users MODIFY COLUMN email VARCHAR(500);
  ALTER TABLE users MODIFY COLUMN nombre VARCHAR(300) NOT NULL;

Casos de uso:
  • Aumentar longitud de campos
  • Cambiar de nullable a NOT NULL
  • Cambiar tipo de dato


TIPO 3: ELIMINAR COLUMNA
────────────────────────
Elimina un campo de una tabla.

⚠️  CUIDADO: Esto es IRREVERSIBLE (en el dato, pero la migración se registra)

Ejemplo:
  ALTER TABLE users DROP COLUMN old_field;

Casos de uso:
  • Eliminar campos obsoletos
  • Limpiar schema


TIPO 4: CREAR TABLA NUEVA
─────────────────────────
Crea una nueva tabla en la BD.

Ejemplo:
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    theme VARCHAR(50) DEFAULT 'dark',
    notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

Casos de uso:
  • Crear tabla de configuración
  • Crear tabla de auditoría
  • Crear tabla de backup


TIPO 5: CREAR ÍNDICE
────────────────────
Crea índice para mejorar velocidad de búsquedas.

Ejemplo:
  CREATE INDEX idx_user_email ON users (email);
  CREATE INDEX idx_user_created_at ON users (created_at);

Casos de uso:
  • Optimizar búsquedas por email
  • Optimizar búsquedas por fecha
  • Mejorar performance general


6️⃣  GUÍA PASO A PASO - EJEMPLO PRÁCTICO
═════════════════════════════════════════════════════════════════════════════════

ESCENARIO: Quiero agregar campo de teléfono a los usuarios

PASO 1: Ir a "Migraciones BD" en el admin
──────
Click en el botón de Migraciones

PASO 2: Completar formulario
──────
Versión:      001
Descripción:  Agregar teléfono a usuarios
SQL:          ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

PASO 3: Click en "▶ Ejecutar Migración"
──────
El sistema:
  1. Conecta a la BD
  2. Ejecuta el comando SQL
  3. Registra la migración
  4. Muestra confirmación

PASO 4: Ver en Historial
──────
Vuelvo a "Historial" y veo:
  ✅ Versión 001 - SUCCESS
  📅 Fecha: 17/04/2026 14:30:00
  📝 Agregar teléfono a usuarios

PASO 5: Validar
──────
Click en "✓ Validar Schema" para confirmar que todo está bien.


7️⃣  TEMPLATES DISPONIBLES
═════════════════════════════════════════════════════════════════════════════════

TEMPLATE 1: Agregar campo de usuario
─────────────────────────────────────
Descripción: Agrega campo de teléfono a usuarios
SQL:
  ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

Versión: 001


TEMPLATE 2: Crear tabla de backup
──────────────────────────────────
Descripción: Tabla para guardar backups de datos
SQL:
  CREATE TABLE IF NOT EXISTS data_backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    backup_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

Versión: 003


TEMPLATE 3: Crear tabla de auditoría
─────────────────────────────────────
Descripción: Registra cambios de admin
SQL:
  CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

Versión: 004


8️⃣  CASOS DE USO COMUNES
═════════════════════════════════════════════════════════════════════════════════

CASO 1: Agregar múltiples campos
─────────────────────────────────
Quiero agregar teléfono, dirección y ciudad.

SQL:
  ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
  ALTER TABLE users ADD COLUMN address TEXT;
  ALTER TABLE users ADD COLUMN city VARCHAR(100);

🎯 Versión: 001
📝 Descripción: Agregar información de contacto


CASO 2: Cambiar longitud de campo
─────────────────────────────────
La columna 'nombre' es muy pequeña (100), necesito 300.

SQL:
  ALTER TABLE users MODIFY COLUMN nombre VARCHAR(300);

🎯 Versión: 002
📝 Descripción: Aumentar longitud de campo nombre


CASO 3: Hacer campo obligatorio
─────────────────────────────────
El email debe ser obligatorio (no puede ser NULL).

SQL:
  ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL;

🎯 Versión: 003
📝 Descripción: Hacer email obligatorio


CASO 4: Crear tabla de configuración
──────────────────────────────────────
Necesito una tabla para guardar configuraciones del admin.

SQL:
  CREATE TABLE IF NOT EXISTS admin_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

🎯 Versión: 004
📝 Descripción: Crear tabla de configuración de admin


CASO 5: Agregar índice para optimizar búsqueda
───────────────────────────────────────────────
Las búsquedas de usuarios por email son lentas.

SQL:
  CREATE INDEX idx_email ON users (email);
  CREATE INDEX idx_created_at ON users (created_at);

🎯 Versión: 005
📝 Descripción: Agregar índices para optimizar búsquedas


9️⃣  SOLUCIÓN DE PROBLEMAS
═════════════════════════════════════════════════════════════════════════════════

PROBLEMA 1: "Error: Syntax error"
──────────────────────────────────
Causas posibles:
  ❌ Falta el punto y coma (;) al final
  ❌ Hay un espacio o carácter especial mal
  ❌ Falta un paréntesis

Solución:
  ✅ Revisa la sintaxis SQL
  ✅ Verifica que cada comando termine en ;
  ✅ Usa un validador SQL online si no estás seguro


PROBLEMA 2: "Migration version already executed"
──────────────────────────────────────────────────
Causas:
  ❌ Ya ejecutaste esta versión antes

Solución:
  ✅ Usa una versión diferente (002, 003, etc)
  ✅ Si es necesario ejecutar de nuevo, usa versión +1


PROBLEMA 3: "Table 'users' doesn't exist"
──────────────────────────────────────────
Causas:
  ❌ La tabla no existe o tiene otro nombre
  ❌ Escribiste mal el nombre

Solución:
  ✅ Valida el schema en la tab "Validar Schema"
  ✅ Verifica los nombres de las tablas
  ✅ Usa nombres exactos (sensibles a mayúsculas)


PROBLEMA 4: "Cannot add foreign key constraint"
────────────────────────────────────────────────
Causas:
  ❌ La tabla referenciada no existe
  ❌ El tipo de dato no coincide

Solución:
  ✅ Asegúrate que la tabla existe
  ✅ Los tipos de datos deben ser iguales
  ✅ Valida con el schema antes


PROBLEMA 5: "Need to revert a migration"
─────────────────────────────────────────
Causas:
  ❌ Ejecutaste una migración incorrecta
  ❌ Necesitas deshacer cambios

Solución:
  🔄 El sistema registra TODO - puedes crear una nueva migración que revierta
  
  Ejemplo: Si agregaste una columna por error
  
  // Migración original (001):
  ALTER TABLE users ADD COLUMN temp_field VARCHAR(100);
  
  // Migración para revertir (002):
  ALTER TABLE users DROP COLUMN temp_field;

  ✅ La columna se elimina pero el historial queda registrado


1️⃣0️⃣ MEJORES PRÁCTICAS
═════════════════════════════════════════════════════════════════════════════════

✅ HAZLO:
  ✓ Hacer BACKUP antes de ejecutar migraciones críticas
  ✓ Usar versiones secuenciales (001, 002, 003...)
  ✓ Escribir descripciones claras
  ✓ Validar el schema después de cambios
  ✓ Revisar el SQL antes de ejecutar
  ✓ Usar templates para operaciones comunes
  ✓ Documentar por qué hiciste el cambio

❌ NO LO HAGAS:
  ✗ Cambiar datos directamente en phpMyAdmin durante desarrollo
  ✗ Usar versiones duplicadas
  ✗ No documentar cambios
  ✗ Ejecutar SQL sin probar primero
  ✗ Confiar solo en memoria - registra TODO
  ✗ Cambiar tables críticas sin backup


═════════════════════════════════════════════════════════════════════════════════
Preguntas frecuentes: Consulta con tu profesor o administrador
Documentación: https://github.com/tu-repo/migraciones-bd
═════════════════════════════════════════════════════════════════════════════════

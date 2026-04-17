╔══════════════════════════════════════════════════════════════════════════════╗
║                   MIGRACIONES BD - INICIO RÁPIDO (5 MINUTOS)                  ║
║                          CECyTE 04 - Dream Machine                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

⏱️  TIEMPO ESTIMADO: 5 minutos
🎯 OBJETIVO: Ejecutar tu primera migración

════════════════════════════════════════════════════════════════════════════════
PASO 1: ACCEDER AL PANEL (1 min)
════════════════════════════════════════════════════════════════════════════════

1. Abre tu navegador
2. Ve a: http://localhost:3000
3. Inicia sesión como ADMIN
4. Click en "🔧 Migraciones BD"

Resultado: Ves el panel de migraciones ✅


════════════════════════════════════════════════════════════════════════════════
PASO 2: COPIAR UN TEMPLATE (1 min)
════════════════════════════════════════════════════════════════════════════════

1. Click en la tab "📝 Templates"
2. Busca "add_user_field"
3. Click en el botón "📥 Usar"

Resultado: El formulario se rellena automáticamente ✅


════════════════════════════════════════════════════════════════════════════════
PASO 3: PERSONALIZAR LA MIGRACIÓN (2 min)
════════════════════════════════════════════════════════════════════════════════

El formulario ahora tiene:

┌─────────────────────────────────────────────────────┐
│ Versión: 001                                        │
│ Descripción: Agregar teléfono a usuarios           │
│ SQL: ALTER TABLE users ADD COLUMN phone_number ... │
└─────────────────────────────────────────────────────┘

✏️  PUEDES CAMBIAR:
   • Versión: Cambiar a "001" si es tu primera migración
   • Descripción: Personaliza según lo que necesites
   • SQL: Modifica el comando si necesitas


EJEMPLO - Agregar tres campos a la vez:
  
  ┌─ Versión: 001
  │
  │  Descripción: Agregar información de contacto
  │
  │  SQL:
  │  ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
  │  ALTER TABLE users ADD COLUMN address TEXT;
  │  ALTER TABLE users ADD COLUMN city VARCHAR(100);
  └─

📌 IMPORTANTE:
   • Separa comandos con punto y coma (;)
   • Cada línea es un comando SQL diferente


════════════════════════════════════════════════════════════════════════════════
PASO 4: EJECUTAR LA MIGRACIÓN (1 min)
════════════════════════════════════════════════════════════════════════════════

1. Click en el botón "▶ Ejecutar Migración"
2. Espera a que termine...

Verás un mensaje:
  ✅ SUCCESS: Migración 001 ejecutada correctamente
        O
  ❌ FAILED: Error - revierte automáticamente

🎉 ¡Listo! Tu cambio se aplicó sin perder datos


════════════════════════════════════════════════════════════════════════════════
PASO 5: VERIFICAR EN HISTORIAL (1 min - OPCIONAL)
════════════════════════════════════════════════════════════════════════════════

1. Click en tab "📋 Historial"
2. Verás tu migración listada:

   ✅ Versión: 001
      Descripción: Agregar información de contacto
      Estado: SUCCESS
      Fecha: 17/04/2026 14:35:00

Esto confirma que el cambio se hizo correctamente ✅


════════════════════════════════════════════════════════════════════════════════
🎓 PRÓXIMOS PASOS
════════════════════════════════════════════════════════════════════════════════

Ahora que ya sabes lo básico:

1. 📚 Lee la GUÍA COMPLETA (MIGRACIONES_BD_GUIA_COMPLETA.md)
   
2. 🔬 Prueba otros templates:
   ✓ Crear tabla de auditoría
   ✓ Agregar índices
   ✓ Crear tabla de backup
   
3. 🛠️  Practica con cambios pequeños:
   ✓ Agregar una columna
   ✓ Cambiar tipo de dato
   ✓ Crear un índice
   
4. ✓ Valida tu schema:
   • Click en "✓ Validar Schema"
   • Verifica que todo está bien


════════════════════════════════════════════════════════════════════════════════
⚠️  COSAS IMPORTANTES A RECORDAR
════════════════════════════════════════════════════════════════════════════════

🔒 SEGURIDAD:
   • Siempre haz BACKUP antes de migraciones críticas
   • Los cambios se registran en la tabla schema_migrations
   • Nunca borres esta tabla

📝 BUENAS PRÁCTICAS:
   • Usa versiones secuenciales: 001, 002, 003...
   • Escribe descripciones claras
   • Un cambio por migración cuando sea posible

🚀 VENTAJAS:
   ✅ Sin perder datos
   ✅ Cambios rastreados
   ✅ Historial completo
   ✅ Revertible si es necesario


════════════════════════════════════════════════════════════════════════════════
❓ PREGUNTAS FRECUENTES (FAQ)
════════════════════════════════════════════════════════════════════════════════

P: ¿Qué pasa si algo sale mal?
R: La migración se revierte automáticamente. Tu BD queda como estaba.

P: ¿Puedo ejecutar múltiples comandos en una migración?
R: Sí, sepáralos con punto y coma (;)

P: ¿Cómo reverto una migración?
R: Crea una nueva migración que deshaga los cambios.

P: ¿Dónde se guardan las migraciones?
R: En la tabla schema_migrations de la BD.

P: ¿Puedo cambiar una migración después de ejecutarla?
R: No, pero puedes crear una nueva que corrija el problema.

P: ¿Es obligatorio usar versiones numéricas?
R: Sí, para mantener orden y evitar conflictos.


════════════════════════════════════════════════════════════════════════════════
🔧 EJEMPLOS RÁPIDOS
════════════════════════════════════════════════════════════════════════════════

EJEMPLO 1: Agregar teléfono
───────────────────────────
Versión: 001
Descripción: Agregar teléfono a usuarios
SQL:
  ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);


EJEMPLO 2: Hacer email único
────────────────────────────
Versión: 002
Descripción: Hacer email único en la tabla
SQL:
  ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;


EJEMPLO 3: Crear índice para búsquedas rápidas
─────────────────────────────────────────────
Versión: 003
Descripción: Agregar índice en email para búsquedas rápidas
SQL:
  CREATE INDEX idx_email ON users (email);


EJEMPLO 4: Agregar múltiples campos
──────────────────────────────────
Versión: 004
Descripción: Agregar campos de perfil completo
SQL:
  ALTER TABLE users ADD COLUMN bio TEXT;
  ALTER TABLE users ADD COLUMN location VARCHAR(100);
  ALTER TABLE users ADD COLUMN website VARCHAR(255);
  ALTER TABLE users ADD COLUMN profile_updated_at TIMESTAMP;


EJEMPLO 5: Crear tabla nueva
──────────────────────────
Versión: 005
Descripción: Crear tabla de preferencias del usuario
SQL:
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    theme VARCHAR(50) DEFAULT 'dark',
    notifications BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


════════════════════════════════════════════════════════════════════════════════
✅ LISTA DE VERIFICACIÓN
════════════════════════════════════════════════════════════════════════════════

Antes de ejecutar una migración:
  ☐ Hice BACKUP de la BD
  ☐ Probé el SQL en un editor local
  ☐ Verifiqué nombres de tablas y columnas
  ☐ Todos los comandos terminan en punto y coma (;)
  ☐ Escribí una descripción clara

Después de ejecutar:
  ☐ El resultado dice SUCCESS
  ☐ Validé el schema
  ☐ Probé que los datos están intactos
  ☐ El historial muestra la migración


════════════════════════════════════════════════════════════════════════════════
🎯 ¡YA ESTÁS LISTO!
════════════════════════════════════════════════════════════════════════════════

Ahora puedes:
  ✅ Agregar campos sin perder datos
  ✅ Modificar estructura sin reimportar todo
  ✅ Documentar cada cambio
  ✅ Tener historial completo
  ✅ Revertir cambios si es necesario

¡A programar se ha dicho! 🚀

════════════════════════════════════════════════════════════════════════════════

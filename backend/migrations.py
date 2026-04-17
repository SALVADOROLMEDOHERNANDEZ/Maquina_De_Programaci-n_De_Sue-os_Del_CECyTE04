"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SISTEMA DE MIGRACIONES DE BASE DE DATOS                   ║
║                          CECyTE 04 - Dream Machine                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Este módulo maneja las migraciones de la base de datos de forma segura,
permitiendo modificar el schema sin perder datos.
"""

import mysql.connector
from mysql.connector import Error as MySQLError
from typing import List, Dict, Tuple
import os
from datetime import datetime
import json

class DatabaseMigration:
    """Gestor de migraciones de base de datos"""
    
    def __init__(self, db_config: Dict):
        """
        Inicializa el gestor de migraciones
        
        Args:
            db_config: Configuración de conexión a MySQL
        """
        self.db_config = db_config
        self.connection = None
        self.cursor = None
    
    def connect(self) -> bool:
        """Conecta a la base de datos"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor(dictionary=True)
            print("✅ Conexión a BD establecida")
            return True
        except MySQLError as e:
            print(f"❌ Error de conexión: {e}")
            return False
    
    def disconnect(self):
        """Desconecta de la base de datos"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("🔌 Desconectado de la BD")
    
    def create_migrations_table(self):
        """Crea la tabla de control de migraciones si no existe"""
        try:
            sql = """
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
            """
            self.cursor.execute(sql)
            self.connection.commit()
            print("✅ Tabla de migraciones creada/verificada")
            return True
        except MySQLError as e:
            print(f"❌ Error al crear tabla de migraciones: {e}")
            return False
    
    def get_executed_migrations(self) -> List[str]:
        """Obtiene lista de migraciones ejecutadas"""
        try:
            sql = "SELECT version FROM schema_migrations WHERE status='success' ORDER BY version"
            self.cursor.execute(sql)
            result = self.cursor.fetchall()
            return [row['version'] for row in result]
        except MySQLError as e:
            print(f"❌ Error al obtener migraciones: {e}")
            return []
    
    def record_migration(self, version: str, description: str, success: bool, error_msg: str = None):
        """Registra una migración en la BD"""
        try:
            status = 'success' if success else 'failed'
            sql = """
            INSERT INTO schema_migrations (version, description, status, error_message)
            VALUES (%s, %s, %s, %s)
            """
            self.cursor.execute(sql, (version, description, status, error_msg))
            self.connection.commit()
            print(f"✅ Migración registrada: {version}")
            return True
        except MySQLError as e:
            print(f"❌ Error al registrar migración: {e}")
            return False
    
    def execute_migration(self, version: str, sql_commands: str, description: str = "") -> Tuple[bool, str]:
        """
        Ejecuta una migración de forma segura
        
        Args:
            version: Versión de la migración (ej: "001", "002")
            sql_commands: Comandos SQL a ejecutar
            description: Descripción de la migración
            
        Returns:
            (success, message)
        """
        try:
            # Verificar si ya fue ejecutada
            if version in self.get_executed_migrations():
                return False, f"Migración {version} ya fue ejecutada"
            
            # Crear tabla de migraciones si no existe
            if not self.create_migrations_table():
                return False, "No se pudo crear tabla de migraciones"
            
            # Ejecutar comandos SQL
            print(f"\n🔄 Ejecutando migración {version}...")
            
            # Dividir comandos por `;` para ejecutarlos uno por uno
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
            
            for i, command in enumerate(commands, 1):
                if command:
                    print(f"   [{i}/{len(commands)}] Ejecutando comando...")
                    self.cursor.execute(command)
                    self.connection.commit()
            
            # Registrar migración exitosa
            self.record_migration(version, description, True)
            
            return True, f"✅ Migración {version} ejecutada correctamente"
        
        except MySQLError as e:
            error_msg = str(e)
            print(f"❌ Error en migración {version}: {error_msg}")
            
            # Rollback automático
            self.connection.rollback()
            self.record_migration(version, description, False, error_msg)
            
            return False, f"Error: {error_msg}"
    
    def get_migration_history(self) -> List[Dict]:
        """Obtiene historial de migraciones"""
        try:
            sql = """
            SELECT * FROM schema_migrations 
            ORDER BY executed_at DESC
            LIMIT 50
            """
            self.cursor.execute(sql)
            return self.cursor.fetchall()
        except MySQLError as e:
            print(f"❌ Error al obtener historial: {e}")
            return []
    
    def rollback_migration(self, version: str, rollback_sql: str) -> Tuple[bool, str]:
        """
        Revierte una migración (si está disponible)
        
        Args:
            version: Versión a revertir
            rollback_sql: SQL para revertir los cambios
            
        Returns:
            (success, message)
        """
        try:
            print(f"\n⚠️ Revirtiendo migración {version}...")
            
            commands = [cmd.strip() for cmd in rollback_sql.split(';') if cmd.strip()]
            for command in commands:
                if command:
                    self.cursor.execute(command)
                    self.connection.commit()
            
            # Marcar como revertida
            sql = "DELETE FROM schema_migrations WHERE version = %s"
            self.cursor.execute(sql, (version,))
            self.connection.commit()
            
            return True, f"✅ Migración {version} revertida"
        
        except MySQLError as e:
            self.connection.rollback()
            return False, f"❌ Error al revertir: {str(e)}"
    
    def validate_schema(self) -> Dict:
        """Valida la integridad del schema actual"""
        try:
            validation_report = {
                'timestamp': datetime.now().isoformat(),
                'database': self.db_config.get('database', 'unknown'),
                'tables': {},
                'errors': []
            }
            
            # Obtener todas las tablas
            sql = "SHOW TABLES"
            self.cursor.execute(sql)
            tables = [row[f'Tables_in_{self.db_config.get("database")}'] for row in self.cursor.fetchall()]
            
            for table in tables:
                try:
                    sql = f"DESCRIBE {table}"
                    self.cursor.execute(sql)
                    columns = self.cursor.fetchall()
                    validation_report['tables'][table] = {
                        'status': 'ok',
                        'column_count': len(columns),
                        'columns': [col['Field'] for col in columns]
                    }
                except MySQLError as e:
                    validation_report['errors'].append(f"Error en tabla {table}: {str(e)}")
            
            print(f"✅ Validación completada: {len(tables)} tablas")
            return validation_report
        
        except MySQLError as e:
            print(f"❌ Error en validación: {e}")
            return {'errors': [str(e)]}


class MigrationBuilder:
    """Constructor de migraciones desde UI"""
    
    @staticmethod
    def create_migration(
        version: str,
        description: str,
        migration_type: str,
        details: Dict
    ) -> str:
        """
        Crea una migración SQL basada en el tipo
        
        Args:
            version: Versión de migración
            description: Descripción
            migration_type: Tipo (add_column, modify_column, add_table, etc)
            details: Detalles específicos
            
        Returns:
            SQL de la migración
        """
        
        if migration_type == "add_column":
            return MigrationBuilder._build_add_column(details)
        elif migration_type == "modify_column":
            return MigrationBuilder._build_modify_column(details)
        elif migration_type == "drop_column":
            return MigrationBuilder._build_drop_column(details)
        elif migration_type == "add_table":
            return MigrationBuilder._build_add_table(details)
        elif migration_type == "add_index":
            return MigrationBuilder._build_add_index(details)
        elif migration_type == "custom":
            return details.get('sql', '')
        else:
            return ""
    
    @staticmethod
    def _build_add_column(details: Dict) -> str:
        """Construye SQL para agregar columna"""
        table = details.get('table')
        column = details.get('column')
        data_type = details.get('data_type', 'VARCHAR(255)')
        nullable = details.get('nullable', True)
        default = details.get('default')
        
        nullable_str = 'NULL' if nullable else 'NOT NULL'
        default_str = f"DEFAULT {default}" if default else ""
        
        return f"ALTER TABLE {table} ADD COLUMN {column} {data_type} {nullable_str} {default_str};"
    
    @staticmethod
    def _build_modify_column(details: Dict) -> str:
        """Construye SQL para modificar columna"""
        table = details.get('table')
        column = details.get('column')
        data_type = details.get('data_type', 'VARCHAR(255)')
        nullable = details.get('nullable', True)
        
        nullable_str = 'NULL' if nullable else 'NOT NULL'
        
        return f"ALTER TABLE {table} MODIFY COLUMN {column} {data_type} {nullable_str};"
    
    @staticmethod
    def _build_drop_column(details: Dict) -> str:
        """Construye SQL para eliminar columna"""
        table = details.get('table')
        column = details.get('column')
        
        return f"ALTER TABLE {table} DROP COLUMN {column};"
    
    @staticmethod
    def _build_add_table(details: Dict) -> str:
        """Construye SQL para crear tabla"""
        table = details.get('table')
        columns = details.get('columns', [])
        
        columns_sql = ",\n    ".join(columns)
        
        return f"""
CREATE TABLE IF NOT EXISTS {table} (
    {columns_sql}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""
    
    @staticmethod
    def _build_add_index(details: Dict) -> str:
        """Construye SQL para crear índice"""
        table = details.get('table')
        index_name = details.get('index_name')
        columns = details.get('columns', [])  # Lista de columnas
        
        columns_str = ", ".join(columns)
        
        return f"CREATE INDEX {index_name} ON {table} ({columns_str});"


# Ejemplo de uso
if __name__ == "__main__":
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'cecyte04_dreams'
    }
    
    migration = DatabaseMigration(db_config)
    
    if migration.connect():
        migration.create_migrations_table()
        
        # Ejemplo de migración
        test_migration = """
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
        """
        
        success, msg = migration.execute_migration(
            "001",
            test_migration,
            "Agregar número de teléfono"
        )
        
        print(msg)
        
        # Ver historial
        print("\n📋 Historial de migraciones:")
        for record in migration.get_migration_history():
            print(f"  - {record['version']}: {record['description']} ({record['status']})")
        
        migration.disconnect()

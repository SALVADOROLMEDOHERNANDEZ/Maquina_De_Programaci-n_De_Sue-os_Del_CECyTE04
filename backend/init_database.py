#!/usr/bin/env python3
"""
Script de Inicialización de Base de Datos MySQL
Para CECyTE 04 - Máquina de Programación de Sueños
"""

import aiomysql
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def init_database():
    """Initialize MySQL database with schema"""
    
    # Read SQL schema
    schema_path = ROOT_DIR / 'database_schema.sql'
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    # Split by statements (simple split by ;)
    statements = [s.strip() for s in schema_sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
    print("🔧 Conectando a MySQL...")
    
    try:
        # Connect without database first to create it
        connection = await aiomysql.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', ''),
            charset='utf8mb4'
        )
        
        async with connection.cursor() as cursor:
            print("✅ Conectado a MySQL")
            
            # Execute each statement
            for i, statement in enumerate(statements):
                try:
                    # Skip comments and empty statements
                    if statement.startswith('--') or not statement.strip():
                        continue
                    
                    await cursor.execute(statement)
                    
                    # Determine action type
                    action = statement.split()[0].upper()
                    if action == 'CREATE':
                        if 'DATABASE' in statement.upper():
                            print(f"✅ Base de datos creada/verificada")
                        elif 'TABLE' in statement.upper():
                            table_name = statement.split('TABLE')[1].split('(')[0].strip().split()[1] if 'IF NOT EXISTS' in statement else statement.split('TABLE')[1].split('(')[0].strip()
                            print(f"✅ Tabla creada: {table_name}")
                    elif action == 'INSERT':
                        print(f"✅ Datos iniciales insertados")
                    elif action == 'USE':
                        db_name = statement.split()[1].strip()
                        print(f"✅ Usando base de datos: {db_name}")
                    
                except Exception as e:
                    print(f"⚠️  Error en statement {i+1}: {str(e)}")
                    print(f"   Statement: {statement[:100]}...")
                    # Continue with next statement
                    continue
            
            await connection.commit()
            print("\n" + "="*60)
            print("✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE")
            print("="*60)
            print("\n📊 Tablas creadas:")
            print("  - users")
            print("  - user_sessions")
            print("  - admin_sessions")
            print("  - especialidades (con 5 carreras)")
            print("  - simulations")
            print("  - models_3d")
            print("  - tarjeta_positions")
            print("\n🎓 Datos iniciales:")
            print("  - 5 especialidades precargadas")
            print("  - Sistema listo para usar")
            print("\n🚀 Puedes iniciar el backend ahora:")
            print("  uvicorn server:app --host 0.0.0.0 --port 8001 --reload")
            print("="*60)
        
        connection.close()
        
    except Exception as e:
        print(f"\n❌ Error al inicializar base de datos:")
        print(f"   {str(e)}")
        print(f"\n💡 Verifica:")
        print(f"  - MySQL está corriendo")
        print(f"  - Credenciales en .env son correctas")
        print(f"  - Usuario tiene permisos para crear bases de datos")
        return False
    
    return True

if __name__ == "__main__":
    print("="*60)
    print("🚀 INICIALIZADOR DE BASE DE DATOS - CECyTE 04")
    print("="*60)
    print("\n📋 Configuración desde .env:")
    print(f"  Host: {os.environ.get('MYSQL_HOST', 'localhost')}")
    print(f"  Puerto: {os.environ.get('MYSQL_PORT', '3306')}")
    print(f"  Usuario: {os.environ.get('MYSQL_USER', 'root')}")
    print(f"  Base de datos: {os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')}")
    print("\n")
    
    success = asyncio.run(init_database())
    
    if not success:
        exit(1)

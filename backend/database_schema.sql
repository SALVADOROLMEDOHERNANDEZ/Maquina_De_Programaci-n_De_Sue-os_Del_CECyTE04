-- ═══════════════════════════════════════════════════════════════
-- BASE DE DATOS CECYTE 04 - MÁQUINA DE PROGRAMACIÓN DE SUEÑOS
-- Compatible con phpMyAdmin / MySQL / Hostinger
-- ═══════════════════════════════════════════════════════════════

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS cecyte04_dreams CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cecyte04_dreams;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: users (Usuarios del sistema)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    sexo ENUM('M', 'F', 'Otro') DEFAULT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_admin (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: user_sessions (Sesiones de usuarios)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: admin_sessions (Sesiones de administradores)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: especialidades (Especialidades educativas)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS especialidades (
    especialidad_id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    habilidades JSON NOT NULL,
    campo_laboral JSON NOT NULL,
    posicion_3d JSON NOT NULL,
    color VARCHAR(20) NOT NULL,
    icono VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: simulations (Simulaciones de futuro)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS simulations (
    simulation_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT NULL,
    nombre VARCHAR(255) NOT NULL,
    sexo ENUM('M', 'F', 'Otro') DEFAULT NULL,
    intereses JSON NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    historia TEXT NOT NULL,
    imagen_base64 LONGTEXT DEFAULT NULL,
    avatar_config JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: models_3d (Modelos 3D del plantel)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS models_3d (
    model_id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    format VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    bounds JSON DEFAULT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: tarjeta_positions (Posiciones de tarjetas 3D)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tarjeta_positions (
    tarjeta_id VARCHAR(50) PRIMARY KEY,
    especialidad_id VARCHAR(50) NOT NULL,
    position JSON NOT NULL,
    rotation JSON NOT NULL,
    scale FLOAT DEFAULT 1.0,
    model_id VARCHAR(50) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(especialidad_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models_3d(model_id) ON DELETE SET NULL,
    INDEX idx_especialidad_id (especialidad_id),
    INDEX idx_model_id (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- INSERTAR DATOS INICIALES: Especialidades (ACTUALIZADAS)
-- Solo Programación y Mantenimiento Industrial
-- ═══════════════════════════════════════════════════════════════
INSERT INTO especialidades (especialidad_id, nombre, descripcion, habilidades, campo_laboral, posicion_3d, color, icono) VALUES
('prog', 'Programación', 'Desarrolla software, aplicaciones web y móviles. Aprende lenguajes como Python, JavaScript, Java y más.',
 '["Desarrollo Web", "Bases de Datos", "Algoritmos", "Aplicaciones Móviles", "Inteligencia Artificial"]',
 '["Desarrollador de Software", "Ingeniero de Datos", "Arquitecto de Sistemas", "DevOps Engineer"]',
 '{"x": -15, "y": 0, "z": 0}', '#00f0ff', 'Code'),

('mantenimiento', 'Mantenimiento Industrial', 'Especialízate en el mantenimiento preventivo y correctivo de maquinaria industrial, sistemas neumáticos, hidráulicos y eléctricos. Aprende a diagnosticar fallas y optimizar procesos de producción.',
 '["Mantenimiento Preventivo", "Sistemas Neumáticos", "Sistemas Hidráulicos", "Electricidad Industrial", "PLC y Automatización", "Soldadura", "Mecánica Industrial"]',
 '["Técnico en Mantenimiento Industrial", "Supervisor de Mantenimiento", "Ingeniero de Planta", "Especialista en Automatización", "Técnico en Sistemas Neumáticos"]',
 '{"x": 15, "y": 0, "z": 0}', '#ff9500', 'Wrench')
ON DUPLICATE KEY UPDATE 
    nombre=VALUES(nombre),
    descripcion=VALUES(descripcion),
    habilidades=VALUES(habilidades),
    campo_laboral=VALUES(campo_laboral),
    posicion_3d=VALUES(posicion_3d),
    color=VALUES(color),
    icono=VALUES(icono);

-- ═══════════════════════════════════════════════════════════════
-- ELIMINAR CARRERAS ANTIGUAS (si existen)
-- ═══════════════════════════════════════════════════════════════
DELETE FROM especialidades WHERE especialidad_id IN ('electronica', 'contabilidad', 'administracion', 'enfermeria');

-- ═══════════════════════════════════════════════════════════════
-- INFORMACIÓN DEL ESQUEMA
-- ═══════════════════════════════════════════════════════════════
-- Base de datos: cecyte04_dreams
-- Charset: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Engine: InnoDB (para integridad referencial)
-- 
-- Tablas creadas: 7
-- - users: Usuarios del sistema
-- - user_sessions: Sesiones activas
-- - admin_sessions: Sesiones de admin
-- - especialidades: Carreras disponibles
-- - simulations: Simulaciones generadas
-- - models_3d: Modelos 3D del plantel
-- - tarjeta_positions: Posiciones en tour 3D
-- 
-- Datos iniciales: 2 especialidades
-- - Programación
-- - Mantenimiento Industrial
-- ═══════════════════════════════════════════════════════════════

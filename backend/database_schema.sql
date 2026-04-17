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
-- TABLA: user_sessions (Sesiones de usuarios - UNA por usuario)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: admin_sessions (Sesiones de administradores - UNA por admin)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: session_cleanup_log (Log de limpieza automática de sesiones)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS session_cleanup_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sessions_deleted INT DEFAULT 0,
    cleaned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cleaned_at (cleaned_at)
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
-- PROCEDIMIENTO ALMACENADO: Limpiar sesiones expiradas
-- ═══════════════════════════════════════════════════════════════
DELIMITER ;;

CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
    DECLARE deleted_user_sessions INT DEFAULT 0;
    DECLARE deleted_admin_sessions INT DEFAULT 0;
    
    -- Eliminar sesiones de usuarios expiradas
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    SET deleted_user_sessions = ROW_COUNT();
    
    -- Eliminar sesiones de admin expiradas
    DELETE FROM admin_sessions 
    WHERE expires_at < NOW();
    SET deleted_admin_sessions = ROW_COUNT();
    
    -- Registrar limpieza
    INSERT INTO session_cleanup_log (sessions_deleted, cleaned_at) 
    VALUES (deleted_user_sessions + deleted_admin_sessions, NOW());
END;;

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════
-- EVENTO: Ejecutar limpieza cada 6 horas
-- ═══════════════════════════════════════════════════════════════
DROP EVENT IF EXISTS cleanup_sessions_event;

CREATE EVENT cleanup_sessions_event
ON SCHEDULE EVERY 6 HOUR
STARTS DATE_ADD(NOW(), INTERVAL 1 HOUR)
DO
    CALL cleanup_expired_sessions();
-- Solo Programación y Mantenimiento Industrial
-- ═══════════════════════════════════════════════════════════════
INSERT INTO especialidades (especialidad_id, nombre, descripcion, habilidades, campo_laboral, posicion_3d, color, icono) VALUES
('prog', 'Programacion', 'Objetivo
En el contexto nacional la formación de Técnicos en: Programación es relevante porque: contribuye a la formación de personas capaces de integrarse a un mercado laboral dinámico y de alta demanda, que esta a la vanguardia en el uso de la tecnología y que contribuye a la transformación digital de los sectores productivos en el país.

Perfil de Egreso
Durante el proceso de formación de los cinco módulos, el estudiante desarrollará o reforzará las siguientes competencias profesionales:
• Desarrolla software de aplicación con programación estructurada
• Aplica metodologías de desarrollo de software utilizando herramientas de programación visual
• Desarrolla aplicaciones Web
• Desarrolla software de aplicación Web con almacenamiento persistente de datos​
• Desarrolla aplicaciones para dispositivos móviles',
 '["Desarrolla software de aplicación con programación estructurada", "Aplica metodologías de desarrollo de software utilizando herramientas de programación visual", "Desarrolla aplicaciones Web", "Desarrolla software de aplicación Web con almacenamiento persistente de datos​", "Desarrolla aplicaciones para dispositivos móviles"]',
 '["Desarrollador de Software", "Ingeniero de Datos", "Arquitecto de Sistemas", "DevOps Engineer"]',
 '{"x": -15, "y": 0, "z": 0}', '#00f0ff', 'Code'),

('mantenimiento', 'Mantenimiento Industrial', 'Objetivo
La carrera de Técnico en mantenimiento industrial ofrece las competencias profesionales que permiten al estudiante realizar actividades dirigidas
a realizar mantenimiento a instalaciones eléctricas, fabricar pequeñas estructuras metálicas, realiza actividades de ajuste de banco utilizando
herramientas básicas, interpretar planos de piezas mecánicas, utilizar máquinas herramientas convencionales y de control numérico para
reparación y fabricación de piezas, manejar máquinas de soldar de arco eléctrico y oxicorte, manipular sistemas de control y automatización,
sistemas de neumática e hidráulica, mantiene equipos de refrigeración y aire acondicionado e implementara los programas de administración del
mantenimiento en los sistemas.

Perfil de Egreso
Durante el proceso de formación de los cinco módulos, el estudiante desarrollará o reforzará:
Las siguientes competencias profesionales:
• Repara instalaciones eléctricas
• Suelda materiales ferrosos y no ferrosos
• Fabrica piezas metálicas
• Mantiene equipos hidráulicos, neumáticos y automatización
• Mantiene equipos de refrigeración y aire acondicionado',
 '["Repara instalaciones eléctricas", "Suelda materiales ferrosos y no ferrosos", "Fabrica piezas metálicas", "Mantiene equipos hidráulicos, neumáticos y automatización", "Mantiene equipos de refrigeración y aire acondicionado"]',
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
-- TABLA: badges (Insignias del sistema de gamificación)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS badges (
    badge_id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    icono VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    puntos INT DEFAULT 10,
    categoria ENUM('quiz', 'contribucion', 'logro', 'especial') DEFAULT 'logro',
    requisito TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: user_badges (Insignias obtenidas por usuarios)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_badge_id (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: quiz_completions (Cuestionarios completados)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS quiz_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT NULL,
    session_id VARCHAR(100) NOT NULL,
    respuestas JSON NOT NULL,
    resultado JSON,
    puntos_obtenidos INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: contributions (Contribuciones al proyecto IA CECYTE)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    tipo ENUM('codigo', 'documentacion', 'bug_report', 'feature', 'otro') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    url VARCHAR(500),
    puntos INT DEFAULT 10,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    revisado_por VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_estado (estado),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: user_points (Puntos totales de usuarios)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_points (
    user_id VARCHAR(50) PRIMARY KEY,
    puntos_totales INT DEFAULT 0,
    quizzes_completados INT DEFAULT 0,
    contribuciones_aprobadas INT DEFAULT 0,
    nivel INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: multimedia (Contenido multimedia del plantel)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS multimedia (
    multimedia_id VARCHAR(50) PRIMARY KEY,
    tipo ENUM('video', 'foto', 'publicacion') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    tags JSON DEFAULT NULL,
    categoria VARCHAR(100) DEFAULT 'general',
    platform ENUM('instagram', 'facebook', 'youtube') DEFAULT NULL,
    url VARCHAR(500) DEFAULT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    uploaded_by VARCHAR(50) NOT NULL,
    visible BOOLEAN DEFAULT TRUE,
    vistas INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_tipo (tipo),
    INDEX idx_categoria (categoria),
    INDEX idx_visible (visible),
    INDEX idx_created_at (created_at),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: publication_likes (Likes en publicaciones)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS publication_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    multimedia_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (multimedia_id) REFERENCES multimedia(multimedia_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (multimedia_id, user_id),
    INDEX idx_multimedia_id (multimedia_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- TABLA: publication_comments (Comentarios en publicaciones)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS publication_comments (
    comment_id VARCHAR(50) PRIMARY KEY,
    multimedia_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (multimedia_id) REFERENCES multimedia(multimedia_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_multimedia_id (multimedia_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ═══════════════════════════════════════════════════════════════
INSERT INTO badges (badge_id, nombre, descripcion, icono, color, puntos, categoria, requisito) VALUES
('primer_quiz', 'Explorador Vocacional', 'Completaste tu primer cuestionario vocacional', 'Compass', '#00f0ff', 10, 'quiz', 'Completar 1 cuestionario'),
('quiz_master', 'Maestro del Quiz', 'Completaste 5 cuestionarios vocacionales', 'Brain', '#7c3aed', 50, 'quiz', 'Completar 5 cuestionarios'),
('primera_contribucion', 'Colaborador Iniciado', 'Hiciste tu primera contribución al proyecto IA CECYTE', 'GitBranch', '#10b981', 20, 'contribucion', 'Primera contribución aprobada'),
('contribuidor_activo', 'Contribuidor Activo', 'Has hecho 5 contribuciones aprobadas', 'Code', '#f59e0b', 100, 'contribucion', '5 contribuciones aprobadas'),
('documentador', 'Documentador', 'Contribuiste con documentación al proyecto', 'FileText', '#3b82f6', 30, 'contribucion', 'Contribuir documentación'),
('bug_hunter', 'Cazador de Bugs', 'Reportaste un bug que fue corregido', 'Bug', '#ef4444', 25, 'contribucion', 'Reportar bug válido'),
('innovador', 'Innovador', 'Propusiste una nueva característica implementada', 'Lightbulb', '#8b5cf6', 50, 'contribucion', 'Feature implementada'),
('nivel_5', 'Aprendiz Avanzado', 'Alcanzaste el nivel 5', 'Award', '#fbbf24', 0, 'logro', 'Alcanzar nivel 5'),
('nivel_10', 'Experto CECyTE', 'Alcanzaste el nivel 10', 'Trophy', '#f97316', 0, 'logro', 'Alcanzar nivel 10'),
('primera_simulacion', 'Soñador', 'Creaste tu primera simulación de futuro', 'Sparkles', '#ec4899', 15, 'logro', 'Crear primera simulación'),
('fundador', 'Miembro Fundador', 'Uno de los primeros en unirse al proyecto IA CECYTE', 'Star', '#ffd700', 100, 'especial', 'Insignia especial')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

-- ═══════════════════════════════════════════════════════════════
-- INFORMACIÓN DEL ESQUEMA
-- ═══════════════════════════════════════════════════════════════
-- Base de datos: cecyte04_dreams
-- Charset: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Engine: InnoDB (para integridad referencial)
-- 
-- STATUS: VERSIÓN 3.0 (Módulo de Publicaciones + Tour Virtual Múltiple)
-- CAMBIOS: 
--   - Agregados campos platform, url, likes_count, comments_count a multimedia
--   - Nueva tabla publication_likes para likes en publicaciones
--   - Nueva tabla publication_comments para comentarios en publicaciones
--   - Modificada lógica de models_3d para permitir múltiples modelos activos
--
-- Tablas creadas: 16
-- - users: Usuarios del sistema
-- - user_sessions: Sesiones activas (1 por usuario)
-- - admin_sessions: Sesiones de admin (1 por admin)
-- - session_cleanup_log: Log de limpiezas automáticas
-- - especialidades: Carreras disponibles
-- - simulations: Simulaciones generadas
-- - models_3d: Modelos 3D del plantel (múltiples activos)
-- - tarjeta_positions: Posiciones en tour 3D
-- - badges: Insignias del sistema
-- - user_badges: Insignias obtenidas por usuarios
-- - quiz_completions: Cuestionarios completados
-- - contributions: Contribuciones al proyecto IA CECYTE
-- - user_points: Puntos totales de usuarios
-- - multimedia: Contenido multimedia del plantel (con publicaciones)
-- - publication_likes: Likes en publicaciones ✨ NUEVO
-- - publication_comments: Comentarios en publicaciones ✨ NUEVO
--
-- PROCEDIMIENTOS ALMACENADOS:
-- - cleanup_expired_sessions(): Elimina sesiones expiradas
--
-- EVENTOS:
-- - cleanup_sessions_event: Se ejecuta cada 6 horas automáticamente
--
-- Datos iniciales: 2 especialidades
-- - Programación
-- - Mantenimiento Industrial
--
-- NOTAS DE SEGURIDAD:
-- 1. Las contraseñas de admin se almacenan hasheadas (SHA256) en env
-- 2. Los session_tokens se generan con UUID v4
-- 3. Las sesiones expiran: usuarios (7 días), admins (24 horas)
-- 4. HTTPS + SameSite Cookie + HttpOnly obligatorios en producción
-- 5. Limpieza automática previene acumulación de datos obsoletos
-- ═══════════════════════════════════════════════════════════════
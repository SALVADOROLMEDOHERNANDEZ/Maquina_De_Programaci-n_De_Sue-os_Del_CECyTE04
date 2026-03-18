# PRD: Máquina de Programación de Sueños - CECyTE 04

## Problema Original
Crear una aplicación web y móvil futurista para CECyTE 04 que integre IA, realidad virtual y generación de contenido personalizado para mostrar a los estudiantes cómo sería su futuro académico y profesional.

## Arquitectura

### Stack Tecnológico
- **Frontend**: React 18 + Tailwind CSS + Framer Motion + Three.js (3D)
- **Backend**: FastAPI (Python)
- **Base de Datos**: MongoDB
- **Integraciones**: 
  - OpenAI GPT-5.2 (generación de historias)
  - OpenAI GPT Image 1 (generación de imágenes)
  - Google Auth (Emergent-managed)
  - SendGrid (emails) - pendiente configuración
  - Twilio (WhatsApp) - pendiente configuración

### Coordenadas del Plantel
- Latitud: 19°30'33.77"N
- Longitud: 98°27'52.86"W

## User Personas

### 1. Estudiante Prospecto (14-18 años)
- Quiere conocer las especialidades de CECyTE 04
- Busca visualizar su futuro profesional
- Interesado en experiencias interactivas

### 2. Administrador del Sistema
- Gestiona contenido 3D del plantel
- Actualiza posiciones de tarjetas virtuales
- Mantiene el sistema actualizado

## Core Requirements

### Implementado ✅
1. **Landing Page** - Diseño futurista con animaciones
2. **Simulador de Futuro** - Wizard de 4 pasos
   - Ingreso de nombre y sexo
   - Selección de intereses (mínimo 2)
   - Selección de carrera
   - Generación de historia con GPT-5.2
   - Generación de imagen con GPT Image 1
   - Configuración de avatar 3D
3. **Tour Virtual** - Vista 2.5D con tarjetas interactivas
4. **Especialidades** - Listado de 5 carreras con información
5. **Panel de Administración**
   - Login con credenciales (admin/cecyte04admin)
   - Carga de modelos 3D (GLTF, GLB, FBX, OBJ)
   - Editor de posiciones de tarjetas en espacio 3D
6. **Google Auth** - Autenticación de usuarios
7. **Sistema de Avatares** - Generación basada en nombre/sexo

### Pendiente (P0) 🔄
- Integración de visor 3D con modelos importados
- Navegación libre por modelo 3D
- Colocación de tarjetas dentro del modelo 3D

### Pendiente (P1) ⏳
- Configuración de SendGrid para emails
- Configuración de Twilio para WhatsApp
- Avatar 3D renderizado (actualmente es configuración JSON)

### Pendiente (P2) 📋
- Modo offline/PWA
- Multilenguaje
- Analíticas de uso

## Lo que está Implementado

### 14/01/2026 - MVP Inicial
- ✅ Landing page con diseño futurista
- ✅ Simulador de futuro con 4 pasos
- ✅ Generación de historias con GPT-5.2
- ✅ Generación de imágenes con GPT Image 1
- ✅ Tour virtual 2.5D
- ✅ 5 especialidades con información
- ✅ Panel de administración completo
- ✅ Carga de modelos 3D
- ✅ Editor de posiciones de tarjetas
- ✅ Google Auth
- ✅ Generación de avatares por nombre/sexo

## Credenciales de Admin
- Usuario: `admin`
- Contraseña: `cecyte04admin`

## Endpoints API

### Públicos
- `GET /api/health` - Estado del servidor
- `GET /api/especialidades` - Lista de especialidades
- `GET /api/campus/info` - Información del campus
- `GET /api/tarjetas/positions` - Posiciones de tarjetas
- `GET /api/models/active` - Modelo 3D activo

### Autenticados
- `POST /api/auth/session` - Crear sesión (Google Auth)
- `GET /api/auth/me` - Usuario actual
- `POST /api/simulation/generate-story` - Generar historia
- `POST /api/simulation/generate-image` - Generar imagen
- `POST /api/simulation/save` - Guardar simulación

### Admin
- `POST /api/admin/login` - Login admin
- `GET /api/admin/check` - Verificar admin
- `POST /api/admin/models/upload` - Subir modelo 3D
- `GET /api/admin/models` - Lista de modelos
- `PUT /api/admin/models/{id}/activate` - Activar modelo
- `DELETE /api/admin/models/{id}` - Eliminar modelo
- `PUT /api/admin/tarjetas/position` - Actualizar posición

## Próximos Pasos

1. **GitHub** - Seguir instrucciones para crear repositorio
2. **Modelo 3D** - Subir modelo del plantel en formato GLB
3. **Visor 3D** - Implementar navegación libre con avatar
4. **Email/WhatsApp** - Configurar SendGrid y Twilio

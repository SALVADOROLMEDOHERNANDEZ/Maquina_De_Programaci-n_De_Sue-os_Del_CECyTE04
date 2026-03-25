# PRD - Máquina de Programación de Sueños CECyTE 04

## Descripción del Proyecto
Aplicación full-stack para CECyTE 04 (Centro de Estudios Científicos y Tecnológicos del Estado de Tlaxcala) que permite a los estudiantes explorar carreras técnicas, simular su futuro profesional con IA, y participar en un proyecto colaborativo de inteligencia artificial.

## Stack Tecnológico
- **Frontend:** React, Tailwind CSS, Framer Motion, React Three Fiber
- **Backend:** FastAPI (Python)
- **Base de Datos:** 
  - MongoDB (entorno de desarrollo/preview)
  - MySQL (producción/Hostinger)
- **IA:** Google Gemini (texto), Hugging Face (imágenes)

## Funcionalidades Implementadas

### ✅ Completado

#### Gestión de Carreras (Actualizado)
- **Carreras actuales:**
  - Programación
  - Mantenimiento Industrial
- **Carreras eliminadas:** Contabilidad, Enfermería, Electrónica, Administración

#### Cuestionario Vocacional (`/cuestionario-vocacional`)
- 10 preguntas dinámicas sobre gustos, habilidades e intereses
- Soporte para preguntas de selección única y múltiple
- Integración con IA (Google Gemini) para recomendaciones personalizadas
- Recomendaciones incluyen carreras de CECyTE Y opciones externas
- Análisis de perfil y fortalezas del estudiante

#### Sección IA CECYTE (`/ia-cecyte`)
- Página dedicada al proyecto colaborativo de IA
- Secciones: Inicio, Documentación, Cómo Contribuir, Desarrolladores
- Endpoints API para documentación y guías de contribución
- Diseño moderno con tema púrpura/rosa

#### Landing Page Actualizada
- Navegación con enlaces a Cuestionario e IA CECYTE
- Tarjetas de características actualizadas (5 secciones)
- Botones CTA para nuevas funcionalidades

#### Funcionalidades Existentes
- Simulador de Futuro con IA
- Tour Virtual 3D
- Gestión de modelos 3D (admin)
- Sistema de autenticación
- Panel de administración

## Estructura de Archivos

```
/app
├── backend/
│   ├── server.py           # API FastAPI con MongoDB
│   ├── database_schema.sql # Esquema MySQL (para producción)
│   ├── .env                # Configuración
│   └── uploads/models/     # Modelos 3D
├── frontend/
│   ├── src/
│   │   ├── App.js          # Rutas actualizadas
│   │   ├── pages/
│   │   │   ├── CareerQuiz.js    # NUEVO - Cuestionario vocacional
│   │   │   ├── CecyteAI.js      # NUEVO - Proyecto IA CECYTE
│   │   │   ├── LandingPage.js   # Actualizado con nuevos enlaces
│   │   │   └── ...
│   │   └── components/ui/
│   └── craco.config.js     # Configuración de webpack (actualizada)
└── memory/
    └── PRD.md
```

## Endpoints API Nuevos

### Cuestionario Vocacional
- `POST /api/career-quiz/recommend` - Recomendaciones de carrera con IA

### Proyecto IA CECYTE
- `GET /api/ia-cecyte/info` - Información del proyecto
- `GET /api/ia-cecyte/developers` - Lista de desarrolladores
- `GET /api/ia-cecyte/docs` - Documentación
- `GET /api/ia-cecyte/contributing` - Guía de contribución

## Configuración de Base de Datos

### Para Desarrollo (MongoDB)
```env
USE_MONGODB=true
MONGO_URL=mongodb://localhost:27017
DB_NAME=cecyte04_dreams
```

### Para Producción (MySQL/Hostinger)
```env
USE_MONGODB=false
MYSQL_HOST=tu-servidor
MYSQL_USER=tu-usuario
MYSQL_PASSWORD=tu-contraseña
MYSQL_DATABASE=cecyte04_dreams
```

## Próximos Pasos (Backlog)

### P1 - Alta Prioridad
- [ ] Agregar más contenido a la sección de desarrolladores de IA CECYTE
- [ ] Crear sistema de registro de contribuidores
- [ ] Mejorar las preguntas del cuestionario vocacional

### P2 - Media Prioridad
- [ ] Agregar estadísticas de uso del cuestionario
- [ ] Crear sistema de badges/logros para desarrolladores
- [ ] Implementar exportación de resultados del cuestionario

### P3 - Baja Prioridad
- [ ] Integrar más carreras externas en las recomendaciones
- [ ] Crear versión móvil optimizada
- [ ] Agregar modo oscuro/claro

## Notas Importantes

1. **Configuración craco.config.js:** Se ha desactivado HMR (`hot: false`) para evitar errores en el entorno de preview. En producción funciona correctamente.

2. **Base de datos dual:** El proyecto soporta MongoDB (desarrollo) y MySQL (producción). Usar variable `USE_MONGODB` para cambiar.

3. **APIs de IA:** Requieren claves de API:
   - `GOOGLE_GEMINI_API_KEY` - Para generación de texto
   - `HUGGINGFACE_API_TOKEN` - Para generación de imágenes

---
*Última actualización: 25 de Marzo, 2026*

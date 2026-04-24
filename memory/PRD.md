# PRD - Máquina de Programación de Sueños CECyTE 04

## Descripción del Proyecto
Aplicación full-stack para CECyTE 04 que permite a los estudiantes explorar carreras técnicas, simular su futuro profesional con IA, participar en un proyecto colaborativo de inteligencia artificial, y ganar puntos e insignias mediante gamificación.

## Stack Tecnológico
- **Frontend:** React, Tailwind CSS, Framer Motion, React Three Fiber
- **Backend:** FastAPI (Python)
- **Base de Datos:** MySQL (compatible con phpMyAdmin/Hostinger)
- **IA:** Google Gemini (texto e imagen)

## Funcionalidades Implementadas

### ✅ Gestión de Carreras
- **Carreras actuales:** Programación, Mantenimiento Industrial
- **Carreras eliminadas:** Contabilidad, Enfermería, Electrónica, Administración

### ✅ Cuestionario Vocacional (`/cuestionario-vocacional`)
- 10 preguntas dinámicas sobre gustos, habilidades e intereses
- IA (Google Gemini) genera recomendaciones personalizadas
- Incluye carreras de CECyTE Y opciones externas
- **Otorga puntos automáticamente** al completar

### ✅ Sección IA CECYTE (`/ia-cecyte`)
- Página con 6 pestañas: Inicio, Ranking, Insignias, Documentación, Contribuir, Desarrolladores
- Sistema completo de gamificación
- Formulario para enviar contribuciones
- Lista de desarrolladores con sus badges

### ✅ Sistema de Gamificación (NUEVO)
**Tablas de Base de Datos:**
- `badges` - Insignias disponibles
- `user_badges` - Insignias obtenidas
- `quiz_completions` - Cuestionarios completados
- `contributions` - Contribuciones enviadas
- `user_points` - Puntos y niveles de usuarios

**11 Insignias Disponibles:**
1. 🧭 Explorador Vocacional (primer quiz)
2. 🧠 Maestro del Quiz (5 quizzes)
3. 🌿 Colaborador Iniciado (primera contribución)
4. 💻 Contribuidor Activo (5 contribuciones)
5. 📄 Documentador
6. 🐛 Cazador de Bugs
7. 💡 Innovador
8. 🏆 Aprendiz Avanzado (nivel 5)
9. 🏅 Experto CECyTE (nivel 10)
10. ✨ Soñador (primera simulación)
11. ⭐ Miembro Fundador (especial)

**Endpoints de Gamificación:**
- `GET /api/gamification/badges` - Lista todas las insignias
- `GET /api/gamification/ranking` - Top 20 usuarios
- `GET /api/gamification/user/{user_id}` - Perfil de gamificación
- `GET /api/gamification/my-profile` - Mi perfil
- `POST /api/gamification/contribution` - Enviar contribución
- `POST /api/admin/gamification/approve-contribution/{id}` - Aprobar (admin)
- `GET /api/admin/gamification/pending-contributions` - Pendientes (admin)
- `POST /api/admin/gamification/award-badge` - Otorgar insignia (admin)

### ✅ Funcionalidades Existentes
- Simulador de Futuro con IA
- Tour Virtual 3D
- Gestión de modelos 3D (admin)
- Sistema de autenticación
- Panel de administración

## Estructura de Archivos Actualizada

```
/app
├── backend/
│   ├── server.py              # API FastAPI con MySQL + Gamificación
│   ├── database_schema.sql    # Esquema MySQL actualizado (6 tablas nuevas)
│   ├── init_database.py       # Script de inicialización
│   ├── .env                   # Configuración
│   └── uploads/models/
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── CareerQuiz.js     # Cuestionario vocacional
│   │   │   ├── CecyteAI.js       # IA CECYTE con gamificación
│   │   │   ├── LandingPage.js
│   │   │   └── ...
│   │   └── components/ui/
│   └── craco.config.js
└── memory/
    └── PRD.md
```

## Pasos para Actualizar en tu Entorno Local

### 1. Sincronizar con GitHub
```powershell
cd C:\Users\olmed\Downloads\MPSCECyTE04\Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04
git pull origin master
```

### 2. Actualizar Base de Datos
Ejecuta el nuevo esquema en phpMyAdmin o:
```powershell
cd backend
python init_database.py
```

### 3. Iniciar Servicios
```powershell
# Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (otra terminal)
cd frontend
yarn start
```

## Próximos Pasos (Backlog)

### P1 - Alta Prioridad
- [ ] Agregar notificaciones cuando se otorgan insignias
- [ ] Panel de admin para gestionar contribuciones pendientes
- [ ] Perfil de usuario con sus estadísticas

### P2 - Media Prioridad
- [ ] Insignias adicionales por eventos especiales
- [ ] Sistema de niveles con beneficios
- [ ] Exportar certificados de logros

### P3 - Baja Prioridad
- [ ] Compartir logros en redes sociales
- [ ] Competencias entre usuarios
- [ ] Historial de actividades

---
*Última actualización: 25 de Marzo, 2026*
*Versión: 2.0 - Sistema de Gamificación*

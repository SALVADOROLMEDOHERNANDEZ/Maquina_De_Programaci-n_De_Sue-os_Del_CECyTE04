# Máquina de Programación de Sueños - CECyTE 04

Aplicación web futurista que integra IA, realidad virtual y generación de contenido personalizado para mostrar a los estudiantes su futuro académico y profesional en CECyTE 04.

## 🚀 Características

- **Simulador de Futuro**: Genera historias de éxito personalizadas con GPT-5.2 e imágenes con GPT Image 1
- **Tour Virtual 3D**: Explora las especialidades del plantel de forma interactiva
- **Panel de Administración**: Carga modelos 3D y edita posiciones de tarjetas
- **Avatares 3D**: Generados automáticamente basados en nombre y sexo
- **Google Auth**: Autenticación segura con Google

## 📍 Ubicación

CECyTE 04 - Tlaxcala, México  
Coordenadas: 19°30'33.77"N 98°27'52.86"W

## 🛠️ Tecnologías

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Three.js
- **Backend**: FastAPI (Python)
- **Base de Datos**: MongoDB
- **IA**: OpenAI GPT-5.2, GPT Image 1

## 📂 Estructura

```
/app
├── backend/          # FastAPI backend
│   ├── server.py     # API principal
│   └── uploads/      # Modelos 3D
├── frontend/         # React frontend
│   └── src/
│       ├── pages/    # Páginas de la app
│       └── components/
└── memory/           # Documentación PRD
```

## 🔐 Credenciales Admin

- Usuario: `admin`
- Contraseña: `cecyte04admin`

## 🌐 Rutas

- `/` - Landing page
- `/simulator` - Simulador de futuro
- `/tour` - Tour virtual 3D
- `/especialidades` - Lista de carreras
- `/dashboard` - Panel de usuario
- `/admin` - Panel de administración

## 📝 Especialidades

1. Programación
2. Electrónica
3. Contabilidad
4. Administración
5. Enfermería

---
Desarrollado con ❤️ para CECyTE 04

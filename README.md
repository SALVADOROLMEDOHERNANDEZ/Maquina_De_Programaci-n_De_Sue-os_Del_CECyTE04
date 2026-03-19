# 🎓 Máquina de Programación de Sueños - CECyTE 04

![CECyTE 04](https://img.shields.io/badge/CECyTE-04-ccff00?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-00f0ff?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-7c3aed?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-00ff9d?style=for-the-badge&logo=mongodb)

Aplicación web futurista que integra **Inteligencia Artificial**, **Tour Virtual 3D** y **generación de contenido personalizado** para mostrar a los estudiantes su futuro académico y profesional en CECyTE 04.

## ✨ Características Principales

### 🔮 Simulador de Futuro
- Genera historias de éxito personalizadas con **GPT-5.2**
- Crea imágenes futuristas con **GPT Image 1**
- Avatar 3D basado en nombre y género
- Envío de póster por email/WhatsApp

### 🏫 Tour Virtual 3D
- Explora las instalaciones del plantel
- Tarjetas interactivas de especialidades
- Soporte para modelos 3D (GLTF, GLB, FBX, OBJ)
- Navegación inmersiva

### 🛠️ Panel de Administración
- Carga de modelos 3D del plantel
- Editor de posiciones de tarjetas en espacio 3D
- Gestión de especialidades
- Autenticación dual (credenciales + Google)

### 🎯 5 Especialidades
| Especialidad | Color | Descripción |
|--------------|-------|-------------|
| Programación | 🔵 Cyan | Desarrollo de software y aplicaciones |
| Electrónica | 🟢 Lime | Circuitos, automatización, IoT |
| Contabilidad | 🟣 Purple | Finanzas y gestión fiscal |
| Administración | 🔴 Red | Liderazgo y gestión empresarial |
| Enfermería | 🟢 Green | Salud y bienestar comunitario |

## 📍 Ubicación

**CECyTE 04** - Tlaxcala, México  
📌 Coordenadas: `19°30'33.77"N 98°27'52.86"W`

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/SALVADOROLMEDOHERNANDEZ/Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04.git
cd Maquina_De_Programaci-n_De_Sue-os_Del_CECyTE04

# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --port 8001 --reload

# Frontend (otra terminal)
cd frontend
yarn install
yarn start
```

📖 **Ver guía completa:** [INSTALL.md](INSTALL.md)

## 🔐 Acceso Admin

| Método | Credenciales |
|--------|--------------|
| Login directo | `admin` / `cecyte04admin` |
| Google Auth | `olmedohernandezsalvador@gmail.com` |

**URL Admin:** `/admin`

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Three.js |
| Backend | FastAPI, Python 3.9+ |
| Base de Datos | MongoDB 6.0+ |
| IA | OpenAI GPT-5.2, GPT Image 1 |
| Auth | Google OAuth (Emergent) |

## 📂 Estructura

```
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dependencias Python
│   └── uploads/models/    # Modelos 3D
├── frontend/
│   ├── src/
│   │   ├── pages/         # 7 páginas
│   │   ├── components/    # Componentes UI
│   │   └── context/       # Auth Context
│   └── package.json
└── INSTALL.md             # Guía de instalación
```

## 🌐 Rutas de la Aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/simulator` | Simulador de futuro |
| `/tour` | Tour virtual 3D |
| `/especialidades` | Lista de carreras |
| `/dashboard` | Panel de usuario |
| `/admin` | Panel de administración |

## 📸 Capturas

### Landing Page
- Diseño futurista con paleta cyan/lime/purple
- Animaciones fluidas con Framer Motion
- Partículas animadas de fondo

### Simulador de Futuro
- Wizard de 4 pasos
- Generación de historias con IA
- Imágenes personalizadas

### Tour Virtual
- Vista 2.5D interactiva
- Tarjetas de especialidades
- Panel de información dinámico

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/NuevaCaracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Desarrollado con ❤️ para **CECyTE 04** - Tlaxcala, México

---

**Autor:** Salvador Olmedo Hernández  
**Email:** olmedohernandezsalvador@gmail.com

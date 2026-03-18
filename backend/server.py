from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, BackgroundTasks, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import base64
import httpx
import aiofiles
import hashlib
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory for 3D models
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'models'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Máquina de Programación de Sueños - CECyTE 04")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Admin configuration
ADMIN_CREDENTIALS = {
    "username": os.environ.get("ADMIN_USERNAME", "admin"),
    "password_hash": hashlib.sha256(os.environ.get("ADMIN_PASSWORD", "cecyte04admin").encode()).hexdigest()
}
ADMIN_EMAILS = os.environ.get("ADMIN_EMAILS", "").split(",") if os.environ.get("ADMIN_EMAILS") else []

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    sexo: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    is_admin: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SimulationRequest(BaseModel):
    nombre: str
    intereses: List[str]
    carrera: str
    sexo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None

class SimulationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    simulation_id: str
    user_id: Optional[str] = None
    nombre: str
    sexo: Optional[str] = None
    intereses: List[str]
    carrera: str
    historia: str
    imagen_base64: Optional[str] = None
    avatar_config: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Especialidad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    especialidad_id: str
    nombre: str
    descripcion: str
    habilidades: List[str]
    campo_laboral: List[str]
    posicion_3d: dict  # {x, y, z}
    color: str
    icono: str

class Model3D(BaseModel):
    model_config = ConfigDict(extra="ignore")
    model_id: str
    nombre: str
    filename: str
    format: str  # gltf, glb, fbx, obj
    file_size: int
    is_active: bool = False
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TarjetaPosition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tarjeta_id: str
    especialidad_id: str
    position: dict  # {x, y, z}
    rotation: dict  # {x, y, z}
    scale: float = 1.0
    model_id: Optional[str] = None  # Associated 3D model

class AdminLogin(BaseModel):
    username: str
    password: str

class SendPosterRequest(BaseModel):
    simulation_id: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    metodo: str  # "email", "whatsapp", "ambos"

# ============== HELPER FUNCTIONS ==============

async def get_current_user(request: Request) -> Optional[dict]:
    """Get current authenticated user from session"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if user_doc:
        user_doc["is_admin"] = session_doc.get("is_admin", False)
    return user_doc

async def require_admin(request: Request) -> dict:
    """Require admin authentication"""
    user = await get_current_user(request)
    if not user or not user.get("is_admin", False):
        # Check admin session token
        admin_token = request.cookies.get("admin_token")
        if not admin_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                admin_token = auth_header[7:]
        
        if admin_token:
            admin_session = await db.admin_sessions.find_one({"token": admin_token}, {"_id": 0})
            if admin_session:
                expires_at = admin_session.get("expires_at")
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    return {"username": admin_session["username"], "is_admin": True}
        
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_avatar_config(nombre: str, sexo: str = "neutral") -> dict:
    """Generate avatar configuration based on name and gender"""
    # Generate consistent colors based on name hash
    name_hash = hashlib.md5(nombre.encode()).hexdigest()
    
    # Skin tones
    skin_tones = ["#FFDFC4", "#F0D5BE", "#D1A684", "#A67C52", "#8D5524", "#6B4423"]
    skin_index = int(name_hash[0:2], 16) % len(skin_tones)
    
    # Hair colors
    hair_colors = ["#090806", "#2C222B", "#71635A", "#B7A69E", "#D6C4C2", "#CABFB1", "#977961", "#E6CEA8"]
    hair_index = int(name_hash[2:4], 16) % len(hair_colors)
    
    # Eye colors
    eye_colors = ["#634E34", "#2E536F", "#3D671D", "#497665", "#1C7847", "#7A3B3F"]
    eye_index = int(name_hash[4:6], 16) % len(eye_colors)
    
    # Clothing colors (professional)
    clothing_colors = ["#1E3A5F", "#2C3E50", "#34495E", "#7F8C8D", "#2E4A62", "#1A3A4A", "#4A4A4A"]
    clothing_index = int(name_hash[6:8], 16) % len(clothing_colors)
    
    # Hair styles based on gender
    if sexo.lower() in ["f", "femenino", "mujer", "female"]:
        hair_styles = ["long_straight", "long_wavy", "ponytail", "bun", "shoulder_length"]
        body_type = "female"
    elif sexo.lower() in ["m", "masculino", "hombre", "male"]:
        hair_styles = ["short", "crew_cut", "side_part", "slicked_back", "medium"]
        body_type = "male"
    else:
        hair_styles = ["short", "medium", "ponytail"]
        body_type = "neutral"
    
    hair_style_index = int(name_hash[8:10], 16) % len(hair_styles)
    
    return {
        "nombre": nombre,
        "sexo": sexo,
        "body_type": body_type,
        "skin_color": skin_tones[skin_index],
        "hair_color": hair_colors[hair_index],
        "hair_style": hair_styles[hair_style_index],
        "eye_color": eye_colors[eye_index],
        "clothing_color": clothing_colors[clothing_index],
        "clothing_secondary": "#FFFFFF",
        "height": 1.0 + (int(name_hash[10:12], 16) % 30) / 100,  # 1.0 to 1.3
        "accessories": []
    }

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create user session"""
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        async with httpx.AsyncClient() as http_client:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = auth_response.json()
        
        # Check if admin
        is_admin = session_data["email"] in ADMIN_EMAILS
        
        user_doc = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
        
        if not user_doc:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": session_data["email"],
                "name": session_data["name"],
                "picture": session_data.get("picture"),
                "is_admin": is_admin,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
        else:
            user_id = user_doc["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": session_data["name"],
                    "picture": session_data.get("picture"),
                    "is_admin": is_admin
                }}
            )
        
        session_token = session_data.get("session_token", f"session_{uuid.uuid4().hex}")
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_doc = {
            "session_id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_token": session_token,
            "is_admin": is_admin,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one(session_doc)
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "is_admin": is_admin
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth session error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_current_user_endpoint(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    response.delete_cookie(key="admin_token", path="/")
    return {"message": "Logged out successfully"}

# ============== ADMIN AUTH ENDPOINTS ==============

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin, response: Response):
    """Admin login with username/password"""
    password_hash = hashlib.sha256(data.password.encode()).hexdigest()
    
    if data.username != ADMIN_CREDENTIALS["username"] or password_hash != ADMIN_CREDENTIALS["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin_token = f"admin_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.admin_sessions.insert_one({
        "token": admin_token,
        "username": data.username,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="admin_token",
        value=admin_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=24 * 60 * 60
    )
    
    return {"message": "Admin login successful", "is_admin": True}

@api_router.get("/admin/check")
async def check_admin(request: Request):
    """Check if current user is admin"""
    try:
        admin = await require_admin(request)
        return {"is_admin": True, "user": admin}
    except HTTPException:
        return {"is_admin": False}

# ============== SIMULATION ENDPOINTS ==============

@api_router.post("/simulation/generate-story")
async def generate_story(data: SimulationRequest):
    """Generate personalized story using GPT-5.2"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"story_{uuid.uuid4().hex[:8]}",
            system_message="""Eres un narrador inspiracional que crea historias de éxito para estudiantes de CECyTE 04 en México. 
            Genera historias emotivas, motivadoras y realistas sobre el futuro académico y profesional del estudiante.
            La historia debe ser en español, tener entre 200-300 palabras, y mostrar cómo el estudiante logra sus sueños gracias a su formación en CECyTE 04.
            Incluye detalles específicos sobre la carrera elegida y cómo los intereses del estudiante contribuyen a su éxito.
            El tono debe ser inspirador y futurista, como si estuvieras describiendo un sueño que se hace realidad."""
        )
        chat.with_model("openai", "gpt-5.2")
        
        prompt = f"""Crea una historia de éxito para {data.nombre}, un estudiante de CECyTE 04 que estudia {data.carrera}.
        
        Sus intereses son: {', '.join(data.intereses)}
        
        La historia debe narrar su trayectoria desde CECyTE 04 hasta convertirse en un profesional exitoso, 
        mostrando momentos clave de su formación, logros importantes y cómo sus intereses lo llevaron al éxito.
        
        Escribe en primera persona, como si fuera el estudiante recordando su camino al éxito desde el futuro."""
        
        user_message = UserMessage(text=prompt)
        historia = await chat.send_message(user_message)
        
        return {"historia": historia}
        
    except Exception as e:
        logger.error(f"Story generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")

@api_router.post("/simulation/generate-image")
async def generate_image(data: SimulationRequest):
    """Generate futuristic avatar image using GPT Image 1"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        gender_desc = "female" if data.sexo and data.sexo.lower() in ["f", "femenino", "mujer", "female"] else "male"
        
        prompt = f"""Create a professional, futuristic digital portrait of a successful {gender_desc} {data.carrera} professional.
        The person should appear confident and accomplished, wearing modern professional attire.
        Background should feature subtle holographic elements and the CECyTE logo.
        Style: Cyberpunk professional, high-tech, inspirational.
        The image should convey success, innovation, and a bright future.
        Include subtle elements related to: {', '.join(data.intereses[:3])}.
        Colors: Electric blue, purple accents, and lime green highlights."""
        
        image_gen = OpenAIImageGeneration(api_key=api_key)
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {"imagen_base64": image_base64}
        else:
            raise HTTPException(status_code=500, detail="No image generated")
            
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")

@api_router.post("/simulation/generate-avatar")
async def generate_avatar(data: SimulationRequest):
    """Generate 3D avatar configuration based on user data"""
    avatar_config = generate_avatar_config(data.nombre, data.sexo or "neutral")
    return {"avatar_config": avatar_config}

@api_router.post("/simulation/save", response_model=dict)
async def save_simulation(request: Request, data: dict):
    """Save simulation result to database"""
    try:
        user = await get_current_user(request)
        user_id = user["user_id"] if user else None
        
        simulation_id = f"sim_{uuid.uuid4().hex[:12]}"
        
        # Generate avatar config
        avatar_config = generate_avatar_config(
            data.get("nombre", "Usuario"),
            data.get("sexo", "neutral")
        )
        
        simulation_doc = {
            "simulation_id": simulation_id,
            "user_id": user_id,
            "nombre": data.get("nombre"),
            "sexo": data.get("sexo"),
            "intereses": data.get("intereses", []),
            "carrera": data.get("carrera"),
            "historia": data.get("historia"),
            "imagen_base64": data.get("imagen_base64"),
            "avatar_config": avatar_config,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.simulations.insert_one(simulation_doc)
        
        return {"simulation_id": simulation_id, "avatar_config": avatar_config, "message": "Simulation saved successfully"}
        
    except Exception as e:
        logger.error(f"Save simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving simulation: {str(e)}")

@api_router.get("/simulation/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get simulation by ID"""
    simulation = await db.simulations.find_one(
        {"simulation_id": simulation_id},
        {"_id": 0}
    )
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return simulation

@api_router.get("/simulations/user")
async def get_user_simulations(request: Request):
    """Get all simulations for authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    simulations = await db.simulations.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return simulations

# ============== ESPECIALIDADES ENDPOINTS ==============

@api_router.get("/especialidades")
async def get_especialidades():
    """Get all specialties with 3D positions"""
    count = await db.especialidades.count_documents({})
    
    if count == 0:
        especialidades_data = [
            {
                "especialidad_id": "prog",
                "nombre": "Programacion",
                "descripcion": "Desarrolla software, aplicaciones web y móviles. Aprende lenguajes como Python, JavaScript, Java y más.",
                "habilidades": ["Desarrollo Web", "Bases de Datos", "Algoritmos", "Aplicaciones Móviles", "Inteligencia Artificial"],
                "campo_laboral": ["Desarrollador de Software", "Ingeniero de Datos", "Arquitecto de Sistemas", "DevOps Engineer"],
                "posicion_3d": {"x": -20, "y": 0, "z": 10},
                "color": "#00f0ff",
                "icono": "Code"
            },
            {
                "especialidad_id": "electronica",
                "nombre": "Electronica",
                "descripcion": "Diseña y mantiene sistemas electrónicos, desde circuitos hasta sistemas de automatización industrial.",
                "habilidades": ["Circuitos Electrónicos", "Microcontroladores", "Automatización", "Robótica", "IoT"],
                "campo_laboral": ["Ingeniero Electrónico", "Técnico en Automatización", "Diseñador de PCB", "Especialista en IoT"],
                "posicion_3d": {"x": 20, "y": 0, "z": 10},
                "color": "#ccff00",
                "icono": "Cpu"
            },
            {
                "especialidad_id": "contabilidad",
                "nombre": "Contabilidad",
                "descripcion": "Gestiona finanzas empresariales, elabora estados financieros y asesora en temas fiscales.",
                "habilidades": ["Contabilidad General", "Impuestos", "Nóminas", "Auditoría", "Finanzas"],
                "campo_laboral": ["Contador Público", "Auditor", "Asesor Fiscal", "Analista Financiero"],
                "posicion_3d": {"x": 0, "y": 0, "z": -20},
                "color": "#7c3aed",
                "icono": "Calculator"
            },
            {
                "especialidad_id": "administracion",
                "nombre": "Administracion",
                "descripcion": "Lidera equipos, gestiona recursos y desarrolla estrategias empresariales exitosas.",
                "habilidades": ["Gestión de Proyectos", "Recursos Humanos", "Marketing", "Planeación Estratégica", "Liderazgo"],
                "campo_laboral": ["Gerente General", "Director de RH", "Emprendedor", "Consultor Empresarial"],
                "posicion_3d": {"x": -15, "y": 0, "z": -15},
                "color": "#ff6b6b",
                "icono": "Briefcase"
            },
            {
                "especialidad_id": "enfermeria",
                "nombre": "Enfermeria",
                "descripcion": "Cuida la salud de las personas, brinda atención médica y promueve el bienestar comunitario.",
                "habilidades": ["Cuidados de Enfermería", "Primeros Auxilios", "Farmacología", "Salud Pública", "Atención al Paciente"],
                "campo_laboral": ["Enfermero(a) General", "Especialista en Urgencias", "Enfermero(a) Quirúrgico", "Promotor de Salud"],
                "posicion_3d": {"x": 15, "y": 0, "z": -15},
                "color": "#00ff9d",
                "icono": "Heart"
            }
        ]
        
        await db.especialidades.insert_many(especialidades_data)
    
    especialidades = await db.especialidades.find({}, {"_id": 0}).to_list(100)
    return especialidades

@api_router.get("/especialidad/{especialidad_id}")
async def get_especialidad(especialidad_id: str):
    """Get specialty by ID"""
    especialidad = await db.especialidades.find_one(
        {"especialidad_id": especialidad_id},
        {"_id": 0}
    )
    
    if not especialidad:
        raise HTTPException(status_code=404, detail="Especialidad not found")
    
    return especialidad

# ============== 3D MODEL MANAGEMENT (ADMIN) ==============

@api_router.post("/admin/models/upload")
async def upload_3d_model(
    request: Request,
    file: UploadFile = File(...),
    nombre: str = Form(...)
):
    """Upload a 3D model file (admin only)"""
    admin = await require_admin(request)
    
    # Validate file extension
    allowed_extensions = ['.gltf', '.glb', '.fbx', '.obj']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}")
    
    # Generate unique filename
    model_id = f"model_{uuid.uuid4().hex[:12]}"
    filename = f"{model_id}{file_ext}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        file_size = len(content)
        
        # Save model info to database
        model_doc = {
            "model_id": model_id,
            "nombre": nombre,
            "filename": filename,
            "original_filename": file.filename,
            "format": file_ext[1:],  # Remove the dot
            "file_size": file_size,
            "is_active": False,
            "uploaded_by": admin.get("username", admin.get("email", "admin")),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.models_3d.insert_one(model_doc)
        
        return {"model_id": model_id, "filename": filename, "message": "Model uploaded successfully"}
        
    except Exception as e:
        logger.error(f"Model upload error: {e}")
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error uploading model: {str(e)}")

@api_router.get("/admin/models")
async def get_all_models(request: Request):
    """Get all uploaded 3D models (admin only)"""
    await require_admin(request)
    
    models = await db.models_3d.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(100)
    return models

@api_router.get("/models/active")
async def get_active_model():
    """Get the currently active 3D model"""
    model = await db.models_3d.find_one({"is_active": True}, {"_id": 0})
    return model

@api_router.put("/admin/models/{model_id}/activate")
async def activate_model(request: Request, model_id: str):
    """Set a model as the active campus model (admin only)"""
    await require_admin(request)
    
    # Deactivate all models
    await db.models_3d.update_many({}, {"$set": {"is_active": False}})
    
    # Activate selected model
    result = await db.models_3d.update_one(
        {"model_id": model_id},
        {"$set": {"is_active": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {"message": "Model activated successfully"}

@api_router.delete("/admin/models/{model_id}")
async def delete_model(request: Request, model_id: str):
    """Delete a 3D model (admin only)"""
    await require_admin(request)
    
    model = await db.models_3d.find_one({"model_id": model_id}, {"_id": 0})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Delete file
    file_path = UPLOADS_DIR / model["filename"]
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.models_3d.delete_one({"model_id": model_id})
    
    # Also delete associated tarjeta positions
    await db.tarjeta_positions.delete_many({"model_id": model_id})
    
    return {"message": "Model deleted successfully"}

@api_router.get("/models/file/{filename}")
async def get_model_file(filename: str):
    """Serve 3D model file"""
    file_path = UPLOADS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    ext = file_path.suffix.lower()
    content_types = {
        '.gltf': 'model/gltf+json',
        '.glb': 'model/gltf-binary',
        '.fbx': 'application/octet-stream',
        '.obj': 'text/plain'
    }
    
    return FileResponse(
        file_path,
        media_type=content_types.get(ext, 'application/octet-stream'),
        filename=filename
    )

# ============== TARJETA POSITIONS (ADMIN) ==============

@api_router.get("/tarjetas/positions")
async def get_tarjeta_positions(model_id: Optional[str] = None):
    """Get all tarjeta positions for a model"""
    query = {"model_id": model_id} if model_id else {}
    positions = await db.tarjeta_positions.find(query, {"_id": 0}).to_list(100)
    
    # If no positions exist, return default positions
    if not positions:
        especialidades = await db.especialidades.find({}, {"_id": 0}).to_list(100)
        positions = []
        for esp in especialidades:
            pos = esp.get("posicion_3d", {"x": 0, "y": 0, "z": 0})
            positions.append({
                "tarjeta_id": f"tarjeta_{esp['especialidad_id']}",
                "especialidad_id": esp["especialidad_id"],
                "position": pos,
                "rotation": {"x": 0, "y": 0, "z": 0},
                "scale": 1.0,
                "model_id": model_id
            })
    
    return positions

@api_router.put("/admin/tarjetas/position")
async def update_tarjeta_position(request: Request, data: dict):
    """Update tarjeta position (admin only)"""
    await require_admin(request)
    
    tarjeta_id = data.get("tarjeta_id")
    if not tarjeta_id:
        raise HTTPException(status_code=400, detail="tarjeta_id is required")
    
    update_data = {
        "tarjeta_id": tarjeta_id,
        "especialidad_id": data.get("especialidad_id"),
        "position": data.get("position", {"x": 0, "y": 0, "z": 0}),
        "rotation": data.get("rotation", {"x": 0, "y": 0, "z": 0}),
        "scale": data.get("scale", 1.0),
        "model_id": data.get("model_id"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tarjeta_positions.update_one(
        {"tarjeta_id": tarjeta_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Position updated successfully"}

@api_router.post("/admin/tarjetas/positions/bulk")
async def bulk_update_tarjeta_positions(request: Request, data: dict):
    """Bulk update tarjeta positions (admin only)"""
    await require_admin(request)
    
    positions = data.get("positions", [])
    
    for pos in positions:
        pos["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.tarjeta_positions.update_one(
            {"tarjeta_id": pos["tarjeta_id"]},
            {"$set": pos},
            upsert=True
        )
    
    return {"message": f"Updated {len(positions)} positions"}

# ============== POSTER SENDING ENDPOINTS ==============

@api_router.post("/poster/send")
async def send_poster(data: SendPosterRequest, background_tasks: BackgroundTasks):
    """Send poster via email and/or WhatsApp"""
    try:
        simulation = await db.simulations.find_one(
            {"simulation_id": data.simulation_id},
            {"_id": 0}
        )
        
        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
        
        results = {"email": None, "whatsapp": None}
        
        # Email sending with SendGrid
        if data.metodo in ["email", "ambos"] and data.email:
            sendgrid_key = os.environ.get("SENDGRID_API_KEY")
            sender_email = os.environ.get("SENDER_EMAIL")
            
            if sendgrid_key and sender_email:
                try:
                    from sendgrid import SendGridAPIClient
                    from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
                    
                    html_content = f"""
                    <html>
                    <body style="background-color: #020408; color: #e2e8f0; font-family: Arial, sans-serif; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #ccff00; text-align: center;">Tu Futuro en CECyTE 04</h1>
                            <h2 style="color: #00f0ff;">Hola {simulation.get('nombre', 'Estudiante')}</h2>
                            <p>Aquí está tu historia de éxito personalizada:</p>
                            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                                <p style="line-height: 1.6;">{simulation.get('historia', '')}</p>
                            </div>
                            <p style="margin-top: 20px; text-align: center; color: #7c3aed;">
                                Carrera: {simulation.get('carrera', 'No especificada')}
                            </p>
                            <hr style="border-color: rgba(255,255,255,0.1);">
                            <p style="text-align: center; font-size: 12px; color: #666;">
                                Máquina de Programación de Sueños - CECyTE 04
                            </p>
                        </div>
                    </body>
                    </html>
                    """
                    
                    message = Mail(
                        from_email=sender_email,
                        to_emails=data.email,
                        subject=f"Tu Futuro Soñado en CECyTE 04 - {simulation.get('nombre', 'Estudiante')}",
                        html_content=html_content
                    )
                    
                    if simulation.get('imagen_base64'):
                        attachment = Attachment()
                        attachment.file_content = FileContent(simulation['imagen_base64'])
                        attachment.file_name = FileName('tu_futuro_cecyte04.png')
                        attachment.file_type = FileType('image/png')
                        attachment.disposition = Disposition('attachment')
                        message.add_attachment(attachment)
                    
                    sg = SendGridAPIClient(sendgrid_key)
                    response = sg.send(message)
                    results["email"] = "sent" if response.status_code == 202 else "failed"
                    
                except Exception as e:
                    logger.error(f"Email sending error: {e}")
                    results["email"] = f"error: {str(e)}"
            else:
                results["email"] = "not_configured"
        
        # WhatsApp sending with Twilio
        if data.metodo in ["whatsapp", "ambos"] and data.telefono:
            twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
            twilio_phone = os.environ.get("TWILIO_WHATSAPP_NUMBER")
            
            if twilio_sid and twilio_token and twilio_phone:
                try:
                    from twilio.rest import Client
                    
                    twilio_client = Client(twilio_sid, twilio_token)
                    
                    message_body = f"""
🌟 *Tu Futuro en CECyTE 04* 🌟

Hola {simulation.get('nombre', 'Estudiante')}!

Tu historia de éxito:
{simulation.get('historia', '')[:500]}...

Carrera: {simulation.get('carrera', 'No especificada')}

¡Tu futuro comienza en CECyTE 04! 🚀
                    """
                    
                    message = twilio_client.messages.create(
                        body=message_body,
                        from_=f"whatsapp:{twilio_phone}",
                        to=f"whatsapp:{data.telefono}"
                    )
                    results["whatsapp"] = "sent" if message.sid else "failed"
                    
                except Exception as e:
                    logger.error(f"WhatsApp sending error: {e}")
                    results["whatsapp"] = f"error: {str(e)}"
            else:
                results["whatsapp"] = "not_configured"
        
        return {"message": "Poster sending processed", "results": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send poster error: {e}")
        raise HTTPException(status_code=500, detail=f"Error sending poster: {str(e)}")

# ============== CAMPUS INFO ==============

@api_router.get("/campus/info")
async def get_campus_info():
    """Get campus information including coordinates"""
    return {
        "nombre": "CECyTE 04",
        "direccion": "Tlaxcala, México",
        "coordenadas": {
            "latitud": 19.509380555555556,
            "longitud": -98.46468333333333,
            "formato_dms": "19°30'33.77\"N 98°27'52.86\"W"
        },
        "especialidades": ["Programación", "Electrónica", "Contabilidad", "Administración", "Enfermería"],
        "descripcion": "Centro de Estudios Científicos y Tecnológicos del Estado de Tlaxcala, formando profesionales técnicos del futuro."
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Máquina de Programación de Sueños - CECyTE 04 API", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cecyte04-dreams-api"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

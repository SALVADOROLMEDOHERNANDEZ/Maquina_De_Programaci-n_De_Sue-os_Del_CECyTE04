from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
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

UPLOADS_DIR = ROOT_DIR / 'uploads' / 'models'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

mongo_client = None
db = None

async def get_db():
    global mongo_client, db
    if mongo_client is None:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'cecyte04_dreams')
        mongo_client = AsyncIOMotorClient(mongo_url)
        db = mongo_client[db_name]
    return db

app = FastAPI(title="Máquina de Programación de Sueños - CECyTE 04")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ADMIN_CREDENTIALS = {
    "username": os.environ.get("ADMIN_USERNAME", "admin"),
    "password_hash": hashlib.sha256(os.environ.get("ADMIN_PASSWORD", "cecyte04admin").encode()).hexdigest()
}
ADMIN_EMAILS = os.environ.get("ADMIN_EMAILS", "olmedohernandezsalvador@gmail.com").split(",")

# Models
class SimulationRequest(BaseModel):
    nombre: str
    intereses: List[str]
    carrera: str
    sexo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class CareerQuizRequest(BaseModel):
    respuestas: Dict[str, Any]

class SendPosterRequest(BaseModel):
    simulation_id: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    metodo: str

# Initial Data
ESPECIALIDADES_INICIALES = [
    {
        "especialidad_id": "prog",
        "nombre": "Programación",
        "descripcion": "Desarrolla software, aplicaciones web y móviles. Aprende lenguajes como Python, JavaScript, Java y más.",
        "habilidades": ["Desarrollo Web", "Bases de Datos", "Algoritmos", "Aplicaciones Móviles", "Inteligencia Artificial"],
        "campo_laboral": ["Desarrollador de Software", "Ingeniero de Datos", "Arquitecto de Sistemas", "DevOps Engineer"],
        "posicion_3d": {"x": -15, "y": 0, "z": 0},
        "color": "#00f0ff",
        "icono": "Code"
    },
    {
        "especialidad_id": "mantenimiento",
        "nombre": "Mantenimiento Industrial",
        "descripcion": "Especialízate en el mantenimiento preventivo y correctivo de maquinaria industrial, sistemas neumáticos, hidráulicos y eléctricos.",
        "habilidades": ["Mantenimiento Preventivo", "Sistemas Neumáticos", "Sistemas Hidráulicos", "Electricidad Industrial", "PLC y Automatización", "Soldadura", "Mecánica Industrial"],
        "campo_laboral": ["Técnico en Mantenimiento Industrial", "Supervisor de Mantenimiento", "Ingeniero de Planta", "Especialista en Automatización"],
        "posicion_3d": {"x": 15, "y": 0, "z": 0},
        "color": "#ff9500",
        "icono": "Wrench"
    }
]

async def init_especialidades():
    database = await get_db()
    count = await database.especialidades.count_documents({})
    if count == 0:
        await database.especialidades.insert_many(ESPECIALIDADES_INICIALES)
        logger.info("Especialidades inicializadas")

def serialize_doc(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if '_id' in doc:
        del doc['_id']
    return doc

# Helper Functions
async def get_current_user(request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        return None
    
    database = await get_db()
    session_doc = await database.user_sessions.find_one({"session_token": session_token})
    if not session_doc:
        return None
    
    expires_at = session_doc.get('expires_at')
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await database.users.find_one({"user_id": session_doc['user_id']})
    if user_doc:
        user_doc = serialize_doc(user_doc)
        user_doc['is_admin'] = bool(session_doc.get('is_admin', False))
    return user_doc

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if not user or not user.get("is_admin", False):
        admin_token = request.cookies.get("admin_token")
        if not admin_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                admin_token = auth_header[7:]
        
        if admin_token:
            database = await get_db()
            admin_session = await database.admin_sessions.find_one({"token": admin_token})
            if admin_session:
                expires_at = admin_session.get('expires_at')
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    return {"username": admin_session["username"], "is_admin": True}
        
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_avatar_config(nombre: str, sexo: str = "neutral") -> dict:
    name_hash = hashlib.md5(nombre.encode()).hexdigest()
    skin_tones = ["#FFDFC4", "#F0D5BE", "#D1A684", "#A67C52", "#8D5524", "#6B4423"]
    hair_colors = ["#090806", "#2C222B", "#71635A", "#B7A69E", "#D6C4C2", "#CABFB1"]
    eye_colors = ["#634E34", "#2E536F", "#3D671D", "#497665", "#1C7847", "#7A3B3F"]
    clothing_colors = ["#1E3A5F", "#2C3E50", "#34495E", "#7F8C8D", "#2E4A62"]
    
    if sexo.lower() in ["f", "femenino", "mujer", "female"]:
        hair_styles = ["long_straight", "long_wavy", "ponytail", "bun"]
        body_type = "female"
    elif sexo.lower() in ["m", "masculino", "hombre", "male"]:
        hair_styles = ["short", "crew_cut", "side_part", "slicked_back"]
        body_type = "male"
    else:
        hair_styles = ["short", "medium", "ponytail"]
        body_type = "neutral"
    
    return {
        "nombre": nombre,
        "sexo": sexo,
        "body_type": body_type,
        "skin_color": skin_tones[int(name_hash[0:2], 16) % len(skin_tones)],
        "hair_color": hair_colors[int(name_hash[2:4], 16) % len(hair_colors)],
        "hair_style": hair_styles[int(name_hash[8:10], 16) % len(hair_styles)],
        "eye_color": eye_colors[int(name_hash[4:6], 16) % len(eye_colors)],
        "clothing_color": clothing_colors[int(name_hash[6:8], 16) % len(clothing_colors)],
    }

# Auth Endpoints
@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
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
        
        is_admin = session_data["email"] in ADMIN_EMAILS
        database = await get_db()
        user_doc = await database.users.find_one({"email": session_data["email"]})
        
        if not user_doc:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await database.users.insert_one({
                "user_id": user_id, "email": session_data["email"],
                "name": session_data["name"], "picture": session_data.get("picture"),
                "is_admin": is_admin, "created_at": datetime.now(timezone.utc)
            })
        else:
            user_id = user_doc["user_id"]
            await database.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": session_data["name"], "picture": session_data.get("picture"), "is_admin": is_admin}}
            )
        
        session_token = session_data.get("session_token", f"session_{uuid.uuid4().hex}")
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await database.user_sessions.delete_many({"user_id": user_id})
        await database.user_sessions.insert_one({
            "session_id": str(uuid.uuid4()), "user_id": user_id,
            "session_token": session_token, "is_admin": is_admin,
            "expires_at": expires_at, "created_at": datetime.now(timezone.utc)
        })
        
        response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
        return {"user_id": user_id, "email": session_data["email"], "name": session_data["name"], "picture": session_data.get("picture"), "is_admin": is_admin}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth session error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_current_user_endpoint(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        database = await get_db()
        await database.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    response.delete_cookie(key="admin_token", path="/")
    return {"message": "Logged out successfully"}

# Admin Auth
@api_router.post("/admin/login")
async def admin_login(data: AdminLogin, response: Response):
    password_hash = hashlib.sha256(data.password.encode()).hexdigest()
    if data.username != ADMIN_CREDENTIALS["username"] or password_hash != ADMIN_CREDENTIALS["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin_token = f"admin_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    database = await get_db()
    await database.admin_sessions.insert_one({"token": admin_token, "username": data.username, "expires_at": expires_at, "created_at": datetime.now(timezone.utc)})
    response.set_cookie(key="admin_token", value=admin_token, httponly=True, secure=True, samesite="none", path="/", max_age=24*60*60)
    return {"message": "Admin login successful", "is_admin": True}

@api_router.get("/admin/check")
async def check_admin(request: Request):
    try:
        admin = await require_admin(request)
        return {"is_admin": True, "user": admin}
    except HTTPException:
        return {"is_admin": False}

# Simulation Endpoints
@api_router.post("/simulation/generate-story")
async def generate_story(data: SimulationRequest):
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Gemini API key no configurada")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        prompt = f"""Eres un narrador inspiracional. Genera una historia emotiva sobre el futuro de {data.nombre}, estudiante de {data.carrera} en CECyTE 04. Intereses: {', '.join(data.intereses)}. La historia debe estar en español, 250-350 palabras, en primera persona."""
        response = model.generate_content(prompt)
        return {"historia": response.text}
    except Exception as e:
        logger.error(f"Story generation error: {e}")
        return {"historia": f"Me llamo {data.nombre} y recuerdo el día que entré a CECyTE 04 para estudiar {data.carrera}. Mis intereses en {data.intereses[0] if data.intereses else 'tecnología'} me llevaron a esta institución. Hoy trabajo en lo que siempre soñé gracias a mi formación en CECyTE 04."}

@api_router.post("/simulation/generate-image")
async def generate_image(data: SimulationRequest):
    try:
        from huggingface_hub import InferenceClient
        from PIL import Image
        import io
        
        api_token = os.environ.get("HUGGINGFACE_API_TOKEN")
        if not api_token:
            return {"imagen_base64": None}
        
        client = InferenceClient(token=api_token)
        gender_desc = "mujer joven profesional" if data.sexo and data.sexo.lower() in ["f", "femenino", "mujer", "female"] else "hombre joven profesional"
        prompt = f"professional portrait of a successful {gender_desc} {data.carrera}, futuristic office, cyberpunk style"
        
        image = client.text_to_image(model="stabilityai/stable-diffusion-2-1:cheapest", prompt=prompt, provider="auto")
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return {"imagen_base64": base64.b64encode(buffered.getvalue()).decode('utf-8')}
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return {"imagen_base64": None}

@api_router.post("/simulation/generate-avatar")
async def generate_avatar(data: SimulationRequest):
    return {"avatar_config": generate_avatar_config(data.nombre, data.sexo or "neutral")}

@api_router.post("/simulation/save")
async def save_simulation(request: Request, data: dict):
    try:
        user = await get_current_user(request)
        user_id = user["user_id"] if user else None
        simulation_id = f"sim_{uuid.uuid4().hex[:12]}"
        avatar_config = generate_avatar_config(data.get("nombre", "Usuario"), data.get("sexo", "neutral"))
        
        database = await get_db()
        await database.simulations.insert_one({
            "simulation_id": simulation_id, "user_id": user_id,
            "nombre": data.get("nombre"), "sexo": data.get("sexo"),
            "intereses": data.get("intereses", []), "carrera": data.get("carrera"),
            "historia": data.get("historia"), "imagen_base64": data.get("imagen_base64"),
            "avatar_config": avatar_config, "created_at": datetime.now(timezone.utc)
        })
        return {"simulation_id": simulation_id, "avatar_config": avatar_config, "message": "Simulation saved successfully"}
    except Exception as e:
        logger.error(f"Save simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/simulation/{simulation_id}")
async def get_simulation(simulation_id: str):
    database = await get_db()
    simulation = await database.simulations.find_one({"simulation_id": simulation_id})
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return serialize_doc(simulation)

@api_router.get("/simulations/user")
async def get_user_simulations(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    database = await get_db()
    cursor = database.simulations.find({"user_id": user["user_id"]}).sort("created_at", -1).limit(100)
    return [serialize_doc(sim) for sim in await cursor.to_list(length=100)]

# Especialidades
@api_router.get("/especialidades")
async def get_especialidades():
    database = await get_db()
    cursor = database.especialidades.find({})
    return [serialize_doc(esp) for esp in await cursor.to_list(length=100)]

@api_router.get("/especialidad/{especialidad_id}")
async def get_especialidad(especialidad_id: str):
    database = await get_db()
    especialidad = await database.especialidades.find_one({"especialidad_id": especialidad_id})
    if not especialidad:
        raise HTTPException(status_code=404, detail="Especialidad not found")
    return serialize_doc(especialidad)

# Career Quiz
@api_router.post("/career-quiz/recommend")
async def recommend_career(data: CareerQuizRequest):
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            return {
                "recomendaciones": [
                    {"carrera": "Programación", "compatibilidad": 85, "descripcion": "Ideal para ti.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True},
                    {"carrera": "Mantenimiento Industrial", "compatibilidad": 75, "descripcion": "Gran opción.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True}
                ],
                "mensaje": "Recomendaciones sin IA"
            }
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        respuestas_texto = json.dumps(data.respuestas, ensure_ascii=False)
        
        prompt = f"""Analiza estas respuestas y recomienda carreras. Respuestas: {respuestas_texto}
        
Carreras en CECyTE 04: Programación, Mantenimiento Industrial
También incluye opciones externas.

Responde SOLO con JSON válido:
{{"recomendaciones": [{{"carrera": "Nombre", "compatibilidad": 85, "descripcion": "Por qué", "donde_estudiar": ["Lugar"], "es_cecyte": true}}], "analisis": "Perfil", "fortalezas": ["F1", "F2"]}}"""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text)
    except Exception as e:
        logger.error(f"Career recommendation error: {e}")
        return {"recomendaciones": [{"carrera": "Programación", "compatibilidad": 80, "descripcion": "Carrera versátil.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True}]}

# CECYTE AI Project
@api_router.get("/ia-cecyte/info")
async def get_cecyte_ai_info():
    return {
        "nombre": "IA CECYTE - Proyecto Colaborativo",
        "descripcion": "Un proyecto donde los estudiantes de programación de CECYTE 04 colaboran para crear su propia inteligencia artificial.",
        "estado": "En desarrollo",
        "objetivos": ["Aprender sobre IA de manera práctica", "Crear un asistente virtual para CECYTE", "Fomentar trabajo colaborativo", "Desarrollar habilidades en ML y NLP"],
        "tecnologias": ["Python", "TensorFlow", "NLP", "APIs REST"],
        "como_contribuir": "/ia-cecyte para más información"
    }

@api_router.get("/ia-cecyte/developers")
async def get_cecyte_ai_developers():
    return {"desarrolladores": [], "mensaje": "¿Quieres aparecer aquí? Contribuye al proyecto IA CECYTE", "como_unirse": "Contacta a tu profesor de programación"}

@api_router.get("/ia-cecyte/docs")
async def get_cecyte_ai_docs():
    return {
        "titulo": "Documentación del Proyecto IA CECYTE",
        "secciones": [
            {"titulo": "Introducción", "contenido": "El proyecto IA CECYTE busca crear una inteligencia artificial propia del plantel."},
            {"titulo": "Requisitos", "contenido": "Python 3.8+, conocimientos básicos de programación"},
            {"titulo": "Primeros Pasos", "contenido": "1. Clona el repositorio\n2. Instala las dependencias\n3. Lee la guía de contribución"}
        ]
    }

@api_router.get("/ia-cecyte/contributing")
async def get_cecyte_ai_contributing():
    return {
        "titulo": "Guía de Contribución",
        "pasos": [
            {"numero": 1, "titulo": "Fork del Repositorio", "descripcion": "Haz un fork del proyecto"},
            {"numero": 2, "titulo": "Crea una Rama", "descripcion": "git checkout -b mi-caracteristica"},
            {"numero": 3, "titulo": "Desarrolla", "descripcion": "Escribe tu código"},
            {"numero": 4, "titulo": "Prueba", "descripcion": "Asegúrate de que todas las pruebas pasen"},
            {"numero": 5, "titulo": "Pull Request", "descripcion": "Envía un PR"}
        ],
        "reglas": ["Respeta el código de conducta", "Documenta tu código", "Sigue PEP 8"]
    }

# 3D Models
@api_router.post("/admin/models/upload")
async def upload_3d_model(request: Request, file: UploadFile = File(...), nombre: str = Form(...)):
    admin = await require_admin(request)
    allowed = ['.gltf', '.glb', '.fbx', '.obj']
    file_ext = Path(file.filename or "model").suffix.lower()
    if file_ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid format. Allowed: {allowed}")
    
    model_id = f"model_{uuid.uuid4().hex[:12]}"
    filename = f"{model_id}{file_ext}"
    file_path = UPLOADS_DIR / filename
    
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 100MB")
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    database = await get_db()
    await database.models_3d.insert_one({
        "model_id": model_id, "nombre": nombre, "filename": filename,
        "original_filename": file.filename, "format": file_ext[1:],
        "file_size": len(content), "is_active": False,
        "uploaded_by": admin.get("username", "admin"), "uploaded_at": datetime.now(timezone.utc)
    })
    return {"model_id": model_id, "filename": filename, "file_size": len(content)}

@api_router.get("/admin/models")
async def get_all_models(request: Request):
    await require_admin(request)
    database = await get_db()
    cursor = database.models_3d.find({}).sort("uploaded_at", -1).limit(100)
    return [serialize_doc(m) for m in await cursor.to_list(length=100)]

@api_router.get("/models/active")
async def get_active_model():
    database = await get_db()
    model = await database.models_3d.find_one({"is_active": True})
    return serialize_doc(model)

@api_router.put("/admin/models/{model_id}/activate")
async def activate_model(request: Request, model_id: str):
    await require_admin(request)
    database = await get_db()
    await database.models_3d.update_many({}, {"$set": {"is_active": False}})
    result = await database.models_3d.update_one({"model_id": model_id}, {"$set": {"is_active": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model activated"}

@api_router.delete("/admin/models/{model_id}")
async def delete_model(request: Request, model_id: str):
    await require_admin(request)
    database = await get_db()
    model = await database.models_3d.find_one({"model_id": model_id})
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    file_path = UPLOADS_DIR / model["filename"]
    if file_path.exists():
        file_path.unlink()
    await database.models_3d.delete_one({"model_id": model_id})
    return {"message": "Model deleted"}

@api_router.get("/models/file/{filename}")
async def get_model_file(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    content_types = {'.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.fbx': 'application/octet-stream', '.obj': 'text/plain'}
    return FileResponse(file_path, media_type=content_types.get(file_path.suffix.lower(), 'application/octet-stream'))

# Tarjeta Positions
@api_router.get("/tarjetas/positions")
async def get_tarjeta_positions(model_id: Optional[str] = None):
    database = await get_db()
    query = {"model_id": model_id} if model_id else {}
    cursor = database.tarjeta_positions.find(query)
    positions = [serialize_doc(p) for p in await cursor.to_list(length=100)]
    
    if not positions:
        cursor = database.especialidades.find({})
        especialidades = await cursor.to_list(length=100)
        positions = [{"tarjeta_id": f"tarjeta_{e['especialidad_id']}", "especialidad_id": e["especialidad_id"], "position": e.get("posicion_3d", {"x":0,"y":0,"z":0}), "rotation": {"x":0,"y":0,"z":0}, "scale": 1.0, "model_id": model_id} for e in especialidades]
    return positions

@api_router.put("/admin/tarjetas/position")
async def update_tarjeta_position(request: Request, data: dict):
    await require_admin(request)
    tarjeta_id = data.get("tarjeta_id")
    if not tarjeta_id:
        raise HTTPException(status_code=400, detail="tarjeta_id required")
    database = await get_db()
    await database.tarjeta_positions.update_one({"tarjeta_id": tarjeta_id}, {"$set": {**data, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    return {"message": "Position updated"}

# Poster Send
@api_router.post("/poster/send")
async def send_poster(data: SendPosterRequest):
    database = await get_db()
    simulation = await database.simulations.find_one({"simulation_id": data.simulation_id})
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"message": "Poster sending processed", "results": {"email": "not_configured", "whatsapp": "not_configured"}}

# Campus Info
@api_router.get("/campus/info")
async def get_campus_info():
    return {
        "nombre": "CECyTE 04",
        "direccion": "Tlaxcala, México",
        "coordenadas": {"latitud": 19.509380555555556, "longitud": -98.46468333333333, "formato_dms": "19°30'33.77\"N 98°27'52.86\"W"},
        "especialidades": ["Programación", "Mantenimiento Industrial"],
        "descripcion": "Centro de Estudios Científicos y Tecnológicos del Estado de Tlaxcala"
    }

# Health
@api_router.get("/")
async def root():
    return {"message": "Máquina de Programación de Sueños - CECyTE 04 API", "status": "active", "database": "MongoDB"}

@api_router.get("/health")
async def health_check():
    try:
        database = await get_db()
        await database.command("ping")
        return {"status": "healthy", "service": "cecyte04-dreams-api", "database": "MongoDB", "connection": "OK"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    await get_db()
    await init_especialidades()
    logger.info("MongoDB initialized")

@app.on_event("shutdown")
async def shutdown():
    global mongo_client
    if mongo_client:
        mongo_client.close()

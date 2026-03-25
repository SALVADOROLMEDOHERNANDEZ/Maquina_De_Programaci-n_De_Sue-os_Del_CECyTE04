from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiomysql
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

# MySQL connection pool
db_pool = None

async def get_db():
    """Get or create MySQL connection pool"""
    global db_pool
    if db_pool is None:
        db_pool = await aiomysql.create_pool(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', ''),
            db=os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams'),
            charset='utf8mb4',
            autocommit=True,
            minsize=1,
            maxsize=10
        )
    return db_pool

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

# Helper Functions
async def get_current_user(request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        return None
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM user_sessions WHERE session_token = %s", (session_token,))
            session_doc = await cursor.fetchone()
            if not session_doc:
                return None
            
            expires_at = session_doc['expires_at']
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                return None
            
            await cursor.execute("SELECT * FROM users WHERE user_id = %s", (session_doc['user_id'],))
            user_doc = await cursor.fetchone()
            if user_doc:
                user_doc = dict(user_doc)
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
            pool = await get_db()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute("SELECT * FROM admin_sessions WHERE token = %s", (admin_token,))
                    admin_session = await cursor.fetchone()
                    if admin_session:
                        expires_at = admin_session['expires_at']
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
        
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("SELECT * FROM users WHERE email = %s", (session_data["email"],))
                user_doc = await cursor.fetchone()
                
                if not user_doc:
                    user_id = f"user_{uuid.uuid4().hex[:12]}"
                    await cursor.execute(
                        "INSERT INTO users (user_id, email, name, picture, is_admin, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                        (user_id, session_data["email"], session_data["name"], session_data.get("picture"), is_admin, datetime.now(timezone.utc))
                    )
                else:
                    user_id = user_doc["user_id"]
                    await cursor.execute(
                        "UPDATE users SET name = %s, picture = %s, is_admin = %s WHERE user_id = %s",
                        (session_data["name"], session_data.get("picture"), is_admin, user_id)
                    )
                
                session_token = session_data.get("session_token", f"session_{uuid.uuid4().hex}")
                expires_at = datetime.now(timezone.utc) + timedelta(days=7)
                
                await cursor.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
                await cursor.execute(
                    "INSERT INTO user_sessions (session_id, user_id, session_token, is_admin, expires_at, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), user_id, session_token, is_admin, expires_at, datetime.now(timezone.utc))
                )
        
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
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM user_sessions WHERE session_token = %s", (session_token,))
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
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "INSERT INTO admin_sessions (token, username, expires_at, created_at) VALUES (%s, %s, %s, %s)",
                (admin_token, data.username, expires_at, datetime.now(timezone.utc))
            )
    
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
        
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO simulations (simulation_id, user_id, nombre, sexo, intereses, carrera, historia, imagen_base64, avatar_config, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (simulation_id, user_id, data.get("nombre"), data.get("sexo"),
                     json.dumps(data.get("intereses", [])), data.get("carrera"),
                     data.get("historia"), data.get("imagen_base64"),
                     json.dumps(avatar_config), datetime.now(timezone.utc))
                )
        
        return {"simulation_id": simulation_id, "avatar_config": avatar_config, "message": "Simulation saved successfully"}
    except Exception as e:
        logger.error(f"Save simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/simulation/{simulation_id}")
async def get_simulation(simulation_id: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM simulations WHERE simulation_id = %s", (simulation_id,))
            simulation = await cursor.fetchone()
            if not simulation:
                raise HTTPException(status_code=404, detail="Simulation not found")
            simulation['intereses'] = json.loads(simulation['intereses']) if simulation.get('intereses') else []
            simulation['avatar_config'] = json.loads(simulation['avatar_config']) if simulation.get('avatar_config') else None
            return dict(simulation)

@api_router.get("/simulations/user")
async def get_user_simulations(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM simulations WHERE user_id = %s ORDER BY created_at DESC LIMIT 100", (user["user_id"],))
            simulations = await cursor.fetchall()
            for sim in simulations:
                sim['intereses'] = json.loads(sim['intereses']) if sim.get('intereses') else []
                sim['avatar_config'] = json.loads(sim['avatar_config']) if sim.get('avatar_config') else None
            return [dict(s) for s in simulations]

# Especialidades
@api_router.get("/especialidades")
async def get_especialidades():
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM especialidades")
            especialidades = await cursor.fetchall()
            for esp in especialidades:
                esp['habilidades'] = json.loads(esp['habilidades']) if esp.get('habilidades') else []
                esp['campo_laboral'] = json.loads(esp['campo_laboral']) if esp.get('campo_laboral') else []
                esp['posicion_3d'] = json.loads(esp['posicion_3d']) if esp.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
            return [dict(e) for e in especialidades]

@api_router.get("/especialidad/{especialidad_id}")
async def get_especialidad(especialidad_id: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM especialidades WHERE especialidad_id = %s", (especialidad_id,))
            especialidad = await cursor.fetchone()
            if not especialidad:
                raise HTTPException(status_code=404, detail="Especialidad not found")
            especialidad['habilidades'] = json.loads(especialidad['habilidades']) if especialidad.get('habilidades') else []
            especialidad['campo_laboral'] = json.loads(especialidad['campo_laboral']) if especialidad.get('campo_laboral') else []
            especialidad['posicion_3d'] = json.loads(especialidad['posicion_3d']) if especialidad.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
            return dict(especialidad)

# Career Quiz - NUEVO
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

# CECYTE AI Project - NUEVO
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
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """INSERT INTO models_3d (model_id, nombre, filename, original_filename, format, file_size, is_active, uploaded_by, uploaded_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (model_id, nombre, filename, file.filename, file_ext[1:], len(content), False, admin.get("username", "admin"), datetime.now(timezone.utc))
            )
    
    return {"model_id": model_id, "filename": filename, "file_size": len(content)}

@api_router.get("/admin/models")
async def get_all_models(request: Request):
    await require_admin(request)
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d ORDER BY uploaded_at DESC LIMIT 100")
            models = await cursor.fetchall()
            return [dict(m) for m in models]

@api_router.get("/models/active")
async def get_active_model():
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d WHERE is_active = 1 LIMIT 1")
            model = await cursor.fetchone()
            return dict(model) if model else None

@api_router.put("/admin/models/{model_id}/activate")
async def activate_model(request: Request, model_id: str):
    await require_admin(request)
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute("UPDATE models_3d SET is_active = 0")
            await cursor.execute("UPDATE models_3d SET is_active = 1 WHERE model_id = %s", (model_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model activated"}

@api_router.delete("/admin/models/{model_id}")
async def delete_model(request: Request, model_id: str):
    await require_admin(request)
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d WHERE model_id = %s", (model_id,))
            model = await cursor.fetchone()
            if not model:
                raise HTTPException(status_code=404, detail="Model not found")
            file_path = UPLOADS_DIR / model["filename"]
            if file_path.exists():
                file_path.unlink()
            await cursor.execute("DELETE FROM models_3d WHERE model_id = %s", (model_id,))
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
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            if model_id:
                await cursor.execute("SELECT * FROM tarjeta_positions WHERE model_id = %s", (model_id,))
            else:
                await cursor.execute("SELECT * FROM tarjeta_positions")
            positions = await cursor.fetchall()
            
            for pos in positions:
                pos['position'] = json.loads(pos['position']) if pos.get('position') else {"x": 0, "y": 0, "z": 0}
                pos['rotation'] = json.loads(pos['rotation']) if pos.get('rotation') else {"x": 0, "y": 0, "z": 0}
            
            if not positions:
                await cursor.execute("SELECT * FROM especialidades")
                especialidades = await cursor.fetchall()
                positions = []
                for e in especialidades:
                    pos_3d = json.loads(e['posicion_3d']) if e.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
                    positions.append({
                        "tarjeta_id": f"tarjeta_{e['especialidad_id']}",
                        "especialidad_id": e["especialidad_id"],
                        "position": pos_3d,
                        "rotation": {"x": 0, "y": 0, "z": 0},
                        "scale": 1.0,
                        "model_id": model_id
                    })
            
            return [dict(p) for p in positions]

@api_router.put("/admin/tarjetas/position")
async def update_tarjeta_position(request: Request, data: dict):
    await require_admin(request)
    tarjeta_id = data.get("tarjeta_id")
    if not tarjeta_id:
        raise HTTPException(status_code=400, detail="tarjeta_id required")
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """INSERT INTO tarjeta_positions (tarjeta_id, especialidad_id, position, rotation, scale, model_id, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                   especialidad_id = VALUES(especialidad_id),
                   position = VALUES(position),
                   rotation = VALUES(rotation),
                   scale = VALUES(scale),
                   model_id = VALUES(model_id),
                   updated_at = VALUES(updated_at)""",
                (tarjeta_id, data.get("especialidad_id"),
                 json.dumps(data.get("position", {"x": 0, "y": 0, "z": 0})),
                 json.dumps(data.get("rotation", {"x": 0, "y": 0, "z": 0})),
                 data.get("scale", 1.0), data.get("model_id"),
                 datetime.now(timezone.utc))
            )
    return {"message": "Position updated"}

# Poster Send
@api_router.post("/poster/send")
async def send_poster(data: SendPosterRequest):
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM simulations WHERE simulation_id = %s", (data.simulation_id,))
            simulation = await cursor.fetchone()
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
    return {"message": "Máquina de Programación de Sueños - CECyTE 04 API", "status": "active", "database": "MySQL"}

@api_router.get("/health")
async def health_check():
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT 1")
                await cursor.fetchone()
        return {"status": "healthy", "service": "cecyte04-dreams-api", "database": "MySQL", "connection": "OK"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    await get_db()
    logger.info("✅ MySQL connection pool initialized")

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()
        logger.info("✅ MySQL connection pool closed")

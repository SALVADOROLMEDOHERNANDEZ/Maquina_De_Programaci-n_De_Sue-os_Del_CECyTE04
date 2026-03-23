from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, BackgroundTasks, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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

# Create uploads directory for 3D models
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'models'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# MySQL connection pool
db_pool = None

async def get_db_pool():
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
ADMIN_EMAILS = os.environ.get("ADMIN_EMAILS", "olmedohernandezsalvador@gmail.com").split(",") if os.environ.get("ADMIN_EMAILS") else ["olmedohernandezsalvador@gmail.com"]

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
    model_id: Optional[str] = None

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
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM user_sessions WHERE session_token = %s",
                (session_token,)
            )
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
            
            await cursor.execute(
                "SELECT * FROM users WHERE user_id = %s",
                (session_doc['user_id'],)
            )
            user_doc = await cursor.fetchone()
            
            if user_doc:
                user_doc['is_admin'] = bool(session_doc.get('is_admin', False))
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
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(
                        "SELECT * FROM admin_sessions WHERE token = %s",
                        (admin_token,)
                    )
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
    """Generate avatar configuration based on name and gender"""
    name_hash = hashlib.md5(nombre.encode()).hexdigest()
    
    skin_tones = ["#FFDFC4", "#F0D5BE", "#D1A684", "#A67C52", "#8D5524", "#6B4423"]
    skin_index = int(name_hash[0:2], 16) % len(skin_tones)
    
    hair_colors = ["#090806", "#2C222B", "#71635A", "#B7A69E", "#D6C4C2", "#CABFB1", "#977961", "#E6CEA8"]
    hair_index = int(name_hash[2:4], 16) % len(hair_colors)
    
    eye_colors = ["#634E34", "#2E536F", "#3D671D", "#497665", "#1C7847", "#7A3B3F"]
    eye_index = int(name_hash[4:6], 16) % len(eye_colors)
    
    clothing_colors = ["#1E3A5F", "#2C3E50", "#34495E", "#7F8C8D", "#2E4A62", "#1A3A4A", "#4A4A4A"]
    clothing_index = int(name_hash[6:8], 16) % len(clothing_colors)
    
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
        "height": 1.0 + (int(name_hash[10:12], 16) % 30) / 100,
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
        
        is_admin = session_data["email"] in ADMIN_EMAILS
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Check if user exists
                await cursor.execute(
                    "SELECT * FROM users WHERE email = %s",
                    (session_data["email"],)
                )
                user_doc = await cursor.fetchone()
                
                if not user_doc:
                    user_id = f"user_{uuid.uuid4().hex[:12]}"
                    await cursor.execute(
                        """INSERT INTO users (user_id, email, name, picture, is_admin, created_at)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (user_id, session_data["email"], session_data["name"], 
                         session_data.get("picture"), is_admin, datetime.now(timezone.utc))
                    )
                else:
                    user_id = user_doc["user_id"]
                    await cursor.execute(
                        """UPDATE users SET name = %s, picture = %s, is_admin = %s
                           WHERE user_id = %s""",
                        (session_data["name"], session_data.get("picture"), is_admin, user_id)
                    )
                
                session_token = session_data.get("session_token", f"session_{uuid.uuid4().hex}")
                expires_at = datetime.now(timezone.utc) + timedelta(days=7)
                
                # Delete old sessions
                await cursor.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
                
                # Create new session
                await cursor.execute(
                    """INSERT INTO user_sessions (session_id, user_id, session_token, is_admin, expires_at, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (str(uuid.uuid4()), user_id, session_token, is_admin, expires_at, datetime.now(timezone.utc))
                )
                
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
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM user_sessions WHERE session_token = %s",
                    (session_token,)
                )
    
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
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """INSERT INTO admin_sessions (token, username, expires_at, created_at)
                   VALUES (%s, %s, %s, %s)""",
                (admin_token, data.username, expires_at, datetime.now(timezone.utc))
            )
    
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
    """Generate personalized story using Google Gemini (FREE)"""
    try:
        import google.generativeai as genai
        
        api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="Google Gemini API key no configurada. Obtén una gratis en https://aistudio.google.com"
            )
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""Eres un narrador inspiracional que crea historias de éxito para estudiantes de CECyTE 04 en México.

Genera una historia emotiva, motivadora y realista sobre el futuro académico y profesional de {data.nombre}, un estudiante que estudia {data.carrera} en CECyTE 04.

Sus intereses son: {', '.join(data.intereses)}

La historia debe:
- Estar en español
- Tener entre 250-350 palabras
- Mostrar cómo el estudiante logra sus sueños gracias a su formación en CECyTE 04
- Incluir detalles específicos sobre la carrera elegida
- Mostrar cómo los intereses del estudiante contribuyen a su éxito
- Tener un tono inspirador y futurista
- Estar escrita en primera persona, como si fuera el estudiante recordando su camino al éxito desde el futuro
- Incluir momentos clave de su formación y logros importantes

Escribe solo la historia, sin títulos ni etiquetas adicionales."""
        
        response = model.generate_content(prompt)
        historia = response.text
        
        logger.info(f"Historia generada para {data.nombre} usando Gemini")
        
        return {"historia": historia}
        
    except Exception as e:
        logger.error(f"Story generation error: {e}")
        historia_fallback = f"""Me llamo {data.nombre} y recuerdo claramente el día que entré a CECyTE 04 para estudiar {data.carrera}. 

Mis intereses siempre estuvieron en {data.intereses[0] if data.intereses else 'tecnología'}, y sabía que esta institución era el lugar perfecto para desarrollarlos. Los profesores no solo nos enseñaron teoría, sino que nos prepararon para el mundo real con proyectos prácticos y empresas reales.

Hoy, años después, trabajo en lo que siempre soñé. Mi formación en CECyTE 04 fue el cimiento que me permitió construir una carrera exitosa. Las habilidades que adquirí, tanto técnicas como personales, me abrieron puertas que jamás imaginé.

Cada día agradezco haber tomado la decisión de estudiar en CECyTE 04. No solo encontré una educación de calidad, sino una comunidad que me impulsó a ser mejor cada día. Si pudiera volver atrás, elegiría el mismo camino mil veces más.

El futuro que construí comenzó en esas aulas, con esos profesores y con esos compañeros. CECyTE 04 no solo me dio un título, me dio las herramientas para crear mi propio destino."""
        
        logger.warning("Usando historia fallback debido a error en API")
        return {"historia": historia_fallback}

@api_router.post("/simulation/generate-image")
async def generate_image(data: SimulationRequest):
    """Generate futuristic avatar image using Hugging Face Inference API (FREE)"""
    try:
        from huggingface_hub import InferenceClient
        from PIL import Image
        import io
        
        api_token = os.environ.get("HUGGINGFACE_API_TOKEN")
        if not api_token:
            logger.warning("Hugging Face API token no configurado. Saltando generación de imagen.")
            raise HTTPException(
                status_code=500, 
                detail="Hugging Face API token no configurado. Obtén uno gratis en https://huggingface.co/settings/tokens"
            )
        
        client = InferenceClient(token=api_token)
        
        gender_desc = "mujer joven profesional" if data.sexo and data.sexo.lower() in ["f", "femenino", "mujer", "female"] else "hombre joven profesional"
        
        prompt = f"""professional portrait of a successful young {gender_desc} {data.carrera} professional, 
confident smile, modern business attire, futuristic office background, 
holographic elements, CECyTE logo subtle, cyberpunk style, high-tech atmosphere, 
inspirational, bright future, innovation, 
electric blue and purple and lime green color scheme, 
digital art, 4k, professional photography, success story,
related to: {', '.join(data.intereses[:3])},
masterpiece, best quality, highly detailed"""
        
        negative_prompt = "low quality, blurry, distorted, ugly, deformed, amateur, bad anatomy, text, watermark"
        
        logger.info(f"Generando imagen para {data.nombre} usando Stable Diffusion")
        
        image = client.text_to_image(
            model="stabilityai/stable-diffusion-2-1:cheapest",
            prompt=prompt,
            negative_prompt=negative_prompt,
            provider="auto"
        )
        
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        logger.info("Imagen generada exitosamente")
        
        return {"imagen_base64": image_base64}
            
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        logger.warning("Generación de imagen fallida, continuando sin imagen")
        return {"imagen_base64": None}

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
        
        avatar_config = generate_avatar_config(
            data.get("nombre", "Usuario"),
            data.get("sexo", "neutral")
        )
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO simulations 
                       (simulation_id, user_id, nombre, sexo, intereses, carrera, historia, imagen_base64, avatar_config, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (simulation_id, user_id, data.get("nombre"), data.get("sexo"),
                     json.dumps(data.get("intereses", [])), data.get("carrera"),
                     data.get("historia"), data.get("imagen_base64"),
                     json.dumps(avatar_config), datetime.now(timezone.utc))
                )
        
        return {"simulation_id": simulation_id, "avatar_config": avatar_config, "message": "Simulation saved successfully"}
        
    except Exception as e:
        logger.error(f"Save simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving simulation: {str(e)}")

@api_router.get("/simulation/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get simulation by ID"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM simulations WHERE simulation_id = %s",
                (simulation_id,)
            )
            simulation = await cursor.fetchone()
            
            if not simulation:
                raise HTTPException(status_code=404, detail="Simulation not found")
            
            # Parse JSON fields
            simulation['intereses'] = json.loads(simulation['intereses']) if simulation.get('intereses') else []
            simulation['avatar_config'] = json.loads(simulation['avatar_config']) if simulation.get('avatar_config') else None
            
            return simulation

@api_router.get("/simulations/user")
async def get_user_simulations(request: Request):
    """Get all simulations for authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM simulations WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
                (user["user_id"],)
            )
            simulations = await cursor.fetchall()
            
            # Parse JSON fields
            for sim in simulations:
                sim['intereses'] = json.loads(sim['intereses']) if sim.get('intereses') else []
                sim['avatar_config'] = json.loads(sim['avatar_config']) if sim.get('avatar_config') else None
            
            return simulations

# ============== ESPECIALIDADES ENDPOINTS ==============

@api_router.get("/especialidades")
async def get_especialidades():
    """Get all specialties with 3D positions"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM especialidades")
            especialidades = await cursor.fetchall()
            
            # Parse JSON fields
            for esp in especialidades:
                esp['habilidades'] = json.loads(esp['habilidades']) if esp.get('habilidades') else []
                esp['campo_laboral'] = json.loads(esp['campo_laboral']) if esp.get('campo_laboral') else []
                esp['posicion_3d'] = json.loads(esp['posicion_3d']) if esp.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
            
            return especialidades

@api_router.get("/especialidad/{especialidad_id}")
async def get_especialidad(especialidad_id: str):
    """Get specialty by ID"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM especialidades WHERE especialidad_id = %s",
                (especialidad_id,)
            )
            especialidad = await cursor.fetchone()
            
            if not especialidad:
                raise HTTPException(status_code=404, detail="Especialidad not found")
            
            # Parse JSON fields
            especialidad['habilidades'] = json.loads(especialidad['habilidades']) if especialidad.get('habilidades') else []
            especialidad['campo_laboral'] = json.loads(especialidad['campo_laboral']) if especialidad.get('campo_laboral') else []
            especialidad['posicion_3d'] = json.loads(especialidad['posicion_3d']) if especialidad.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
            
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
    
    allowed_extensions = ['.gltf', '.glb', '.fbx', '.obj']
    original_filename = file.filename or "model"
    file_ext = Path(original_filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}")
    
    model_id = f"model_{uuid.uuid4().hex[:12]}"
    filename = f"{model_id}{file_ext}"
    file_path = UPLOADS_DIR / filename
    
    try:
        content = await file.read()
        file_size = len(content)
        
        if file_size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum 100MB")
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(content)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO models_3d 
                       (model_id, nombre, filename, original_filename, format, file_size, is_active, uploaded_by, uploaded_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (model_id, nombre, filename, original_filename, file_ext[1:], file_size, False,
                     admin.get("username", admin.get("email", "admin")), datetime.now(timezone.utc))
                )
        
        logger.info(f"Model uploaded: {filename} ({file_size} bytes)")
        
        return {
            "model_id": model_id, 
            "filename": filename, 
            "file_size": file_size,
            "message": "Model uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model upload error: {e}")
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error uploading model: {str(e)}")

@api_router.get("/admin/models")
async def get_all_models(request: Request):
    """Get all uploaded 3D models (admin only)"""
    await require_admin(request)
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d ORDER BY uploaded_at DESC LIMIT 100")
            models = await cursor.fetchall()
            
            # Convert boolean
            for model in models:
                model['is_active'] = bool(model['is_active'])
            
            return models

@api_router.get("/models/active")
async def get_active_model():
    """Get the currently active 3D model"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d WHERE is_active = 1 LIMIT 1")
            model = await cursor.fetchone()
            
            if model:
                model['is_active'] = bool(model['is_active'])
            
            return model

@api_router.put("/admin/models/{model_id}/activate")
async def activate_model(request: Request, model_id: str):
    """Set a model as the active campus model (admin only)"""
    await require_admin(request)
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            # Deactivate all models
            await cursor.execute("UPDATE models_3d SET is_active = 0")
            
            # Activate selected model
            await cursor.execute(
                "UPDATE models_3d SET is_active = 1 WHERE model_id = %s",
                (model_id,)
            )
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Model not found")
    
    return {"message": "Model activated successfully"}

@api_router.delete("/admin/models/{model_id}")
async def delete_model(request: Request, model_id: str):
    """Delete a 3D model (admin only)"""
    await require_admin(request)
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d WHERE model_id = %s", (model_id,))
            model = await cursor.fetchone()
            
            if not model:
                raise HTTPException(status_code=404, detail="Model not found")
            
            # Delete file
            file_path = UPLOADS_DIR / model["filename"]
            if file_path.exists():
                file_path.unlink()
            
            # Delete from database
            await cursor.execute("DELETE FROM models_3d WHERE model_id = %s", (model_id,))
            
            # Delete associated tarjeta positions
            await cursor.execute("DELETE FROM tarjeta_positions WHERE model_id = %s", (model_id,))
    
    return {"message": "Model deleted successfully"}

@api_router.put("/admin/models/{model_id}/bounds")
async def update_model_bounds(request: Request, model_id: str, data: dict):
    """Update model bounds (calculated by frontend)"""
    await require_admin(request)
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "UPDATE models_3d SET bounds = %s WHERE model_id = %s",
                (json.dumps(data.get("bounds")), model_id)
            )
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Model not found")
    
    return {"message": "Bounds updated successfully"}

@api_router.get("/models/file/{filename}")
async def get_model_file(filename: str):
    """Serve 3D model file"""
    file_path = UPLOADS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
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
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            if model_id:
                await cursor.execute(
                    "SELECT * FROM tarjeta_positions WHERE model_id = %s",
                    (model_id,)
                )
            else:
                await cursor.execute("SELECT * FROM tarjeta_positions")
            
            positions = await cursor.fetchall()
            
            # Parse JSON fields
            for pos in positions:
                pos['position'] = json.loads(pos['position']) if pos.get('position') else {"x": 0, "y": 0, "z": 0}
                pos['rotation'] = json.loads(pos['rotation']) if pos.get('rotation') else {"x": 0, "y": 0, "z": 0}
            
            # If no positions exist, return default positions
            if not positions:
                await cursor.execute("SELECT * FROM especialidades")
                especialidades = await cursor.fetchall()
                
                positions = []
                for esp in especialidades:
                    pos_3d = json.loads(esp['posicion_3d']) if esp.get('posicion_3d') else {"x": 0, "y": 0, "z": 0}
                    positions.append({
                        "tarjeta_id": f"tarjeta_{esp['especialidad_id']}",
                        "especialidad_id": esp["especialidad_id"],
                        "position": pos_3d,
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
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """INSERT INTO tarjeta_positions 
                   (tarjeta_id, especialidad_id, position, rotation, scale, model_id, updated_at)
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
    
    return {"message": "Position updated successfully"}

@api_router.post("/admin/tarjetas/positions/bulk")
async def bulk_update_tarjeta_positions(request: Request, data: dict):
    """Bulk update tarjeta positions (admin only)"""
    await require_admin(request)
    
    positions = data.get("positions", [])
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            for pos in positions:
                await cursor.execute(
                    """INSERT INTO tarjeta_positions 
                       (tarjeta_id, especialidad_id, position, rotation, scale, model_id, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                       especialidad_id = VALUES(especialidad_id),
                       position = VALUES(position),
                       rotation = VALUES(rotation),
                       scale = VALUES(scale),
                       model_id = VALUES(model_id),
                       updated_at = VALUES(updated_at)""",
                    (pos.get("tarjeta_id"), pos.get("especialidad_id"),
                     json.dumps(pos.get("position", {"x": 0, "y": 0, "z": 0})),
                     json.dumps(pos.get("rotation", {"x": 0, "y": 0, "z": 0})),
                     pos.get("scale", 1.0), pos.get("model_id"),
                     datetime.now(timezone.utc))
                )
    
    return {"message": f"Updated {len(positions)} positions"}

# ============== POSTER SENDING ENDPOINTS ==============

@api_router.post("/poster/send")
async def send_poster(data: SendPosterRequest, background_tasks: BackgroundTasks):
    """Send poster via email and/or WhatsApp"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    "SELECT * FROM simulations WHERE simulation_id = %s",
                    (data.simulation_id,)
                )
                simulation = await cursor.fetchone()
                
                if not simulation:
                    raise HTTPException(status_code=404, detail="Simulation not found")
                
                # Parse JSON
                simulation['intereses'] = json.loads(simulation['intereses']) if simulation.get('intereses') else []
        
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
    return {"message": "Máquina de Programación de Sueños - CECyTE 04 API", "status": "active", "database": "MySQL"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint with database connection test"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT 1")
                await cursor.fetchone()
        
        return {"status": "healthy", "service": "cecyte04-dreams-api", "database": "MySQL", "connection": "OK"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "service": "cecyte04-dreams-api", "database": "MySQL", "connection": "FAILED", "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize database connection pool on startup"""
    await get_db_pool()
    logger.info("✅ MySQL connection pool initialized")

@app.on_event("shutdown")
async def shutdown():
    """Close database connection pool on shutdown"""
    global db_pool
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()
        logger.info("✅ MySQL connection pool closed")

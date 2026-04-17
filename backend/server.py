from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
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
from migrations import DatabaseMigration, MigrationBuilder
import mysql.connector

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOADS_DIR = ROOT_DIR / 'uploads' / 'models'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

MULTIMEDIA_DIR = ROOT_DIR / 'uploads' / 'multimedia'
MULTIMEDIA_DIR.mkdir(parents=True, exist_ok=True)

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

# Mount multimedia directory for serving uploaded files
app.mount("/multimedia", StaticFiles(directory=str(MULTIMEDIA_DIR)), name="multimedia")

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

class MultimediaRequest(BaseModel):
    tipo: str  # 'video', 'foto', 'publicacion'
    titulo: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = "general"
    tags: Optional[List[str]] = None
    platform: Optional[str] = None  # 'instagram', 'facebook', 'youtube'
    url: Optional[str] = None

class MultimediaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    tags: Optional[List[str]] = None
    visible: Optional[bool] = None
    platform: Optional[str] = None
    url: Optional[str] = None

class CommentRequest(BaseModel):
    comment_text: str

class CommentUpdate(BaseModel):
    comment_text: str

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
                session_id = str(uuid.uuid4())
                
                # Usar ON DUPLICATE KEY UPDATE para evitar duplicados:
                # Si el usuario ya tiene sesión, la actualiza reutilizando el mismo session_id
                await cursor.execute(
                    """INSERT INTO user_sessions (session_id, user_id, session_token, is_admin, expires_at, created_at, updated_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, NOW())
                       ON DUPLICATE KEY UPDATE 
                       session_token = VALUES(session_token),
                       expires_at = VALUES(expires_at),
                       updated_at = NOW()""",
                    (session_id, user_id, session_token, is_admin, expires_at, datetime.now(timezone.utc))
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
            # Usar ON DUPLICATE KEY UPDATE para evitar duplicados:
            # Si el admin ya tiene sesión, la actualiza en lugar de crear una nueva
            await cursor.execute(
                """INSERT INTO admin_sessions (token, username, expires_at, created_at, updated_at) 
                   VALUES (%s, %s, %s, %s, NOW())
                   ON DUPLICATE KEY UPDATE 
                   token = VALUES(token),
                   expires_at = VALUES(expires_at),
                   updated_at = NOW()""",
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

@api_router.get("/admin/statistics")
async def get_admin_statistics(request: Request):
    """Obtiene estadísticas del dashboard de administración"""
    await require_admin(request)
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Usuarios totales
                await cursor.execute("SELECT COUNT(*) as total FROM users WHERE is_admin = FALSE")
                users_count = (await cursor.fetchone())['total']
                
                # Contenido multimedia total
                await cursor.execute("SELECT COUNT(*) as total FROM multimedia WHERE visible = TRUE")
                multimedia_count = (await cursor.fetchone())['total']
                
                # Total de vistas en multimedia
                await cursor.execute("SELECT COALESCE(SUM(vistas), 0) as total FROM multimedia")
                total_views = (await cursor.fetchone())['total']
                
                # Simulaciones totales
                await cursor.execute("SELECT COUNT(*) as total FROM simulations")
                simulations_count = (await cursor.fetchone())['total']
                
                # Sesiones activas
                await cursor.execute("SELECT COUNT(*) as total FROM user_sessions WHERE expires_at > NOW()")
                active_sessions = (await cursor.fetchone())['total']
                
                # Modelos 3D activos
                await cursor.execute("SELECT COUNT(*) as total FROM models_3d WHERE is_active = TRUE")
                active_models = (await cursor.fetchone())['total']
                
                # Multimedia por tipo
                await cursor.execute("""
                    SELECT tipo, COUNT(*) as count 
                    FROM multimedia 
                    WHERE visible = TRUE
                    GROUP BY tipo
                """)
                multimedia_by_type = {}
                for row in await cursor.fetchall():
                    multimedia_by_type[row['tipo']] = row['count']
                
                # Contribuciones pendientes
                await cursor.execute("SELECT COUNT(*) as total FROM contributions WHERE estado = 'pendiente'")
                pending_contributions = (await cursor.fetchone())['total']
                
                # Top usuarios por puntos
                await cursor.execute("""
                    SELECT u.name, up.puntos_totales 
                    FROM user_points up
                    JOIN users u ON u.user_id = up.user_id
                    ORDER BY up.puntos_totales DESC
                    LIMIT 5
                """)
                top_users = [{"name": row['name'], "puntos": row['puntos_totales']} for row in await cursor.fetchall()]
                
                # Usuarios registrados por mes (últimos 12 meses)
                await cursor.execute("""
                    SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
                    FROM users
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month
                """)
                users_by_month = [{"month": row['month'], "count": row['count']} for row in await cursor.fetchall()]
                
                # Simulaciones por especialidad
                await cursor.execute("""
                    SELECT s.carrera, COUNT(*) as count
                    FROM simulations s
                    GROUP BY s.carrera
                    ORDER BY count DESC
                """)
                simulations_by_career = [{"career": row['carrera'], "count": row['count']} for row in await cursor.fetchall()]
                
                # Actividad reciente (últimas 24 horas)
                await cursor.execute("""
                    SELECT 
                        (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_24h,
                        (SELECT COUNT(*) FROM simulations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_simulations_24h,
                        (SELECT COUNT(*) FROM multimedia WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_multimedia_24h
                """)
                activity_24h = await cursor.fetchone()
        
        return {
            "users_total": users_count,
            "multimedia_content": multimedia_count,
            "total_views": total_views,
            "simulations_total": simulations_count,
            "active_sessions": active_sessions,
            "active_3d_models": active_models,
            "multimedia_by_type": multimedia_by_type,
            "pending_contributions": pending_contributions,
            "top_users": top_users,
            "users_by_month": users_by_month,
            "simulations_by_career": simulations_by_career,
            "activity_24h": activity_24h
        }
    except Exception as e:
        logger.error(f"Error obtaining statistics: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")

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
async def recommend_career(request: Request, data: CareerQuizRequest):
    session_id = str(uuid.uuid4())
    user = await get_current_user(request)
    user_id = user["user_id"] if user else None
    
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            resultado = {
                "recomendaciones": [
                    {"carrera": "Programación", "compatibilidad": 85, "descripcion": "Ideal para ti.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True},
                    {"carrera": "Mantenimiento Industrial", "compatibilidad": 75, "descripcion": "Gran opción.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True}
                ],
                "mensaje": "Recomendaciones sin IA"
            }
            # Award points even without AI
            await award_quiz_points(user_id, session_id, data.respuestas, resultado)
            return resultado
        
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
        resultado = json.loads(text)
        
        # Award points for completing quiz
        await award_quiz_points(user_id, session_id, data.respuestas, resultado)
        
        return resultado
    except Exception as e:
        logger.error(f"Career recommendation error: {e}")
        resultado = {"recomendaciones": [{"carrera": "Programación", "compatibilidad": 80, "descripcion": "Carrera versátil.", "donde_estudiar": ["CECyTE 04"], "es_cecyte": True}]}
        await award_quiz_points(user_id, session_id, data.respuestas, resultado)
        return resultado

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
    """Get developers with their badges and points"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Get top contributors
            await cursor.execute("""
                SELECT u.user_id, u.name, u.email, u.picture,
                       COALESCE(up.puntos_totales, 0) as puntos,
                       COALESCE(up.nivel, 1) as nivel,
                       COALESCE(up.contribuciones_aprobadas, 0) as contribuciones
                FROM users u
                LEFT JOIN user_points up ON u.user_id = up.user_id
                WHERE up.contribuciones_aprobadas > 0
                ORDER BY up.puntos_totales DESC
                LIMIT 20
            """)
            developers = await cursor.fetchall()
            
            # Get badges for each developer
            for dev in developers:
                await cursor.execute("""
                    SELECT b.badge_id, b.nombre, b.icono, b.color
                    FROM user_badges ub
                    JOIN badges b ON ub.badge_id = b.badge_id
                    WHERE ub.user_id = %s
                    ORDER BY ub.awarded_at DESC
                    LIMIT 5
                """, (dev['user_id'],))
                dev['badges'] = await cursor.fetchall()
            
            return {
                "desarrolladores": [dict(d) for d in developers],
                "mensaje": "¿Quieres aparecer aquí? Contribuye al proyecto IA CECYTE",
                "como_unirse": "Contacta a tu profesor de programación o envía tu primera contribución"
            }

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

# ============== GAMIFICATION SYSTEM ==============

class ContributionRequest(BaseModel):
    tipo: str  # codigo, documentacion, bug_report, feature, otro
    titulo: str
    descripcion: Optional[str] = None
    url: Optional[str] = None

@api_router.get("/gamification/badges")
async def get_all_badges():
    """Get all available badges"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM badges ORDER BY categoria, puntos DESC")
            badges = await cursor.fetchall()
            return [dict(b) for b in badges]

@api_router.get("/gamification/ranking")
async def get_ranking(limit: int = 20):
    """Get top users ranking"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT u.user_id, u.name, u.picture,
                       COALESCE(up.puntos_totales, 0) as puntos,
                       COALESCE(up.nivel, 1) as nivel,
                       COALESCE(up.quizzes_completados, 0) as quizzes,
                       COALESCE(up.contribuciones_aprobadas, 0) as contribuciones,
                       (SELECT COUNT(*) FROM user_badges WHERE user_id = u.user_id) as total_badges
                FROM users u
                LEFT JOIN user_points up ON u.user_id = up.user_id
                WHERE up.puntos_totales > 0
                ORDER BY up.puntos_totales DESC
                LIMIT %s
            """, (limit,))
            ranking = await cursor.fetchall()
            
            # Add position
            for i, user in enumerate(ranking):
                user['posicion'] = i + 1
            
            return {"ranking": [dict(r) for r in ranking], "total": len(ranking)}

@api_router.get("/gamification/user/{user_id}")
async def get_user_gamification(user_id: str):
    """Get user's gamification data"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Get user points
            await cursor.execute("""
                SELECT * FROM user_points WHERE user_id = %s
            """, (user_id,))
            points = await cursor.fetchone()
            
            if not points:
                points = {"puntos_totales": 0, "nivel": 1, "quizzes_completados": 0, "contribuciones_aprobadas": 0}
            
            # Get user badges
            await cursor.execute("""
                SELECT b.*, ub.awarded_at
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.badge_id
                WHERE ub.user_id = %s
                ORDER BY ub.awarded_at DESC
            """, (user_id,))
            badges = await cursor.fetchall()
            
            # Get user ranking position
            await cursor.execute("""
                SELECT COUNT(*) + 1 as posicion
                FROM user_points
                WHERE puntos_totales > COALESCE((SELECT puntos_totales FROM user_points WHERE user_id = %s), 0)
            """, (user_id,))
            rank = await cursor.fetchone()
            
            # Get recent contributions
            await cursor.execute("""
                SELECT * FROM contributions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 10
            """, (user_id,))
            contributions = await cursor.fetchall()
            
            return {
                "puntos": dict(points) if isinstance(points, dict) else points,
                "badges": [dict(b) for b in badges],
                "posicion_ranking": rank['posicion'] if rank else 0,
                "contribuciones": [dict(c) for c in contributions]
            }

@api_router.get("/gamification/my-profile")
async def get_my_gamification(request: Request):
    """Get current user's gamification profile"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await get_user_gamification(user["user_id"])

@api_router.post("/gamification/contribution")
async def submit_contribution(request: Request, data: ContributionRequest):
    """Submit a new contribution"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                INSERT INTO contributions (user_id, tipo, titulo, descripcion, url, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user["user_id"], data.tipo, data.titulo, data.descripcion, data.url, datetime.now(timezone.utc)))
            
            return {"message": "Contribución enviada para revisión", "status": "pendiente"}

@api_router.post("/admin/gamification/approve-contribution/{contribution_id}")
async def approve_contribution(request: Request, contribution_id: int):
    """Approve a contribution (admin only)"""
    admin = await require_admin(request)
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Get contribution
            await cursor.execute("SELECT * FROM contributions WHERE id = %s", (contribution_id,))
            contribution = await cursor.fetchone()
            
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")
            
            if contribution['estado'] != 'pendiente':
                raise HTTPException(status_code=400, detail="Contribution already processed")
            
            # Update contribution status
            puntos = {"codigo": 30, "documentacion": 20, "bug_report": 15, "feature": 40, "otro": 10}.get(contribution['tipo'], 10)
            
            await cursor.execute("""
                UPDATE contributions SET estado = 'aprobada', puntos = %s, revisado_por = %s
                WHERE id = %s
            """, (puntos, admin.get("username", "admin"), contribution_id))
            
            # Update user points
            await cursor.execute("""
                INSERT INTO user_points (user_id, puntos_totales, contribuciones_aprobadas, nivel)
                VALUES (%s, %s, 1, 1)
                ON DUPLICATE KEY UPDATE
                puntos_totales = puntos_totales + %s,
                contribuciones_aprobadas = contribuciones_aprobadas + 1,
                nivel = FLOOR(puntos_totales / 100) + 1
            """, (contribution['user_id'], puntos, puntos))
            
            # Check and award badges
            await cursor.execute("SELECT contribuciones_aprobadas FROM user_points WHERE user_id = %s", (contribution['user_id'],))
            user_points = await cursor.fetchone()
            
            # First contribution badge
            if user_points and user_points['contribuciones_aprobadas'] == 1:
                await cursor.execute("""
                    INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, 'primera_contribucion', %s)
                """, (contribution['user_id'], admin.get("username", "admin")))
            
            # Active contributor badge (5 contributions)
            if user_points and user_points['contribuciones_aprobadas'] >= 5:
                await cursor.execute("""
                    INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, 'contribuidor_activo', %s)
                """, (contribution['user_id'], admin.get("username", "admin")))
            
            # Type-specific badges
            if contribution['tipo'] == 'documentacion':
                await cursor.execute("""
                    INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, 'documentador', %s)
                """, (contribution['user_id'], admin.get("username", "admin")))
            elif contribution['tipo'] == 'bug_report':
                await cursor.execute("""
                    INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, 'bug_hunter', %s)
                """, (contribution['user_id'], admin.get("username", "admin")))
            elif contribution['tipo'] == 'feature':
                await cursor.execute("""
                    INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, 'innovador', %s)
                """, (contribution['user_id'], admin.get("username", "admin")))
            
            return {"message": "Contribución aprobada", "puntos_otorgados": puntos}

@api_router.get("/admin/gamification/pending-contributions")
async def get_pending_contributions(request: Request):
    """Get pending contributions (admin only)"""
    await require_admin(request)
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT c.*, u.name as user_name, u.email as user_email
                FROM contributions c
                JOIN users u ON c.user_id = u.user_id
                WHERE c.estado = 'pendiente'
                ORDER BY c.created_at ASC
            """)
            contributions = await cursor.fetchall()
            return [dict(c) for c in contributions]

@api_router.post("/admin/gamification/award-badge")
async def award_badge(request: Request, data: dict):
    """Manually award a badge to a user (admin only)"""
    admin = await require_admin(request)
    
    user_id = data.get("user_id")
    badge_id = data.get("badge_id")
    
    if not user_id or not badge_id:
        raise HTTPException(status_code=400, detail="user_id and badge_id required")
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            try:
                await cursor.execute("""
                    INSERT INTO user_badges (user_id, badge_id, awarded_by)
                    VALUES (%s, %s, %s)
                """, (user_id, badge_id, admin.get("username", "admin")))
                
                # Add badge points to user
                await cursor.execute("SELECT puntos FROM badges WHERE badge_id = %s", (badge_id,))
                badge = await cursor.fetchone()
                if badge:
                    await cursor.execute("""
                        INSERT INTO user_points (user_id, puntos_totales, nivel)
                        VALUES (%s, %s, 1)
                        ON DUPLICATE KEY UPDATE
                        puntos_totales = puntos_totales + %s,
                        nivel = FLOOR(puntos_totales / 100) + 1
                    """, (user_id, badge[0], badge[0]))
                
                return {"message": "Badge awarded successfully"}
            except Exception as e:
                if "Duplicate entry" in str(e):
                    raise HTTPException(status_code=400, detail="User already has this badge")
                raise

# Function to award quiz completion points
async def award_quiz_points(user_id: str, session_id: str, respuestas: dict, resultado: dict):
    """Award points for completing a quiz"""
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            puntos = 10  # Base points for completing quiz
            
            # Save quiz completion
            await cursor.execute("""
                INSERT INTO quiz_completions (user_id, session_id, respuestas, resultado, puntos_obtenidos)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, session_id, json.dumps(respuestas), json.dumps(resultado), puntos))
            
            if user_id:
                # Update user points
                await cursor.execute("""
                    INSERT INTO user_points (user_id, puntos_totales, quizzes_completados, nivel)
                    VALUES (%s, %s, 1, 1)
                    ON DUPLICATE KEY UPDATE
                    puntos_totales = puntos_totales + %s,
                    quizzes_completados = quizzes_completados + 1,
                    nivel = FLOOR(puntos_totales / 100) + 1
                """, (user_id, puntos, puntos))
                
                # Check for quiz badges
                await cursor.execute("SELECT quizzes_completados FROM user_points WHERE user_id = %s", (user_id,))
                user_points = await cursor.fetchone()
                
                if user_points:
                    if user_points['quizzes_completados'] == 1:
                        await cursor.execute("""
                            INSERT IGNORE INTO user_badges (user_id, badge_id)
                            VALUES (%s, 'primer_quiz')
                        """, (user_id,))
                    if user_points['quizzes_completados'] >= 5:
                        await cursor.execute("""
                            INSERT IGNORE INTO user_badges (user_id, badge_id)
                            VALUES (%s, 'quiz_master')
                        """, (user_id,))

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
async def get_active_models():
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM models_3d WHERE is_active = 1 ORDER BY uploaded_at DESC")
            models = await cursor.fetchall()
            return [dict(model) for model in models]

@api_router.put("/admin/models/{model_id}/toggle")
async def toggle_model_active(request: Request, model_id: str):
    await require_admin(request)
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Verificar estado actual
            await cursor.execute("SELECT is_active FROM models_3d WHERE model_id = %s", (model_id,))
            result = await cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Model not found")
            
            new_status = 0 if result['is_active'] else 1
            await cursor.execute("UPDATE models_3d SET is_active = %s WHERE model_id = %s", (new_status, model_id))
    
    return {"message": f"Model {'activated' if new_status else 'deactivated'}", "is_active": bool(new_status)}

@api_router.put("/admin/models/{model_id}/activate")
async def activate_model(request: Request, model_id: str):
    return await toggle_model_active(request, model_id)

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

# ═══════════════════════════════════════════════════════════════
# MULTIMEDIA MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@api_router.post("/admin/multimedia")
async def upload_multimedia(
    request: Request,
    file: UploadFile = File(...),
    tipo: str = Form(...),
    titulo: str = Form(...),
    descripcion: Optional[str] = Form(None),
    categoria: Optional[str] = Form("general"),
    tags: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    url: Optional[str] = Form(None)
):
    """Subir contenido multimedia (solo admin)"""
    admin = await require_admin(request)
    
    try:
        # Validar tipo
        if tipo not in ['video', 'foto', 'publicacion']:
            raise HTTPException(status_code=400, detail="Tipo de contenido no válido")
        
        # Validar platform si es publicación
        if tipo == 'publicacion' and platform and platform not in ['instagram', 'facebook', 'youtube']:
            raise HTTPException(status_code=400, detail="Plataforma no válida")
        
        # Validar archivo
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nombre de archivo requerido")
        
        # Validar tamaño (máx 500MB)
        content = await file.read()
        if len(content) > 500 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Archivo muy grande (máx 500MB)")
        
        # Validar extensión según tipo
        valid_extensions = {
            'video': ['.mp4', '.webm', '.avi', '.mov', '.mkv'],
            'foto': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            'publicacion': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt']
        }
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in valid_extensions.get(tipo, []):
            raise HTTPException(status_code=400, detail=f"Formato no soportado para {tipo}")
        
        # Sanitizar nombre
        multimedia_id = f"media_{uuid.uuid4().hex[:12]}"
        safe_filename = f"{multimedia_id}{file_ext}"
        file_path = MULTIMEDIA_DIR / safe_filename
        
        # Guardar archivo
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Obtener user_id del admin
        user = await get_current_user(request)
        user_id = user["user_id"] if user else admin.get("user_id", "admin")
        
        # Guardar en BD
        tags_json = json.dumps(tags.split(',') if tags else [])
        
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """INSERT INTO multimedia 
                       (multimedia_id, tipo, titulo, descripcion, archivo_url, tags, categoria, platform, url, uploaded_by, visible, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s)""",
                    (multimedia_id, tipo, titulo, descripcion, f"/multimedia/{safe_filename}", 
                     tags_json, categoria, platform, url, user_id, datetime.now(timezone.utc))
                )
        
        return {
            "multimedia_id": multimedia_id,
            "mensaje": "Contenido subido exitosamente",
            "tipo": tipo,
            "archivo": safe_filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multimedia upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/multimedia")
async def list_multimedia(request: Request, tipo: Optional[str] = None, categoria: Optional[str] = None):
    """Listar contenido multimedia (solo admin)"""
    admin = await require_admin(request)
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = "SELECT * FROM multimedia WHERE 1=1"
                params = []
                
                if tipo:
                    query += " AND tipo = %s"
                    params.append(tipo)
                
                if categoria:
                    query += " AND categoria = %s"
                    params.append(categoria)
                
                query += " ORDER BY created_at DESC LIMIT 200"
                
                await cursor.execute(query, params)
                multimedia_list = await cursor.fetchall()
                
                result = []
                for item in multimedia_list:
                    item_dict = dict(item)
                    item_dict['tags'] = json.loads(item_dict.get('tags', '[]')) if item_dict.get('tags') else []
                    result.append(item_dict)
                
                return result
    
    except Exception as e:
        logger.error(f"List multimedia error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/multimedia/{multimedia_id}")
async def update_multimedia(request: Request, multimedia_id: str, data: MultimediaUpdate):
    """Editar contenido multimedia (solo admin)"""
    admin = await require_admin(request)
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Verificar que existe
                await cursor.execute("SELECT * FROM multimedia WHERE multimedia_id = %s", (multimedia_id,))
                if not await cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Contenido no encontrado")
                
                # Actualizar campos
                updates = []
                params = []
                
                if data.titulo is not None:
                    updates.append("titulo = %s")
                    params.append(data.titulo)
                
                if data.descripcion is not None:
                    updates.append("descripcion = %s")
                    params.append(data.descripcion)
                
                if data.categoria is not None:
                    updates.append("categoria = %s")
                    params.append(data.categoria)
                
                if data.tags is not None:
                    updates.append("tags = %s")
                    params.append(json.dumps(data.tags))
                
                if data.visible is not None:
                    updates.append("visible = %s")
                    params.append(data.visible)
                
                if data.platform is not None:
                    updates.append("platform = %s")
                    params.append(data.platform)
                
                if data.url is not None:
                    updates.append("url = %s")
                    params.append(data.url)
                
                if updates:
                    updates.append("updated_at = %s")
                    params.append(datetime.now(timezone.utc))
                    params.append(multimedia_id)
                    
                    query = f"UPDATE multimedia SET {', '.join(updates)} WHERE multimedia_id = %s"
                    await cursor.execute(query, params)
        
        return {"mensaje": "Contenido actualizado", "multimedia_id": multimedia_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update multimedia error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/multimedia/{multimedia_id}")
async def delete_multimedia(request: Request, multimedia_id: str):
    """Eliminar contenido multimedia (solo admin)"""
    admin = await require_admin(request)
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Obtener archivo para eliminarlo
                await cursor.execute("SELECT archivo_url FROM multimedia WHERE multimedia_id = %s", (multimedia_id,))
                result = await cursor.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Contenido no encontrado")
                
                # Eliminar archivo
                if result['archivo_url']:
                    try:
                        file_path = MULTIMEDIA_DIR / Path(result['archivo_url']).name
                        if file_path.exists():
                            file_path.unlink()
                    except Exception as e:
                        logger.warning(f"Could not delete file: {e}")
                
                # Eliminar de BD
                await cursor.execute("DELETE FROM multimedia WHERE multimedia_id = %s", (multimedia_id,))
        
        return {"mensaje": "Contenido eliminado"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete multimedia error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/multimedia/public")
async def get_public_multimedia(tipo: Optional[str] = None, categoria: Optional[str] = None, limit: int = 50):
    """Obtener contenido multimedia visible (público)"""
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                query = "SELECT * FROM multimedia WHERE visible = TRUE"
                params = []
                
                if tipo:
                    query += " AND tipo = %s"
                    params.append(tipo)
                
                if categoria:
                    query += " AND categoria = %s"
                    params.append(categoria)
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                await cursor.execute(query, params)
                multimedia_list = await cursor.fetchall()
                
                result = []
                for item in multimedia_list:
                    item_dict = dict(item)
                    item_dict['tags'] = json.loads(item_dict.get('tags', '[]')) if item_dict.get('tags') else []
                    # No incluir uploaded_by para usuarios públicos
                    result.append(item_dict)
                
                return result
    
    except Exception as e:
        logger.error(f"Get public multimedia error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/multimedia/{multimedia_id}/view")
async def register_view(multimedia_id: str):
    """Registrar vista de contenido multimedia"""
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE multimedia SET vistas = vistas + 1 WHERE multimedia_id = %s",
                    (multimedia_id,)
                )
        
        return {"mensaje": "Vista registrada"}
    
    except Exception as e:
        logger.error(f"Register view error: {e}")
        # No fallar si hay error, solo registrar

# Publication Likes and Comments
@api_router.post("/publications/{multimedia_id}/like")
async def toggle_like(request: Request, multimedia_id: str):
    """Dar o quitar like a una publicación"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                # Verificar si ya existe el like
                await cursor.execute(
                    "SELECT id FROM publication_likes WHERE multimedia_id = %s AND user_id = %s",
                    (multimedia_id, user['user_id'])
                )
                existing_like = await cursor.fetchone()
                
                if existing_like:
                    # Quitar like
                    await cursor.execute(
                        "DELETE FROM publication_likes WHERE multimedia_id = %s AND user_id = %s",
                        (multimedia_id, user['user_id'])
                    )
                    await cursor.execute(
                        "UPDATE multimedia SET likes_count = likes_count - 1 WHERE multimedia_id = %s",
                        (multimedia_id,)
                    )
                    return {"action": "unliked", "likes_count": await get_likes_count(cursor, multimedia_id)}
                else:
                    # Dar like
                    await cursor.execute(
                        "INSERT INTO publication_likes (multimedia_id, user_id) VALUES (%s, %s)",
                        (multimedia_id, user['user_id'])
                    )
                    await cursor.execute(
                        "UPDATE multimedia SET likes_count = likes_count + 1 WHERE multimedia_id = %s",
                        (multimedia_id,)
                    )
                    return {"action": "liked", "likes_count": await get_likes_count(cursor, multimedia_id)}
    
    except Exception as e:
        logger.error(f"Toggle like error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/publications/{multimedia_id}/likes")
async def get_likes(multimedia_id: str):
    """Obtener likes de una publicación"""
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT pl.*, u.name, u.picture 
                    FROM publication_likes pl 
                    JOIN users u ON pl.user_id = u.user_id 
                    WHERE pl.multimedia_id = %s 
                    ORDER BY pl.created_at DESC
                """, (multimedia_id,))
                likes = await cursor.fetchall()
                return [dict(like) for like in likes]
    
    except Exception as e:
        logger.error(f"Get likes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/publications/{multimedia_id}/comments")
async def add_comment(request: Request, multimedia_id: str, comment: CommentRequest):
    """Agregar comentario a una publicación"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        comment_id = f"comment_{uuid.uuid4().hex[:12]}"
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO publication_comments (comment_id, multimedia_id, user_id, comment_text) VALUES (%s, %s, %s, %s)",
                    (comment_id, multimedia_id, user['user_id'], comment.comment_text)
                )
                await cursor.execute(
                    "UPDATE multimedia SET comments_count = comments_count + 1 WHERE multimedia_id = %s",
                    (multimedia_id,)
                )
        
        return {"comment_id": comment_id, "message": "Comment added"}
    
    except Exception as e:
        logger.error(f"Add comment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/publications/{multimedia_id}/comments")
async def get_comments(multimedia_id: str):
    """Obtener comentarios de una publicación"""
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute("""
                    SELECT pc.*, u.name, u.picture 
                    FROM publication_comments pc 
                    JOIN users u ON pc.user_id = u.user_id 
                    WHERE pc.multimedia_id = %s 
                    ORDER BY pc.created_at DESC
                """, (multimedia_id,))
                comments = await cursor.fetchall()
                return [dict(comment) for comment in comments]
    
    except Exception as e:
        logger.error(f"Get comments error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/publications/comments/{comment_id}")
async def update_comment(request: Request, comment_id: str, comment_update: CommentUpdate):
    """Actualizar comentario propio"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE publication_comments SET comment_text = %s, updated_at = NOW() WHERE comment_id = %s AND user_id = %s",
                    (comment_update.comment_text, comment_id, user['user_id'])
                )
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Comment not found or not owned by user")
        
        return {"message": "Comment updated"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update comment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/publications/comments/{comment_id}")
async def delete_comment(request: Request, comment_id: str):
    """Eliminar comentario propio"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM publication_comments WHERE comment_id = %s AND user_id = %s",
                    (comment_id, user['user_id'])
                )
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Comment not found or not owned by user")
        
        return {"message": "Comment deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete comment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# SISTEMA DE MIGRACIONES DE BASE DE DATOS
# ═══════════════════════════════════════════════════════════════════════════════

class MigrationRequest(BaseModel):
    """Modelo para ejecutar una migración"""
    version: str = Field(..., description="Versión de la migración (ej: 001, 002)")
    description: str = Field(..., description="Descripción de los cambios")
    sql_commands: str = Field(..., description="Comandos SQL a ejecutar")
    migration_type: str = Field("custom", description="Tipo: custom, add_column, modify_column, drop_column")

class MigrationTypeRequest(BaseModel):
    """Modelo para crear migración por tipo"""
    version: str
    description: str
    migration_type: str  # add_column, modify_column, drop_column, add_table, add_index
    table: Optional[str] = None
    column: Optional[str] = None
    data_type: Optional[str] = None
    nullable: Optional[bool] = True
    default: Optional[str] = None
    columns: Optional[List[str]] = None  # Para add_table
    index_name: Optional[str] = None  # Para add_index

@api_router.post("/admin/migrations/execute")
async def execute_migration_endpoint(request: Request, migration_data: MigrationRequest):
    """
    Ejecuta una migración de base de datos de forma segura.
    Las migraciones se registran y pueden ser revertidas si es necesario.
    
    IMPORTANTE: Haz backup de tu BD antes de ejecutar migraciones críticas
    """
    admin = await require_admin(request)
    
    try:
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', ''),
            'database': os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')
        }
        
        migration_manager = DatabaseMigration(db_config)
        
        if not migration_manager.connect():
            raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos")
        
        try:
            # Crear tabla de control si no existe
            migration_manager.create_migrations_table()
            
            # Ejecutar migración
            success, message = migration_manager.execute_migration(
                migration_data.version,
                migration_data.sql_commands,
                migration_data.description
            )
            
            if success:
                return {
                    "success": True,
                    "version": migration_data.version,
                    "message": message,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                return {
                    "success": False,
                    "version": migration_data.version,
                    "error": message,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        
        finally:
            migration_manager.disconnect()
    
    except Exception as e:
        logger.error(f"Migration execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/migrations/create-by-type")
async def create_migration_by_type(request: Request, migration_data: MigrationTypeRequest):
    """
    Crea una migración usando tipos predefinidos:
    - add_column: Agregar nueva columna
    - modify_column: Modificar columna existente
    - drop_column: Eliminar columna
    - add_table: Crear nueva tabla
    - add_index: Crear índice
    """
    admin = await require_admin(request)
    
    try:
        # Generar SQL basado en tipo
        sql_commands = MigrationBuilder.create_migration(
            migration_data.version,
            migration_data.description,
            migration_data.migration_type,
            {
                'table': migration_data.table,
                'column': migration_data.column,
                'data_type': migration_data.data_type,
                'nullable': migration_data.nullable,
                'default': migration_data.default,
                'columns': migration_data.columns,
                'index_name': migration_data.index_name
            }
        )
        
        if not sql_commands:
            raise HTTPException(status_code=400, detail="No se pudo generar SQL para el tipo especificado")
        
        # Ejecutar migración
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', ''),
            'database': os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')
        }
        
        migration_manager = DatabaseMigration(db_config)
        
        if not migration_manager.connect():
            raise HTTPException(status_code=500, detail="No se pudo conectar a la BD")
        
        try:
            migration_manager.create_migrations_table()
            success, message = migration_manager.execute_migration(
                migration_data.version,
                sql_commands,
                migration_data.description
            )
            
            return {
                "success": success,
                "version": migration_data.version,
                "migration_type": migration_data.migration_type,
                "sql_generated": sql_commands,
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        finally:
            migration_manager.disconnect()
    
    except Exception as e:
        logger.error(f"Migration creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/migrations/history")
async def get_migration_history(request: Request, limit: int = 50):
    """
    Obtiene el historial completo de migraciones ejecutadas.
    Muestra qué cambios se han aplicado, cuándo y si fueron exitosos.
    """
    admin = await require_admin(request)
    
    try:
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', ''),
            'database': os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')
        }
        
        migration_manager = DatabaseMigration(db_config)
        
        if not migration_manager.connect():
            raise HTTPException(status_code=500, detail="No se pudo conectar a la BD")
        
        try:
            history = migration_manager.get_migration_history()
            
            return {
                "total": len(history),
                "limit": limit,
                "migrations": [
                    {
                        "id": h.get('id'),
                        "version": h.get('version'),
                        "description": h.get('description'),
                        "status": h.get('status'),
                        "executed_at": h.get('executed_at').isoformat() if h.get('executed_at') else None,
                        "error_message": h.get('error_message'),
                        "rollback_available": h.get('rollback_available')
                    }
                    for h in history[:limit]
                ]
            }
        
        finally:
            migration_manager.disconnect()
    
    except Exception as e:
        logger.error(f"Migration history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/migrations/pending")
async def get_pending_migrations(request: Request):
    """
    Obtiene un resumen de migraciones ejecutadas.
    Útil para tracking de cambios en el schema.
    """
    admin = await require_admin(request)
    
    try:
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', ''),
            'database': os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')
        }
        
        migration_manager = DatabaseMigration(db_config)
        
        if not migration_manager.connect():
            raise HTTPException(status_code=500, detail="No se pudo conectar a la BD")
        
        try:
            executed = migration_manager.get_executed_migrations()
            
            return {
                "executed_migrations": executed,
                "total_executed": len(executed),
                "last_sync": datetime.now(timezone.utc).isoformat()
            }
        
        finally:
            migration_manager.disconnect()
    
    except Exception as e:
        logger.error(f"Pending migrations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/migrations/validate")
async def validate_schema(request: Request):
    """
    Valida la integridad del schema actual de la base de datos.
    Genera un reporte completo de todas las tablas y columnas.
    """
    admin = await require_admin(request)
    
    try:
        db_config = {
            'host': os.environ.get('MYSQL_HOST', 'localhost'),
            'user': os.environ.get('MYSQL_USER', 'root'),
            'password': os.environ.get('MYSQL_PASSWORD', ''),
            'database': os.environ.get('MYSQL_DATABASE', 'cecyte04_dreams')
        }
        
        migration_manager = DatabaseMigration(db_config)
        
        if not migration_manager.connect():
            raise HTTPException(status_code=500, detail="No se pudo conectar a la BD")
        
        try:
            validation_report = migration_manager.validate_schema()
            
            return {
                "validation": validation_report,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "valid" if not validation_report.get('errors') else "invalid"
            }
        
        finally:
            migration_manager.disconnect()
    
    except Exception as e:
        logger.error(f"Schema validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/migrations/templates")
async def get_migration_templates(request: Request):
    """
    Devuelve ejemplos de SQL comunes para migraciones típicas
    """
    admin = await require_admin(request)
    
    return {
        "templates": {
            "add_user_field": {
                "description": "Agregar campo de teléfono a usuarios",
                "sql": "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);",
                "version": "001"
            },
            "add_admin_field": {
                "description": "Agregar campo de despacho a admin",
                "sql": "ALTER TABLE admin_sessions ADD COLUMN despacho VARCHAR(100);",
                "version": "002"
            },
            "create_backup_table": {
                "description": "Crear tabla de backup de datos",
                "sql": """CREATE TABLE IF NOT EXISTS data_backups (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    table_name VARCHAR(100) NOT NULL,
                    backup_data JSON NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",
                "version": "003"
            },
            "add_audit_log": {
                "description": "Crear tabla de auditoría",
                "sql": """CREATE TABLE IF NOT EXISTS audit_log (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id VARCHAR(100),
                    action VARCHAR(100) NOT NULL,
                    table_name VARCHAR(100) NOT NULL,
                    record_id VARCHAR(100),
                    old_values JSON,
                    new_values JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_admin_id (admin_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",
                "version": "004"
            },
            "add_index_performance": {
                "description": "Agregar índice para mejorar performance",
                "sql": "CREATE INDEX idx_user_created_at ON users (created_at);",
                "version": "005"
            }
        },
        "docs": {
            "add_column": "ALTER TABLE table_name ADD COLUMN column_name DATA_TYPE [DEFAULT value];",
            "modify_column": "ALTER TABLE table_name MODIFY COLUMN column_name DATA_TYPE;",
            "drop_column": "ALTER TABLE table_name DROP COLUMN column_name;",
            "add_index": "CREATE INDEX index_name ON table_name (column_name);",
            "rename_table": "RENAME TABLE old_name TO new_name;",
            "notes": "Siempre hacer backup antes de ejecutar migraciones. Los cambios se registran automáticamente."
        }
    }
async def delete_comment(request: Request, comment_id: str):
    """Eliminar comentario propio o como admin"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Verificar si es admin o propietario del comentario
                if user.get('is_admin'):
                    await cursor.execute("SELECT multimedia_id FROM publication_comments WHERE comment_id = %s", (comment_id,))
                else:
                    await cursor.execute("SELECT multimedia_id FROM publication_comments WHERE comment_id = %s AND user_id = %s", (comment_id, user['user_id']))
                
                comment = await cursor.fetchone()
                if not comment:
                    raise HTTPException(status_code=404, detail="Comment not found")
                
                await cursor.execute("DELETE FROM publication_comments WHERE comment_id = %s", (comment_id,))
                await cursor.execute(
                    "UPDATE multimedia SET comments_count = comments_count - 1 WHERE multimedia_id = %s",
                    (comment['multimedia_id'],)
                )
        
        return {"message": "Comment deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete comment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_likes_count(cursor, multimedia_id: str) -> int:
    """Helper function to get current likes count"""
    await cursor.execute("SELECT likes_count FROM multimedia WHERE multimedia_id = %s", (multimedia_id,))
    result = await cursor.fetchone()
    return result['likes_count'] if result else 0
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
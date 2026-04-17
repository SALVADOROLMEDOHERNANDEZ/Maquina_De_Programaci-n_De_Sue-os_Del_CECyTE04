# 🧪 GUÍA DE TESTING - Versión 3.0

**Fecha:** 16 de Abril 2026  
**Objetivo:** Validar funcionamiento de Publicaciones y Tour Virtual Múltiple

---

## 📋 ANTES DE EMPEZAR

### Requisitos
- Base de datos actualizada con cambios v3.0
- Backend corriendo (uvicorn)
- Frontend corriendo (npm start)
- Usuario autenticado (para algunas pruebas)
- Cuenta admin configurada

### URLs Base
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001` (o tu puerto)
- Base de datos: phpMyAdmin accesible

---

## 🧪 TEST 1: MÓDULO DE PUBLICACIONES

### Test 1.1: Cargar página de publicaciones
**Pasos:**
1. Navegar a `http://localhost:3000/publicaciones`
2. Verificar que carga sin errores
3. Ver lista de publicaciones existentes

**Resultado esperado:**
- ✅ Página carga
- ✅ Grid de publicaciones visible
- ✅ Si no hay publicaciones, mostrar mensaje "No hay publicaciones"
- ✅ No hay errores en console

**Debug si falla:**
```bash
# Revisar console del navegador (F12)
# Verificar que API retorna /api/multimedia/public?tipo=publicacion
# Backend logs:
# tail -f backend.log | grep multimedia
```

---

### Test 1.2: Admin crea publicación (Instagram)
**Pasos:**
1. Iniciar sesión como admin
2. En `/publicaciones`, clickear "Nueva Publicación"
3. Llenar formulario:
   - Título: "Evento CECyTE 04"
   - Descripción: "Descripción del evento"
   - Plataforma: "Instagram"
   - URL: (dejar vacío para esta prueba)
   - Archivo: subir una imagen (JPG/PNG)
4. Clickear "Crear Publicación"

**Resultado esperado:**
- ✅ Toast de éxito
- ✅ Publicación aparece en la lista
- ✅ Imagen visible en la tarjeta
- ✅ Badge de plataforma muestra ícono de Instagram

**Debug si falla:**
```bash
# Verificar en BD:
SELECT * FROM multimedia WHERE tipo = 'publicacion' AND platform = 'instagram';

# Revisar logs backend:
grep -i "multimedia upload" backend.log

# Verificar archivo subido:
ls -la backend/uploads/multimedia/ | grep media_
```

---

### Test 1.3: Admin crea publicación (YouTube)
**Pasos:**
1. "Nueva Publicación"
2. Título: "Tutorial de Programación"
3. Plataforma: "YouTube"
4. URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
5. Descripción: "Aprende programación desde cero"
6. Crear

**Resultado esperado:**
- ✅ Publicación con badge de YouTube
- ✅ Mostrar enlace "Ver contenido externo"
- ✅ Sin archivo (URL es el contenido principal)

**Verificación BD:**
```sql
SELECT multimedia_id, titulo, platform, url FROM multimedia 
WHERE platform = 'youtube' LIMIT 1;
```

---

### Test 1.4: Usuario da like
**Pasos (Usuario autenticado):**
1. En `/publicaciones`
2. Ver una publicación
3. Clickear corazón ❤️
4. Verificar cambios:
   - Corazón se llena (rojo)
   - Contador aumenta
5. Clickear nuevamente para quitar like

**Resultado esperado:**
- ✅ Like agregado inmediatamente (se ve en UI)
- ✅ Contador aumenta (+1)
- ✅ Corazón se llena
- ✅ Al quitar like: contador baja (-1), corazón se vacía
- ✅ Sin recargar página

**Verificación BD:**
```sql
-- Checar que like existe
SELECT * FROM publication_likes 
WHERE multimedia_id = 'media_xxxxx';

-- Checar que contador se actualiza
SELECT likes_count FROM multimedia 
WHERE multimedia_id = 'media_xxxxx';
```

---

### Test 1.5: Usuario sin autenticación NO puede dar like
**Pasos:**
1. Cerrar sesión / Abrir en incógnito
2. Ir a `/publicaciones`
3. Intentar dar like

**Resultado esperado:**
- ✅ Toast de error: "Requiere autenticación"
- ✅ Like no se registra
- ✅ No se redirige

---

### Test 1.6: Agregar comentario
**Pasos (Usuario autenticado):**
1. En una publicación, clickear icono de comentarios 💬
2. Se abre modal con comentarios
3. Escribir comentario: "¡Excelente publicación!"
4. Clickear enviar/botón de envío
5. Verificar que aparece el comentario

**Resultado esperado:**
- ✅ Modal se abre
- ✅ Comentario aparece en lista
- ✅ Muestra nombre del usuario
- ✅ Muestra fecha/hora
- ✅ Contador de comentarios aumenta

**Verificación BD:**
```sql
SELECT comment_id, comment_text, user_id FROM publication_comments
WHERE multimedia_id = 'media_xxxxx'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 1.7: Editar comentario propio
**Pasos:**
1. Abrir comentarios de una publicación
2. Ver comentario que hiciste
3. (Si hay botón editar) Clickearlo
4. Cambiar texto
5. Guardar

**Resultado esperado:**
- ✅ Comentario se actualiza
- ✅ Muestra "Actualizado" o timestamp nuevo
- ✅ Solo puedes editar los tuyos

---

### Test 1.8: Ver lista de likes
**Pasos:**
1. En una publicación, clickear contador de likes
2. (Si hay funcionalidad) Ver lista de usuarios que dieron like

**Resultado esperado:**
- ✅ Modal/desplegable con lista
- ✅ Muestra foto/nombre de cada usuario
- ✅ Ordenados por fecha

---

### Test 1.9: Admin puede eliminar publicación
**Pasos (Admin):**
1. Ir a `/admin` (AdminPanel)
2. (Buscar sección Multimedia o Publicaciones)
3. Encontrar una publicación
4. Clickear "Eliminar"
5. Confirmar eliminación

**Resultado esperado:**
- ✅ Publicación desaparece
- ✅ Archivo se elimina del servidor
- ✅ Todos los likes/comentarios se eliminan en cascada

---

## 🧪 TEST 2: TOUR VIRTUAL MÚLTIPLE

### Test 2.1: Cargar Tour Virtual
**Pasos:**
1. Navegar a `http://localhost:3000/tour`
2. Esperar a que cargue

**Resultado esperado:**
- ✅ Canvas 3D carga
- ✅ Ver especialidades (tarjetas)
- ✅ Ver avatar del usuario
- ✅ No hay errores en console

**Debug si falla:**
```bash
# Revisar API call:
curl http://localhost:8001/api/models/active
# Debe retornar: [ { model_id, nombre, filename, ... }, ... ]

# Revisar que archivo modelo existe:
ls -la backend/uploads/models/
```

---

### Test 2.2: Múltiples modelos activos
**Pasos (Admin):**
1. Subir 2+ modelos 3D en AdminPanel
2. Activar ambos con toggle (no debería desactivar el anterior)
3. Ir a `/tour`
4. Verificar que ambos modelos se cargan

**Resultado esperado:**
- ✅ Ambos modelos activos simultáneamente
- ✅ Tour carga el primero
- ✅ Infraestructura para cambiar entre ellos
- ✅ No se cuelga la página

**Verificación:**
```sql
SELECT model_id, nombre, is_active FROM models_3d 
WHERE is_active = 1;
-- Debe retornar 2+ registros
```

---

### Test 2.3: Toggle de modelo funciona
**Pasos (Admin):**
1. Ir a AdminPanel
2. Ver lista de modelos
3. Toggle de activación para modelo A
4. Verificar que se desactiva (pero otros no)

**Resultado esperado:**
- ✅ Modelo A: is_active cambia de 1 a 0 o viceversa
- ✅ Otros modelos NO se ven afectados
- ✅ Tour actualiza automáticamente en tiempo real (próxima carga)

---

### Test 2.4: Modelo pesado NO traba
**Pasos:**
1. Subir modelo 3D de 50MB+
2. Activarlo
3. Ir a `/tour`
4. Medir tiempo de carga

**Resultado esperado:**
- ✅ Página responsiva durante la carga
- ✅ Indicador de "Cargando modelo 3D..."
- ✅ Tiempos: < 5s en red normal
- ✅ Se puede rotar/zoom mientras carga

**Monitor:**
```bash
# Network tab en DevTools (F12)
# Ver tiempo de:
# - GET /api/models/active (debe ser < 100ms)
# - GET /api/models/file/filename (depende del tamaño)
```

---

### Test 2.5: Manejo de error - Modelo corrupto
**Pasos:**
1. Renombrar archivo de modelo a .gltf corrupto
2. Activarlo
3. Ir a `/tour`

**Resultado esperado:**
- ✅ Muestra error rojo: "Formato de archivo no soportado"
- ✅ Tour sigue funcionando (muestra monumento central)
- ✅ No se cuelga

---

### Test 2.6: Cambio de formato
**Pasos:**
1. Subir modelo en .fbx
2. Subir mismo modelo en .glb
3. Activar ambos
4. Ir a `/tour`

**Resultado esperado:**
- ✅ Ambos cargan sin conflictos
- ✅ Loaders automáticos funcionan
- ✅ Rendimiento similar

---

### Test 2.7: Performance - Sin modelo (Tour clásico)
**Pasos:**
1. Desactivar todos los modelos
2. Ir a `/tour`

**Resultado esperado:**
- ✅ Muestra monumento central animado
- ✅ Tarjetas de especialidades funcionan
- ✅ Performance muy rápido (sin archivo 3D grande)

---

## 🔍 TEST 3: INTEGRACIÓN

### Test 3.1: Dashboard - Botón de navegación
**Pasos:**
1. Ir a `/dashboard`
2. Clickear botón "Publicaciones"

**Resultado esperado:**
- ✅ Navega a `/publicaciones`
- ✅ No hay errores de ruta

---

### Test 3.2: Autenticación E2E
**Pasos:**
1. Desautenticarse
2. Ir a `/publicaciones`
3. Ver publicaciones (debe ser pública)
4. Intentar dar like (debe pedir autenticación)
5. Iniciar sesión
6. Dar like (ahora debe funcionar)

**Resultado esperado:**
- ✅ Contenido público sin auth
- ✅ Interacciones requieren auth
- ✅ Redirección a login si es necesario

---

### Test 3.3: Base de datos consistencia
**Pasos:**
1. Crear publicación
2. Agregar 5 likes
3. Agregar 3 comentarios
4. Eliminar comentario
5. Verificar BD

**Resultado esperado:**
- ✅ Estructura de datos correcta
- ✅ Contadores sincronizados
- ✅ Foreign keys mantienen consistencia

---

## 📊 RESULTADOS

### Checklist Final

**Publicaciones:**
- [ ] Cargar página
- [ ] Admin crea instituciones
- [ ] Admin crea Facebook
- [ ] Admin crea YouTube
- [ ] Usuario autenticado da like
- [ ] Usuario no autenticado NO puede dar like
- [ ] Agregar comentario
- [ ] Editar comentario (si está implementado)
- [ ] Admin elimina publicación

**Tour Virtual:**
- [ ] Cargar tour
- [ ] Múltiples modelos activos
- [ ] Toggle funciona
- [ ] Modelo pesado no traba
- [ ] Manejo de errores
- [ ] Cambio de formato
- [ ] Tour sin modelo

**Integración:**
- [ ] Dashboard navega correctamente
- [ ] Auth E2E funciona
- [ ] BD consistente

---

## 📝 REPORTE DE BUGS

Si encuentras algún problema, crear issue con formato:

```markdown
## Bug: [Descripción breve]

**Pasos para reproducir:**
1. ...
2. ...

**Esperado:**
- ...

**Actual:**
- ...

**Logs/Screenshots:**
[Pegar aquí]

**Ambiente:**
- Browser: Chrome 120
- OS: Windows 11
- Backend: v3.0
- Frontend: v3.0
```

---

## 🚀 PERFORMANCE BENCHMARKS

| Acción | Objetivo | Actual |
|--------|----------|--------|
| Cargar `/publicaciones` | < 2s | - |
| Dar like | < 500ms | - |
| Agregar comentario | < 1s | - |
| Cargar tour (sin modelo) | < 1s | - |
| Cargar tour (con modelo 10MB) | < 5s | - |
| Cargar tour (con modelo 50MB) | < 15s | - |

---

**Test creado:** 16 Abril 2026  
**Versión:** 3.0  
**Status:** Listo para Testing

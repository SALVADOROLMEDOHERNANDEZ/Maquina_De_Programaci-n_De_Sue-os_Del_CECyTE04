# 🎓 Guía de Uso - Sistema de Modelos 3D
## Máquina de Programación de Sueños - CECyTE 04

---

## ✅ Estado del Sistema

**TODOS LOS PROBLEMAS HAN SIDO SOLUCIONADOS**

- ✅ Backend funcionando correctamente
- ✅ Frontend compilado exitosamente  
- ✅ Sistema de modelos 3D operativo
- ✅ Soporte completo para GLTF, GLB, FBX y OBJ
- ✅ Manejo de errores robusto implementado

---

## 📋 Problemas que se Solucionaron

### 1. **Dependencias del Backend**
- **Problema**: Módulo `aiofiles` no encontrado
- **Solución**: ✅ Reinstalación completa de dependencias

### 2. **Dependencias del Frontend**  
- **Problema**: Incompatibilidad de versión de Node.js con `camera-controls`
- **Solución**: ✅ Instalación con flag `--ignore-engines`

### 3. **Soporte Limitado de Formatos 3D**
- **Problema**: Solo funcionaba GLTF/GLB, FBX y OBJ no funcionaban
- **Solución**: ✅ Reescritura completa del componente con loaders dinámicos

### 4. **Falta de Manejo de Errores**
- **Problema**: No había feedback cuando un modelo fallaba al cargar
- **Solución**: ✅ Sistema completo de errores con indicadores visuales

---

## 🎯 Formatos Soportados

| Formato | Extensión | Loader Usado | Características |
|---------|-----------|--------------|-----------------|
| **GLTF** | `.gltf` | GLTFLoader | ⭐ **RECOMENDADO** - Mejor rendimiento, texturas, materiales |
| **GLB** | `.glb` | GLTFLoader | ⭐ **RECOMENDADO** - Versión binaria de GLTF, archivo único |
| **FBX** | `.fbx` | FBXLoader | ✅ Bueno para modelos de Autodesk/Maya/3DS Max |
| **OBJ** | `.obj` | OBJLoader | ✅ Simple pero sin materiales complejos |

---

## 🚀 Cómo Usar el Sistema

### **Paso 1: Acceder al Panel de Administración**

1. Abre tu navegador y ve a: `[TU_URL]/admin`
2. Inicia sesión con:
   - **Usuario**: `admin`
   - **Contraseña**: `cecyte04admin`
   
   O con Google Auth usando: `olmedohernandezsalvador@gmail.com`

### **Paso 2: Subir un Modelo 3D**

1. En el panel admin, haz clic en la pestaña **"Modelos 3D"**
2. Completa el formulario:
   - **Nombre del modelo**: Ej. "Plantel CECyTE 04 Completo"
   - **Archivo**: Haz clic en el área de carga o arrastra tu archivo
3. Formatos aceptados: `.gltf`, `.glb`, `.fbx`, `.obj`
4. Tamaño máximo: **100 MB**
5. Haz clic en **"Subir Modelo"**

### **Paso 3: Activar el Modelo**

1. Una vez subido, aparecerá en la lista de **"Modelos Cargados"**
2. Haz clic en el botón **✓ (check)** para activarlo
3. Solo puede haber un modelo activo a la vez
4. El modelo activo se mostrará con un badge **"ACTIVO"** en azul

### **Paso 4: Ver el Tour Virtual**

1. Haz clic en **"Vista Previa"** en la barra superior
2. O navega directamente a: `[TU_URL]/tour`
3. El modelo 3D del plantel aparecerá en el centro de la escena
4. Usa el mouse para:
   - **Arrastrar**: Rotar la vista
   - **Scroll**: Hacer zoom in/out
   - **Click en tarjetas**: Ver información de especialidades

---

## 📐 Ajustes Automáticos del Sistema

El sistema realiza automáticamente:

### ✨ **Centrado Automático**
- Calcula el centro del modelo
- Lo posiciona en el origen de la escena

### ✨ **Posicionamiento en el Suelo**
- Coloca el modelo sobre el plano Y=0
- El modelo siempre "toca" el suelo

### ✨ **Escalado Inteligente**
- **Modelos grandes** (>60 unidades): Escala a 60 unidades
- **Modelos pequeños** (<10 unidades): Escala a 30 unidades
- **Mantiene las proporciones** originales

---

## 💡 Recomendaciones para Mejores Resultados

### 📏 **Antes de Exportar tu Modelo 3D**

1. **Centrar el modelo** en el origen (0,0,0) en tu software 3D
2. **Usar unidades métricas** (metros recomendado)
3. **Optimizar geometría**:
   - Menos de 100,000 polígonos recomendado
   - Eliminar geometría oculta
   - Usar modificador "Decimate" si es necesario

4. **Texturas**:
   - Formatos: JPG o PNG
   - Resolución máxima: 2048x2048 píxeles
   - Incluir texturas en el archivo (GLB/FBX) o en carpeta separada (GLTF/OBJ)

### 🎨 **Formato Recomendado: GLB**

**¿Por qué GLB?**
- ✅ Archivo único (geometría + texturas + materiales)
- ✅ Menor tamaño que GLTF
- ✅ Carga más rápida
- ✅ Soporte completo de materiales PBR
- ✅ Compatible con Blender, Maya, 3DS Max, SketchUp

**Cómo exportar GLB desde Blender:**
1. File > Export > glTF 2.0 (.glb/.gltf)
2. Formato: **glTF Binary (.glb)**
3. Include: ✅ Selected Objects (o Todo)
4. Transform: ✅ +Y Up
5. Geometry: ✅ Apply Modifiers
6. Export

---

## 🔧 Gestión de Modelos en el Panel Admin

### **Ver Modelos Cargados**
- Lista completa con nombre, formato y tamaño
- Indica cuál está activo con badge azul

### **Activar/Desactivar Modelos**
- Solo un modelo puede estar activo
- Al activar uno, los demás se desactivan automáticamente

### **Eliminar Modelos**
- Haz clic en el botón 🗑️ (basura) rojo
- Confirmación requerida
- Elimina el archivo del servidor y la base de datos

### **Posicionar Tarjetas de Especialidades**
- Pestaña **"Posición Tarjetas"**
- Ajusta coordenadas X, Y, Z de cada tarjeta
- Coordenadas relativas al modelo 3D
- Guarda cambios para aplicar

---

## 🎪 Indicadores Visuales en el Tour

### Durante la Carga
```
┌─────────────────────────────────┐
│ ⟳ Cargando modelo 3D...         │
└─────────────────────────────────┘
```
- Badge azul en la parte superior
- Aparece mientras el modelo se carga

### En Caso de Error
```
┌─────────────────────────────────┐
│ ⚠ Error al cargar el modelo 3D  │
└─────────────────────────────────┘
```
- Badge rojo en la parte superior
- Muestra mensaje de error descriptivo

### Modelo Cargado Exitosamente
```
┌─────────────────────────────────┐
│ ◻ Modelo del plantel cargado    │
└─────────────────────────────────┘
```
- Badge verde en la esquina superior izquierda
- Indica que hay un modelo activo

---

## 🐛 Solución de Problemas

### **El modelo no aparece en el tour**

**Posibles causas y soluciones:**

1. ✅ **Verificar que el modelo esté activado**
   - Ve al panel admin
   - Asegúrate de que tenga el badge "ACTIVO"

2. ✅ **Verificar formato de archivo**
   - Solo GLTF, GLB, FBX y OBJ son soportados
   - Extensión correcta en el nombre de archivo

3. ✅ **Verificar tamaño de archivo**
   - Máximo 100 MB
   - Comprime texturas si es necesario

4. ✅ **Ver consola del navegador**
   - F12 > Console
   - Busca errores relacionados con "model" o "3D"

### **El modelo aparece muy grande o pequeño**

- ✅ El sistema escala automáticamente
- ✅ Si sigue mal, verifica las unidades en tu software 3D
- ✅ Exporta con escala 1:1 en metros

### **El modelo está fuera de centro**

- ✅ El sistema centra automáticamente
- ✅ Si persiste, centra en tu software 3D antes de exportar

### **Las texturas no aparecen**

**Para GLTF:**
- ✅ Asegúrate de incluir la carpeta de texturas
- ✅ Usa rutas relativas en el archivo GLTF

**Para GLB:**
- ✅ Las texturas están embebidas, verifica la exportación

**Para FBX/OBJ:**
- ✅ Incluye el archivo MTL (para OBJ)
- ✅ Embebe texturas al exportar (FBX)

---

## 📊 Estado Actual del Sistema

```bash
✅ Backend:      RUNNING (Puerto 8001)
✅ Frontend:     RUNNING (Puerto 3000)  
✅ MongoDB:      RUNNING (Puerto 27017)
✅ Nginx:        RUNNING
```

### **Verificar estado:**
```bash
sudo supervisorctl status
```

### **Reiniciar servicios si es necesario:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all
```

---

## 📖 Archivos de Documentación

- **`/app/CAMBIOS_MODELOS_3D.md`** - Cambios técnicos detallados
- **`/app/GUIA_USO_MODELOS_3D.md`** - Esta guía (uso para administradores)
- **`/app/README.md`** - Documentación general del proyecto
- **`/app/test_result.md`** - Estado de testing y desarrollo

---

## 🎯 Próximos Pasos Sugeridos

1. **Preparar tu modelo 3D del plantel CECyTE 04**
   - Exportarlo en formato GLB (recomendado)
   - Optimizar geometría y texturas
   - Asegurarte de que esté centrado

2. **Subir el modelo al sistema**
   - Usar el panel de administración
   - Activarlo después de subirlo

3. **Verificar en el tour virtual**
   - Navegar a `/tour`
   - Verificar que se vea correctamente
   - Ajustar posiciones de tarjetas si es necesario

4. **Optimizar si es necesario**
   - Si carga lento: Reducir polígonos o comprimir texturas
   - Si no se ve bien: Ajustar materiales o iluminación en el software 3D

---

## 🆘 Soporte

Si tienes problemas:

1. **Verifica los logs:**
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   tail -f /var/log/supervisor/frontend.err.log
   ```

2. **Verifica la API:**
   ```bash
   curl http://localhost:8001/api/health
   curl http://localhost:8001/api/models/active
   ```

3. **Revisa la consola del navegador:**
   - F12 > Console
   - Busca errores en rojo

---

## ✨ ¡Listo para Usar!

El sistema de modelos 3D está completamente funcional y listo para mostrar el plantel CECyTE 04 en toda su gloria virtual. 

**¡Solo falta subir tu modelo 3D y activarlo!** 🎉

---

**Desarrollado para CECyTE 04 - Tlaxcala, México** ❤️

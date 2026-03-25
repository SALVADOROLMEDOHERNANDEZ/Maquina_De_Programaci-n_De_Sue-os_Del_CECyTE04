import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, Brain, Target, Heart, Briefcase, Lightbulb, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PREGUNTAS = [
  {
    id: 'actividades',
    pregunta: '¿Qué tipo de actividades disfrutas más en tu tiempo libre?',
    tipo: 'multiple',
    opciones: [
      { valor: 'tecnologia', texto: 'Explorar tecnología, videojuegos, programar', icono: '💻' },
      { valor: 'manual', texto: 'Arreglar cosas, trabajar con herramientas', icono: '🔧' },
      { valor: 'creativo', texto: 'Dibujar, diseñar, crear contenido', icono: '🎨' },
      { valor: 'social', texto: 'Ayudar a otros, organizar eventos', icono: '🤝' },
      { valor: 'investigar', texto: 'Leer, investigar, aprender cosas nuevas', icono: '📚' }
    ]
  },
  {
    id: 'habilidades',
    pregunta: '¿Cuáles consideras que son tus principales habilidades?',
    tipo: 'multiple',
    opciones: [
      { valor: 'logica', texto: 'Resolver problemas lógicos y matemáticos', icono: '🧮' },
      { valor: 'mecanica', texto: 'Entender cómo funcionan las máquinas', icono: '⚙️' },
      { valor: 'comunicacion', texto: 'Comunicarme y expresar ideas', icono: '💬' },
      { valor: 'creatividad', texto: 'Pensar de forma creativa e innovadora', icono: '💡' },
      { valor: 'organizacion', texto: 'Organizar y planificar actividades', icono: '📋' }
    ]
  },
  {
    id: 'ambiente_trabajo',
    pregunta: '¿En qué tipo de ambiente te gustaría trabajar?',
    tipo: 'single',
    opciones: [
      { valor: 'oficina', texto: 'Oficina con computadoras', icono: '🖥️' },
      { valor: 'planta', texto: 'Planta industrial o taller', icono: '🏭' },
      { valor: 'exterior', texto: 'Trabajo de campo o exterior', icono: '🌳' },
      { valor: 'laboratorio', texto: 'Laboratorio o investigación', icono: '🔬' },
      { valor: 'mixto', texto: 'Combinación de varios', icono: '🔄' }
    ]
  },
  {
    id: 'materias_favoritas',
    pregunta: '¿Qué materias te gustan o gustaban más en la escuela?',
    tipo: 'multiple',
    opciones: [
      { valor: 'matematicas', texto: 'Matemáticas y física', icono: '📐' },
      { valor: 'computacion', texto: 'Computación e informática', icono: '💻' },
      { valor: 'quimica', texto: 'Química y biología', icono: '🧪' },
      { valor: 'humanidades', texto: 'Historia, español, idiomas', icono: '📖' },
      { valor: 'artes', texto: 'Artes, música, educación física', icono: '🎭' }
    ]
  },
  {
    id: 'meta_profesional',
    pregunta: '¿Qué es lo más importante para ti en tu futura carrera?',
    tipo: 'single',
    opciones: [
      { valor: 'dinero', texto: 'Ganar buen dinero', icono: '💰' },
      { valor: 'estabilidad', texto: 'Tener un trabajo estable', icono: '🏠' },
      { valor: 'pasion', texto: 'Hacer algo que me apasione', icono: '❤️' },
      { valor: 'impacto', texto: 'Contribuir a la sociedad', icono: '🌍' },
      { valor: 'crecimiento', texto: 'Oportunidades de crecimiento', icono: '📈' }
    ]
  },
  {
    id: 'resolver_problemas',
    pregunta: '¿Cómo prefieres resolver problemas?',
    tipo: 'single',
    opciones: [
      { valor: 'analisis', texto: 'Analizando datos y buscando patrones', icono: '📊' },
      { valor: 'practica', texto: 'Probando soluciones de forma práctica', icono: '🛠️' },
      { valor: 'equipo', texto: 'Discutiendo con otras personas', icono: '👥' },
      { valor: 'intuicion', texto: 'Siguiendo mi intuición', icono: '✨' },
      { valor: 'investigacion', texto: 'Investigando y documentándome', icono: '🔍' }
    ]
  },
  {
    id: 'tecnologia',
    pregunta: '¿Cómo te relacionas con la tecnología?',
    tipo: 'single',
    opciones: [
      { valor: 'apasionado', texto: 'Me encanta y siempre quiero aprender más', icono: '🚀' },
      { valor: 'herramienta', texto: 'La uso como herramienta útil', icono: '🔧' },
      { valor: 'necesario', texto: 'Solo lo necesario', icono: '📱' },
      { valor: 'preferir_manual', texto: 'Prefiero el trabajo manual', icono: '✋' }
    ]
  },
  {
    id: 'trabajo_equipo',
    pregunta: '¿Cómo prefieres trabajar?',
    tipo: 'single',
    opciones: [
      { valor: 'solo', texto: 'Prefiero trabajar solo', icono: '👤' },
      { valor: 'equipo_pequeno', texto: 'En equipos pequeños (2-4 personas)', icono: '👥' },
      { valor: 'equipo_grande', texto: 'En equipos grandes', icono: '👨‍👩‍👧‍👦' },
      { valor: 'lider', texto: 'Me gusta liderar equipos', icono: '👔' },
      { valor: 'flexible', texto: 'Depende del proyecto', icono: '🔄' }
    ]
  },
  {
    id: 'innovacion',
    pregunta: '¿Qué opinas sobre crear cosas nuevas?',
    tipo: 'single',
    opciones: [
      { valor: 'crear', texto: 'Me emociona crear desde cero', icono: '✨' },
      { valor: 'mejorar', texto: 'Prefiero mejorar lo existente', icono: '📈' },
      { valor: 'mantener', texto: 'Me gusta mantener funcionando', icono: '🔧' },
      { valor: 'seguir', texto: 'Prefiero seguir instrucciones', icono: '📋' }
    ]
  },
  {
    id: 'futuro',
    pregunta: '¿Cómo te imaginas en 10 años?',
    tipo: 'single',
    opciones: [
      { valor: 'empresa_tech', texto: 'Trabajando en empresa tecnológica', icono: '🏢' },
      { valor: 'industria', texto: 'En una planta industrial importante', icono: '🏭' },
      { valor: 'emprendimiento', texto: 'Con mi propio negocio', icono: '💼' },
      { valor: 'investigacion', texto: 'Investigando o enseñando', icono: '🎓' },
      { valor: 'remoto', texto: 'Trabajando de forma remota', icono: '🌐' }
    ]
  }
];

export default function CareerQuiz() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const preguntaActual = PREGUNTAS[paso];
  const progreso = ((paso + 1) / PREGUNTAS.length) * 100;

  const handleSeleccion = (valor) => {
    if (preguntaActual.tipo === 'multiple') {
      const actuales = respuestas[preguntaActual.id] || [];
      if (actuales.includes(valor)) {
        setRespuestas({
          ...respuestas,
          [preguntaActual.id]: actuales.filter(v => v !== valor)
        });
      } else {
        setRespuestas({
          ...respuestas,
          [preguntaActual.id]: [...actuales, valor]
        });
      }
    } else {
      setRespuestas({
        ...respuestas,
        [preguntaActual.id]: valor
      });
    }
  };

  const estaSeleccionado = (valor) => {
    const respuesta = respuestas[preguntaActual.id];
    if (preguntaActual.tipo === 'multiple') {
      return (respuesta || []).includes(valor);
    }
    return respuesta === valor;
  };

  const puedeAvanzar = () => {
    const respuesta = respuestas[preguntaActual.id];
    if (preguntaActual.tipo === 'multiple') {
      return respuesta && respuesta.length > 0;
    }
    return respuesta !== undefined;
  };

  const handleSiguiente = async () => {
    if (paso < PREGUNTAS.length - 1) {
      setPaso(paso + 1);
    } else {
      // Finalizar y obtener recomendaciones
      setCargando(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/career-quiz/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestas })
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener recomendaciones');
        }
        
        const data = await response.json();
        setResultado(data);
      } catch (err) {
        setError('Hubo un problema al procesar tus respuestas. Por favor intenta de nuevo.');
        console.error('Error:', err);
      } finally {
        setCargando(false);
      }
    }
  };

  const handleAnterior = () => {
    if (paso > 0) {
      setPaso(paso - 1);
    }
  };

  const reiniciar = () => {
    setPaso(0);
    setRespuestas({});
    setResultado(null);
    setError(null);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <Brain className="w-20 h-20 text-cyan-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Analizando tus respuestas...</h2>
          <p className="text-slate-400">Nuestra IA está encontrando las mejores opciones para ti</p>
        </motion.div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Resultados Personalizados</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Tus Carreras Ideales
            </h1>
            {resultado.analisis && (
              <p className="text-slate-400 max-w-2xl mx-auto">{resultado.analisis}</p>
            )}
          </motion.div>

          {/* Fortalezas */}
          {resultado.fortalezas && resultado.fortalezas.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-lime-400" />
                Tus Fortalezas
              </h3>
              <div className="flex flex-wrap gap-2">
                {resultado.fortalezas.map((fortaleza, idx) => (
                  <span key={idx} className="px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-full text-lime-400 text-sm">
                    {fortaleza}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recomendaciones */}
          <div className="space-y-6" data-testid="career-recommendations">
            {resultado.recomendaciones?.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  rec.es_cecyte 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-lime-500/10 border-cyan-500/30' 
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                {rec.es_cecyte && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-cyan-500 to-lime-500 rounded-full text-xs font-bold text-slate-900">
                    DISPONIBLE EN CECyTE 04
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{rec.carrera}</h3>
                    <p className="text-slate-400 mb-4">{rec.descripcion}</p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-500">Dónde estudiar:</span>
                      <span className="text-slate-300">{rec.donde_estudiar?.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${rec.compatibilidad >= 80 ? 'text-lime-400' : rec.compatibilidad >= 60 ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {rec.compatibilidad}%
                    </div>
                    <div className="text-xs text-slate-500">Compatibilidad</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Acciones */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button
              onClick={reiniciar}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Hacer otro cuestionario
            </Button>
            <Link to="/especialidades">
              <Button className="bg-gradient-to-r from-cyan-500 to-lime-500 text-slate-900 font-bold">
                Ver carreras de CECyTE
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/simulator">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                <Sparkles className="w-4 h-4 mr-2" />
                Simular mi futuro
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-6">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">Cuestionario Vocacional con IA</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Descubre tu Carrera Ideal
          </h1>
          <p className="text-slate-400">
            Responde las siguientes preguntas y nuestra IA te recomendará las mejores opciones
          </p>
        </motion.div>

        {/* Barra de progreso */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Pregunta {paso + 1} de {PREGUNTAS.length}</span>
            <span>{Math.round(progreso)}% completado</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-lime-500"
              initial={{ width: 0 }}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-2">
              {preguntaActual.pregunta}
            </h2>
            {preguntaActual.tipo === 'multiple' && (
              <p className="text-slate-400 text-sm mb-6">Puedes seleccionar varias opciones</p>
            )}

            <div className="space-y-3">
              {preguntaActual.opciones.map((opcion) => (
                <motion.button
                  key={opcion.valor}
                  onClick={() => handleSeleccion(opcion.valor)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    estaSeleccionado(opcion.valor)
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                      : 'bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{opcion.icono}</span>
                    <span className="flex-1">{opcion.texto}</span>
                    {estaSeleccionado(opcion.valor) && (
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navegación */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handleAnterior}
            disabled={paso === 0}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button
            onClick={handleSiguiente}
            disabled={!puedeAvanzar()}
            className="bg-gradient-to-r from-cyan-500 to-lime-500 text-slate-900 font-bold disabled:opacity-30"
          >
            {paso === PREGUNTAS.length - 1 ? (
              <>
                Ver Resultados
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

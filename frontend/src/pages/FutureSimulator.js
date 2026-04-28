import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { 
  Sparkles, 
  User, 
  Heart, 
  GraduationCap, 
  Wand2, 
  ArrowRight, 
  ArrowLeft,
  Cpu,
  Download,
  Mail,
  Share2,
  Check,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CARRERAS = [
  { id: 'prog', nombre: 'Programacion', icon: Cpu },
  { id: 'mantenimiento', nombre: 'Mantenimiento Industrial', icon: Cpu }
];

const INTERESES = [
  'Tecnologia', 'Ciencias', 'Arte', 'Deportes', 'Musica',
  'Videojuegos', 'Matematicas', 'Negocios', 'Salud', 'Robotica',
  'Programacion', 'Diseno', 'Redes Sociales', 'Medio Ambiente'
];

const CUESTIONARIO_GUSTOS = [
  'Resolver problemas', 'Crear apps o sistemas', 'Reparar maquinaria',
  'Trabajar con herramientas', 'Disenar soluciones', 'Aprender nuevas tecnologias'
];

const CUESTIONARIO_PASATIEMPOS = [
  'Videojuegos', 'Electronica', 'Proyectos DIY', 'Lectura tecnica',
  'Deporte', 'Contenido digital', 'Robotica'
];

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#00f0ff]/15 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[#ccff00]/10 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse-glow"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function FutureSimulator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    sexo: '',
    intereses: [],
    gustos: [],
    pasatiempos: [],
    le_gustaria_aprender: '',
    carrera: '',
    email: '',
    telefono: ''
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleInteresToggle = (interes) => {
    setFormData(prev => ({
      ...prev,
      intereses: prev.intereses.includes(interes)
        ? prev.intereses.filter(i => i !== interes)
        : [...prev.intereses, interes]
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.nombre.trim().length >= 2 && formData.sexo !== '';
      case 2:
        return formData.intereses.length >= 2;
      case 3:
        return formData.gustos.length >= 1 && formData.pasatiempos.length >= 1 && formData.le_gustaria_aprender.trim().length >= 6;
      case 4:
        return formData.carrera !== '';
      default:
        return true;
    }
  };

  const generateFuture = async () => {
    setIsGenerating(true);
    setGenerationStep('Conectando con la IA...');

    try {
      const requestPayload = formData;

      // Generate story
      setGenerationStep('Generando tu historia de exito...');
      const storyResponse = await fetch(`${API_URL}/api/simulation/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestPayload)
      });

      if (!storyResponse.ok) {
        throw new Error('Error generando historia');
      }

      const storyData = await storyResponse.json();

      // Generate image
      setGenerationStep('Creando tu imagen del futuro...');
      let imageData = { imagen_base64: null };
      
      try {
        const imageResponse = await fetch(`${API_URL}/api/simulation/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestPayload)
        });

        if (imageResponse.ok) {
          imageData = await imageResponse.json();
        }
      } catch (imgError) {
        console.log('Image generation skipped:', imgError);
      }

      // Save simulation
      setGenerationStep('Guardando tu simulacion...');
      const saveResponse = await fetch(`${API_URL}/api/simulation/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...requestPayload,
          historia: storyData.historia,
          beneficios_carrera: storyData.beneficios_carrera || '',
          imagen_base64: imageData.imagen_base64
        })
      });

      const saveData = await saveResponse.json();

      setResult({
        simulation_id: saveData.simulation_id,
        historia: storyData.historia,
        beneficios_carrera: storyData.beneficios_carrera || '',
        carreras_relacionadas: (
          storyData.carreras_relacionadas &&
          typeof storyData.carreras_relacionadas === 'object' &&
          !Array.isArray(storyData.carreras_relacionadas)
        )
          ? storyData.carreras_relacionadas
          : { universitarias: [], laborales_inmediatas: [] },
        imagen_base64: imageData.imagen_base64
      });

      setStep(6);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Error al generar tu futuro. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSendPoster = async (method) => {
    if (!result?.simulation_id) return;

    const sendData = {
      simulation_id: result.simulation_id,
      metodo: method,
      email: formData.email || null,
      telefono: formData.telefono || null
    };

    try {
      const response = await fetch(`${API_URL}/api/poster/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sendData)
      });

      if (response.ok) {
        toast.success(`Poster enviado por ${method === 'email' ? 'correo' : 'WhatsApp'}!`);
      } else {
        toast.error('Error enviando el poster');
      }
    } catch (error) {
      toast.error('Error de conexion');
    }
  };

  const downloadPoster = () => {
    if (!result?.imagen_base64) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.imagen_base64}`;
    link.download = `futuro_cecyte04_${formData.nombre.replace(/\s/g, '_')}.png`;
    link.click();
    toast.success('Poster descargado!');
  };

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#ccff00]" />
          <span className="text-lg font-bold font-['Syne']">Simulador de Futuro</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container-cyber py-8">
        {/* Progress Bar */}
        {step <= 5 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between text-sm text-white/50 mb-2">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#ccff00]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Syne'] font-bold">Como te llamas?</h2>
                    <p className="text-white/50 text-sm">Tu nombre aparecera en tu historia de exito</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre" className="text-white/70">Nombre completo</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Escribe tu nombre..."
                      className="input-cyber h-14 text-lg"
                      data-testid="simulator-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white/70 mb-3 block">Sexo (para generar tu avatar 3D)</Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, sexo: 'masculino' }))}
                        className={`flex-1 p-4 rounded-xl border transition-all ${
                          formData.sexo === 'masculino'
                            ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-[#00f0ff]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                        }`}
                        data-testid="sexo-masculino"
                      >
                        Masculino
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, sexo: 'femenino' }))}
                        className={`flex-1 p-4 rounded-xl border transition-all ${
                          formData.sexo === 'femenino'
                            ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-[#7c3aed]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                        }`}
                        data-testid="sexo-femenino"
                      >
                        Femenino
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceed()}
                    className="btn-primary rounded-full px-8 py-6"
                    data-testid="simulator-next-btn"
                  >
                    Siguiente <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#00f0ff]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Syne'] font-bold">Cuales son tus intereses?</h2>
                    <p className="text-white/50 text-sm">Selecciona al menos 2 intereses</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTERESES.map((interes) => (
                    <button
                      key={interes}
                      onClick={() => handleInteresToggle(interes)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.intereses.includes(interes)
                          ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-[#00f0ff]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                      }`}
                      data-testid={`interest-${interes.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {interes}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="text-white/70"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Atras
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceed()}
                    className="btn-primary rounded-full px-8 py-6"
                    data-testid="simulator-next-btn-2"
                  >
                    Siguiente <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Questionnaire */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Syne'] font-bold">Cuestionario personal</h2>
                    <p className="text-white/50 text-sm">Cuéntanos tus gustos, pasatiempos y que quieres aprender</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-white/70 mb-2 block">Que te gusta hacer? (elige al menos 1)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CUESTIONARIO_GUSTOS.map((gusto) => (
                        <button
                          key={gusto}
                          type="button"
                          onClick={() => handleArrayToggle('gustos', gusto)}
                          className={`p-3 rounded-xl border text-sm text-left transition-all ${
                            formData.gustos.includes(gusto)
                              ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-[#d8b4fe]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                          }`}
                        >
                          {gusto}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70 mb-2 block">Tus pasatiempos favoritos (elige al menos 1)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CUESTIONARIO_PASATIEMPOS.map((pasatiempo) => (
                        <button
                          key={pasatiempo}
                          type="button"
                          onClick={() => handleArrayToggle('pasatiempos', pasatiempo)}
                          className={`p-3 rounded-xl border text-sm text-left transition-all ${
                            formData.pasatiempos.includes(pasatiempo)
                              ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-[#67e8f9]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                          }`}
                        >
                          {pasatiempo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="aprender" className="text-white/70">Que te gustaria estudiar o aprender?</Label>
                    <Input
                      id="aprender"
                      value={formData.le_gustaria_aprender}
                      onChange={(e) => setFormData(prev => ({ ...prev, le_gustaria_aprender: e.target.value }))}
                      placeholder="Ej: programacion web, automatizacion, robotica, redes..."
                      className="input-cyber h-12"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="text-white/70"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Atras
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!canProceed()}
                    className="btn-primary rounded-full px-8 py-6"
                  >
                    Siguiente <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Career */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Syne'] font-bold">Que carrera te interesa?</h2>
                    <p className="text-white/50 text-sm">Selecciona tu especialidad deseada</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {CARRERAS.map((carrera) => (
                    <button
                      key={carrera.id}
                      onClick={() => setFormData(prev => ({ ...prev, carrera: carrera.nombre }))}
                      className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                        formData.carrera === carrera.nombre
                          ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                      }`}
                      data-testid={`career-${carrera.id}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.carrera === carrera.nombre ? 'bg-[#7c3aed]/20' : 'bg-white/5'
                      }`}>
                        <carrera.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{carrera.nombre}</span>
                      {formData.carrera === carrera.nombre && (
                        <Check className="w-5 h-5 text-[#7c3aed] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="text-white/70"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Atras
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    disabled={!canProceed()}
                    className="btn-primary rounded-full px-8 py-6"
                    data-testid="simulator-next-btn-3"
                  >
                    Siguiente <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Contact & Generate */}
            {step === 5 && !isGenerating && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-[#ccff00]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Syne'] font-bold">Listo para ver tu futuro?</h2>
                    <p className="text-white/50 text-sm">Opcionalmente agrega tu contacto para recibir tu poster</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <Label htmlFor="email" className="text-white/70">Correo electronico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@correo.com"
                      className="input-cyber h-12"
                      data-testid="simulator-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-white/70">WhatsApp (opcional)</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+52 1234567890"
                      className="input-cyber h-12"
                      data-testid="simulator-phone-input"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4 mb-8">
                  <h3 className="text-sm font-medium text-white/50 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-white/50">Nombre:</span> <span className="text-white">{formData.nombre}</span></p>
                    <p><span className="text-white/50">Carrera:</span> <span className="text-[#7c3aed]">{formData.carrera}</span></p>
                    <p><span className="text-white/50">Intereses:</span> <span className="text-[#00f0ff]">{formData.intereses.join(', ')}</span></p>
                    <p><span className="text-white/50">Gustos:</span> <span className="text-[#d8b4fe]">{formData.gustos.join(', ')}</span></p>
                    <p><span className="text-white/50">Pasatiempos:</span> <span className="text-[#67e8f9]">{formData.pasatiempos.join(', ')}</span></p>
                    <p><span className="text-white/50">Quiere aprender:</span> <span className="text-white/80">{formData.le_gustaria_aprender}</span></p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(4)}
                    className="text-white/70"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Atras
                  </Button>
                  <Button
                    onClick={generateFuture}
                    className="btn-primary rounded-full px-8 py-6 text-lg"
                    data-testid="simulator-generate-btn"
                  >
                    <Wand2 className="w-5 h-5 mr-2" /> Generar Mi Futuro
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Generating State */}
            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-12 text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#ccff00] animate-spin" style={{ padding: '3px' }}>
                    <div className="w-full h-full rounded-full bg-[#020408]" />
                  </div>
                  <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-[#ccff00] animate-pulse" />
                </div>
                <h2 className="text-2xl font-['Syne'] font-bold mb-2">Programando tu futuro...</h2>
                <p className="text-[#00f0ff] animate-pulse">{generationStep}</p>
              </motion.div>
            )}

            {/* Step 6: Result */}
            {step === 6 && result && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="glass-card rounded-2xl p-8 text-center">
                  <Sparkles className="w-12 h-12 text-[#ccff00] mx-auto mb-4" />
                  <h2 className="text-3xl font-['Syne'] font-bold mb-2">
                    Tu Futuro esta Listo, {formData.nombre}!
                  </h2>
                  <p className="text-white/50">
                    La IA ha creado tu historia de exito personalizada
                  </p>
                </div>

                {/* Image */}
                {result.imagen_base64 && (
                  <div className="glass-card rounded-2xl p-4 overflow-hidden">
                    <img 
                      src={`data:image/png;base64,${result.imagen_base64}`}
                      alt="Tu futuro en CECyTE 04"
                      className="w-full rounded-xl"
                      data-testid="result-image"
                    />
                  </div>
                )}

                {/* Story */}
                <div className="glass-card rounded-2xl p-8">
                  <h3 className="text-xl font-['Syne'] font-bold mb-4 text-[#00f0ff]">
                    Tu Historia de Exito
                  </h3>
                  <p className="text-white/80 leading-relaxed whitespace-pre-line" data-testid="result-story">
                    {result.historia}
                  </p>
                </div>

                {result.beneficios_carrera && (
                  <div className="glass-card rounded-2xl p-8">
                    <h3 className="text-xl font-['Syne'] font-bold mb-4 text-[#ccff00]">
                      Lo que te ayudara la carrera que elegiste
                    </h3>
                    <p className="text-white/80 leading-relaxed whitespace-pre-line">
                      {result.beneficios_carrera}
                    </p>
                    {result.carreras_relacionadas && (
                      <div className="mt-6">
                        {Array.isArray(result.carreras_relacionadas.universitarias) && result.carreras_relacionadas.universitarias.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm uppercase tracking-wide text-[#00f0ff] mb-3">
                              Carreras universitarias
                            </h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {result.carreras_relacionadas.universitarias.map((item, idx) => (
                                <li
                                  key={`uni-${item}-${idx}`}
                                  className="rounded-lg border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-3 py-2 text-sm text-white/90"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(result.carreras_relacionadas.laborales_inmediatas) && result.carreras_relacionadas.laborales_inmediatas.length > 0 && (
                          <div>
                            <h4 className="text-sm uppercase tracking-wide text-[#ccff00] mb-3">
                              Areas laborales inmediatas
                            </h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                              {result.carreras_relacionadas.laborales_inmediatas.map((item, idx) => (
                                <li
                                  key={`lab-${item}-${idx}`}
                                  className="rounded-lg border border-[#ccff00]/20 bg-[#ccff00]/10 px-3 py-2 text-sm text-white/90"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">Comparte tu futuro</h3>
                  <div className="flex flex-wrap gap-3">
                    {result.imagen_base64 && (
                      <Button
                        onClick={downloadPoster}
                        className="btn-secondary rounded-full"
                        data-testid="download-poster-btn"
                      >
                        <Download className="w-4 h-4 mr-2" /> Descargar
                      </Button>
                    )}
                    {formData.email && (
                      <Button
                        onClick={() => handleSendPoster('email')}
                        className="btn-secondary rounded-full"
                        data-testid="send-email-btn"
                      >
                        <Mail className="w-4 h-4 mr-2" /> Enviar por Email
                      </Button>
                    )}
                    {formData.telefono && (
                      <Button
                        onClick={() => handleSendPoster('whatsapp')}
                        className="btn-secondary rounded-full"
                        data-testid="send-whatsapp-btn"
                      >
                        <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => navigate('/tour')}
                    className="btn-secondary rounded-full px-6"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Tour Virtual
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary rounded-full px-6"
                    data-testid="go-dashboard-btn"
                  >
                    Ir al Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, PlayCircle, Code2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

const YOUTUBE_RECURSOS = [
  {
    titulo: 'JavaScript desde cero (playlist)',
    descripcion: 'Variables, funciones, objetos y fundamentos para comenzar fuerte.',
    url: 'https://www.youtube.com/results?search_query=javascript+desde+cero+playlist'
  },
  {
    titulo: 'React paso a paso',
    descripcion: 'Componentes, estados, hooks y buenas practicas para proyectos reales.',
    url: 'https://www.youtube.com/results?search_query=react+curso+desde+cero'
  },
  {
    titulo: 'Logica de programacion',
    descripcion: 'Ejercicios para resolver problemas y mejorar tu pensamiento computacional.',
    url: 'https://www.youtube.com/results?search_query=logica+de+programacion+ejercicios'
  },
  {
    titulo: 'Python para principiantes',
    descripcion: 'Una ruta simple para dominar sintaxis y estructuras basicas.',
    url: 'https://www.youtube.com/results?search_query=python+para+principiantes+curso'
  }
];

export default function ProgramacionHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#7c3aed]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#00f0ff]/15 blur-3xl pointer-events-none" />

      <main className="relative z-10 container-cyber py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-white/70 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al dashboard
        </Button>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 border border-[#7c3aed]/30 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-[#d8b4fe]" />
            </div>
            <div>
              <h1 className="text-3xl font-['Syne'] font-bold text-white">Centro de Programacion</h1>
              <p className="text-white/60 text-sm">Exclusivo para alumnos con correo institucional</p>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed">
            Este apartado esta pensado para ayudarte a comprender los temas que se te dificultan en la especialidad.
            Aqui encontraras recursos seleccionados, rutas de estudio y contenido audiovisual para reforzar tus clases.
          </p>
        </motion.section>

        <section className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-6 border border-[#00f0ff]/25"
          >
            <h2 className="text-xl font-['Syne'] font-bold mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[#00f0ff]" />
              Videos de apoyo
            </h2>
            <div className="space-y-3">
              {YOUTUBE_RECURSOS.map((video) => (
                <a
                  key={video.titulo}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-4"
                >
                  <p className="font-semibold text-white flex items-center gap-2">
                    {video.titulo} <ExternalLink className="w-4 h-4 text-white/50" />
                  </p>
                  <p className="text-sm text-white/60 mt-1">{video.descripcion}</p>
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 border border-[#ccff00]/25"
          >
            <h2 className="text-xl font-['Syne'] font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ccff00]" />
              Recomendaciones de estudio
            </h2>
            <ul className="space-y-3 text-white/80 text-sm">
              <li className="rounded-xl bg-white/5 border border-white/10 p-3">1) Repasa teoria y crea un mini proyecto por cada tema.</li>
              <li className="rounded-xl bg-white/5 border border-white/10 p-3">2) Practica 30 minutos diarios de ejercicios de logica.</li>
              <li className="rounded-xl bg-white/5 border border-white/10 p-3">3) Forma equipos de estudio para resolver dudas complejas.</li>
              <li className="rounded-xl bg-white/5 border border-white/10 p-3">4) Guarda codigo reutilizable en tu propio repositorio.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-[#ccff00]/30 bg-[#ccff00]/10 p-4 text-sm text-white/80">
              <p className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ccff00]" />
                Proximamente se pueden integrar guias por semestre, retos semanales y mentorias.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, ShieldCheck, Factory, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function MantenimientoHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#00f0ff]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#ccff00]/15 blur-3xl pointer-events-none" />

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
          className="glass-card rounded-3xl p-8 border border-[#00f0ff]/30 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-[#67e8f9]" />
            </div>
            <div>
              <h1 className="text-3xl font-['Syne'] font-bold text-white">Centro de Mantenimiento Industrial</h1>
              <p className="text-white/60 text-sm">Exclusivo para alumnos con correo institucional</p>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed">
            Este espacio esta listo para centralizar recursos tecnicos de mantenimiento industrial:
            diagnostico de fallas, seguridad, procesos y practicas de taller.
          </p>
        </motion.section>

        <section className="grid lg:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <Factory className="w-8 h-8 text-[#00f0ff] mb-3" />
            <h3 className="font-['Syne'] font-bold text-lg mb-2">Procesos industriales</h3>
            <p className="text-sm text-white/60">Proximamente: guias de sistemas mecanicos, electricos y neumaticos.</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <ShieldCheck className="w-8 h-8 text-[#ccff00] mb-3" />
            <h3 className="font-['Syne'] font-bold text-lg mb-2">Seguridad tecnica</h3>
            <p className="text-sm text-white/60">Proximamente: normas de seguridad, checklists y buenas practicas.</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <Sparkles className="w-8 h-8 text-[#7c3aed] mb-3" />
            <h3 className="font-['Syne'] font-bold text-lg mb-2">Contenido guiado</h3>
            <p className="text-sm text-white/60">Proximamente: ruta por niveles con videos y materiales por tema.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

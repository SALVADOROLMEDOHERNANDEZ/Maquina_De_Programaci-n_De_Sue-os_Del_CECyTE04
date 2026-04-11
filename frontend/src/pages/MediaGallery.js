import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, Video, Image, FileText, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MediaGallery() {
  const navigate = useNavigate();
  const [multimedia, setMultimedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    loadMultimedia();
  }, []);

  const loadMultimedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/multimedia/public?limit=100`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMultimedia(data);
      }
    } catch (error) {
      console.error('Load multimedia error:', error);
      toast.error('Error al cargar contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedia = async (media) => {
    setSelectedMedia(media);
    // Registrar vista
    try {
      await fetch(`${API_URL}/api/multimedia/${media.multimedia_id}/view`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('View register error:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'foto': return <Image className="w-5 h-5" />;
      case 'publicacion': return <FileText className="w-5 h-5" />;
      default: return null;
    }
  };

  const getPreviewUrl = (item) => {
    if (item.thumbnail_url) return `${API_URL}${item.thumbnail_url}`;
    if (item.archivo_url && /\.(jpe?g|png|gif|webp)$/i.test(item.archivo_url)) {
      return `${API_URL}${item.archivo_url}`;
    }
    return null;
  };

  const filteredMultimedia = multimedia.filter(item => {
    const typeMatch = !selectedType || item.tipo === selectedType;
    const categoryMatch = !selectedCategory || item.categoria === selectedCategory;
    return typeMatch && categoryMatch;
  });

  const categories = [...new Set(multimedia.map(m => m.categoria))];
  const types = ['video', 'foto', 'publicacion'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] grid-bg flex items-center justify-center">
        <div className="spinner-cyber" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] grid-bg">
      {/* Header */}
      <nav className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="container-cyber flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <span className="text-lg font-bold font-['Syne']">Galería Multimedia</span>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div className="container-cyber py-6">
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <p className="text-white/70 text-sm mb-2">Tipo</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedType === null ? 'default' : 'outline'}
                  onClick={() => setSelectedType(null)}
                  size="sm"
                  className="rounded-full"
                >
                  Todos
                </Button>
                {types.map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type)}
                    size="sm"
                    className="rounded-full capitalize"
                  >
                    {type === 'foto' ? 'Fotos' : type === 'video' ? 'Videos' : 'Publicaciones'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-white/70 text-sm mb-2">Categoría</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(null)}
                  size="sm"
                  className="rounded-full"
                >
                  Todas
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    size="sm"
                    className="rounded-full capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredMultimedia.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-white/50">No hay contenido disponible con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMultimedia.map((item, idx) => (
              <motion.div
                key={item.multimedia_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleViewMedia(item)}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-[#00f0ff] transition-colors group"
              >
                {/* Vista previa */}
                <div className="aspect-video bg-gradient-to-br from-[#7c3aed]/20 to-[#00f0ff]/20 flex items-center justify-center relative overflow-hidden">
                  {getPreviewUrl(item) ? (
                    <img
                      src={getPreviewUrl(item)}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#7c3aed]">
                      {getTypeIcon(item.tipo)}
                      <p className="text-xs mt-2 capitalize">{item.tipo}</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold line-clamp-2">{item.titulo}</h3>
                    {getTypeIcon(item.tipo)}
                  </div>

                  <p className="text-sm text-white/50 line-clamp-2 mb-3">{item.descripcion}</p>

                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="px-2 py-1 rounded bg-white/10 text-white/70 text-xs">
                      {item.categoria}
                    </span>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-white/40 flex justify-between">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span>{(item.vistas || 0).toLocaleString()} vistas</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ViewMedia */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#020408] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
          >
            <div className="sticky top-0 flex items-center justify-between p-6 bg-[#020408]/95 border-b border-white/10">
              <h2 className="font-bold">{selectedMedia.titulo}</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedMedia(null)}
                className="text-white/70"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="aspect-video bg-gradient-to-br from-[#7c3aed]/20 to-[#00f0ff]/20 rounded-xl flex items-center justify-center overflow-hidden">
                {selectedMedia.tipo === 'video' && selectedMedia.archivo_url ? (
                  <video
                    src={`${API_URL}${selectedMedia.archivo_url}`}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : selectedMedia.archivo_url ? (
                  <img
                    src={`${API_URL}${selectedMedia.archivo_url}`}
                    alt={selectedMedia.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    {getTypeIcon(selectedMedia.tipo)}
                    <p className="text-white/50 mt-2">Contenido no disponible</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-white/70 text-sm mb-2">Descripción</p>
                <p className="text-white/90">{selectedMedia.descripcion || 'Sin descripción'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-white/50 text-xs mb-1">Categoría</p>
                  <p className="font-medium capitalize">{selectedMedia.categoria}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Fecha</p>
                  <p className="font-medium">{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Vistas</p>
                  <p className="font-medium">{(selectedMedia.vistas || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                <div>
                  <p className="text-white/70 text-sm mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedMedia.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

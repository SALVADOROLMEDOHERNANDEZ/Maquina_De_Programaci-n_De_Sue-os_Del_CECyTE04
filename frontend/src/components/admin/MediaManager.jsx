import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  FileUp,
  Loader2,
  AlertCircle,
  Video,
  Image,
  FileText,
  Calendar,
  Eye as EyeIcon
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MediaManager({ onDataChange }) {
  const [multimedia, setMultimedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Formulario
  const tipo = 'publicacion';
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [tags, setTags] = useState('');

  const loadMultimedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/multimedia?tipo=publicacion`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMultimedia(data);
      }
    } catch (error) {
      console.error('Load publications error:', error);
      toast.error('Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMultimedia();
  }, [loadMultimedia]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar extensión
      const validExtensions = {
        video: ['.mp4', '.webm', '.avi', '.mov', '.mkv'],
        foto: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        publicacion: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt']
      };

      const fileName = file.name.toLowerCase();
      const ext = fileName.substring(fileName.lastIndexOf('.'));
      
      if (!validExtensions[tipo].includes(ext)) {
        toast.error(`Formato no válido. Use: ${validExtensions[tipo].join(', ')}`);
        e.target.value = '';
        return;
      }

      // Validar tamaño (máx 500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 500MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      if (!titulo) {
        setTitulo(file.name.replace(/\.[^/.]+$/, ''));
      }
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !titulo) {
      toast.error('Selecciona archivo y proporciona un título');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tipo', tipo);
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('categoria', categoria);
      formData.append('tags', tags);

      const response = await fetch(`${API_URL}/api/admin/multimedia`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        toast.success('Contenido subido exitosamente');
        setSelectedFile(null);
        setTitulo('');
        setDescripcion('');
        setTags('');
        await loadMultimedia();
        onDataChange?.();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al subir contenido');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (multimedia_id) => {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/multimedia/${multimedia_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Contenido eliminado');
        await loadMultimedia();
        onDataChange?.();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleToggleVisibility = async (multimedia_id, current_visible) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/multimedia/${multimedia_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ visible: !current_visible })
      });

      if (response.ok) {
        toast.success(current_visible ? 'Contenido oculto' : 'Contenido visible');
        await loadMultimedia();
      }
    } catch (error) {
      toast.error('Error al cambiar visibilidad');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

const getTypeIcon = () => {
    return <FileText className="w-5 h-5 text-purple-400" />;
  };

  if (loading && multimedia.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner-cyber" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <h2 className="text-xl font-['Syne'] font-bold mb-4 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-[#00f0ff]" />
          Subir Publicación
        </h2>

        <div className="grid md:grid-cols-1 gap-4 mb-4">
          <div>
            <Label className="text-white/70">Categoría</Label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="input-cyber w-full rounded-xl"
            >
              <option value="general">General</option>
              <option value="evento">Evento</option>
              <option value="logro">Logro</option>
              <option value="noticia">Noticia</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white/70">Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del contenido"
              className="input-cyber"
            />
          </div>

          <div>
            <Label className="text-white/70">Tags (separados por comas)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="input-cyber"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-white/70">Descripción</Label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el contenido..."
            className="input-cyber w-full rounded-xl p-3 h-24"
          />
        </div>

        <div className="mb-4">
          <Label className="text-white/70">Archivo</Label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/5 transition-all">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
            />
            <div className="flex flex-col items-center justify-center py-4">
              {selectedFile ? (
                <>
                  {getTypeIcon(tipo)}
                  <p className="text-[#00f0ff] font-medium">{selectedFile.name}</p>
                  <p className="text-white/40 text-sm">{formatFileSize(selectedFile.size)}</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-white/40 mb-2" />
                  <p className="text-white/60">Haz clic para seleccionar</p>
                  <p className="text-white/40 text-sm">o arrastra y suelta aquí</p>
                </>
              )}
            </div>
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !titulo}
          className="w-full btn-primary rounded-xl"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Subir Publicación
        </Button>
      </motion.div>

      {/* Publicaciones List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <h2 className="text-xl font-['Syne'] font-bold mb-4">
          Publicaciones ({multimedia.length})
        </h2>

        {multimedia.length === 0 ? (
          <p className="text-white/50 text-center py-8">
            No hay publicaciones. Sube tu primera publicación.
          </p>
        ) : (
          <div className="space-y-3">
            {multimedia.map((item) => (
              <motion.div
                key={item.multimedia_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-xl border transition-all ${
                  item.visible
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/2 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(item.tipo)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.titulo}</h3>
                      <p className="text-sm text-white/50 mb-2">{item.descripcion}</p>
                      <div className="flex gap-2 flex-wrap items-center text-xs">
                        <span className="px-2 py-1 rounded bg-white/10 text-white/70">
                          {item.tipo}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/10 text-white/70">
                          {item.categoria}
                        </span>
                        <span className="flex items-center gap-1 text-white/50">
                          <EyeIcon className="w-3 h-3" />
                          {item.vistas || 0} vistas
                        </span>
                        <span className="text-white/40 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(item.multimedia_id, item.visible)}
                      className="text-white/70 hover:text-white"
                    >
                      {item.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.multimedia_id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

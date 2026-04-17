import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import {
  Heart,
  MessageCircle,
  Share2,
  Instagram,
  Facebook,
  Youtube,
  Plus,
  Eye,
  ThumbsUp,
  Send,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Publicaciones = () => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublicacion, setSelectedPublicacion] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const loadPublicaciones = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/multimedia/public?tipo=publicacion`);
      if (response.ok) {
        const data = await response.json();
        setPublicaciones(data);
        
        // Load likes for each publication
        const likesPromises = data.map(pub => loadLikes(pub.multimedia_id));
        await Promise.all(likesPromises);
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las publicaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPublicaciones();
    checkAdminStatus();
  }, [loadPublicaciones]);

  const loadLikes = async (multimediaId) => {
    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/likes`);
      if (response.ok) {
        const likesData = await response.json();
        setLikes(prev => ({ ...prev, [multimediaId]: likesData }));
        
        // Check if current user liked
        const token = localStorage.getItem('session_token');
        if (token) {
          const userResponse = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userResponse.ok) {
            const user = await userResponse.json();
            const userLiked = likesData.some(like => like.user_id === user.user_id);
            setUserLikes(prev => ({ ...prev, [multimediaId]: userLiked }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const checkAdminStatus = async () => {
    const token = localStorage.getItem('session_token') || localStorage.getItem('admin_token');
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const user = await response.json();
          setIsAdmin(user.is_admin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  };

  const handleLike = async (multimediaId) => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      toast({
        title: "Requiere autenticación",
        description: "Debes iniciar sesión para dar like",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setUserLikes(prev => ({ ...prev, [multimediaId]: result.action === 'liked' }));
        
        // Update likes count
        setPublicaciones(prev => prev.map(pub => 
          pub.multimedia_id === multimediaId 
            ? { ...pub, likes_count: result.likes_count }
            : pub
        ));
        
        // Reload likes
        await loadLikes(multimediaId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el like",
        variant: "destructive"
      });
    }
  };

  const loadComments = async (multimediaId) => {
    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleComment = async (multimediaId) => {
    if (!newComment.trim()) return;

    const token = localStorage.getItem('session_token');
    if (!token) {
      toast({
        title: "Requiere autenticación",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment_text: newComment })
      });

      if (response.ok) {
        setNewComment('');
        await loadComments(multimediaId);
        
        // Update comments count
        setPublicaciones(prev => prev.map(pub => 
          pub.multimedia_id === multimediaId 
            ? { ...pub, comments_count: pub.comments_count + 1 }
            : pub
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive"
      });
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-800"
          >
            Publicaciones
          </motion.h1>
          
          {isAdmin && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Publicación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Subir Nueva Publicación</DialogTitle>
                </DialogHeader>
                <UploadForm onSuccess={() => {
                  setShowUploadDialog(false);
                  loadPublicaciones();
                }} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {publicaciones.map((publicacion) => (
              <motion.div
                key={publicacion.multimedia_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(publicacion.platform)}
                        <Badge variant="secondary">{publicacion.platform || 'general'}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(publicacion.created_at)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{publicacion.titulo}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    {publicacion.descripcion && (
                      <p className="text-gray-600 mb-4">{publicacion.descripcion}</p>
                    )}
                    
                    {publicacion.archivo_url && (
                      <div className="mb-4">
                        {publicacion.archivo_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={`${API_URL}${publicacion.archivo_url}`}
                            alt={publicacion.titulo}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : publicacion.url ? (
                          <a 
                            href={publicacion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver contenido externo
                          </a>
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(publicacion.multimedia_id)}
                          className={userLikes[publicacion.multimedia_id] ? "text-red-500" : ""}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${userLikes[publicacion.multimedia_id] ? "fill-current" : ""}`} />
                          {publicacion.likes_count || 0}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPublicacion(publicacion);
                            loadComments(publicacion.multimedia_id);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {publicacion.comments_count || 0}
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {publicaciones.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay publicaciones</h3>
            <p className="text-gray-500">Las publicaciones aparecerán aquí cuando sean creadas.</p>
          </div>
        )}

        {/* Comments Modal */}
        <Dialog open={!!selectedPublicacion} onOpenChange={() => setSelectedPublicacion(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPublicacion?.titulo}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.name}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment_text}</p>
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleComment(selectedPublicacion?.multimedia_id)}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const UploadForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    platform: '',
    url: '',
    categoria: 'general'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const data = new FormData();
      
      data.append('tipo', 'publicacion');
      data.append('titulo', formData.titulo);
      if (formData.descripcion) data.append('descripcion', formData.descripcion);
      data.append('categoria', formData.categoria);
      if (formData.platform) data.append('platform', formData.platform);
      if (formData.url) data.append('url', formData.url);
      if (file) data.append('file', file);

      const response = await fetch(`${API_URL}/api/admin/multimedia`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Publicación creada correctamente"
        });
        onSuccess();
      } else {
        throw new Error('Error al subir publicación');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="platform">Plataforma</Label>
        <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="url">URL (opcional)</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      
      <div>
        <Label htmlFor="file">Archivo (opcional)</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,.pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      
      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {uploading ? 'Subiendo...' : 'Crear Publicación'}
      </Button>
    </form>
  );
};

export default Publicaciones;
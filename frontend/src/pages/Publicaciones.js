import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Instagram,
  Facebook,
  Youtube,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPlatformMeta(platform) {
  switch (platform) {
    case 'instagram':
      return {
        icon: <Instagram className="w-4 h-4 text-pink-300" />,
        label: 'Instagram',
        accent: 'from-pink-500/30 via-fuchsia-500/20 to-orange-400/20'
      };
    case 'facebook':
      return {
        icon: <Facebook className="w-4 h-4 text-blue-300" />,
        label: 'Facebook',
        accent: 'from-blue-500/30 via-cyan-500/20 to-slate-400/10'
      };
    case 'youtube':
      return {
        icon: <Youtube className="w-4 h-4 text-red-300" />,
        label: 'YouTube',
        accent: 'from-red-500/30 via-rose-500/20 to-orange-300/10'
      };
    default:
      return {
        icon: null,
        label: 'General',
        accent: 'from-emerald-400/20 via-cyan-400/10 to-transparent'
      };
  }
}

function PublicationMedia({ publicacion }) {
  if (!publicacion.archivo_url) {
    if (!publicacion.url) return null;
    return (
      <a
        href={publicacion.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-slate-950/70 px-4 py-3 text-sm text-cyan-100 transition-colors hover:border-cyan-300/40 hover:bg-slate-900/80"
      >
        <span className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-cyan-300" />
          Abrir contenido externo
        </span>
        <span className="text-cyan-300/70">Ver</span>
      </a>
    );
  }

  if (publicacion.archivo_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
        <img
          src={`${API_URL}${publicacion.archivo_url}`}
          alt={publicacion.titulo}
          className="h-80 w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-4 text-slate-200">
      <ImageIcon className="w-5 h-5 text-cyan-300" />
      <span>Archivo adjunto disponible en la publicación</span>
    </div>
  );
}

export default function Publicaciones() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();

  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublicacion, setSelectedPublicacion] = useState(null);
  const [commentsByPublication, setCommentsByPublication] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likesByPublication, setLikesByPublication] = useState({});

  const selectedComments = useMemo(
    () => commentsByPublication[selectedPublicacion?.multimedia_id] || [],
    [commentsByPublication, selectedPublicacion]
  );

  const loadComments = useCallback(async (multimediaId) => {
    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/comments`);
      if (!response.ok) return;
      const commentsData = await response.json();
      setCommentsByPublication((prev) => ({ ...prev, [multimediaId]: commentsData }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, []);

  const loadLikes = useCallback(async (multimediaId) => {
    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/likes`);
      if (!response.ok) return;
      const likesData = await response.json();
      setLikesByPublication((prev) => ({ ...prev, [multimediaId]: likesData }));
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  }, []);

  const loadPublicaciones = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/multimedia/public?tipo=publicacion`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las publicaciones');
      }
      const data = await response.json();
      setPublicaciones(data);
      await Promise.all(data.map((pub) => loadLikes(pub.multimedia_id)));
    } catch (error) {
      console.error('Error loading publications:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar las publicaciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [loadLikes, toast]);

  useEffect(() => {
    loadPublicaciones();
  }, [loadPublicaciones]);

  const ensureAuthenticated = useCallback((actionLabel) => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Inicia sesión',
        description: `Debes iniciar sesión para ${actionLabel}.`,
        variant: 'destructive'
      });
      return false;
    }
    return true;
  }, [isAuthenticated, toast, user]);

  const handleLike = useCallback(async (multimediaId) => {
    if (!ensureAuthenticated('dar like')) return;

    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || 'No se pudo procesar el like');
      }

      setPublicaciones((prev) => prev.map((pub) => (
        pub.multimedia_id === multimediaId
          ? { ...pub, likes_count: data.likes_count }
          : pub
      )));

      await loadLikes(multimediaId);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar el like',
        variant: 'destructive'
      });
    }
  }, [ensureAuthenticated, loadLikes, toast]);

  const openComments = useCallback(async (publicacion) => {
    setSelectedPublicacion(publicacion);
    await loadComments(publicacion.multimedia_id);
  }, [loadComments]);

  const handleComment = useCallback(async () => {
    if (!selectedPublicacion?.multimedia_id || !newComment.trim()) return;
    if (!ensureAuthenticated('comentar')) return;

    const multimediaId = selectedPublicacion.multimedia_id;
    const optimisticComment = {
      comment_id: `temp_${Date.now()}`,
      name: user.name || 'Tú',
      comment_text: newComment.trim(),
      created_at: new Date().toISOString(),
      pending: true
    };

    setCommentSubmitting(true);
    setCommentsByPublication((prev) => ({
      ...prev,
      [multimediaId]: [...(prev[multimediaId] || []), optimisticComment]
    }));
    setPublicaciones((prev) => prev.map((pub) => (
      pub.multimedia_id === multimediaId
        ? { ...pub, comments_count: (pub.comments_count || 0) + 1 }
        : pub
    )));

    const commentText = newComment.trim();
    setNewComment('');

    try {
      const response = await fetch(`${API_URL}/api/publications/${multimediaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment_text: commentText })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || 'No se pudo agregar el comentario');
      }

      await loadComments(multimediaId);
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentsByPublication((prev) => ({
        ...prev,
        [multimediaId]: (prev[multimediaId] || []).filter((comment) => comment.comment_id !== optimisticComment.comment_id)
      }));
      setPublicaciones((prev) => prev.map((pub) => (
        pub.multimedia_id === multimediaId
          ? { ...pub, comments_count: Math.max((pub.comments_count || 1) - 1, 0) }
          : pub
      )));
      setNewComment(commentText);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el comentario',
        variant: 'destructive'
      });
    } finally {
      setCommentSubmitting(false);
    }
  }, [ensureAuthenticated, loadComments, newComment, selectedPublicacion, toast, user]);

  const handleCommentKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleComment();
    }
  }, [handleComment]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="glass-card rounded-3xl px-8 py-10 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-cyan-300" />
          <p className="text-white/70">Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-bg">
      <div className="container-cyber py-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} className="btn-secondary rounded-full">
                <ArrowLeft className="w-4 h-4" />
                Regresar
              </Button>
              <div className="glass rounded-full px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-200/80">
                Feed Social
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="glass-card relative overflow-hidden rounded-[32px] p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.15),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(204,255,0,0.12),transparent_20%)]" />
              <div className="relative">
                <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-200/70">Comunidad</p>
                <h1 className="text-4xl font-['Syne'] font-extrabold text-white md:text-6xl">
                  Publicaciones
                </h1>
                <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
                  Un feed más limpio y dinámico para compartir novedades, fotos y comentarios del plantel con una experiencia visual más cercana a una red social.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-6">
              <div className="mb-4">
                <p className="text-sm text-white/50">Estado de sesión</p>
                <p className="font-semibold text-white">{user?.name || 'Invitado'}</p>
              </div>
              {isAuthenticated ? (
                <p className="text-sm leading-relaxed text-white/70">
                  Ya puedes dar like y comentar publicaciones. Tus interacciones se guardarán con tu sesión actual.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-white/70">
                    Inicia sesión para reaccionar y comentar como en una red social.
                  </p>
                  <Button onClick={login} className="btn-primary w-full">
                    Iniciar sesión
                  </Button>
                </div>
              )}
              {user?.is_admin && (
                <div className="mt-4 rounded-2xl border border-[#ccff00]/20 bg-[#ccff00]/8 p-4 text-sm text-[#f4ffd0]">
                  Las publicaciones se suben únicamente desde el panel de administración.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {publicaciones.length === 0 ? (
          <div className="glass-card rounded-[32px] px-8 py-14 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-white/30" />
            <h3 className="text-2xl font-['Syne'] text-white">No hay publicaciones todavía</h3>
            <p className="mt-3 text-white/60">
              Cuando se suba contenido nuevo aparecerá aquí con su vista social y comentarios.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <AnimatePresence>
                {publicaciones.map((publicacion, index) => {
                  const platformMeta = getPlatformMeta(publicacion.platform);
                  const likedByUser = !!likesByPublication[publicacion.multimedia_id]?.some(
                    (like) => like.user_id === user?.user_id
                  );

                  return (
                    <motion.div
                      key={publicacion.multimedia_id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                    >
                      <Card className="glass-card overflow-hidden rounded-[34px] border-white/10 bg-[#060914]/88 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)]">
                        <CardContent className="p-0">
                          <div className={`relative border-b border-white/8 bg-gradient-to-r ${platformMeta.accent} p-6`}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex items-center gap-4">
                                {platformMeta.icon && (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                    {platformMeta.icon}
                                  </div>
                                )}
                                <div>
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge className="border-0 bg-white/10 text-white/90">{platformMeta.label}</Badge>
                                    <Badge className="border-0 bg-[#ccff00]/15 text-[#ccff00]">CECyTE 04</Badge>
                                  </div>
                                  <p className="text-sm text-white/60">{formatDate(publicacion.created_at)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigator.share?.({ title: publicacion.titulo, text: publicacion.descripcion || publicacion.titulo })}
                                className="rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-5 p-6 md:p-7">
                            <div>
                              <h2 className="text-2xl font-['Syne'] font-bold text-white md:text-3xl">
                                {publicacion.titulo}
                              </h2>
                              {publicacion.descripcion && (
                                <p className="mt-3 text-[15px] leading-7 text-white/72">
                                  {publicacion.descripcion}
                                </p>
                              )}
                            </div>

                            <PublicationMedia publicacion={publicacion} />

                            <div className="flex flex-wrap items-center gap-3 border-t border-white/8 pt-2">
                              <Button
                                variant="ghost"
                                onClick={() => handleLike(publicacion.multimedia_id)}
                                className={`rounded-full px-4 ${likedByUser ? 'bg-red-500/12 text-red-300 hover:bg-red-500/18' : 'bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'}`}
                              >
                                <Heart className={`w-4 h-4 ${likedByUser ? 'fill-current' : ''}`} />
                                {publicacion.likes_count || 0}
                              </Button>

                              <Button
                                variant="ghost"
                                onClick={() => openComments(publicacion)}
                                className="rounded-full bg-white/5 px-4 text-white/75 hover:bg-white/10 hover:text-white"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {publicacion.comments_count || 0}
                              </Button>

                              {publicacion.url && (
                                <a
                                  href={publicacion.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition-colors hover:bg-cyan-500/20"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir enlace
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <aside className="space-y-6">
              <div className="glass-card rounded-[30px] p-6">
                <p className="mb-3 text-sm uppercase tracking-[0.25em] text-cyan-200/70">Resumen</p>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">Publicaciones activas</p>
                    <p className="mt-1 text-3xl font-['Syne'] font-bold text-white">{publicaciones.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">Comentarios totales</p>
                    <p className="mt-1 text-3xl font-['Syne'] font-bold text-white">
                      {publicaciones.reduce((acc, pub) => acc + (pub.comments_count || 0), 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-white/50">Likes totales</p>
                    <p className="mt-1 text-3xl font-['Syne'] font-bold text-white">
                      {publicaciones.reduce((acc, pub) => acc + (pub.likes_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[30px] p-6">
                <p className="mb-3 text-sm uppercase tracking-[0.25em] text-cyan-200/70">Interacción</p>
                <p className="text-sm leading-7 text-white/68">
                  Da like para reaccionar rápido y abre los comentarios para conversar como en un feed social. Los comentarios se envían con `Enter` y puedes usar `Shift + Enter` para salto de línea.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedPublicacion}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPublicacion(null);
            setNewComment('');
          }
        }}
      >
        <DialogContent className="glass max-h-[88vh] max-w-4xl overflow-hidden border border-white/10 bg-[#040710]/96 p-0 text-white">
          {selectedPublicacion && (
            <div className="grid max-h-[88vh] md:grid-cols-[1.05fr_0.95fr]">
              <div className="hidden border-r border-white/8 bg-black/30 p-4 md:block">
                <PublicationMedia publicacion={selectedPublicacion} />
              </div>

              <div className="flex min-h-[70vh] flex-col">
                <DialogHeader className="border-b border-white/8 px-6 py-5 text-left">
                  <DialogTitle className="text-2xl font-['Syne'] text-white">
                    {selectedPublicacion.titulo}
                  </DialogTitle>
                  <p className="text-sm text-white/55">{formatDate(selectedPublicacion.created_at)}</p>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {selectedPublicacion.descripcion && (
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm leading-7 text-white/72">
                      {selectedPublicacion.descripcion}
                    </div>
                  )}

                  {selectedComments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/12 bg-white/5 p-5 text-center text-white/50">
                      Todavía no hay comentarios. Sé la primera persona en escribir uno.
                    </div>
                  ) : (
                    selectedComments.map((comment) => (
                      <div
                        key={comment.comment_id}
                        className="rounded-2xl border border-white/8 bg-white/5 p-4"
                      >
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/12 text-sm font-bold text-cyan-200">
                            {getInitials(comment.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{comment.name}</p>
                            <p className="text-xs text-white/45">{formatDate(comment.created_at)}</p>
                          </div>
                          {comment.pending && (
                            <span className="ml-auto text-xs text-[#ccff00]">Enviando...</span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                          {comment.comment_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/8 px-6 py-5">
                  {!isAuthenticated && (
                    <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      Necesitas iniciar sesión para comentar.
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <Textarea
                      placeholder={isAuthenticated ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      disabled={!isAuthenticated || commentSubmitting}
                      className="input-cyber min-h-[92px] flex-1 resize-none rounded-2xl border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30"
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!isAuthenticated || !newComment.trim() || commentSubmitting}
                      className="btn-primary h-[92px] rounded-2xl px-6"
                    >
                      {commentSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

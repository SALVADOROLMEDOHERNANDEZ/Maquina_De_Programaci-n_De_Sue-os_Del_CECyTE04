import React, { useState, useEffect, useCallback} from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Shield, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  LogOut,
  Box,
  Move,
  Settings,
  Eye,
  FileUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginMode] = useState(true);
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Models
  const [models, setModels] = useState([]);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [modelName, setModelName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Tarjetas
  const [tarjetaPositions, setTarjetaPositions] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [activeTab, setActiveTab] = useState('models');

  const loadData = useCallback(async () => {
    try {
      const modelsRes = await fetch(`${API_URL}/api/admin/models`, { credentials: 'include' });
      if (modelsRes.ok) setModels(await modelsRes.json());

      const espRes = await fetch(`${API_URL}/api/especialidades`);
      if (espRes.ok) setEspecialidades(await espRes.json());

      const posRes = await fetch(`${API_URL}/api/tarjetas/positions`);
      if (posRes.ok) setTarjetaPositions(await posRes.json());
    } catch (error) {
      console.error('Load data error:', error);
    }
  }, []);


    // ✅ checkAdminStatus con useCallback
  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/check`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAdmin(data.is_admin);

      if (data.is_admin) {
        await loadData();
      }
    } catch (error) {
      console.error('Admin check error:', error);
    } finally {
      setLoading(false);
    }
  }, [loadData]);
  // ✅ useEffect con dependencia correcta
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        setIsAdmin(true);
        toast.success('Sesión de administrador iniciada');
        await loadData();
      } else {
        toast.error('Credenciales inválidas');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setIsAdmin(false);
    navigate('/');
  };

  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.gltf', '.glb', '.fbx', '.obj'];
      const fileName = file.name.toLowerCase();
      const ext = fileName.substring(fileName.lastIndexOf('.'));
      
      if (!validExtensions.includes(ext)) {
        toast.error('Formato no válido. Use: GLTF, GLB, FBX u OBJ');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 100MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      if (!modelName) {
        setModelName(file.name.replace(/\.[^/.]+$/, ''));
      }
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleUploadModel = async () => {
    if (!selectedFile || !modelName) {
      toast.error('Selecciona un archivo y proporciona un nombre');
      return;
    }
    
    setUploadingModel(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('nombre', modelName);
      
      const response = await fetch(`${API_URL}/api/admin/models/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        toast.success('Modelo subido correctamente');
        setSelectedFile(null);
        setModelName('');
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Error al subir modelo');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setUploadingModel(false);
    }
  };

  const handleActivateModel = async (modelId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/models/${modelId}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Modelo activado');
        await loadData();
      }
    } catch (error) {
      toast.error('Error al activar modelo');
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!confirm('¿Estás seguro de eliminar este modelo?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/models/${modelId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Modelo eliminado');
        await loadData();
      }
    } catch (error) {
      toast.error('Error al eliminar modelo');
    }
  };

  const handlePositionChange = (tarjetaId, field, subfield, value) => {
    setTarjetaPositions(prev => prev.map(pos => {
      if (pos.tarjeta_id === tarjetaId) {
        return {
          ...pos,
          [field]: {
            ...pos[field],
            [subfield]: parseFloat(value) || 0
          }
        };
      }
      return pos;
    }));
  };

  const handleSavePositions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tarjetas/positions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ positions: tarjetaPositions })
      });
      
      if (response.ok) {
        toast.success('Posiciones guardadas');
      }
    } catch (error) {
      toast.error('Error al guardar posiciones');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="spinner-cyber" />
      </div>
    );
  }

  // Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020408] grid-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#7c3aed]" />
            </div>
            <div>
              <h1 className="text-2xl font-['Syne'] font-bold">Panel Admin</h1>
              <p className="text-white/50 text-sm">CECyTE 04</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-white/70">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input-cyber"
                data-testid="admin-username"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white/70">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-cyber"
                data-testid="admin-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full btn-primary rounded-xl py-6"
              data-testid="admin-login-btn"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white/50 hover:text-white"
            >
              Volver al inicio
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#020408] grid-bg">
      {/* Header */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container-cyber flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold font-['Syne']">Admin Panel</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/tour')}
              className="text-white/70 hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" /> Vista Previa
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white/70 hover:text-white"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="container-cyber py-6">
        <div className="flex gap-2 mb-8">
          <Button
            onClick={() => setActiveTab('models')}
            className={`rounded-xl ${activeTab === 'models' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Box className="w-4 h-4 mr-2" /> Modelos 3D
          </Button>
          <Button
            onClick={() => setActiveTab('tarjetas')}
            className={`rounded-xl ${activeTab === 'tarjetas' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Move className="w-4 h-4 mr-2" /> Posición Tarjetas
          </Button>
        </div>

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="text-xl font-['Syne'] font-bold mb-4 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[#00f0ff]" />
                Subir Modelo 3D del Plantel
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Nombre del modelo</Label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Ej: Plantel CECyTE 04 Completo"
                    className="input-cyber"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Archivo 3D (GLTF, GLB, FBX, OBJ)</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/5 transition-all">
                      <input
                        type="file"
                        accept=".gltf,.glb,.fbx,.obj"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="model-file-input"
                      />
                      <div className="flex flex-col items-center justify-center py-4">
                        {selectedFile ? (
                          <>
                            <Box className="w-10 h-10 text-[#00f0ff] mb-2" />
                            <p className="text-[#00f0ff] font-medium">{selectedFile.name}</p>
                            <p className="text-white/40 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-white/40 mb-2" />
                            <p className="text-white/60">Haz clic para seleccionar archivo</p>
                            <p className="text-white/40 text-sm">o arrastra y suelta aquí</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/5 rounded-xl text-sm text-white/50">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Formatos soportados: GLTF, GLB, FBX, OBJ
              </div>
              
              <Button
                onClick={handleUploadModel}
                disabled={uploadingModel || !selectedFile || !modelName}
                className="mt-4 btn-primary rounded-xl"
              >
                {uploadingModel ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Subir Modelo
              </Button>
            </motion.div>

            {/* Models List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="text-xl font-['Syne'] font-bold mb-4">Modelos Cargados</h2>
              
              {models.length === 0 ? (
                <p className="text-white/50 text-center py-8">
                  No hay modelos cargados. Sube un modelo 3D del plantel para comenzar.
                </p>
              ) : (
                <div className="space-y-3">
                  {models.map((model) => (
                    <div
                      key={model.model_id}
                      className={`p-4 rounded-xl border transition-all ${
                        model.is_active 
                          ? 'bg-[#00f0ff]/10 border-[#00f0ff]' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Box className={`w-8 h-8 ${model.is_active ? 'text-[#00f0ff]' : 'text-white/50'}`} />
                          <div>
                            <h3 className="font-bold">{model.nombre}</h3>
                            <p className="text-sm text-white/50">
                              {model.format.toUpperCase()} • {formatFileSize(model.file_size)}
                            </p>
                          </div>
                          {model.is_active && (
                            <span className="px-2 py-1 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] text-xs">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!model.is_active && (
                            <Button
                              size="sm"
                              onClick={() => handleActivateModel(model.model_id)}
                              className="btn-secondary rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteModel(model.model_id)}
                            className="rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Tarjetas Tab */}
        {activeTab === 'tarjetas' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-['Syne'] font-bold flex items-center gap-2">
                <Move className="w-5 h-5 text-[#ccff00]" />
                Posición de Tarjetas en el Espacio 3D
              </h2>
              <Button onClick={handleSavePositions} className="btn-primary rounded-xl">
                Guardar Cambios
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/50 font-medium">Especialidad</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Posición X</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Posición Y</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Posición Z</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Escala</th>
                  </tr>
                </thead>
                <tbody>
                  {especialidades.map((esp) => {
                    const pos = tarjetaPositions.find(p => p.especialidad_id === esp.especialidad_id) || {
                      tarjeta_id: `tarjeta_${esp.especialidad_id}`,
                      position: esp.posicion_3d || { x: 0, y: 0, z: 0 },
                      scale: 1.0
                    };
                    
                    return (
                      <tr key={esp.especialidad_id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: esp.color }}
                            />
                            <span className="font-medium">{esp.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={pos.position?.x || 0}
                            onChange={(e) => handlePositionChange(pos.tarjeta_id, 'position', 'x', e.target.value)}
                            className="input-cyber w-24 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={pos.position?.y || 0}
                            onChange={(e) => handlePositionChange(pos.tarjeta_id, 'position', 'y', e.target.value)}
                            className="input-cyber w-24 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={pos.position?.z || 0}
                            onChange={(e) => handlePositionChange(pos.tarjeta_id, 'position', 'z', e.target.value)}
                            className="input-cyber w-24 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="0.1"
                            value={pos.scale || 1.0}
                            onChange={(e) => setTarjetaPositions(prev => prev.map(p => 
                              p.tarjeta_id === pos.tarjeta_id ? { ...p, scale: parseFloat(e.target.value) || 1 } : p
                            ))}
                            className="input-cyber w-24 text-center mx-auto"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-xl text-sm text-white/50">
              <p><strong>Tip:</strong> Las coordenadas X, Y, Z determinan la posición de cada tarjeta en el espacio 3D del modelo importado.</p>
              <p className="mt-1">• X: Izquierda (-) / Derecha (+)</p>
              <p>• Y: Abajo (-) / Arriba (+)</p>
              <p>• Z: Atrás (-) / Adelante (+)</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

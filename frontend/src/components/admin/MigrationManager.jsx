import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Code2, Database, Copy, Play } from 'lucide-react';
import { Button } from '../ui/button';

const MigrationManager = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('execute');
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [validated, setValidated] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    version: '',
    description: '',
    sql_commands: '',
    migration_type: 'custom'
  });

  // Estados de resultado
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Cargar templates al montar
  useEffect(() => {
    loadTemplates();
    loadMigrationHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/admin/migrations/templates');
      const data = await response.json();
      setTemplates(data.templates || {});
    } catch (err) {
      console.error('Error cargando templates:', err);
    }
  };

  const loadMigrationHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/admin/migrations/history?limit=10');
      const data = await response.json();
      setMigrations(data.migrations || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async (e) => {
    e.preventDefault();
    
    if (!formData.version || !formData.description || !formData.sql_commands) {
      setResult({
        success: false,
        message: 'Por favor completa todos los campos'
      });
      setShowResult(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/admin/migrations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();
      
      setResult(data);
      setShowResult(true);

      if (data.success) {
        // Limpiar formulario y recargar historial
        setFormData({
          version: '',
          description: '',
          sql_commands: '',
          migration_type: 'custom'
        });
        setTimeout(() => loadMigrationHistory(), 1000);
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Error: ${err.message}`
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const validateSchema = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/admin/migrations/validate', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      setValidated(data.validation);
    } catch (err) {
      console.error('Error validando schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateName) => {
    const template = templates[templateName];
    if (template) {
      setFormData({
        version: template.version || '',
        description: template.description || '',
        sql_commands: template.sql || '',
        migration_type: 'custom'
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('SQL copiado al portapapeles');
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Sistema de Migraciones</h1>
          <p className="text-slate-400">Ejecuta cambios en la BD sin perder datos</p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b border-slate-700 mb-6">
        {[
          { id: 'execute', label: '▶ Ejecutar Migración', icon: Play },
          { id: 'history', label: '📋 Historial', icon: Clock },
          { id: 'templates', label: '📝 Templates', icon: Code2 },
          { id: 'validate', label: '✓ Validar Schema', icon: RefreshCw }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      <AnimatePresence mode="wait">
        {/* TAB: Ejecutar Migración */}
        {activeTab === 'execute' && (
          <motion.div
            key="execute"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">⚠️ Importante</p>
                <p className="text-amber-100/80 text-sm">Haz backup de tu BD antes de ejecutar migraciones. Los cambios se registran automáticamente y pueden ser revertidos si es necesario.</p>
              </div>
            </div>

            <form onSubmit={executeMigration} className="space-y-4">
              {/* Versión */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Versión de Migración
                </label>
                <input
                  type="text"
                  placeholder="ej: 001, 002, 003"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Número único para identificar la migración</p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Describe qué cambios hace esta migración"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Comandos SQL */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Comandos SQL
                </label>
                <textarea
                  value={formData.sql_commands}
                  onChange={(e) => setFormData({ ...formData, sql_commands: e.target.value })}
                  placeholder={`ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);\nALTER TABLE users ADD COLUMN address TEXT;`}
                  rows={8}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Separa múltiples comandos con punto y coma (;)</p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-between">
                <Button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  variant="outline"
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  📝 Ver Templates
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {loading ? 'Ejecutando...' : '▶ Ejecutar Migración'}
                </Button>
              </div>
            </form>

            {/* Resultado de ejecución */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 ${
                  result?.success
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {result?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={result?.success ? 'text-green-200 font-semibold' : 'text-red-200 font-semibold'}>
                      {result?.message}
                    </p>
                    {result?.error && (
                      <p className="text-xs text-red-100/80 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TAB: Historial */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Historial de Migraciones</h2>
              <Button
                onClick={loadMigrationHistory}
                disabled={loading}
                variant="outline"
                className="text-slate-300 border-slate-600"
              >
                🔄 Recargar
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-slate-400 mt-3">Cargando historial...</p>
              </div>
            ) : migrations.length > 0 ? (
              <div className="space-y-2">
                {migrations.map((m, idx) => (
                  <motion.div
                    key={m.version}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex items-start gap-4"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.status === 'success' ? 'bg-green-900/50' : 'bg-red-900/50'
                    }`}>
                      {m.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="font-mono font-bold text-white text-lg">{m.version}</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          m.status === 'success' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{m.description}</p>
                      {m.executed_at && (
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(m.executed_at).toLocaleString('es-ES')}
                        </p>
                      )}
                      {m.error_message && (
                        <p className="text-red-300 text-xs mt-2 bg-red-900/20 p-2 rounded">
                          {m.error_message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-700/30 border border-dashed border-slate-600 rounded-lg p-8 text-center">
                <p className="text-slate-400">No hay migraciones ejecutadas aún</p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: Templates */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(templates).map(([key, template]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-3 hover:border-blue-500/50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-blue-400 text-sm font-semibold">{key}</p>
                    <p className="text-slate-300 text-sm mt-1">{template.description}</p>
                  </div>
                  <div className="bg-slate-900 rounded p-2 overflow-x-auto">
                    <code className="text-xs text-slate-300 font-mono break-words">
                      {template.sql.substring(0, 100)}...
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(template.sql)}
                      variant="outline"
                      className="flex-1 text-xs text-slate-300 border-slate-600"
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copiar
                    </Button>
                    <Button
                      onClick={() => loadTemplate(key)}
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      📥 Usar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB: Validar Schema */}
        {activeTab === 'validate' && (
          <motion.div
            key="validate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Button
              onClick={validateSchema}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              {loading ? 'Validando...' : '✓ Validar Base de Datos'}
            </Button>

            {validated && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${
                  validated.errors?.length === 0
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}>
                  <p className={validated.errors?.length === 0 ? 'text-green-200 font-semibold' : 'text-red-200 font-semibold'}>
                    {validated.errors?.length === 0 ? '✓ Base de datos válida' : '✗ Se encontraron errores'}
                  </p>
                </div>

                {validated.tables && Object.keys(validated.tables).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-white">📊 Tablas ({Object.keys(validated.tables).length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(validated.tables).map(([tableName, tableInfo]) => (
                        <div key={tableName} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                          <p className="font-mono text-blue-400 font-semibold">{tableName}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {tableInfo.column_count} columnas
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MigrationManager;

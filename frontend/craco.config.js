// craco.config.js
const path = require("path");
require("dotenv").config();

const isDevServer = process.env.NODE_ENV !== "production";

const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Ignorar directorios innecesarios
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };

      // Añadir plugin de health check si está habilitado
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      // Ignorar warnings molestos
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /onBeforeSetupMiddleware/,
        /onAfterSetupMiddleware/,
        /Failed to parse source map/
      ];

      return webpackConfig;
    },
  },
};

// Configuración del servidor de desarrollo
webpackConfig.devServer = (devServerConfig) => {
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }
      setupHealthEndpoints(devServer, healthPluginInstance);
      return middlewares;
    };
  }

  // Forzar HMR y LiveReload
  devServerConfig.hot = false;
  devServerConfig.liveReload = true;
  devServerConfig.client = {
    overlay: true,
  };

  return devServerConfig;
};

// Visual Edits (puede desactivar HMR, prueba comentarlo si sigue fallando)
//if (isDevServer) {
//  try {
//    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
//    webpackConfig = withVisualEdits(webpackConfig);
//  } catch (err) {
//    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
//      console.warn("[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled.");
//    } else {
//      throw err;
//    }
//  }
//}

module.exports = webpackConfig;

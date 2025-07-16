const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARES =====
app.use(helmet()); // Seguridad
app.use(morgan('combined')); // Logs
app.use(compression()); // Compresión gzip

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos (para exports)
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// ===== RUTAS =====
app.use('/api/reports', reportsRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de Reportería funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Reportería - Banco de Alimentos',
    version: '1.0.0',
    endpoints: {
      reports: {
        inventory: 'GET /api/reports/inventory',
        movements: 'GET /api/reports/movements',
        donations: 'GET /api/reports/donations',
        history: 'GET /api/reports/history'
      }
    }
  });
});

// ===== MANEJO DE ERRORES =====
// 404 - Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== INICIO DEL SERVIDOR =====
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await testConnection();
    
    // Crear directorio de exports si no existe
    const fs = require('fs').promises;
    await fs.mkdir(path.join(__dirname, '../exports'), { recursive: true });
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de reportería ejecutándose en puerto ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`💾 Base de datos: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

startServer();

module.exports = app;

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  // En desarrollo, saltar autenticación temporalmente
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 'b70edc93-a71d-4a95-a78e-b98feaf76e81', rol: 'admin' };
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    req.user = user;
    next();
  });
};

// Middleware para verificar roles específicos
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para validar UUID
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const uuid = req.params[paramName] || req.query[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuid && !uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        message: `${paramName} debe ser un UUID válido`
      });
    }
    
    next();
  };
};

// Middleware para validar fechas
const validateDate = (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  if (fecha_inicio && isNaN(Date.parse(fecha_inicio))) {
    return res.status(400).json({
      success: false,
      message: 'fecha_inicio debe ser una fecha válida (YYYY-MM-DD)'
    });
  }
  
  if (fecha_fin && isNaN(Date.parse(fecha_fin))) {
    return res.status(400).json({
      success: false,
      message: 'fecha_fin debe ser una fecha válida (YYYY-MM-DD)'
    });
  }
  
  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({
      success: false,
      message: 'fecha_inicio no puede ser mayor que fecha_fin'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  validateUUID,
  validateDate
};

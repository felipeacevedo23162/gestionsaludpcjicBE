const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Middleware to validate JWT token and session
const validateSession = async (req, res, next) => {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Note: Session validation removed for SPA compatibility
    // SPAs like Angular typically use stateless JWT authentication

    // Verify user still exists and is active
    const user = await query(
      'SELECT id, documento, nombres, apellidos, rol_id, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (user.length === 0 || !user[0].activo) {
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    // Add user info to request
    req.user = {
      id: user[0].id,
      documento: user[0].documento,
      nombres: user[0].nombres,
      apellidos: user[0].apellidos,
      rol_id: user[0].rol_id
    };

    next();
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Middleware to check specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.rol_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      const userRole = req.user.rol_id;

      // Admin role (assuming role_id 1 is admin)
      if (userRole === 1) {
        return next();
      }

      // Check if user owns the resource
      if (resourceId === userId) {
        return next();
      }

      // For patient records, check if user is the patient
      if (req.route.path.includes('/patients/')) {
        const patient = await query(
          'SELECT id FROM pacientes WHERE id = ? AND actualizado_por = ?',
          [resourceId, userId]
        );
        
        if (patient.length > 0) {
          return next();
        }
      }

      res.status(403).json({ 
        success: false, 
        message: 'Access denied - insufficient permissions' 
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  };
};

module.exports = {
  verifyToken,
  generateToken,
  generateRefreshToken,
  validateSession,
  requireRole,
  requireOwnershipOrAdmin
};
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');
const { generateToken, generateRefreshToken, verifyToken } = require('../middleware/auth');
const { loginValidation } = require('../middleware/validation');
const { handleValidationErrors, asyncHandler } = require('../middleware/error');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for failed login attempts (in production, use Redis)
const failedAttempts = new Map();
const LOCKOUT_TIME = parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

// Helper function to check if account is locked
const isAccountLocked = (identifier) => {
  const attempts = failedAttempts.get(identifier);
  if (!attempts) return false;
  
  return attempts.count >= MAX_ATTEMPTS && 
         (Date.now() - attempts.lastAttempt) < LOCKOUT_TIME;
};

// Helper function to record failed attempt
const recordFailedAttempt = (identifier) => {
  const attempts = failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(identifier, attempts);
};

// Helper function to clear failed attempts
const clearFailedAttempts = (identifier) => {
  failedAttempts.delete(identifier);
};

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', 
  authLimiter,
  loginValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { documento, contrasena } = req.body;
    const clientIP = req.ip;
    const identifier = `${documento}-${clientIP}`;

    // Check if account is locked
    if (isAccountLocked(identifier)) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts. Please try again later.'
      });
    }

    // Find user
    const users = await query(`
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.contrasena, u.rol_id, u.activo,
             r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.documento = ?
    `, [documento]);

    if (users.length === 0) {
      recordFailedAttempt(identifier);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);
    if (!isPasswordValid) {
      recordFailedAttempt(identifier);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(identifier);

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.rol_id;

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      documento: user.documento,
      rol_id: user.rol_id
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login (optional)
    await query(
      'UPDATE usuarios SET actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          documento: user.documento,
          nombres: user.nombres,
          apellidos: user.apellidos,
          rol_id: user.rol_id,
          rol_nombre: user.rol_nombre
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      }
    });
  })
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if user still exists and is active
    const users = await query(
      'SELECT id, documento, rol_id, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].activo) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const tokenPayload = {
      userId: users[0].id,
      documento: users[0].documento,
      rol_id: users[0].rol_id
    };

    const newAccessToken = generateToken(tokenPayload);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  })
);

/**
 * @route POST /api/auth/logout
 * @desc User logout
 * @access Private
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not logout'
      });
    }

    res.clearCookie(process.env.SESSION_NAME || 'sessionId');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const users = await query(`
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.telefono, 
             u.rol_id, u.activo, u.genero_id, u.creado_en,
             r.nombre as rol_nombre,
             g.nombre as genero_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN generos g ON u.genero_id = g.id
      WHERE u.id = ? AND u.activo = 1
    `, [decoded.userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    delete user.contrasena; // Remove password from response

    res.json({
      success: true,
      data: user
    });
  })
);

module.exports = router;
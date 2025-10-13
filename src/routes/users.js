const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { 
  createUserValidation, 
  updateUserValidation,
  uuidParamValidation,
  paginationValidation
} = require('../middleware/validation');
const { handleValidationErrors, asyncHandler } = require('../middleware/error');

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users with pagination
 * @access Private (Admin only)
 */
router.get('/',
  requireRole([1]), // Only admin
  paginationValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = `WHERE (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.documento LIKE ?)`;
      queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM usuarios u 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get users
    const usersQuery = `
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.fecha_nacimiento,
             u.telefono, u.rol_id, u.activo, u.genero_id, u.creado_en,
             r.nombre as rol_nombre,
             g.nombre as genero_nombre,
             td.descripcion as tipo_documento
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN generos g ON u.genero_id = g.id
      LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
      ${whereClause}
      ORDER BY u.nombres, u.apellidos
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const users = await query(usersQuery, queryParams);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id',
  uuidParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user can access this data
    if (req.user.rol_id !== 1 && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const users = await query(`
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.fecha_nacimiento,
             u.telefono, u.rol_id, u.activo, u.genero_id, u.creado_en,
             u.actualizado_en, u.tipo_documento_id,
             r.nombre as rol_nombre,
             g.nombre as genero_nombre,
             td.descripcion as tipo_documento
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN generos g ON u.genero_id = g.id
      LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  })
);

/**
 * @route POST /api/users
 * @desc Create new user
 * @access Private (Admin only)
 */
router.post('/',
  requireRole([1]), // Only admin
  createUserValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      tipo_documento_id,
      documento,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      contrasena,
      rol_id,
      genero_id
    } = req.body;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const result = await query(`
      INSERT INTO usuarios (
        tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
        telefono, contrasena, rol_id, genero_id, actualizado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
      telefono, hashedPassword, rol_id, genero_id, req.user.id
    ]);

    // Get created user
    const newUser = await query(`
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.fecha_nacimiento,
             u.telefono, u.rol_id, u.activo, u.genero_id,
             r.nombre as rol_nombre,
             g.nombre as genero_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN generos g ON u.genero_id = g.id
      WHERE u.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  })
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put('/:id',
  updateUserValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user can modify this data
    if (req.user.rol_id !== 1 && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    const allowedFields = [
      'tipo_documento_id', 'documento', 'nombres', 'apellidos', 
      'fecha_nacimiento', 'telefono', 'rol_id', 'genero_id', 'activo'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(req.body[field]);
      }
    });

    // Handle password update
    if (req.body.contrasena) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(req.body.contrasena, saltRounds);
      updateFields.push('contrasena = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add updated_by and timestamp
    updateFields.push('actualizado_por = ?', 'actualizado_en = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id, id);

    await query(`
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Get updated user
    const updatedUser = await query(`
      SELECT u.id, u.documento, u.nombres, u.apellidos, u.fecha_nacimiento,
             u.telefono, u.rol_id, u.activo, u.genero_id,
             r.nombre as rol_nombre,
             g.nombre as genero_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN generos g ON u.genero_id = g.id
      WHERE u.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });
  })
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (soft delete - deactivate)
 * @access Private (Admin only)
 */
router.delete('/:id',
  requireRole([1]), // Only admin
  uuidParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete (deactivate)
    await query(`
      UPDATE usuarios 
      SET activo = 0, actualizado_por = ?, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  })
);

module.exports = router;
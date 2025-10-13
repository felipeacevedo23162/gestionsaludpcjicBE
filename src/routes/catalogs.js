const express = require('express');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error');

const router = express.Router();

/**
 * @route GET /api/catalogs/document-types
 * @desc Get all document types
 * @access Private
 */
router.get('/document-types',
  asyncHandler(async (req, res) => {
    const documentTypes = await query(`
      SELECT id, codigo, descripcion 
      FROM tipos_documento 
      ORDER BY descripcion
    `);

    res.json({
      success: true,
      data: documentTypes
    });
  })
);

/**
 * @route GET /api/catalogs/genders
 * @desc Get all genders
 * @access Private
 */
router.get('/genders',
  asyncHandler(async (req, res) => {
    const genders = await query(`
      SELECT id, nombre 
      FROM generos 
      ORDER BY nombre
    `);

    res.json({
      success: true,
      data: genders
    });
  })
);

/**
 * @route GET /api/catalogs/civil-status
 * @desc Get all civil status options
 * @access Private
 */
router.get('/civil-status',
  asyncHandler(async (req, res) => {
    const civilStatus = await query(`
      SELECT id, descripcion 
      FROM estadocivil 
      ORDER BY descripcion
    `);

    res.json({
      success: true,
      data: civilStatus
    });
  })
);

/**
 * @route GET /api/catalogs/roles
 * @desc Get all user roles
 * @access Private
 */
router.get('/roles',
  asyncHandler(async (req, res) => {
    const roles = await query(`
      SELECT id, nombre 
      FROM roles 
      ORDER BY nombre
    `);

    res.json({
      success: true,
      data: roles
    });
  })
);

/**
 * @route GET /api/catalogs/service-types
 * @desc Get all service types
 * @access Private
 */
router.get('/service-types',
  asyncHandler(async (req, res) => {
    const serviceTypes = await query(`
      SELECT id, nombre 
      FROM tiposervicio 
      ORDER BY nombre
    `);

    res.json({
      success: true,
      data: serviceTypes
    });
  })
);

/**
 * @route GET /api/catalogs/appointment-status
 * @desc Get all appointment status options
 * @access Private
 */
router.get('/appointment-status',
  asyncHandler(async (req, res) => {
    const appointmentStatus = await query(`
      SELECT id, nombre 
      FROM estadocita 
      ORDER BY id
    `);

    res.json({
      success: true,
      data: appointmentStatus
    });
  })
);

/**
 * @route GET /api/catalogs/professionals
 * @desc Get all active professionals/users
 * @access Private
 */
router.get('/professionals',
  asyncHandler(async (req, res) => {
    const professionals = await query(`
      SELECT u.id, CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
             u.documento, r.nombre as rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = 1
      ORDER BY u.nombres, u.apellidos
    `);

    res.json({
      success: true,
      data: professionals
    });
  })
);

/**
 * @route GET /api/catalogs/all
 * @desc Get all catalog data in one request
 * @access Private
 */
router.get('/all',
  asyncHandler(async (req, res) => {
    const [
      documentTypes,
      genders,
      civilStatus,
      roles,
      serviceTypes,
      appointmentStatus,
      professionals
    ] = await Promise.all([
      query('SELECT id, codigo, descripcion FROM tipos_documento ORDER BY descripcion'),
      query('SELECT id, nombre FROM generos ORDER BY nombre'),
      query('SELECT id, descripcion FROM estadocivil ORDER BY descripcion'),
      query('SELECT id, nombre FROM roles ORDER BY nombre'),
      query('SELECT id, nombre FROM tiposervicio ORDER BY nombre'),
      query('SELECT id, nombre FROM estadocita ORDER BY id'),
      query(`
        SELECT u.id, CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
               u.documento, r.nombre as rol
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.activo = 1
        ORDER BY u.nombres, u.apellidos
      `)
    ]);

    res.json({
      success: true,
      data: {
        documentTypes,
        genders,
        civilStatus,
        roles,
        serviceTypes,
        appointmentStatus,
        professionals
      }
    });
  })
);

module.exports = router;
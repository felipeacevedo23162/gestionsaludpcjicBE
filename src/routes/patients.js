const express = require('express');
const { query } = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { 
  createPatientValidation, 
  updatePatientValidation,
  uuidParamValidation,
  paginationValidation
} = require('../middleware/validation');
const { handleValidationErrors, asyncHandler } = require('../middleware/error');

const router = express.Router();

/**
 * @route GET /api/patients
 * @desc Get all patients with pagination and search
 * @access Private
 */
router.get('/',
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
      whereClause = `WHERE (p.nombres LIKE ? OR p.apellidos LIKE ? OR p.documento LIKE ?)`;
      queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM pacientes p 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get patients
    const patientsQuery = `
      SELECT p.id, p.tipo_documento_id, p.documento, p.nombres, p.apellidos, p.fecha_nacimiento,
             p.telefono, p.correo, p.direccion, p.genero_id, p.estado_civil_id,
             p.creado_en, p.actualizado_en,
             g.nombre as genero_nombre,
             ec.descripcion as estado_civil,
             td.descripcion as tipo_documento
      FROM pacientes p
      LEFT JOIN generos g ON p.genero_id = g.id
      LEFT JOIN estadocivil ec ON p.estado_civil_id = ec.id
      LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
      ${whereClause}
      ORDER BY p.nombres, p.apellidos
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const patients = await query(patientsQuery, queryParams);

    res.json({
      success: true,
      data: patients,
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
 * @route GET /api/patients/:id
 * @desc Get patient by ID
 * @access Private
 */
router.get('/:id',
  uuidParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patients = await query(`
      SELECT p.id, p.documento, p.nombres, p.apellidos, p.fecha_nacimiento,
             p.telefono, p.correo, p.direccion, p.genero_id, p.estado_civil_id,
             p.tipo_documento_id, p.creado_en, p.actualizado_en,
             g.nombre as genero_nombre,
             ec.descripcion as estado_civil,
             td.descripcion as tipo_documento
      FROM pacientes p
      LEFT JOIN generos g ON p.genero_id = g.id
      LEFT JOIN estadocivil ec ON p.estado_civil_id = ec.id
      LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
      WHERE p.id = ?
    `, [id]);

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get patient's appointment history
    const appointments = await query(`
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones,
             ts.nombre as tipo_servicio,
             ec.nombre as estado,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional
      FROM citas c
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      WHERE c.paciente_id = ?
      ORDER BY c.fecha_inicio DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        patient: patients[0],
        recent_appointments: appointments
      }
    });
  })
);

/**
 * @route POST /api/patients
 * @desc Create new patient
 * @access Private
 */
router.post('/',
  createPatientValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      tipo_documento_id,
      documento,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      correo,
      direccion,
      genero_id,
      estado_civil_id
    } = req.body;

    // Generate UUID for patient ID
    const { v4: uuidv4 } = require('uuid');
    const patientId = uuidv4();

    await query(`
      INSERT INTO pacientes (
        id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
        telefono, correo, direccion, genero_id, estado_civil_id, actualizado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      patientId, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
      telefono, correo, direccion, genero_id, estado_civil_id, req.user.id
    ]);

    // Get created patient
    const newPatient = await query(`
      SELECT p.id, p.tipo_documento_id, p.documento, p.nombres, p.apellidos, p.fecha_nacimiento,
             p.telefono, p.correo, p.direccion, p.genero_id, p.estado_civil_id,
             g.nombre as genero_nombre,
             ec.descripcion as estado_civil,
             td.descripcion as tipo_documento
      FROM pacientes p
      LEFT JOIN generos g ON p.genero_id = g.id
      LEFT JOIN estadocivil ec ON p.estado_civil_id = ec.id
      LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
      WHERE p.id = ?
    `, [patientId]);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: newPatient[0]
    });
  })
);

/**
 * @route PUT /api/patients/:id
 * @desc Update patient
 * @access Private
 */
router.put('/:id',
  updatePatientValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if patient exists
    const existingPatient = await query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (existingPatient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    const allowedFields = [
      'tipo_documento_id', 'documento', 'nombres', 'apellidos', 
      'fecha_nacimiento', 'telefono', 'correo', 'direccion',
      'genero_id', 'estado_civil_id'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(req.body[field]);
      }
    });

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
      UPDATE pacientes 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Get updated patient
    const updatedPatient = await query(`
      SELECT p.id, p.tipo_documento_id, p.documento, p.nombres, p.apellidos, p.fecha_nacimiento,
             p.telefono, p.correo, p.direccion, p.genero_id, p.estado_civil_id,
             g.nombre as genero_nombre,
             ec.descripcion as estado_civil,
             td.descripcion as tipo_documento
      FROM pacientes p
      LEFT JOIN generos g ON p.genero_id = g.id
      LEFT JOIN estadocivil ec ON p.estado_civil_id = ec.id
      LEFT JOIN tipos_documento td ON p.tipo_documento_id = td.id
      WHERE p.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient[0]
    });
  })
);

/**
 * @route DELETE /api/patients/:id
 * @desc Delete patient (hard delete with cascade)
 * @access Private (Admin only)
 */
router.delete('/:id',
  requireRole([1]), // Only admin
  uuidParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if patient exists
    const existingPatient = await query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (existingPatient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check for existing appointments
    const appointments = await query(
      'SELECT COUNT(*) as count FROM citas WHERE paciente_id = ?',
      [id]
    );

    if (appointments[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete patient with existing appointments'
      });
    }

    await query('DELETE FROM pacientes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  })
);

/**
 * @route GET /api/patients/:id/appointments
 * @desc Get patient's appointments
 * @access Private
 */
router.get('/:id/appointments',
  uuidParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if patient exists
    const patient = await query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (patient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM citas WHERE paciente_id = ?',
      [id]
    );
    const total = countResult[0].total;

    // Get appointments
    const appointments = await query(`
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones, c.creado_en,
             ts.nombre as tipo_servicio,
             ec.nombre as estado,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional
      FROM citas c
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      WHERE c.paciente_id = ?
      ORDER BY c.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

module.exports = router;
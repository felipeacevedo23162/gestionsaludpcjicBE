const express = require('express');
const { query } = require('../config/database');
const { requireRole } = require('../middleware/auth');
const { 
  createAppointmentValidation, 
  updateAppointmentValidation,
  intParamValidation,
  paginationValidation
} = require('../middleware/validation');
const { handleValidationErrors, asyncHandler } = require('../middleware/error');

const router = express.Router();

/**
 * @route GET /api/appointments
 * @desc Get all appointments with pagination and filters
 * @access Private
 */
router.get('/',
  paginationValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { 
      fecha_inicio, 
      fecha_fin, 
      estado_id, 
      profesional_id, 
      tipo_servicio_id,
      search 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Date range filter
    if (fecha_inicio) {
      whereConditions.push('c.fecha_inicio >= ?');
      queryParams.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      whereConditions.push('c.fecha_fin <= ?');
      queryParams.push(fecha_fin);
    }

    // Status filter
    if (estado_id) {
      whereConditions.push('c.estado_id = ?');
      queryParams.push(estado_id);
    }

    // Professional filter
    if (profesional_id) {
      whereConditions.push('c.profesional_id = ?');
      queryParams.push(profesional_id);
    }

    // Service type filter
    if (tipo_servicio_id) {
      whereConditions.push('c.tipo_servicio_id = ?');
      queryParams.push(tipo_servicio_id);
    }

    // Search in patient name or document
    if (search) {
      whereConditions.push('(p.nombres LIKE ? OR p.apellidos LIKE ? OR p.documento LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get appointments
    const appointmentsQuery = `
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones, c.creado_en,
             c.paciente_id, c.profesional_id, c.tipo_servicio_id, c.estado_id,
             CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
             p.documento as paciente_documento,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional_nombre,
             ts.nombre as tipo_servicio,
             ec.nombre as estado
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY c.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const appointments = await query(appointmentsQuery, queryParams);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        fecha_inicio,
        fecha_fin,
        estado_id,
        profesional_id,
        tipo_servicio_id,
        search
      }
    });
  })
);

/**
 * @route GET /api/appointments/:id
 * @desc Get appointment by ID
 * @access Private
 */
router.get('/:id',
  intParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const appointments = await query(`
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones, c.creado_en,
             c.actualizado_en, c.paciente_id, c.profesional_id, c.tipo_servicio_id, c.estado_id,
             CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
             p.documento as paciente_documento,
             p.telefono as paciente_telefono,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional_nombre,
             ts.nombre as tipo_servicio,
             ec.nombre as estado
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      WHERE c.id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointments[0]
    });
  })
);

/**
 * @route POST /api/appointments
 * @desc Create new appointment
 * @access Private
 */
router.post('/',
  createAppointmentValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      paciente_id,
      profesional_id,
      fecha_inicio,
      fecha_fin,
      tipo_servicio_id,
      observaciones,
      estado_id = 1 // Default to "Programada"
    } = req.body;

    // Validate dates
    const startDate = new Date(fecha_inicio);
    const endDate = new Date(fecha_fin);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be scheduled in the past'
      });
    }

    // Check for conflicts if professional is assigned
    if (profesional_id) {
      const conflicts = await query(`
        SELECT id FROM citas 
        WHERE profesional_id = ? 
        AND estado_id IN (1, 2) 
        AND (
          (fecha_inicio <= ? AND fecha_fin > ?) OR
          (fecha_inicio < ? AND fecha_fin >= ?) OR
          (fecha_inicio >= ? AND fecha_fin <= ?)
        )
      `, [
        profesional_id,
        fecha_inicio, fecha_inicio,
        fecha_fin, fecha_fin,
        fecha_inicio, fecha_fin
      ]);

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Professional has a conflicting appointment at this time'
        });
      }
    }

    // Check patient availability
    const patientConflicts = await query(`
      SELECT id FROM citas 
      WHERE paciente_id = ? 
      AND estado_id IN (1, 2) 
      AND (
        (fecha_inicio <= ? AND fecha_fin > ?) OR
        (fecha_inicio < ? AND fecha_fin >= ?) OR
        (fecha_inicio >= ? AND fecha_fin <= ?)
      )
    `, [
      paciente_id,
      fecha_inicio, fecha_inicio,
      fecha_fin, fecha_fin,
      fecha_inicio, fecha_fin
    ]);

    if (patientConflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Patient has a conflicting appointment at this time'
      });
    }

    const result = await query(`
      INSERT INTO citas (
        paciente_id, profesional_id, fecha_inicio, fecha_fin,
        tipo_servicio_id, observaciones, estado_id, actualizado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paciente_id, profesional_id, fecha_inicio, fecha_fin,
      tipo_servicio_id, observaciones, estado_id, req.user.id
    ]);

    // Get created appointment
    const newAppointment = await query(`
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones,
             CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional_nombre,
             ts.nombre as tipo_servicio,
             ec.nombre as estado
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment[0]
    });
  })
);

/**
 * @route PUT /api/appointments/:id
 * @desc Update appointment
 * @access Private
 */
router.put('/:id',
  updateAppointmentValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if appointment exists
    const existingAppointment = await query('SELECT * FROM citas WHERE id = ?', [id]);
    if (existingAppointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = existingAppointment[0];

    // Only allow updates to future appointments or by admin
    if (new Date(appointment.fecha_inicio) < new Date() && req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify past appointments'
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    const allowedFields = [
      'profesional_id', 'fecha_inicio', 'fecha_fin',
      'tipo_servicio_id', 'observaciones', 'estado_id'
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

    // Validate dates if being updated
    if (req.body.fecha_inicio || req.body.fecha_fin) {
      const startDate = new Date(req.body.fecha_inicio || appointment.fecha_inicio);
      const endDate = new Date(req.body.fecha_fin || appointment.fecha_fin);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Add updated_by and timestamp
    updateFields.push('actualizado_por = ?', 'actualizado_en = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id, id);

    await query(`
      UPDATE citas 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Get updated appointment
    const updatedAppointment = await query(`
      SELECT c.id, c.fecha_inicio, c.fecha_fin, c.observaciones,
             CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
             CONCAT(u.nombres, ' ', u.apellidos) as profesional_nombre,
             ts.nombre as tipo_servicio,
             ec.nombre as estado
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.profesional_id = u.id
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      WHERE c.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment[0]
    });
  })
);

/**
 * @route DELETE /api/appointments/:id
 * @desc Cancel appointment
 * @access Private
 */
router.delete('/:id',
  intParamValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if appointment exists
    const appointment = await query('SELECT * FROM citas WHERE id = ?', [id]);
    if (appointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update status to cancelled (assuming status 4 is cancelled)
    await query(`
      UPDATE citas 
      SET estado_id = 4, actualizado_por = ?, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  })
);

/**
 * @route GET /api/appointments/calendar
 * @desc Get appointments for calendar view
 * @access Private
 */
router.get('/calendar/view',
  asyncHandler(async (req, res) => {
    const { start, end, profesional_id } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (start) {
      whereConditions.push('c.fecha_inicio >= ?');
      queryParams.push(start);
    }

    if (end) {
      whereConditions.push('c.fecha_fin <= ?');
      queryParams.push(end);
    }

    if (profesional_id) {
      whereConditions.push('c.profesional_id = ?');
      queryParams.push(profesional_id);
    }

    // Only show non-cancelled appointments
    whereConditions.push('c.estado_id != 4');

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const appointments = await query(`
      SELECT c.id, c.fecha_inicio as start, c.fecha_fin as end,
             CONCAT(p.nombres, ' ', p.apellidos) as title,
             c.observaciones as description,
             ts.nombre as tipo_servicio,
             ec.nombre as estado,
             CASE 
               WHEN c.estado_id = 1 THEN '#007bff'
               WHEN c.estado_id = 2 THEN '#28a745'
               WHEN c.estado_id = 3 THEN '#ffc107'
               ELSE '#dc3545'
             END as color
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN tiposervicio ts ON c.tipo_servicio_id = ts.id
      LEFT JOIN estadocita ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY c.fecha_inicio
    `, queryParams);

    res.json({
      success: true,
      data: appointments
    });
  })
);

module.exports = router;
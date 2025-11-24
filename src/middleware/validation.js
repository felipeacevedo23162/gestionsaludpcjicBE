const { body, param, query } = require('express-validator');

// Common validations
const documentValidation = body('documento')
  .isLength({ min: 5, max: 20 })
  .matches(/^[0-9A-Za-z-]+$/)
  .withMessage('Document must contain only alphanumeric characters and hyphens');

const nameValidation = (field) => 
  body(field)
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage(`${field} must contain only letters and spaces`);

const emailValidation = body('correo')
  .optional()
  .isEmail()
  .normalizeEmail()
  .withMessage('Invalid email format');

const phoneValidation = body('telefono')
  .optional()
  .matches(/^[+]?[\d\s\-()]+$/)
  .isLength({ min: 7, max: 20 })
  .withMessage('Invalid phone number format');

const passwordValidation = body('contrasena')
  .isLength({ min: 8, max: 128 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number and special character');

// User validations
const createUserValidation = [
  body('tipo_documento_id').isInt({ min: 1 }).withMessage('Valid document type ID required'),
  documentValidation,
  nameValidation('nombres'),
  nameValidation('apellidos'),
  body('fecha_nacimiento').isISO8601().toDate().withMessage('Valid birth date required'),
  phoneValidation,
  passwordValidation,
  body('rol_id').isInt({ min: 1 }).withMessage('Valid role ID required'),
  body('genero_id').optional().isInt({ min: 1 }).withMessage('Valid gender ID required')
];

const updateUserValidation = [
  param('id').isUUID().withMessage('Valid user ID required'),
  body('tipo_documento_id').optional().isInt({ min: 1 }).withMessage('Valid document type ID required'),
  body('documento').optional().isLength({ min: 5, max: 20 }),
  body('nombres').optional().isLength({ min: 2, max: 100 }),
  body('apellidos').optional().isLength({ min: 2, max: 100 }),
  body('fecha_nacimiento').optional().isISO8601().toDate(),
  body('telefono').optional().matches(/^[+]?[\d\s\-()]+$/),
  body('rol_id').optional().isInt({ min: 1 }),
  body('genero_id').optional().isInt({ min: 1 }),
  body('activo').optional().isBoolean()
];

// Patient validations
const createPatientValidation = [
  body('tipo_documento_id').optional().isInt({ min: 1 }).withMessage('Valid document type ID required'),
  documentValidation,
  nameValidation('nombres'),
  nameValidation('apellidos'),
  body('fecha_nacimiento').optional().isISO8601().toDate().withMessage('Valid birth date required'),
  phoneValidation,
  emailValidation,
  body('direccion').optional().isLength({ max: 500 }).withMessage('Address too long'),
  body('genero_id').optional().isInt({ min: 1 }).withMessage('Valid gender ID required'),
  body('estado_civil_id').optional().isInt({ min: 1 }).withMessage('Valid civil status ID required')
];

const updatePatientValidation = [
  param('id').isUUID().withMessage('Valid patient ID required'),
  ...createPatientValidation.map(validation => 
    validation.optional ? validation : validation.optional()
  )
];

// Appointment validations
const createAppointmentValidation = [
  body('paciente_id').isUUID().withMessage('Valid patient ID required'),
  body('profesional_id').optional().isUUID().withMessage('Valid professional ID required'),
  body('fecha_inicio').isISO8601().toDate().withMessage('Valid start date required'),
  body('fecha_fin').isISO8601().toDate().withMessage('Valid end date required'),
  body('tipo_servicio_id').isInt({ min: 1 }).withMessage('Valid service type ID required'),
  body('observaciones').optional().isLength({ max: 1000 }).withMessage('Observations too long'),
  body('estado_id').optional().isInt({ min: 1 }).withMessage('Valid status ID required')
];

const updateAppointmentValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid appointment ID required'),
  body('profesional_id').optional().isUUID(),
  body('fecha_inicio').optional().isISO8601().toDate(),
  body('fecha_fin').optional().isISO8601().toDate(),
  body('tipo_servicio_id').optional().isInt({ min: 1 }),
  body('observaciones').optional().isLength({ max: 1000 }),
  body('estado_id').optional().isInt({ min: 1 })
];

// Login validations
const loginValidation = [
  body('documento').notEmpty().withMessage('Document required'),
  body('contrasena').notEmpty().withMessage('Password required')
];

// ID parameter validations
const uuidParamValidation = param('id').isUUID().withMessage('Valid UUID required');
const intParamValidation = param('id').isInt({ min: 1 }).withMessage('Valid ID required');

// Query parameter validations
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  createPatientValidation,
  updatePatientValidation,
  createAppointmentValidation,
  updateAppointmentValidation,
  loginValidation,
  uuidParamValidation,
  intParamValidation,
  paginationValidation
};
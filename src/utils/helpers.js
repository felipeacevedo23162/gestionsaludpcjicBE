const bcrypt = require('bcryptjs');

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - Password match result
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate Colombian document number
 * @param {string} documento - Document number
 * @param {string} tipoDocumento - Document type code
 * @returns {boolean} - Validation result
 */
const validateDocument = (documento, tipoDocumento = 'CC') => {
  if (!documento) return false;
  
  // Remove any non-numeric characters
  const cleanDoc = documento.replace(/\D/g, '');
  
  switch (tipoDocumento) {
    case 'CC': // Cédula de Ciudadanía
      return cleanDoc.length >= 6 && cleanDoc.length <= 10;
    case 'TI': // Tarjeta de Identidad
      return cleanDoc.length >= 8 && cleanDoc.length <= 11;
    case 'CE': // Cédula de Extranjería
      return cleanDoc.length >= 6 && cleanDoc.length <= 12;
    case 'PP': // Pasaporte
      return documento.length >= 6 && documento.length <= 20;
    default:
      return cleanDoc.length >= 5 && cleanDoc.length <= 20;
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
const formatPhone = (phone) => {
  if (!phone) return phone;
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Colombian phone number formatting
  if (cleaned.startsWith('+57')) {
    return cleaned;
  } else if (cleaned.startsWith('57') && cleaned.length === 12) {
    return '+' + cleaned;
  } else if (cleaned.length === 10) {
    return '+57' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Validation result
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date
 * @returns {number} - Age in years
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date to Colombian format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format datetime to Colombian format
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} - Formatted datetime
 */
const formatDateTime = (datetime) => {
  if (!datetime) return '';
  
  const d = new Date(datetime);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Paginate results
 * @param {Array} data - Data to paginate
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated result
 */
const paginate = (data, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      pages: Math.ceil(data.length / limit)
    }
  };
};

/**
 * Create success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Success response
 */
const successResponse = (data = null, message = 'Success') => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {any} errors - Additional error details
 * @returns {Object} - Error response
 */
const errorResponse = (message = 'Error', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateRandomString,
  sanitizeInput,
  validateDocument,
  formatPhone,
  validateEmail,
  calculateAge,
  formatDate,
  formatDateTime,
  paginate,
  successResponse,
  errorResponse
};
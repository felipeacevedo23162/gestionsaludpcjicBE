-- Insert initial data for the medical appointment system
-- Run this after creating the database schema

-- Insert document types
INSERT INTO tipos_documento (id, codigo, descripcion) VALUES 
(1, 'CC', 'Cédula de Ciudadanía'),
(2, 'TI', 'Tarjeta de Identidad'),
(3, 'CE', 'Cédula de Extranjería'),
(4, 'PP', 'Pasaporte'),
(5, 'RC', 'Registro Civil');

-- Insert genders
INSERT INTO generos (id, nombre) VALUES 
(1, 'Masculino'),
(2, 'Femenino'),
(3, 'Otro'),
(4, 'No especifica');

-- Insert civil status
INSERT INTO estadocivil (id, descripcion) VALUES 
(1, 'Soltero(a)'),
(2, 'Casado(a)'),
(3, 'Unión libre'),
(4, 'Divorciado(a)'),
(5, 'Viudo(a)'),
(6, 'Separado(a)');

-- Insert user roles
INSERT INTO roles (id, nombre) VALUES 
(1, 'Administrador'),
(2, 'Médico General'),
(3, 'Médico Especialista'),
(4, 'Recepcionista'),
(5, 'Auxiliar de Enfermería');

-- Insert service types
INSERT INTO tiposervicio (id, nombre) VALUES 
(1, 'Consulta General'),
(2, 'Consulta Especializada'),
(3, 'Control y Seguimiento'),
(4, 'Procedimiento Menor'),
(5, 'Examen Médico'),
(6, 'Vacunación'),
(7, 'Toma de Signos Vitales'),
(8, 'Consulta Odontológica'),
(9, 'Consulta Psicológica'),
(10, 'Terapia Física');

-- Insert appointment status
INSERT INTO estadocita (id, nombre) VALUES 
(1, 'Programada'),
(2, 'Confirmada'),
(3, 'En Curso'),
(4, 'Completada'),
(5, 'Cancelada'),
(6, 'No Asistió'),
(7, 'Reprogramada');

-- Insert default admin user (password: Admin123!)
-- Remember to change this password in production!
INSERT INTO usuarios (
  id, 
  tipo_documento_id, 
  documento, 
  nombres, 
  apellidos, 
  fecha_nacimiento, 
  telefono, 
  contrasena, 
  rol_id, 
  genero_id,
  activo
) VALUES (
  UUID(),
  1,
  '12345678',
  'Administrador',
  'del Sistema',
  '1980-01-01',
  '+573001234567',
  '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', -- Admin123!
  1,
  1,
  1
);

-- Insert sample medical professional
INSERT INTO usuarios (
  id,
  tipo_documento_id,
  documento,
  nombres,
  apellidos,
  fecha_nacimiento,
  telefono,
  contrasena,
  rol_id,
  genero_id,
  activo
) VALUES (
  UUID(),
  1,
  '98765432',
  'Dr. Juan Carlos',
  'Pérez García',
  '1975-05-15',
  '+573009876543',
  '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', -- Admin123!
  2,
  1,
  1
);

-- Insert sample receptionist
INSERT INTO usuarios (
  id,
  tipo_documento_id,
  documento,
  nombres,
  apellidos,
  fecha_nacimiento,
  telefono,
  contrasena,
  rol_id,
  genero_id,
  activo
) VALUES (
  UUID(),
  1,
  '11223344',
  'María Elena',
  'González López',
  '1990-03-22',
  '+573007654321',
  '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', -- Admin123!
  4,
  2,
  1
);

-- Insert sample patients
INSERT INTO pacientes (
  id,
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
) VALUES 
(
  UUID(),
  1,
  '55667788',
  'Ana María',
  'Rodríguez Jiménez',
  '1992-07-10',
  '+573005555555',
  'ana.rodriguez@email.com',
  'Calle 50 #23-45, Apartamento 302',
  2,
  1
),
(
  UUID(),
  1,
  '66778899',
  'Carlos Andrés',
  'Martínez Vargas',
  '1988-12-03',
  '+573006666666',
  'carlos.martinez@email.com',
  'Carrera 15 #67-89',
  1,
  2
),
(
  UUID(),
  1,
  '77889900',
  'Lucía Patricia',
  'Fernández Torres',
  '1985-09-18',
  '+573007777777',
  'lucia.fernandez@email.com',
  'Avenida 30 #12-34',
  2,
  3
);

COMMIT;
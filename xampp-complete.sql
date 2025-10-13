-- Script completo para XAMPP/phpMyAdmin
-- Copia y pega este código completo en la pestaña SQL de phpMyAdmin

-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS gestion_salud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestion_salud;

-- Eliminar tablas si existen
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS estadocita;
DROP TABLE IF EXISTS estadocivil;
DROP TABLE IF EXISTS generos;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS tiposervicio;
DROP TABLE IF EXISTS tipos_documento;

-- Crear tablas (estructura completa)
CREATE TABLE tipos_documento (
  id int NOT NULL PRIMARY KEY,
  codigo varchar(5) NOT NULL UNIQUE,
  descripcion varchar(50) NOT NULL
);

CREATE TABLE generos (
  id int NOT NULL PRIMARY KEY,
  nombre varchar(20) NOT NULL
);

CREATE TABLE estadocivil (
  id int NOT NULL PRIMARY KEY,
  descripcion varchar(50) NOT NULL UNIQUE
);

CREATE TABLE roles (
  id int NOT NULL PRIMARY KEY,
  nombre varchar(50) NOT NULL UNIQUE
);

CREATE TABLE tiposervicio (
  id int NOT NULL PRIMARY KEY,
  nombre varchar(200) NOT NULL
);

CREATE TABLE estadocita (
  id int NOT NULL PRIMARY KEY,
  nombre varchar(200) NOT NULL
);

CREATE TABLE usuarios (
  id char(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
  tipo_documento_id int DEFAULT NULL,
  documento varchar(20) NOT NULL UNIQUE,
  nombres varchar(100) NOT NULL,
  apellidos varchar(100) NOT NULL,
  fecha_nacimiento date DEFAULT NULL,
  telefono varchar(20) NOT NULL,
  contrasena varchar(255) NOT NULL,
  rol_id int DEFAULT NULL,
  activo tinyint(1) DEFAULT '1',
  genero_id int DEFAULT NULL,
  creado_en timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por char(36) DEFAULT NULL,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (genero_id) REFERENCES generos(id)
);

CREATE TABLE pacientes (
  id char(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
  tipo_documento_id int DEFAULT NULL,
  documento varchar(20) NOT NULL UNIQUE,
  nombres varchar(100) DEFAULT NULL,
  apellidos varchar(100) DEFAULT NULL,
  fecha_nacimiento date DEFAULT NULL,
  telefono varchar(20) DEFAULT NULL,
  correo varchar(100) DEFAULT NULL,
  direccion text,
  genero_id int DEFAULT NULL,
  estado_civil_id int DEFAULT NULL,
  creado_en timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por char(36) DEFAULT NULL,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
  FOREIGN KEY (genero_id) REFERENCES generos(id),
  FOREIGN KEY (estado_civil_id) REFERENCES estadocivil(id)
);

CREATE TABLE citas (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paciente_id char(36) NOT NULL,
  profesional_id char(36) DEFAULT NULL,
  fecha_inicio datetime NOT NULL,
  fecha_fin datetime NOT NULL,
  estado_id int NOT NULL DEFAULT '1',
  observaciones text,
  tipo_servicio_id int NOT NULL,
  creado_en timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por char(36) DEFAULT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (estado_id) REFERENCES estadocita(id),
  FOREIGN KEY (tipo_servicio_id) REFERENCES tiposervicio(id)
);

-- Insertar datos iniciales
INSERT INTO tipos_documento (id, codigo, descripcion) VALUES 
(1, 'CC', 'Cédula de Ciudadanía'),
(2, 'TI', 'Tarjeta de Identidad'),
(3, 'CE', 'Cédula de Extranjería'),
(4, 'PP', 'Pasaporte'),
(5, 'RC', 'Registro Civil');

INSERT INTO generos (id, nombre) VALUES 
(1, 'Masculino'),
(2, 'Femenino'),
(3, 'Otro'),
(4, 'No especifica');

INSERT INTO estadocivil (id, descripcion) VALUES 
(1, 'Soltero(a)'),
(2, 'Casado(a)'),
(3, 'Unión libre'),
(4, 'Divorciado(a)'),
(5, 'Viudo(a)'),
(6, 'Separado(a)');

INSERT INTO roles (id, nombre) VALUES 
(1, 'Administrador'),
(2, 'Médico General'),
(3, 'Médico Especialista'),
(4, 'Recepcionista'),
(5, 'Auxiliar de Enfermería');

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

INSERT INTO estadocita (id, nombre) VALUES 
(1, 'Programada'),
(2, 'Confirmada'),
(3, 'En Curso'),
(4, 'Completada'),
(5, 'Cancelada'),
(6, 'No Asistió'),
(7, 'Reprogramada');

-- Usuario administrador (contraseña: Admin123!)
INSERT INTO usuarios (
  id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
  telefono, contrasena, rol_id, genero_id, activo
) VALUES (
  UUID(), 1, '12345678', 'Administrador', 'del Sistema', '1980-01-01',
  '+573001234567', '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2',
  1, 1, 1
);

-- Usuarios de ejemplo
INSERT INTO usuarios (
  id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
  telefono, contrasena, rol_id, genero_id, activo
) VALUES 
(UUID(), 1, '98765432', 'Dr. Juan Carlos', 'Pérez García', '1975-05-15',
 '+573009876543', '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', 2, 1, 1),
(UUID(), 1, '11223344', 'María Elena', 'González López', '1990-03-22',
 '+573007654321', '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', 4, 2, 1);

-- Pacientes de ejemplo
INSERT INTO pacientes (
  id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento,
  telefono, correo, direccion, genero_id, estado_civil_id
) VALUES 
(UUID(), 1, '55667788', 'Ana María', 'Rodríguez Jiménez', '1992-07-10',
 '+573005555555', 'ana.rodriguez@email.com', 'Calle 50 #23-45, Apartamento 302', 2, 1),
(UUID(), 1, '66778899', 'Carlos Andrés', 'Martínez Vargas', '1988-12-03',
 '+573006666666', 'carlos.martinez@email.com', 'Carrera 15 #67-89', 1, 2),
(UUID(), 1, '77889900', 'Lucía Patricia', 'Fernández Torres', '1985-09-18',
 '+573007777777', 'lucia.fernandez@email.com', 'Avenida 30 #12-34', 2, 3);
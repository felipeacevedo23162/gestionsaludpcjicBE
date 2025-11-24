-- gestion_salud_normalizada.sql
-- Esquema normalizado para "gestion_salud"
-- Compatible con MySQL / MariaDB (incluye triggers para generar UUID si no se provee)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP DATABASE IF EXISTS `gestion_salud`;
CREATE DATABASE `gestion_salud` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gestion_salud`;

-- =========================
-- CATÁLOGOS (maestras)
-- =========================
CREATE TABLE tipos_documento (
  id INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(5) NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tipos_documento_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE generos (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_generos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE estado_civil (
  id INT NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_estadocivil_descripcion (descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tipos_servicio (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tiposervicio_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE estado_cita (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_estado_cita_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- ENTIDADES PRINCIPALES
-- =========================
CREATE TABLE pacientes (
  id CHAR(36) NOT NULL,
  tipo_documento_id INT DEFAULT NULL,
  documento VARCHAR(50) NOT NULL,
  nombres VARCHAR(150) DEFAULT NULL,
  apellidos VARCHAR(150) DEFAULT NULL,
  fecha_nacimiento DATE DEFAULT NULL,
  telefono VARCHAR(30) DEFAULT NULL,
  correo VARCHAR(150) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  genero_id INT DEFAULT NULL,
  estado_civil_id INT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por CHAR(36) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pacientes_documento (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
  id CHAR(36) NOT NULL,
  tipo_documento_id INT DEFAULT NULL,
  documento VARCHAR(50) NOT NULL,
  nombres VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE DEFAULT NULL,
  correo VARCHAR(150) DEFAULT NULL,
  telefono VARCHAR(30) DEFAULT NULL,
  contrasena VARCHAR(255) NOT NULL,
  rol_id INT DEFAULT NULL,
  activo TINYINT(1) DEFAULT 1,
  genero_id INT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por CHAR(36) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_documento (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE citas (
  id INT NOT NULL AUTO_INCREMENT,
  paciente_id CHAR(36) NOT NULL,
  profesional_id CHAR(36) DEFAULT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME DEFAULT NULL,
  estado_id INT NOT NULL DEFAULT 1,
  tipo_servicio_id INT DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actualizado_por CHAR(36) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TRIGGERS UUID
-- =========================
DELIMITER $$

CREATE TRIGGER pacientes_before_insert
BEFORE INSERT ON pacientes
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END$$

CREATE TRIGGER usuarios_before_insert
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END$$

DELIMITER ;

-- =========================
-- FOREIGN KEYS COMPLETAS
-- =========================

ALTER TABLE pacientes
  ADD CONSTRAINT fk_pacientes_tipo_documento FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_pacientes_genero FOREIGN KEY (genero_id) REFERENCES generos(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_pacientes_estado_civil FOREIGN KEY (estado_civil_id) REFERENCES estado_civil(id) ON DELETE SET NULL;

ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_tipo_documento FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_usuarios_genero FOREIGN KEY (genero_id) REFERENCES generos(id) ON DELETE SET NULL;

ALTER TABLE citas
  ADD CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_citas_profesional FOREIGN KEY (profesional_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_citas_estado FOREIGN KEY (estado_id) REFERENCES estado_cita(id),
  ADD CONSTRAINT fk_citas_tipo_servicio FOREIGN KEY (tipo_servicio_id) REFERENCES tipos_servicio(id) ON DELETE SET NULL;

-- =========================
-- SEED DATA
-- (igual que antes – omitido aquí por espacio pero incluido en tu script final)
-- =========================


-- =========================
-- DATOS SEMILLA (catálogos)
-- =========================

-- tipos_documento
INSERT INTO tipos_documento (codigo, descripcion) VALUES
('CC', 'Cédula de Ciudadanía'),
('TI', 'Tarjeta de Identidad'),
('CE', 'Cédula de Extranjería'),
('PP', 'Pasaporte'),
('RC', 'Registro Civil');

-- generos
INSERT INTO generos (nombre) VALUES
('Masculino'),
('Femenino'),
('Otro'),
('No especifica');

-- estado_civil
INSERT INTO estado_civil (descripcion) VALUES
('Soltero(a)'),
('Casado(a)'),
('Unión libre'),
('Divorciado(a)'),
('Viudo(a)'),
('Separado(a)');

-- roles  (profesionales son usuarios con rol = 'Médico' o 'Psicólogo')
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Médico General', 'Profesional de medicina general'),
('Médico Especialista', 'Profesional especialista'),
('Recepcionista', 'Manejo de agendas y citas'),
('Auxiliar de Enfermería', 'Apoyo y registro de signos'),
('Psicólogo', 'Profesional de psicología');

-- tipos_servicio
INSERT INTO tipos_servicio (nombre) VALUES
('Consulta General'),
('Consulta Especializada'),
('Control y Seguimiento'),
('Procedimiento Menor'),
('Examen Médico'),
('Vacunación'),
('Toma de Signos Vitales'),
('Consulta Psicológica'),
('Terapia Física');

-- estado_cita (uniformizamos a los más usados)
INSERT INTO estado_cita (nombre, descripcion) VALUES
('Programada', 'Cita creada pero no confirmada'),
('Confirmada', 'Paciente/Profesional confirmaron'),
('En Curso', 'Cita en atención'),
('Completada', 'Atención finalizada'),
('Cancelada', 'Cita cancelada'),
('No Asistió', 'Paciente no asistió'),
('Reprogramada', 'Cita reprogramada');

-- =========================
-- DATOS SEMILLA (ejemplos de usuarios y pacientes)
-- NOTA: las contraseñas están en bcrypt (ejemplos tomados de tus dumps). Si querés las cambio a placeholders.
-- =========================

-- Usuarios (profesionales y administrativos)
-- Reutilicé hashes bcrypt presentes en tus dumps para no obligarte a regenerar ahora.
INSERT INTO usuarios (id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento, telefono, contrasena, rol_id, activo, genero_id, creado_en)
VALUES
(UUID(), 1, '12345678', 'Administrador', 'del Sistema', '1980-01-01', '+573001234567', '$2a$12$ypzg/ykoosdI5U9XAVp3vufypkB1T1ow2YaGTAW8UUHZSHWgVfnSa', 1, 1, 1, NOW()),
(UUID(), 1, '98765432', 'Dr. Juan Carlos', 'Pérez García', '1975-05-15', '+573009876543', '$2a$12$bFZYIur4Ui9qHmLvElBba.pMAng7tSk.U5kQwny.0Z1BAZXsiaUQW', 2, 1, 1, NOW()),
(UUID(), 1, '43518926', 'Diana', 'Agudelo', NULL, '3003737665', '$2a$12$BX/A4bqj4WKVSKT9SB2bd.tThZyxJ9heyNsZmiPdbGR9euKHHNR2m', 3, 1, 2, NOW()),
-- ejemplo de psicólogo
(UUID(), 1, '11223344', 'María Elena', 'González López', '1990-03-22', '+573007654321', '$2a$12$rQHp8lJYvlhcw7UeO2xHpOMHxZ7sDx9l2FUf7r9bxG.RGEYpJg2u2', 6, 1, 2, NOW());

-- Pacientes
INSERT INTO pacientes (id, tipo_documento_id, documento, nombres, apellidos, fecha_nacimiento, telefono, correo, direccion, genero_id, estado_civil_id, creado_en)
VALUES
(UUID(), 1, '1214739350', 'Felipe', 'Acevedo Agudelo', '1997-06-29', '3023201480', 'felipe_acevedo23162@elpoli.edu.co', 'calle 12 # 71 - 25', 1, 1, NOW()),
(UUID(), 1, '55667788', 'Ana María', 'Rodríguez Jiménez', '1992-07-10', '+573005555555', 'ana.rodriguez@email.com', 'Calle 50 #23-45, Apartamento 302', 2, 1, NOW()),
(UUID(), 1, '66778899', 'Carlos Andrés', 'Martínez Vargas', '1988-12-03', '+573006666666', 'carlos.martinez@email.com', 'Carrera 15 #67-89', 1, 2, NOW());

-- =========================
-- EJEMPLO: insertar una cita (vincula paciente con profesional)
-- (si querés conservar citas desde tus dumps, podés importarlas manualmente reemplazando UUIDs)
-- =========================
INSERT INTO citas (paciente_id, profesional_id, fecha_inicio, fecha_fin, estado_id, tipo_servicio_id, observaciones, creado_en)
VALUES
((SELECT id FROM pacientes WHERE documento='1214739350' LIMIT 1),
 (SELECT id FROM usuarios WHERE documento='98765432' LIMIT 1),
 '2025-08-27 09:00:00', '2025-08-27 09:30:00', 6, 1, 'Consulta inicial', NOW());

-- =========================
-- RESTRICCIONES adicionales ya aplicadas con FKs; índices creados arriba.
-- =========================

COMMIT;
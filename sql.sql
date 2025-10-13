-- Medical Appointment System Database Schema
-- Created: September 15, 2025
-- Description: Complete database structure for managing patients, appointments, and medical professionals

-- =============================================
-- TABLE DEFINITIONS
-- =============================================

-- Appointments table
DROP TABLE IF EXISTS `citas`;
CREATE TABLE `citas` (
  `id` int NOT NULL,
  `paciente_id` char(36) COLLATE utf8mb4_general_ci NOT NULL,
  `profesional_id` char(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `estado_id` int NOT NULL DEFAULT '1',
  `observaciones` text COLLATE utf8mb4_general_ci,
  `tipo_servicio_id` int NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` char(36) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Appointment status table
DROP TABLE IF EXISTS `estadocita`;
CREATE TABLE `estadocita` (
  `id` int NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Civil status table
DROP TABLE IF EXISTS `estadocivil`;
CREATE TABLE `estadocivil` (
  `id` int NOT NULL,
  `descripcion` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Gender table
DROP TABLE IF EXISTS `generos`;
CREATE TABLE `generos` (
  `id` int NOT NULL,
  `nombre` varchar(20) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Patients table
DROP TABLE IF EXISTS `pacientes`;
CREATE TABLE `pacientes` (
  `id` char(36) COLLATE utf8mb4_general_ci NOT NULL DEFAULT (uuid()),
  `tipo_documento_id` int DEFAULT NULL,
  `documento` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_general_ci,
  `genero_id` int DEFAULT NULL,
  `estado_civil_id` int DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` char(36) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Roles table
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Service types table
DROP TABLE IF EXISTS `tiposervicio`;
CREATE TABLE `tiposervicio` (
  `id` int NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Document types table
DROP TABLE IF EXISTS `tipos_documento`;
CREATE TABLE `tipos_documento` (
  `id` int NOT NULL,
  `codigo` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Users table
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` char(36) COLLATE utf8mb4_general_ci NOT NULL DEFAULT (uuid()),
  `tipo_documento_id` int DEFAULT NULL,
  `documento` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `contrasena` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `rol_id` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `genero_id` int DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` char(36) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- PRIMARY KEYS AND INDEXES
-- =============================================

-- Appointments indexes
ALTER TABLE `citas`
  ADD CONSTRAINT `pk_citas` PRIMARY KEY (`id`),
  ADD KEY `idx_paciente_id` (`paciente_id`),
  ADD KEY `idx_profesional_id` (`profesional_id`),
  ADD KEY `idx_tipo_servicio_id` (`tipo_servicio_id`),
  ADD KEY `idx_estado_id` (`estado_id`);

-- Appointment status indexes
ALTER TABLE `estadocita`
  ADD CONSTRAINT `pk_estadocita` PRIMARY KEY (`id`);

-- Civil status indexes
ALTER TABLE `estadocivil`
  ADD CONSTRAINT `pk_estadocivil` PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_estadocivil_descripcion` (`descripcion`);

-- Gender indexes
ALTER TABLE `generos`
  ADD CONSTRAINT `pk_generos` PRIMARY KEY (`id`);

-- Patients indexes
ALTER TABLE `pacientes`
  ADD CONSTRAINT `pk_pacientes` PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_pacientes_documento` (`documento`),
  ADD KEY `idx_pacientes_tipo_documento` (`tipo_documento_id`),
  ADD KEY `idx_pacientes_genero` (`genero_id`),
  ADD KEY `idx_pacientes_estado_civil` (`estado_civil_id`);

-- Roles indexes
ALTER TABLE `roles`
  ADD CONSTRAINT `pk_roles` PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_roles_nombre` (`nombre`);

-- Service types indexes
ALTER TABLE `tiposervicio`
  ADD CONSTRAINT `pk_tiposervicio` PRIMARY KEY (`id`);

-- Document types indexes
ALTER TABLE `tipos_documento`
  ADD CONSTRAINT `pk_tipos_documento` PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_tipos_documento_codigo` (`codigo`);

-- Users indexes
ALTER TABLE `usuarios`
  ADD CONSTRAINT `pk_usuarios` PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_usuarios_documento` (`documento`),
  ADD KEY `idx_usuarios_tipo_documento` (`tipo_documento_id`),
  ADD KEY `idx_usuarios_rol` (`rol_id`),
  ADD KEY `idx_usuarios_genero` (`genero_id`);

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- Appointments foreign keys
ALTER TABLE `citas`
  ADD CONSTRAINT `fk_citas_estado` FOREIGN KEY (`estado_id`) REFERENCES `estadocita` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_citas_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_citas_profesional` FOREIGN KEY (`profesional_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_citas_tipo_servicio` FOREIGN KEY (`tipo_servicio_id`) REFERENCES `tiposervicio` (`id`) ON DELETE RESTRICT;

-- Patients foreign keys
ALTER TABLE `pacientes`
  ADD CONSTRAINT `fk_pacientes_estado_civil` FOREIGN KEY (`estado_civil_id`) REFERENCES `estadocivil` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pacientes_genero` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pacientes_tipo_documento` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Users foreign keys
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_genero` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_usuarios_tipo_documento` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

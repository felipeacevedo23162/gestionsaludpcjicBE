-- Instrucciones para configurar MySQL
-- Ejecuta estos comandos en tu cliente MySQL (MySQL Workbench, phpMyAdmin, etc.)

-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS gestion_salud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. Usar la base de datos
USE gestion_salud;

-- 3. El resto de las tablas ya están en sql.sql, ejecútalo después de esto

-- 4. Luego ejecuta scripts/seed_data.sql para insertar los datos iniciales
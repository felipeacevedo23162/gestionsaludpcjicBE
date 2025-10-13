# 🗑️ SQLite Eliminado - Configuración MySQL

SQLite ha sido completamente eliminado del proyecto. Ahora necesitas configurar MySQL.

## 📋 **Pasos para configurar MySQL:**

### **Opción 1: Instalar MySQL Server**
1. Descargar MySQL desde: https://dev.mysql.com/downloads/mysql/
2. Instalar y configurar con contraseña de root
3. Crear la base de datos

### **Opción 2: Usar XAMPP (Más fácil)**
1. Descargar XAMPP: https://www.apachefriends.org/
2. Instalar XAMPP
3. Iniciar Apache y MySQL desde el panel de XAMPP
4. Abrir phpMyAdmin: http://localhost/phpmyadmin

## 🔧 **Configurar la base de datos:**

### **1. Crear base de datos:**
```sql
CREATE DATABASE gestion_salud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### **2. Ejecutar estructura:**
- Ejecuta el archivo `sql.sql` para crear las tablas

### **3. Insertar datos iniciales:**
- Ejecuta el archivo `scripts/seed_data.sql` para insertar datos iniciales

### **4. Configurar conexión:**
Edita el archivo `.env` con tus datos de MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gestion_salud
DB_USER=root
DB_PASSWORD=tu_password_mysql
```

## 👤 **Usuario por defecto:**
Después de ejecutar `seed_data.sql`:
- **Documento:** `12345678`
- **Contraseña:** `Admin123!`

## ✅ **Verificación:**
Una vez configurado MySQL, ejecuta:
```bash
npm run dev
```

Deberías ver:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

## 🚀 **Alternativa rápida con Docker:**
Si tienes Docker instalado:
```bash
docker run --name mysql-gestion -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=gestion_salud -p 3306:3306 -d mysql:8.0
```

Luego en `.env`:
```env
DB_PASSWORD=123456
```
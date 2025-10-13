# Gestión de Salud API

API segura para sistema de gestión de citas médicas construida con Express.js, MySQL, JWT y sesiones.

## 🚀 Características

- ✅ **Autenticación JWT + Sesiones**: Doble capa de seguridad
- ✅ **Encriptación de contraseñas**: bcryptjs con salt personalizable
- ✅ **Rate limiting**: Protección contra ataques de fuerza bruta
- ✅ **Validación robusta**: express-validator para todos los endpoints
- ✅ **Middleware de seguridad**: Helmet para headers seguros
- ✅ **CORS configurado**: Control de acceso por origen
- ✅ **Manejo de errores**: Sistema centralizado de errores
- ✅ **Base de datos**: Pool de conexiones MySQL optimizado
- ✅ **Logging**: Morgan para registro de requests
- ✅ **Compresión**: gzip automática
- ✅ **Health checks**: Endpoint de salud del servicio
- ✅ **Paginación**: Resultados paginados por defecto
- ✅ **Filtros avanzados**: Búsqueda y filtrado flexible

## 📋 Requisitos

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis (opcional, para sesiones distribuidas)

## 🛠️ Instalación

1. **Clonar e instalar dependencias**:
   ```bash
   cd gestionsaludpcjic
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Configurar base de datos**:
   - Crear la base de datos MySQL
   - Ejecutar el script `sql.sql` para crear las tablas

4. **Insertar datos iniciales**:
   ```sql
   -- Roles
   INSERT INTO roles (id, nombre) VALUES 
   (1, 'Administrador'),
   (2, 'Médico'),
   (3, 'Recepcionista');

   -- Géneros
   INSERT INTO generos (id, nombre) VALUES 
   (1, 'Masculino'),
   (2, 'Femenino'),
   (3, 'Otro');

   -- Tipos de documento
   INSERT INTO tipos_documento (id, codigo, descripcion) VALUES 
   (1, 'CC', 'Cédula de Ciudadanía'),
   (2, 'TI', 'Tarjeta de Identidad'),
   (3, 'CE', 'Cédula de Extranjería'),
   (4, 'PP', 'Pasaporte');

   -- Estados civiles
   INSERT INTO estadocivil (id, descripcion) VALUES 
   (1, 'Soltero(a)'),
   (2, 'Casado(a)'),
   (3, 'Divorciado(a)'),
   (4, 'Viudo(a)');

   -- Estados de cita
   INSERT INTO estadocita (id, nombre) VALUES 
   (1, 'Programada'),
   (2, 'En curso'),
   (3, 'Completada'),
   (4, 'Cancelada');

   -- Tipos de servicio
   INSERT INTO tiposervicio (id, nombre) VALUES 
   (1, 'Consulta General'),
   (2, 'Consulta Especializada'),
   (3, 'Control'),
   (4, 'Procedimiento');
   ```

5. **Iniciar el servidor**:
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📡 Endpoints de la API

### 🔐 Autenticación (`/api/auth`)

```http
POST /api/auth/login
Content-Type: application/json

{
  "documento": "12345678",
  "contrasena": "MiContraseña123!"
}
```

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 👥 Usuarios (`/api/users`)

```http
GET /api/users?page=1&limit=10&search=juan
Authorization: Bearer <token>
```

```http
GET /api/users/{id}
Authorization: Bearer <token>
```

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo_documento_id": 1,
  "documento": "12345678",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez García",
  "fecha_nacimiento": "1990-05-15",
  "telefono": "+573001234567",
  "contrasena": "MiContraseña123!",
  "rol_id": 2,
  "genero_id": 1
}
```

### 🏥 Pacientes (`/api/patients`)

```http
GET /api/patients?page=1&limit=10&search=maria
Authorization: Bearer <token>
```

```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo_documento_id": 1,
  "documento": "87654321",
  "nombres": "María Elena",
  "apellidos": "González López",
  "fecha_nacimiento": "1985-03-22",
  "telefono": "+573009876543",
  "correo": "maria@email.com",
  "direccion": "Calle 123 #45-67",
  "genero_id": 2,
  "estado_civil_id": 1
}
```

### 📅 Citas (`/api/appointments`)

```http
GET /api/appointments?page=1&estado_id=1&fecha_inicio=2025-09-28
Authorization: Bearer <token>
```

```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "paciente_id": "123e4567-e89b-12d3-a456-426614174000",
  "profesional_id": "789e0123-e89b-12d3-a456-426614174001",
  "fecha_inicio": "2025-09-30T10:00:00",
  "fecha_fin": "2025-09-30T11:00:00",
  "tipo_servicio_id": 1,
  "observaciones": "Consulta de control"
}
```

```http
GET /api/appointments/calendar/view?start=2025-09-28&end=2025-10-05
Authorization: Bearer <token>
```

### 📚 Catálogos (`/api/catalogs`)

```http
GET /api/catalogs/all
Authorization: Bearer <token>
```

```http
GET /api/catalogs/professionals
Authorization: Bearer <token>
```

## 🔒 Características de Seguridad

### Autenticación Multi-Capa
- **JWT Tokens**: Para autenticación stateless
- **Sessions**: Para validación adicional en servidor
- **Refresh Tokens**: Para renovación segura de acceso

### Protección contra Ataques
- **Rate Limiting**: 5 intentos de login por IP cada 15 minutos
- **Account Locking**: Bloqueo temporal después de 5 intentos fallidos
- **Password Policy**: Mínimo 8 caracteres con complejidad
- **SQL Injection**: Prepared statements en todas las consultas
- **XSS Protection**: Headers de seguridad con Helmet
- **CSRF Protection**: SameSite cookies y validación de origen

### Encriptación y Hashing
- **bcryptjs**: Hashing de contraseñas con salt configurable
- **Secure Sessions**: Cookies httpOnly, secure y sameSite
- **HTTPS Ready**: Configuración para producción con SSL

### Validación de Datos
- **Input Sanitization**: Limpieza automática de datos
- **Schema Validation**: Validación estricta con express-validator
- **Type Checking**: Verificación de tipos de datos
- **Business Logic**: Validaciones específicas del negocio

## 🏗️ Arquitectura

```
src/
├── app.js              # Aplicación principal
├── config/
│   └── database.js     # Configuración de base de datos
├── middleware/
│   ├── auth.js         # Autenticación JWT/Session
│   ├── validation.js   # Validaciones de entrada
│   └── error.js        # Manejo de errores
├── routes/
│   ├── auth.js         # Rutas de autenticación
│   ├── users.js        # Gestión de usuarios
│   ├── patients.js     # Gestión de pacientes
│   ├── appointments.js # Gestión de citas
│   └── catalogs.js     # Datos de catálogos
└── utils/
    └── helpers.js      # Funciones utilitarias
```

## 🐳 Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/app.js"]
```

## 📊 Monitoring y Logs

La API incluye:
- **Health Check**: `GET /health`
- **Request Logging**: Morgan con formato configurable
- **Error Tracking**: Logs detallados de errores
- **Performance Metrics**: Tiempo de respuesta por endpoint

## 🔧 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `` |
| `DB_NAME` | Nombre de la BD | `gestion_salud` |
| `JWT_SECRET` | Clave secreta JWT | `required` |
| `SESSION_SECRET` | Clave secreta de sesión | `required` |
| `BCRYPT_ROUNDS` | Rounds de bcrypt | `12` |

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage
```

## 📈 Escalabilidad

- **Connection Pooling**: Pool de conexiones MySQL optimizado
- **Redis Sessions**: Sesiones distribuidas con Redis
- **Rate Limiting**: Control de carga por IP
- **Compression**: Respuestas comprimidas automáticamente
- **Clustering**: Ready para PM2 o cluster nativo

## 🔐 Buenas Prácticas Implementadas

1. **Principio de menor privilegio**: Roles y permisos granulares
2. **Fail securely**: Errores que no exponen información sensible
3. **Defense in depth**: Múltiples capas de seguridad
4. **Input validation**: Validación en frontend y backend
5. **Audit logging**: Registro de todas las acciones críticas
6. **Secure defaults**: Configuraciones seguras por defecto

## 🤝 Contribución

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@gestionsalud.com
- 📱 WhatsApp: +57 300 123 4567
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/gestionsaludpcjic/issues)#   g e s t i o n s a l u d p c j i c B E  
 
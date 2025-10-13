const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Configurando base de datos para XAMPP...');
  
  try {
    // Conectar sin especificar base de datos para crearla
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '' // XAMPP por defecto no tiene contraseña
    });

    console.log('✅ Conectado a MySQL');

    // Crear base de datos
    await connection.execute('CREATE DATABASE IF NOT EXISTS gestion_salud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
    console.log('✅ Base de datos "gestion_salud" creada');

    // Usar la base de datos
    await connection.execute('USE gestion_salud');
    console.log('✅ Usando base de datos gestion_salud');

    // Leer y ejecutar sql.sql
    const sqlFilePath = path.join(__dirname, 'sql.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir por statements y ejecutar uno por uno
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || statement.includes('DROP TABLE')) {
        try {
          await connection.execute(statement);
          console.log('✅ Ejecutado:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error('❌ Error:', error.message);
          }
        }
      }
    }

    // Leer y ejecutar seed_data.sql
    const seedFilePath = path.join(__dirname, 'scripts', 'seed_data.sql');
    const seedContent = fs.readFileSync(seedFilePath, 'utf8');
    
    const seedStatements = seedContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'COMMIT');

    for (const statement of seedStatements) {
      if (statement.includes('INSERT')) {
        try {
          await connection.execute(statement);
          console.log('✅ Datos insertados');
        } catch (error) {
          if (!error.message.includes('Duplicate entry')) {
            console.error('❌ Error insertando datos:', error.message);
          }
        }
      }
    }

    await connection.end();
    
    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('👤 Usuario administrador creado:');
    console.log('   📄 Documento: 12345678');
    console.log('   🔐 Contraseña: Admin123!');
    console.log('\n🚀 Ahora puedes probar la API en Postman');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
    process.exit(1);
  }
}

setupDatabase();
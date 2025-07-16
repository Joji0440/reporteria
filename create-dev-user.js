require('dotenv').config();
const { query } = require('./backend/config/database');

async function createDevUser() {
  try {
    console.log('🔍 Verificando estructura de tabla usuarios...');
    
    // Primero ver qué columnas tiene la tabla usuarios
    const structureResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    
    console.log('📦 Estructura de usuarios:');
    structureResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Ahora buscar usuarios existentes
    const userResult = await query(`
      SELECT id, nombre FROM usuarios 
      WHERE nombre ILIKE '%dev%' OR nombre = 'Usuario Desarrollo'
      LIMIT 1
    `);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`✅ Usuario de desarrollo encontrado: ${user.nombre}`);
      console.log(`📋 UUID: ${user.id}`);
      return user.id;
    }
    
    // Si no existe, crear uno
    console.log('🛠️ Creando usuario de desarrollo...');
    const newUserResult = await query(`
      INSERT INTO usuarios (id, nombre, cedula, rol, tipo_persona)
      VALUES (gen_random_uuid(), 'Usuario Desarrollo', '9999999999', 'administrador', 'Natural')
      RETURNING id, nombre
    `);
    
    const newUser = newUserResult.rows[0];
    console.log(`✅ Usuario de desarrollo creado: ${newUser.nombre}`);
    console.log(`📋 UUID: ${newUser.id}`);
    return newUser.id;
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createDevUser();

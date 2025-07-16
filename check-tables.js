const { query } = require('./backend/config/database');
require('dotenv').config();

const checkTables = async () => {
  try {
    console.log('📋 Verificando estructura de base de datos...');
    
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n🗃️ Tablas disponibles:');
    tables.rows.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Verificar si existe la tabla productos_donados
    const productosTable = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'movimientos_productos'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📦 Estructura de movimientos_productos:');
    productosTable.rows.forEach(c => {
      console.log(`   - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkTables();

const { query } = require('./backend/config/database');
require('dotenv').config();

const initializeDatabase = async () => {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear tabla reportes_generados
    await query(`
      CREATE TABLE IF NOT EXISTS reportes_generados (
        id_reporte SERIAL PRIMARY KEY,
        tipo_reporte TEXT NOT NULL CHECK (tipo_reporte IN ('inventario', 'movimientos', 'donaciones')),
        id_usuario UUID,
        fecha_generacion TIMESTAMPTZ DEFAULT now(),
        parametros_filtro JSONB,
        total_registros INTEGER,
        archivo_exportado TEXT,
        formato_exportacion TEXT CHECK (formato_exportacion IN ('excel', 'csv', 'pdf')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('✅ Tabla reportes_generados creada');

    // Crear tabla inventario_actual
    await query(`
      CREATE TABLE IF NOT EXISTS inventario_actual (
        id_inventario SERIAL PRIMARY KEY,
        nombre_producto TEXT NOT NULL,
        unidad_medida TEXT NOT NULL,
        cantidad_total NUMERIC NOT NULL DEFAULT 0,
        cantidad_disponible NUMERIC NOT NULL DEFAULT 0,
        productos_por_vencer INTEGER DEFAULT 0,
        fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
        UNIQUE(nombre_producto, unidad_medida)
      );
    `);
    console.log('✅ Tabla inventario_actual creada');

    // Crear tabla movimientos_productos
    await query(`
      CREATE TABLE IF NOT EXISTS movimientos_productos (
        id_movimiento SERIAL PRIMARY KEY,
        tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'egreso')),
        id_producto INTEGER,
        id_usuario UUID,
        id_solicitud INTEGER,
        cantidad NUMERIC NOT NULL,
        fecha_movimiento TIMESTAMPTZ DEFAULT now(),
        observaciones TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('✅ Tabla movimientos_productos creada');

    // Crear índices
    await query(`CREATE INDEX IF NOT EXISTS idx_reportes_tipo_fecha ON reportes_generados(tipo_reporte, fecha_generacion);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes_generados(id_usuario);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha ON movimientos_productos(tipo_movimiento, fecha_movimiento);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_productos(id_producto);`);
    console.log('✅ Índices creados');

    // Insertar datos de prueba para inventario
    await query(`
      INSERT INTO inventario_actual (nombre_producto, unidad_medida, cantidad_total, cantidad_disponible, productos_por_vencer)
      VALUES 
        ('Arroz', 'Kg', 100, 80, 2),
        ('Frijoles', 'Kg', 50, 45, 0),
        ('Aceite', 'Litros', 30, 25, 1),
        ('Azúcar', 'Kg', 75, 60, 3),
        ('Pasta', 'Kg', 40, 35, 0)
      ON CONFLICT (nombre_producto, unidad_medida) DO NOTHING;
    `);
    console.log('✅ Datos de prueba insertados');

    console.log('🎉 Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
};

initializeDatabase();

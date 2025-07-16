-- Script para crear las tablas del sistema de reportería del banco de alimentos
-- Ejecutar después de tener las tablas base del sistema

-- Tabla para registrar cada reporte generado
CREATE TABLE reportes_generados (
    id_reporte SERIAL PRIMARY KEY,
    tipo_reporte TEXT NOT NULL CHECK (tipo_reporte IN ('inventario', 'movimientos', 'donaciones')),
    id_usuario UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_generacion TIMESTAMPTZ DEFAULT now(),
    parametros_filtro JSONB, -- Para guardar filtros aplicados (fechas, usuarios, productos, etc.)
    total_registros INTEGER,
    archivo_exportado TEXT, -- Ruta del archivo si se exportó
    formato_exportacion TEXT CHECK (formato_exportacion IN ('excel', 'csv', 'pdf')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para el inventario actual (vista materializada para optimización)
CREATE TABLE inventario_actual (
    id_inventario SERIAL PRIMARY KEY,
    nombre_producto TEXT NOT NULL,
    unidad_medida TEXT NOT NULL,
    cantidad_total NUMERIC NOT NULL DEFAULT 0,
    cantidad_disponible NUMERIC NOT NULL DEFAULT 0, -- Descontando solicitudes pendientes
    productos_por_vencer INTEGER DEFAULT 0, -- Productos que vencen en los próximos 30 días
    fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nombre_producto, unidad_medida)
);

-- Tabla para registrar todos los movimientos de productos
CREATE TABLE movimientos_productos (
    id_movimiento SERIAL PRIMARY KEY,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'egreso')),
    id_producto INT REFERENCES productos_donados(id_producto) ON DELETE SET NULL,
    id_usuario UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    id_solicitud INT REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL, -- Para egresos
    cantidad NUMERIC NOT NULL,
    fecha_movimiento TIMESTAMPTZ DEFAULT now(),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas de reportes
CREATE INDEX idx_reportes_tipo_fecha ON reportes_generados(tipo_reporte, fecha_generacion);
CREATE INDEX idx_reportes_usuario ON reportes_generados(id_usuario);
CREATE INDEX idx_movimientos_tipo_fecha ON movimientos_productos(tipo_movimiento, fecha_movimiento);
CREATE INDEX idx_movimientos_producto ON movimientos_productos(id_producto);
CREATE INDEX idx_productos_donados_fecha ON productos_donados(fecha_donacion);
CREATE INDEX idx_productos_donados_usuario ON productos_donados(id_usuario);

-- Trigger para mantener actualizado el inventario_actual
CREATE OR REPLACE FUNCTION actualizar_inventario() 
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular inventario para el producto afectado
    DELETE FROM inventario_actual 
    WHERE nombre_producto = COALESCE(NEW.nombre_producto, OLD.nombre_producto)
    AND unidad_medida = COALESCE(NEW.unidad_medida, OLD.unidad_medida);
    
    INSERT INTO inventario_actual (nombre_producto, unidad_medida, cantidad_total, cantidad_disponible, productos_por_vencer)
    SELECT 
        pd.nombre_producto,
        pd.unidad_medida,
        COALESCE(SUM(pd.cantidad), 0) as cantidad_total,
        COALESCE(SUM(pd.cantidad), 0) - COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_disponible,
        COUNT(CASE WHEN pd.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as productos_por_vencer
    FROM productos_donados pd
    LEFT JOIN detalles_solicitud ds ON pd.id_producto = ds.id_producto
    WHERE pd.nombre_producto = COALESCE(NEW.nombre_producto, OLD.nombre_producto)
    AND pd.unidad_medida = COALESCE(NEW.unidad_medida, OLD.unidad_medida)
    GROUP BY pd.nombre_producto, pd.unidad_medida;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas relevantes
CREATE TRIGGER trigger_actualizar_inventario_productos
    AFTER INSERT OR UPDATE OR DELETE ON productos_donados
    FOR EACH ROW EXECUTE FUNCTION actualizar_inventario();

CREATE TRIGGER trigger_actualizar_inventario_detalles
    AFTER INSERT OR UPDATE OR DELETE ON detalles_solicitud
    FOR EACH ROW EXECUTE FUNCTION actualizar_inventario();

-- Función para registrar movimientos automáticamente
CREATE OR REPLACE FUNCTION registrar_movimiento_producto() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Registrar ingreso por donación
        INSERT INTO movimientos_productos (tipo_movimiento, id_producto, id_usuario, cantidad, observaciones)
        VALUES ('ingreso', NEW.id_producto, NEW.id_usuario, NEW.cantidad, 'Donación registrada');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.cantidad != NEW.cantidad THEN
        -- Registrar ajuste de inventario
        INSERT INTO movimientos_productos (tipo_movimiento, id_producto, id_usuario, cantidad, observaciones)
        VALUES (
            CASE WHEN NEW.cantidad > OLD.cantidad THEN 'ingreso' ELSE 'egreso' END,
            NEW.id_producto, 
            NEW.id_usuario, 
            ABS(NEW.cantidad - OLD.cantidad),
            'Ajuste de inventario'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar movimientos automáticamente
CREATE TRIGGER trigger_registrar_movimiento_donacion
    AFTER INSERT OR UPDATE ON productos_donados
    FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_producto();

-- Poblar inventario inicial
INSERT INTO inventario_actual (nombre_producto, unidad_medida, cantidad_total, cantidad_disponible, productos_por_vencer)
SELECT 
    pd.nombre_producto,
    pd.unidad_medida,
    COALESCE(SUM(pd.cantidad), 0) as cantidad_total,
    COALESCE(SUM(pd.cantidad), 0) - COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_disponible,
    COUNT(CASE WHEN pd.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as productos_por_vencer
FROM productos_donados pd
LEFT JOIN detalles_solicitud ds ON pd.id_producto = ds.id_producto
GROUP BY pd.nombre_producto, pd.unidad_medida;

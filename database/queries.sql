-- Consultas SQL para los reportes del banco de alimentos

-- ===== REPORTE DE INVENTARIO =====
-- Muestra la cantidad total de cada producto disponible
SELECT 
    ia.nombre_producto,
    ia.unidad_medida,
    ia.cantidad_total,
    ia.cantidad_disponible,
    ia.productos_por_vencer,
    ia.fecha_ultima_actualizacion,
    -- Valor promedio por unidad (si se tienen datos de costos)
    CASE 
        WHEN ia.cantidad_total > 0 THEN ROUND((ia.cantidad_total - ia.cantidad_disponible) * 100.0 / ia.cantidad_total, 2)
        ELSE 0 
    END as porcentaje_utilizado
FROM inventario_actual ia
WHERE ia.cantidad_total > 0
ORDER BY ia.cantidad_disponible DESC, ia.nombre_producto;

-- ===== REPORTE DE MOVIMIENTOS =====
-- Muestra el historial de ingresos y egresos
SELECT 
    mp.fecha_movimiento,
    mp.tipo_movimiento,
    pd.nombre_producto,
    pd.unidad_medida,
    mp.cantidad,
    u.nombre as usuario_responsable,
    u.rol as rol_usuario,
    mp.observaciones,
    CASE 
        WHEN mp.id_solicitud IS NOT NULL THEN 'Entrega por solicitud'
        WHEN mp.tipo_movimiento = 'ingreso' THEN 'Donación'
        ELSE 'Movimiento manual'
    END as origen_movimiento
FROM movimientos_productos mp
LEFT JOIN productos_donados pd ON mp.id_producto = pd.id_producto
LEFT JOIN usuarios u ON mp.id_usuario = u.id
WHERE mp.fecha_movimiento >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
  AND mp.fecha_movimiento <= COALESCE($2, CURRENT_DATE)
  AND ($3 IS NULL OR mp.tipo_movimiento = $3)
  AND ($4 IS NULL OR pd.nombre_producto ILIKE '%' || $4 || '%')
ORDER BY mp.fecha_movimiento DESC, mp.id_movimiento DESC;

-- ===== REPORTE DE PRODUCTOS DONADOS =====
-- Muestra todas las donaciones realizadas
SELECT 
    pd.fecha_donacion,
    u.nombre as donante,
    u.tipo_persona,
    u.ruc,
    u.cedula,
    pd.nombre_producto,
    pd.descripcion,
    pd.cantidad,
    pd.unidad_medida,
    pd.fecha_caducidad,
    CASE 
        WHEN pd.fecha_caducidad <= CURRENT_DATE THEN 'Vencido'
        WHEN pd.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por vencer'
        ELSE 'Vigente'
    END as estado_producto,
    -- Calcular cuánto se ha utilizado de esta donación
    COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_utilizada,
    pd.cantidad - COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_disponible
FROM productos_donados pd
LEFT JOIN usuarios u ON pd.id_usuario = u.id
LEFT JOIN detalles_solicitud ds ON pd.id_producto = ds.id_producto
WHERE pd.fecha_donacion >= COALESCE($1, CURRENT_DATE - INTERVAL '90 days')
  AND pd.fecha_donacion <= COALESCE($2, CURRENT_DATE)
  AND ($3 IS NULL OR u.id = $3)
  AND ($4 IS NULL OR pd.nombre_producto ILIKE '%' || $4 || '%')
GROUP BY pd.id_producto, pd.fecha_donacion, u.nombre, u.tipo_persona, u.ruc, u.cedula, 
         pd.nombre_producto, pd.descripcion, pd.cantidad, pd.unidad_medida, pd.fecha_caducidad
ORDER BY pd.fecha_donacion DESC, pd.id_producto DESC;

-- ===== CONSULTAS AUXILIARES =====

-- Resumen estadístico del inventario
SELECT 
    COUNT(DISTINCT nombre_producto) as total_productos_diferentes,
    SUM(cantidad_total) as cantidad_total_inventario,
    SUM(cantidad_disponible) as cantidad_disponible_inventario,
    SUM(productos_por_vencer) as total_productos_por_vencer,
    ROUND(AVG(CASE WHEN cantidad_total > 0 THEN (cantidad_total - cantidad_disponible) * 100.0 / cantidad_total ELSE 0 END), 2) as porcentaje_promedio_utilizado
FROM inventario_actual
WHERE cantidad_total > 0;

-- Top 10 productos más donados (por cantidad)
SELECT 
    pd.nombre_producto,
    pd.unidad_medida,
    COUNT(*) as numero_donaciones,
    SUM(pd.cantidad) as cantidad_total_donada,
    COUNT(DISTINCT pd.id_usuario) as donantes_diferentes
FROM productos_donados pd
WHERE pd.fecha_donacion >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY pd.nombre_producto, pd.unidad_medida
ORDER BY cantidad_total_donada DESC
LIMIT 10;

-- Top donantes por cantidad
SELECT 
    u.nombre,
    u.tipo_persona,
    COUNT(pd.id_producto) as numero_donaciones,
    COUNT(DISTINCT pd.nombre_producto) as productos_diferentes_donados,
    SUM(pd.cantidad) as cantidad_total_donada
FROM usuarios u
INNER JOIN productos_donados pd ON u.id = pd.id_usuario
WHERE pd.fecha_donacion >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY u.id, u.nombre, u.tipo_persona
ORDER BY cantidad_total_donada DESC
LIMIT 10;

-- Productos próximos a vencer (próximos 30 días)
SELECT 
    pd.nombre_producto,
    pd.unidad_medida,
    pd.cantidad,
    pd.fecha_caducidad,
    pd.fecha_caducidad - CURRENT_DATE as dias_para_vencer,
    u.nombre as donante
FROM productos_donados pd
LEFT JOIN usuarios u ON pd.id_usuario = u.id
LEFT JOIN detalles_solicitud ds ON pd.id_producto = ds.id_producto
WHERE pd.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days'
  AND pd.fecha_caducidad > CURRENT_DATE
  AND (ds.cantidad_entregada IS NULL OR pd.cantidad > ds.cantidad_entregada)
ORDER BY pd.fecha_caducidad ASC;

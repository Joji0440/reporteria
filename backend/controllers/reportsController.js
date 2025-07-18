const { query, transaction } = require('../config/database');
const ExcelJS = require('exceljs');
const csv = require('fast-csv');
const fs = require('fs').promises;
const path = require('path');

class ReportsController {
  
  // ===== REPORTE DE INVENTARIO =====
  async getInventoryReport(req, res) {
    try {
      const { export_format } = req.query;
      const userId = req.user?.id;

      // Consulta del inventario
      const inventoryQuery = `
        SELECT 
          ia.nombre_producto,
          ia.unidad_medida,
          ia.cantidad_total,
          ia.cantidad_disponible,
          ia.productos_por_vencer,
          ia.fecha_ultima_actualizacion,
          CASE 
            WHEN ia.cantidad_total > 0 THEN ROUND((ia.cantidad_total - ia.cantidad_disponible) * 100.0 / ia.cantidad_total, 2)
            ELSE 0 
          END as porcentaje_utilizado
        FROM inventario_actual ia
        WHERE ia.cantidad_total > 0
        ORDER BY ia.cantidad_disponible DESC, ia.nombre_producto;
      `;

      const result = await query(inventoryQuery);
      const reportData = result.rows;

      // Si se solicita exportación
      if (export_format && ['excel', 'csv'].includes(export_format)) {
        const filePath = await this.exportReport(reportData, 'inventario', export_format);
        
        // Registrar el reporte SOLO cuando se exporta
        await this.registerReport('inventario', userId, {}, reportData.length, export_format);
        
        // Configurar headers para forzar la extensión correcta
        const fileName = path.basename(filePath);
        
        if (export_format === 'excel') {
          // Forzar que el navegador descargue con extensión .xlsx
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        }
        
        console.log(`⬇️ Descargando archivo: ${fileName}`);
        return res.download(filePath, fileName);
      }

      res.json({
        success: true,
        data: reportData,
        total: reportData.length,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en reporte de inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de inventario',
        error: error.message
      });
    }
  }

  // ===== REPORTE DE MOVIMIENTOS =====
  async getMovementsReport(req, res) {
    try {
      const { 
        fecha_inicio, 
        fecha_fin, 
        tipo_movimiento, 
        producto, 
        export_format 
      } = req.query;
      const userId = req.user?.id;

      const movementsQuery = `
        SELECT 
          mp.fecha_movimiento,
          mp.tipo_movimiento,
          COALESCE(pd.nombre_producto, 'Producto ' || mp.id_producto) as nombre_producto,
          COALESCE(pd.unidad_medida, 'Unidad') as unidad_medida,
          mp.cantidad,
          COALESCE(u.nombre, 'Usuario ' || mp.id_usuario) as usuario_responsable,
          COALESCE(u.rol, 'Sin rol') as rol_usuario,
          COALESCE(mp.observaciones, 'Sin observaciones') as observaciones,
          CASE 
            WHEN mp.id_solicitud IS NOT NULL THEN 'Entrega por solicitud'
            WHEN mp.tipo_movimiento = 'ingreso' THEN 'Donación'
            ELSE 'Movimiento manual'
          END as origen_movimiento
        FROM movimientos_productos mp
        LEFT JOIN productos_donados pd ON mp.id_producto = pd.id_producto
        LEFT JOIN usuarios u ON mp.id_usuario = u.id
        WHERE mp.fecha_movimiento >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
          AND mp.fecha_movimiento <= COALESCE($2::date, CURRENT_DATE + INTERVAL '1 day')
          AND ($3::text IS NULL OR mp.tipo_movimiento = $3::text)
          AND ($4::text IS NULL OR COALESCE(pd.nombre_producto, 'Producto ' || mp.id_producto) ILIKE '%' || $4 || '%')
        ORDER BY mp.fecha_movimiento DESC, mp.id_movimiento DESC;
      `;

      const params = [
        fecha_inicio || null, 
        fecha_fin || null, 
        tipo_movimiento || null, 
        producto || null
      ];
      const result = await query(movementsQuery, params);
      const reportData = result.rows;

      // Crear objeto filters siempre
      const filters = { fecha_inicio, fecha_fin, tipo_movimiento, producto };

      // Exportación si se solicita
      if (export_format && ['excel', 'csv'].includes(export_format)) {
        const filePath = await this.exportReport(reportData, 'movimientos', export_format);
        
        // Registrar el reporte SOLO cuando se exporta
        await this.registerReport('movimientos', userId, filters, reportData.length, export_format);
        
        // Configurar headers para forzar la extensión correcta
        const fileName = path.basename(filePath);
        
        if (export_format === 'excel') {
          // Forzar que el navegador descargue con extensión .xlsx
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        }
        
        console.log(`⬇️ Descargando archivo: ${fileName}`);
        return res.download(filePath, fileName);
      }

      res.json({
        success: true,
        data: reportData,
        total: reportData.length,
        filters: filters,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en reporte de movimientos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de movimientos',
        error: error.message
      });
    }
  }

  // ===== REPORTE DE DONACIONES =====
  async getDonationsReport(req, res) {
    try {
      const { 
        fecha_inicio, 
        fecha_fin, 
        id_usuario, 
        producto, 
        export_format 
      } = req.query;
      const currentUserId = req.user?.id;

      const donationsQuery = `
        SELECT 
          pd.fecha_donacion,
          COALESCE(u.nombre, 'Donante anónimo') as donante,
          COALESCE(u.tipo_persona, 'Natural') as tipo_persona,
          COALESCE(u.ruc, 'N/A') as ruc,
          COALESCE(u.cedula, 'N/A') as cedula,
          pd.nombre_producto,
          COALESCE(pd.descripcion, 'Sin descripción') as descripcion,
          pd.cantidad,
          pd.unidad_medida,
          pd.fecha_caducidad,
          CASE 
            WHEN pd.fecha_caducidad <= CURRENT_DATE THEN 'Vencido'
            WHEN pd.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por vencer'
            ELSE 'Vigente'
          END as estado_producto,
          COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_utilizada,
          pd.cantidad - COALESCE(SUM(ds.cantidad_entregada), 0) as cantidad_disponible
        FROM productos_donados pd
        LEFT JOIN usuarios u ON pd.id_usuario = u.id
        LEFT JOIN detalles_solicitud ds ON pd.id_producto = ds.id_producto
        WHERE pd.fecha_donacion >= COALESCE($1::date, CURRENT_DATE - INTERVAL '90 days')
          AND pd.fecha_donacion <= COALESCE($2::date, CURRENT_DATE)
          AND ($3::uuid IS NULL OR u.id = $3::uuid)
          AND ($4::text IS NULL OR pd.nombre_producto ILIKE '%' || $4 || '%')
        GROUP BY pd.id_producto, pd.fecha_donacion, u.nombre, u.tipo_persona, u.ruc, u.cedula, 
                 pd.nombre_producto, pd.descripcion, pd.cantidad, pd.unidad_medida, pd.fecha_caducidad
        ORDER BY pd.fecha_donacion DESC, pd.id_producto DESC;
      `;

      const params = [
        fecha_inicio || null, 
        fecha_fin || null, 
        id_usuario || null, 
        producto || null
      ];
      const result = await query(donationsQuery, params);
      const reportData = result.rows;

      // DEBUG: Verificar tipos de datos
      if (reportData.length > 0) {
        console.log('🔍 DEBUG - Primer item de donaciones:', {
          cantidad_tipo: typeof reportData[0].cantidad,
          cantidad_valor: reportData[0].cantidad,
          cantidad_utilizada_tipo: typeof reportData[0].cantidad_utilizada,
          cantidad_utilizada_valor: reportData[0].cantidad_utilizada,
          cantidad_disponible_tipo: typeof reportData[0].cantidad_disponible,
          cantidad_disponible_valor: reportData[0].cantidad_disponible
        });
      }

      // Crear objeto filters siempre
      const filters = { fecha_inicio, fecha_fin, id_usuario, producto };

      // Exportación si se solicita
      if (export_format && ['excel', 'csv'].includes(export_format)) {
        const filePath = await this.exportReport(reportData, 'donaciones', export_format);
        
        // Registrar el reporte SOLO cuando se exporta
        await this.registerReport('donaciones', currentUserId, filters, reportData.length, export_format);
        
        // Configurar headers para forzar la extensión correcta
        const fileName = path.basename(filePath);
        
        if (export_format === 'excel') {
          // Forzar que el navegador descargue con extensión .xlsx
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        }
        
        console.log(`⬇️ Descargando archivo: ${fileName}`);
        return res.download(filePath, fileName);
      }

      res.json({
        success: true,
        data: reportData,
        total: reportData.length,
        filters: filters,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en reporte de donaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de donaciones',
        error: error.message
      });
    }
  }

  // ===== OBTENER HISTORIAL DE REPORTES =====
  async getReportsHistory(req, res) {
    try {
      const { tipo_reporte, limit = 50, offset = 0 } = req.query;
      
      let historyQuery = `
        SELECT 
          rg.id_reporte,
          rg.tipo_reporte,
          u.nombre as usuario_generador,
          rg.fecha_generacion,
          rg.parametros_filtro,
          rg.total_registros,
          rg.archivo_exportado,
          rg.formato_exportacion
        FROM reportes_generados rg
        LEFT JOIN usuarios u ON rg.id_usuario = u.id
      `;
      
      const params = [];
      let whereClause = '';
      
      if (tipo_reporte) {
        whereClause = 'WHERE rg.tipo_reporte = $1';
        params.push(tipo_reporte);
      }
      
      historyQuery += whereClause + ` 
        ORDER BY rg.fecha_generacion DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await query(historyQuery, params);
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo historial de reportes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de reportes',
        error: error.message
      });
    }
  }

  // ===== ESTADÍSTICAS DEL DASHBOARD =====
  async getDashboardStats(req, res) {
    try {
      // Obtener estadísticas en paralelo
      const [inventoryCount, activeUsersCount, reportsCount, monthlyMovements] = await Promise.all([
        // Productos en inventario
        query('SELECT COUNT(*) as count FROM inventario_actual WHERE cantidad_total > 0'),
        
        // Donantes activos (usuarios que han hecho donaciones en los últimos 30 días)
        query(`
          SELECT COUNT(DISTINCT pd.id_usuario) as count 
          FROM productos_donados pd 
          WHERE pd.fecha_donacion >= CURRENT_DATE - INTERVAL '30 days'
        `),
        
        // Reportes generados este mes
        query(`
          SELECT COUNT(*) as count 
          FROM reportes_generados 
          WHERE fecha_generacion >= DATE_TRUNC('month', CURRENT_DATE)
        `),
        
        // Movimientos del mes actual
        query(`
          SELECT COUNT(*) as count 
          FROM movimientos_productos 
          WHERE fecha_movimiento >= DATE_TRUNC('month', CURRENT_DATE)
        `)
      ]);

      const stats = {
        inventoryProducts: parseInt(inventoryCount.rows[0].count),
        activeUsers: parseInt(activeUsersCount.rows[0].count),
        generatedReports: parseInt(reportsCount.rows[0].count),
        monthlyMovements: parseInt(monthlyMovements.rows[0].count)
      };

      res.json({
        success: true,
        data: stats,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener estadísticas'
      });
    }
  }

  // ===== FUNCIONES AUXILIARES =====
  
  async registerReport(tipo, userId, filters, totalRecords, exportFormat = null) {
    try {
      const insertQuery = `
        INSERT INTO reportes_generados 
        (tipo_reporte, id_usuario, parametros_filtro, total_registros, formato_exportacion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_reporte;
      `;
      
      const params = [
        tipo, 
        userId, 
        JSON.stringify(filters), 
        totalRecords, 
        exportFormat
      ];
      
      const result = await query(insertQuery, params);
      console.log(`✅ Reporte registrado exitosamente: ID ${result.rows[0].id_reporte}`);
      return result.rows[0].id_reporte;
    } catch (error) {
      console.error('Error registrando reporte:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  async exportReport(data, reportType, format) {
    try {
      const exportsDir = path.join(__dirname, '../../exports');
      await fs.mkdir(exportsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = format === 'excel' ? 'xlsx' : format;
      const fileName = `${reportType}_${timestamp}.${fileExtension}`;
      const filePath = path.join(exportsDir, fileName);
      
      console.log(`📁 Creando archivo: ${fileName} (formato: ${format})`);

      if (format === 'excel') {
        // Crear workbook con configuración explícita
        const workbook = new ExcelJS.Workbook();
        
        // Configurar propiedades del workbook
        workbook.creator = 'Sistema de Reportería - Banco de Alimentos';
        workbook.lastModifiedBy = 'Sistema de Reportería';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();
        
        // Crear worksheet con nombre descriptivo
        const sheetName = reportType === 'inventario' ? 'Inventario' : 
                         reportType === 'movimientos' ? 'Movimientos' : 
                         reportType === 'donaciones' ? 'Donaciones' : 'Reporte';
        const worksheet = workbook.addWorksheet(sheetName);

        if (data.length > 0) {
          // Obtener las columnas de los datos con nombres más descriptivos
          const columns = Object.keys(data[0]).map(key => {
            let header = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            
            // Mejorar nombres específicos
            if (key === 'nombre_producto') header = 'Producto';
            if (key === 'unidad_medida') header = 'Unidad de Medida';
            if (key === 'cantidad_total') header = 'Cantidad Total';
            if (key === 'cantidad_disponible') header = 'Cantidad Disponible';
            if (key === 'fecha_donacion') header = 'Fecha de Donación';
            if (key === 'fecha_movimiento') header = 'Fecha de Movimiento';
            if (key === 'tipo_movimiento') header = 'Tipo de Movimiento';
            if (key === 'fecha_caducidad') header = 'Fecha de Caducidad';
            if (key === 'porcentaje_utilizado') header = 'Porcentaje Utilizado (%)';
            
            return {
              header: header,
              key: key,
              width: Math.max(header.length + 5, 15)
            };
          });

          worksheet.columns = columns;

          // Agregar los datos
          data.forEach(row => {
            // Procesar fechas para que aparezcan correctamente
            const processedRow = { ...row };
            Object.keys(processedRow).forEach(key => {
              if (key.includes('fecha') && processedRow[key]) {
                processedRow[key] = new Date(processedRow[key]);
              }
            });
            worksheet.addRow(processedRow);
          });

          // Estilo para los encabezados
          worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF4472C4' }
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });

          // Aplicar formato a las celdas de datos
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              row.eachCell((cell, colNumber) => {
                cell.border = {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' }
                };
                
                // Alineación específica para números
                if (typeof cell.value === 'number') {
                  cell.alignment = { horizontal: 'right' };
                }
                
                // Formato para fechas
                if (cell.value instanceof Date) {
                  cell.numFmt = 'dd/mm/yyyy';
                  cell.alignment = { horizontal: 'center' };
                }
              });
            }
          });
          
          // Auto-ajustar columnas
          worksheet.columns.forEach(column => {
            if (column.eachCell) {
              let maxLength = 0;
              column.eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                  maxLength = columnLength;
                }
              });
              column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            }
          });
        }

        // Guardar el archivo con configuración específica
        await workbook.xlsx.writeFile(filePath, {
          filename: filePath,
          useStyles: true,
          useSharedStrings: true
        });
        
      } else if (format === 'csv') {
        await new Promise((resolve, reject) => {
          csv.writeToPath(filePath, data, { headers: true })
            .on('error', reject)
            .on('finish', resolve);
        });
      }

      return filePath;
    } catch (error) {
      console.error('Error exportando reporte:', error);
      throw new Error('Error al exportar el reporte: ' + error.message);
    }
  }
}

module.exports = ReportsController;

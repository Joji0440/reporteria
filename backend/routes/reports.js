const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Crear instancia del controlador
const reportsController = new ReportsController();

// Middleware de autenticación para todas las rutas de reportes
router.use(authenticateToken);

// ===== RUTAS DE REPORTES =====

/**
 * GET /api/reports/inventory
 * Genera reporte de inventario actual
 * Query params: export_format (excel|csv)
 */
router.get('/inventory', (req, res) => reportsController.getInventoryReport(req, res));

/**
 * GET /api/reports/movements
 * Genera reporte de movimientos de productos
 * Query params: 
 *   - fecha_inicio (YYYY-MM-DD)
 *   - fecha_fin (YYYY-MM-DD)
 *   - tipo_movimiento (ingreso|egreso)
 *   - producto (string para buscar)
 *   - export_format (excel|csv)
 */
router.get('/movements', (req, res) => reportsController.getMovementsReport(req, res));

/**
 * GET /api/reports/donations
 * Genera reporte de productos donados
 * Query params:
 *   - fecha_inicio (YYYY-MM-DD)
 *   - fecha_fin (YYYY-MM-DD)
 *   - id_usuario (UUID del donante)
 *   - producto (string para buscar)
 *   - export_format (excel|csv)
 */
router.get('/donations', (req, res) => reportsController.getDonationsReport(req, res));

/**
 * GET /api/reports/history
 * Obtiene historial de reportes generados
 * Query params:
 *   - tipo_reporte (inventario|movimientos|donaciones)
 *   - limit (número de registros)
 *   - offset (paginación)
 */
router.get('/history', (req, res) => reportsController.getReportsHistory(req, res));

/**
 * GET /api/reports/dashboard-stats
 * Obtiene estadísticas para el dashboard
 */
router.get('/dashboard-stats', (req, res) => reportsController.getDashboardStats(req, res));

module.exports = router;

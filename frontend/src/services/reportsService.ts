import api from './api';

export interface ReportFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_movimiento?: 'ingreso' | 'egreso';
  id_usuario?: string;
  producto?: string;
  export_format?: 'excel' | 'csv';
}

export interface DashboardStats {
  inventoryProducts: number;
  activeUsers: number;
  generatedReports: number;
  monthlyMovements: number;
}

export interface InventoryItem {
  nombre_producto: string;
  unidad_medida: string;
  cantidad_total: string; // Viene como string de PostgreSQL
  cantidad_disponible: string; // Viene como string de PostgreSQL
  productos_por_vencer: number;
  fecha_ultima_actualizacion: string;
  porcentaje_utilizado: string; // Viene como string de PostgreSQL
}

export interface MovementItem {
  fecha_movimiento: string;
  tipo_movimiento: 'ingreso' | 'egreso';
  nombre_producto: string;
  unidad_medida: string;
  cantidad: number;
  usuario_responsable: string;
  rol_usuario: string;
  observaciones: string;
  origen_movimiento: string;
}

export interface DonationItem {
  fecha_donacion: string;
  donante: string;
  tipo_persona: string;
  ruc: string;
  cedula: string;
  nombre_producto: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  fecha_caducidad: string;
  estado_producto: 'Vigente' | 'Por vencer' | 'Vencido';
  cantidad_utilizada: number;
  cantidad_disponible: number;
}

export interface ReportHistory {
  id_reporte: number;
  tipo_reporte: string;
  usuario_generador: string;
  fecha_generacion: string;
  parametros_filtro: any;
  total_registros: number;
  archivo_exportado: string;
  formato_exportacion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  filters?: any;
  generatedAt?: string;
  message?: string;
  error?: string;
}

class ReportsService {
  
  // ===== REPORTE DE INVENTARIO =====
  async getInventoryReport(exportFormat?: 'excel' | 'csv'): Promise<ApiResponse<InventoryItem[]>> {
    const params = exportFormat ? { export_format: exportFormat } : {};
    const response = await api.get('/api/reports/inventory', { params });
    return response.data;
  }

  // ===== REPORTE DE MOVIMIENTOS =====
  async getMovementsReport(filters: ReportFilters = {}): Promise<ApiResponse<MovementItem[]>> {
    const response = await api.get('/api/reports/movements', { params: filters });
    return response.data;
  }

  // ===== REPORTE DE DONACIONES =====
  async getDonationsReport(filters: ReportFilters = {}): Promise<ApiResponse<DonationItem[]>> {
    const response = await api.get('/api/reports/donations', { params: filters });
    return response.data;
  }

  // ===== HISTORIAL DE REPORTES =====
  async getReportsHistory(filters: {
    tipo_reporte?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<ReportHistory[]>> {
    const response = await api.get('/api/reports/history', { params: filters });
    return response.data;
  }

  // ===== EXPORTAR REPORTE =====
  async exportReport(
    reportType: 'inventory' | 'movements' | 'donations',
    format: 'excel' | 'csv',
    filters: ReportFilters = {}
  ): Promise<Blob> {
    const endpoint = `/api/reports/${reportType}`;
    const params = { ...filters, export_format: format };
    
    const response = await api.get(endpoint, {
      params,
      responseType: 'blob',
    });
    
    return response.data;
  }

  // ===== DESCARGAR ARCHIVO =====
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ===== GENERAR NOMBRE DE ARCHIVO =====
  generateFilename(reportType: string, format: string): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('es-ES', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(':', '');
    
    const reportNames = {
      inventory: 'inventario',
      movements: 'movimientos',
      donations: 'donaciones'
    };

    const reportName = reportNames[reportType as keyof typeof reportNames] || reportType;
    return `reporte_${reportName}_${date}_${time}.${format}`;
  }

  // ===== ESTADÍSTICAS DEL DASHBOARD =====
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/api/reports/dashboard-stats');
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }
}

const reportsService = new ReportsService();
export default reportsService;

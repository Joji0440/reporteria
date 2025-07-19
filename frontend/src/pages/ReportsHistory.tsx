import React, { useState, useEffect } from 'react';
import { History, FileText, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsService, { ReportHistory } from '../services/reportsService';
import './ReportPage.css';

const ReportsHistory: React.FC = () => {
  const [data, setData] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tipo_reporte: '',
    limit: 50,
    offset: 0
  });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getReportsHistory(filters);
      setData(response.data);
      toast.success('Historial actualizado');
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar el historial de reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? (key === 'limit' ? 50 : 0) : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipo_reporte: '',
      limit: 50,
      offset: 0
    });
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getReportTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'inventario': 'Inventario',
      'movimientos': 'Movimientos',
      'donaciones': 'Donaciones'
    };
    return types[type] || type;
  };

  const getFormatLabel = (format: string) => {
    if (!format) return 'Vista web';
    return format.toUpperCase();
  };

  const formatFilters = (parametros: any) => {
    if (!parametros || Object.keys(parametros).length === 0) {
      return 'Sin filtros';
    }
    
    const filterLabels: string[] = [];
    
    if (parametros.fecha_inicio) {
      filterLabels.push(`Desde: ${new Date(parametros.fecha_inicio).toLocaleDateString('es-ES')}`);
    }
    
    if (parametros.fecha_fin) {
      filterLabels.push(`Hasta: ${new Date(parametros.fecha_fin).toLocaleDateString('es-ES')}`);
    }
    
    if (parametros.tipo_movimiento) {
      filterLabels.push(`Tipo: ${parametros.tipo_movimiento}`);
    }
    
    if (parametros.producto) {
      filterLabels.push(`Producto: ${parametros.producto}`);
    }
    
    if (parametros.id_usuario) {
      filterLabels.push(`Usuario específico`);
    }
    
    return filterLabels.length > 0 ? filterLabels.join(', ') : 'Sin filtros';
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="header-content">
          <div className="title-section">
            <History className="title-icon" />
            <div>
              <h1>Historial de Reportes</h1>
              <p>Registro de todos los reportes generados</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={loadHistory} 
              disabled={loading}
              className="btn btn-secondary"
            >
              <History className={`icon ${loading ? 'spinning' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Tipo de Reporte</label>
              <select
                value={filters.tipo_reporte}
                onChange={(e) => handleFilterChange('tipo_reporte', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="inventario">Inventario</option>
                <option value="movimientos">Movimientos</option>
                <option value="donaciones">Donaciones</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Límite de Registros</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button onClick={loadHistory} className="btn btn-primary">
              <Eye className="icon" />
              Aplicar Filtros
            </button>
            <button onClick={clearFilters} className="btn btn-secondary">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="report-content">
        {loading ? (
          <div className="loading-state">
            <History className="spinning" />
            <span>Cargando historial...</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha Generación</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Registros</th>
                  <th>Formato</th>
                  <th>Filtros</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id_reporte}>
                    <td className="number">#{item.id_reporte}</td>
                    <td>{formatDate(item.fecha_generacion)}</td>
                    <td>
                      <span className="status-badge good">
                        {getReportTypeLabel(item.tipo_reporte)}
                      </span>
                    </td>
                    <td>{item.usuario_generador || 'Sistema'}</td>
                    <td className="number">{item.total_registros}</td>
                    <td>
                      <span className={`status-badge ${item.formato_exportacion ? 'warning' : 'good'}`}>
                        {getFormatLabel(item.formato_exportacion)}
                      </span>
                    </td>
                    <td className="filters-cell">
                      {formatFilters(item.parametros_filtro)}
                    </td>
                    <td>
                      {item.archivo_exportado && (
                        <button className="btn-icon" title="Descargar archivo">
                          <Download className="icon" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && !loading && (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>No hay historial</h3>
                <p>No se encontraron reportes generados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="report-summary">
          <div className="summary-card">
            <h4>Estadísticas del Historial</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total reportes:</span>
                <span className="stat-value">{data.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Reportes de inventario:</span>
                <span className="stat-value">
                  {data.filter(item => item.tipo_reporte === 'inventario').length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Reportes de movimientos:</span>
                <span className="stat-value">
                  {data.filter(item => item.tipo_reporte === 'movimientos').length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Reportes de donaciones:</span>
                <span className="stat-value">
                  {data.filter(item => item.tipo_reporte === 'donaciones').length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Archivos exportados:</span>
                <span className="stat-value">
                  {data.filter(item => item.archivo_exportado).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsHistory;

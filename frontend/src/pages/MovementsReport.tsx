import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, TrendingUp, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsService, { MovementItem, ReportFilters } from '../services/reportsService';
import './ReportPage.css';

const MovementsReport: React.FC = () => {
  const [data, setData] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_movimiento: undefined,
    producto: ''
  });

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getMovementsReport(filters);
      setData(response.data);
      setLastUpdate(response.generatedAt || new Date().toISOString());
      toast.success('Reporte de movimientos actualizado');
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte de movimientos');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'csv') => {
    try {
      const blob = await reportsService.exportReport('movements', format, filters);
      const filename = reportsService.generateFilename('movements', format);
      reportsService.downloadFile(blob, filename);
      toast.success(`Reporte exportado como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      tipo_movimiento: undefined,
      producto: ''
    });
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        const response = await reportsService.getMovementsReport({});
        setData(response.data);
        setLastUpdate(response.generatedAt || new Date().toISOString());
      } catch (error) {
        console.error('Error cargando reporte inicial:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getMovementTypeColor = (type: string) => {
    return type === 'ingreso' ? 'good' : 'warning';
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="header-content">
          <div className="title-section">
            <TrendingUp className="title-icon" />
            <div>
              <h1>Reporte de Movimientos</h1>
              <p>Historial de ingresos y egresos de productos</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={loadReport} 
              disabled={loading}
              className="btn btn-secondary"
            >
              <RefreshCw className={`icon ${loading ? 'spinning' : ''}`} />
              Actualizar
            </button>
            
            <div className="export-buttons">
              <button 
                onClick={() => exportReport('excel')}
                className="btn btn-primary"
              >
                <Download className="icon" />
                Excel
              </button>
              <button 
                onClick={() => exportReport('csv')}
                className="btn btn-outline"
              >
                <Download className="icon" />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filters.fecha_inicio || ''}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filters.fecha_fin || ''}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Tipo de Movimiento</label>
              <select
                value={filters.tipo_movimiento || ''}
                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Producto</label>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={filters.producto || ''}
                onChange={(e) => handleFilterChange('producto', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-actions">
            <button onClick={loadReport} className="btn btn-primary">
              <Filter className="icon" />
              Aplicar Filtros
            </button>
            <button onClick={clearFilters} className="btn btn-secondary">
              Limpiar
            </button>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="update-info">
            Última actualización: {formatDate(lastUpdate)}
          </div>
        )}
      </div>

      <div className="report-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" />
            <span>Cargando reporte...</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Cantidad</th>
                  <th>Usuario</th>
                  <th>Origen</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.fecha_movimiento)}</td>
                    <td>
                      <span className={`status-badge ${getMovementTypeColor(item.tipo_movimiento)}`}>
                        {item.tipo_movimiento === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="product-name">{item.nombre_producto}</td>
                    <td>{item.unidad_medida}</td>
                    <td className="number">{formatNumber(item.cantidad)}</td>
                    <td>{item.usuario_responsable} ({item.rol_usuario})</td>
                    <td>{item.origen_movimiento}</td>
                    <td>{item.observaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && !loading && (
              <div className="empty-state">
                <TrendingUp className="empty-icon" />
                <h3>No hay movimientos</h3>
                <p>No se encontraron movimientos con los filtros aplicados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="report-summary">
          <div className="summary-card">
            <h4>Resumen</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total movimientos:</span>
                <span className="stat-value">{data.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total ingresos:</span>
                <span className="stat-value">
                  {data.filter(item => item.tipo_movimiento === 'ingreso').length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Total egresos:</span>
                <span className="stat-value">
                  {data.filter(item => item.tipo_movimiento === 'egreso').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementsReport;

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Heart, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsService, { DonationItem, ReportFilters } from '../services/reportsService';
import './ReportPage.css';

const DonationsReport: React.FC = () => {
  const [data, setData] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    id_usuario: '',
    producto: ''
  });

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getDonationsReport(filters);
      setData(response.data);
      setLastUpdate(response.generatedAt || new Date().toISOString());
      toast.success('Reporte de donaciones actualizado');
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte de donaciones');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'csv') => {
    try {
      const blob = await reportsService.exportReport('donations', format, filters);
      const filename = reportsService.generateFilename('donations', format);
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
      id_usuario: '',
      producto: ''
    });
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        const response = await reportsService.getDonationsReport({});
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
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getProductStatusColor = (status: string) => {
    switch (status) {
      case 'Vigente': return 'good';
      case 'Por vencer': return 'warning';
      case 'Vencido': return 'danger';
      default: return 'good';
    }
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="header-content">
          <div className="title-section">
            <Heart className="title-icon" />
            <div>
              <h1>Reporte de Donaciones</h1>
              <p>Productos donados por usuarios y organizaciones</p>
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
                  <th>Fecha Donación</th>
                  <th>Donante</th>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Utilizado</th>
                  <th>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.fecha_donacion)}</td>
                    <td className="product-name">{item.donante}</td>
                    <td>{item.tipo_persona}</td>
                    <td>{item.ruc || item.cedula}</td>
                    <td>{item.nombre_producto}</td>
                    <td className="number">{formatNumber(item.cantidad)}</td>
                    <td>{item.unidad_medida}</td>
                    <td>{formatDate(item.fecha_caducidad)}</td>
                    <td>
                      <span className={`status-badge ${getProductStatusColor(item.estado_producto)}`}>
                        {item.estado_producto}
                      </span>
                    </td>
                    <td className="number">{formatNumber(item.cantidad_utilizada)}</td>
                    <td className="number">{formatNumber(item.cantidad_disponible)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && !loading && (
              <div className="empty-state">
                <Heart className="empty-icon" />
                <h3>No hay donaciones</h3>
                <p>No se encontraron donaciones con los filtros aplicados</p>
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
                <span className="stat-label">Total donaciones:</span>
                <span className="stat-value">{data.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Donantes únicos:</span>
                <span className="stat-value">
                  {new Set(data.map(item => item.donante)).size}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Cantidad total donada:</span>
                <span className="stat-value">
                  {formatNumber(data.reduce((sum, item) => {
                    const cantidad = typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad;
                    return sum + (isNaN(cantidad) ? 0 : cantidad);
                  }, 0))}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Productos por vencer:</span>
                <span className="stat-value warning">
                  {data.filter(item => item.estado_producto === 'Por vencer').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsReport;

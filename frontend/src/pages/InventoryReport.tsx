import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import reportsService, { InventoryItem } from '../services/reportsService';
import './ReportPage.css';

const InventoryReport: React.FC = () => {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getInventoryReport();
      setData(response.data);
      setLastUpdate(response.generatedAt || new Date().toISOString());
      toast.success('Reporte de inventario actualizado');
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte de inventario');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'csv') => {
    try {
      const blob = await reportsService.exportReport('inventory', format);
      const filename = reportsService.generateFilename('inventory', format);
      reportsService.downloadFile(blob, filename);
      toast.success(`Reporte exportado como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="header-content">
          <div className="title-section">
            <Package className="title-icon" />
            <div>
              <h1>Reporte de Inventario</h1>
              <p>Stock actual de productos disponibles</p>
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
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Total</th>
                  <th>Disponible</th>
                  <th>Por Vencer</th>
                  <th>% Utilizado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td className="product-name">{item.nombre_producto}</td>
                    <td>{item.unidad_medida}</td>
                    <td className="number">{formatNumber(parseFloat(item.cantidad_total))}</td>
                    <td className="number">{formatNumber(parseFloat(item.cantidad_disponible))}</td>
                    <td className="number warning">
                      {item.productos_por_vencer > 0 && (
                        <span className="warning-badge">
                          <AlertTriangle className="warning-icon" />
                          {item.productos_por_vencer}
                        </span>
                      )}
                      {item.productos_por_vencer === 0 && '0'}
                    </td>
                    <td className="number">{parseFloat(item.porcentaje_utilizado).toFixed(1)}%</td>
                    <td>
                      <span className={`status-badge ${
                        item.productos_por_vencer > 0 ? 'warning' : 'good'
                      }`}>
                        {item.productos_por_vencer > 0 ? 'Atención' : 'Bueno'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && !loading && (
              <div className="empty-state">
                <Package className="empty-icon" />
                <h3>No hay datos de inventario</h3>
                <p>No se encontraron productos en el inventario</p>
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
                <span className="stat-label">Total de productos:</span>
                <span className="stat-value">{data.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Productos por vencer:</span>
                <span className="stat-value warning">
                  {data.reduce((sum, item) => sum + item.productos_por_vencer, 0)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Cantidad total:</span>
                <span className="stat-value">
                  {formatNumber(data.reduce((sum, item) => sum + parseFloat(item.cantidad_total), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;

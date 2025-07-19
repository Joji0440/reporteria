import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  Heart, 
  BarChart3,
  FileText,
  Users
} from 'lucide-react';
import reportsService, { DashboardStats } from '../services/reportsService';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    inventoryProducts: 0,
    activeUsers: 0,
    generatedReports: 0,
    monthlyMovements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await reportsService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const reportCards = [
    {
      title: 'Reporte de Inventario',
      description: 'Visualiza el stock actual de todos los productos disponibles',
      icon: Package,
      link: '/inventario',
      color: 'blue'
    },
    {
      title: 'Reporte de Movimientos',
      description: 'Analiza los ingresos y egresos de productos en el tiempo',
      icon: TrendingUp,
      link: '/movimientos',
      color: 'green'
    },
    {
      title: 'Reporte de Donaciones',
      description: 'Consulta todas las donaciones realizadas por usuarios',
      icon: Heart,
      link: '/donaciones',
      color: 'red'
    }
  ];

  const quickStats = [
    { label: 'Productos en Inventario', value: loading ? '--' : stats.inventoryProducts.toString(), icon: Package },
    { label: 'Donantes Activos', value: loading ? '--' : stats.activeUsers.toString(), icon: Users },
    { label: 'Reportes Generados', value: loading ? '--' : stats.generatedReports.toString(), icon: FileText },
    { label: 'Movimientos del Mes', value: loading ? '--' : stats.monthlyMovements.toString(), icon: BarChart3 }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Reportería</h1>
        <p>Sistema de reportes para el Banco de Alimentos</p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="stats-grid">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <Icon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tarjetas de Reportes */}
      <div className="reports-section">
        <h2>Reportes Disponibles</h2>
        <div className="reports-grid">
          {reportCards.map((report, index) => {
            const Icon = report.icon;
            return (
              <Link key={index} to={report.link} className={`report-card ${report.color}`}>
                <div className="report-icon">
                  <Icon />
                </div>
                <div className="report-content">
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                </div>
                <div className="report-arrow">→</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Acceso Rápido */}
      <div className="quick-access">
        <h2>Acceso Rápido</h2>
        <div className="quick-buttons">
          <Link to="/historial" className="quick-button">
            <FileText />
            <span>Ver Historial de Reportes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

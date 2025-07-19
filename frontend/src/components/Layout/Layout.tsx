import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Heart, 
  History,
  Home 
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Movimientos', href: '/movimientos', icon: TrendingUp },
    { name: 'Donaciones', href: '/donaciones', icon: Heart },
    { name: 'Historial', href: '/historial', icon: History },
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <BarChart3 className="logo-icon" />
            <span className="logo-text">Reportería</span>
          </div>
          <p className="subtitle">Banco de Alimentos</p>
        </div>
        
        <div className="nav-links">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

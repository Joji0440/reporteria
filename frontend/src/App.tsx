import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import InventoryReport from './pages/InventoryReport';
import MovementsReport from './pages/MovementsReport';
import DonationsReport from './pages/DonationsReport';
import ReportsHistory from './pages/ReportsHistory';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<InventoryReport />} />
            <Route path="/movimientos" element={<MovementsReport />} />
            <Route path="/donaciones" element={<DonationsReport />} />
            <Route path="/historial" element={<ReportsHistory />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;

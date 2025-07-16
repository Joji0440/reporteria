# Guía de Integración - Sistema de Reportería

## 🔗 Plan de Integración al Sistema Principal

### Fase 1: Preparación del Entorno

#### 1.1 Requisitos de Servidor
```bash
# Servidor Ubuntu/CentOS
- Node.js 18+ 
- PostgreSQL 12+
- Nginx (como proxy reverso)
- PM2 (para gestión de procesos)
- Certificado SSL

# Recursos recomendados:
- CPU: 2-4 cores
- RAM: 4-8 GB
- Disco: 100GB SSD
- Ancho de banda: 100 Mbps
```

#### 1.2 Configuración de Base de Datos
```sql
-- Crear usuario específico para reportería
CREATE USER reporteria_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE banco_alimentos_reports OWNER reporteria_user;

-- Otorgar permisos mínimos necesarios
GRANT CONNECT ON DATABASE banco_alimentos_reports TO reporteria_user;
GRANT USAGE ON SCHEMA public TO reporteria_user;
GRANT CREATE ON SCHEMA public TO reporteria_user;

-- Para integración con DB existente:
GRANT SELECT ON existing_usuarios TO reporteria_user;
GRANT SELECT ON existing_productos TO reporteria_user;
GRANT SELECT ON existing_donaciones TO reporteria_user;
```

### Fase 2: Adaptación del Esquema

#### 2.1 Mapeo de Tablas Existentes
```sql
-- Crear vistas que mapeen las tablas existentes del sistema principal
-- a las esperadas por el sistema de reportería

-- Vista para usuarios
CREATE VIEW usuarios AS
SELECT 
    id_usuario::uuid as id,
    tipo_usuario as rol,
    tipo_persona,
    nombre_completo as nombre,
    numero_ruc as ruc,
    numero_cedula as cedula,
    direccion,
    telefono,
    fecha_registro as created_at,
    fecha_actualizacion as updated_at
FROM sistema_principal.usuarios_existentes;

-- Vista para productos donados
CREATE VIEW productos_donados AS
SELECT 
    id_producto,
    id_donante::uuid as id_usuario,
    nombre_producto,
    descripcion,
    cantidad_donada as cantidad,
    unidad_medida,
    fecha_donacion,
    fecha_vencimiento as fecha_caducidad,
    estado_producto as estado
FROM sistema_principal.donaciones_productos dp
JOIN sistema_principal.donaciones d ON dp.id_donacion = d.id_donacion;

-- Vista para movimientos
CREATE VIEW movimientos_productos AS
SELECT 
    id_movimiento,
    tipo_operacion as tipo_movimiento,
    id_producto,
    id_usuario_responsable::uuid as id_usuario,
    id_solicitud_beneficiario as id_solicitud,
    cantidad_movida as cantidad,
    fecha_operacion as fecha_movimiento,
    observaciones,
    fecha_registro as created_at
FROM sistema_principal.historial_movimientos;
```

#### 2.2 Triggers de Sincronización
```sql
-- Trigger para mantener sincronizados los reportes generados
CREATE OR REPLACE FUNCTION sync_reportes_to_main_system()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar en tabla de auditoría del sistema principal
    INSERT INTO sistema_principal.log_reportes (
        tipo_reporte,
        usuario_generador,
        fecha_generacion,
        parametros,
        total_registros
    ) VALUES (
        NEW.tipo_reporte,
        NEW.id_usuario,
        NEW.fecha_generacion,
        NEW.parametros_filtro,
        NEW.total_registros
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_reportes
    AFTER INSERT ON reportes_generados
    FOR EACH ROW
    EXECUTE FUNCTION sync_reportes_to_main_system();
```

### Fase 3: Configuración de Seguridad

#### 3.1 Integración con Sistema de Autenticación Existente
```javascript
// backend/middleware/auth.js - Versión integrada
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar token contra el sistema principal
    const decoded = jwt.verify(token, process.env.JWT_SECRET_MAIN_SYSTEM);
    
    // Validar usuario en sistema principal
    const userResult = await query(
      'SELECT id, rol, nombre, estado FROM sistema_principal.usuarios WHERE id = $1 AND estado = $2',
      [decoded.id, 'activo']
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autorizado o inactivo' 
      });
    }

    // Verificar permisos para reportería
    const permissionsResult = await query(
      'SELECT modulo FROM sistema_principal.permisos_usuario WHERE id_usuario = $1 AND modulo = $2',
      [decoded.id, 'reporteria']
    );

    if (permissionsResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Sin permisos para acceder al módulo de reportería' 
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};
```

#### 3.2 Configuración de CORS para Integración
```javascript
// Configuración específica para integración
const corsOptions = {
  origin: [
    'https://sistema-principal.banco-alimentos.org',
    'https://app.banco-alimentos.org',
    process.env.MAIN_SYSTEM_URL
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Fase 4: Configuración de Proxy Reverso

#### 4.1 Configuración de Nginx
```nginx
# /etc/nginx/sites-available/banco-alimentos
server {
    listen 443 ssl http2;
    server_name sistema.banco-alimentos.org;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Sistema principal
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Módulo de reportería
    location /reporteria/ {
        rewrite ^/reporteria/(.*) /$1 break;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers específicos para archivos grandes
        client_max_body_size 50M;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # API de reportería
    location /api/reports/ {
        proxy_pass http://localhost:3001/api/reports/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers para CORS
        add_header 'Access-Control-Allow-Origin' 'https://sistema.banco-alimentos.org' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
}
```

### Fase 5: Script de Migración

#### 5.1 Script de Migración Automática
```bash
#!/bin/bash
# migrate-reporteria.sh

set -e

echo "🚀 Iniciando migración del sistema de reportería..."

# Variables de configuración
SOURCE_DIR="/path/to/reporteria-system"
TARGET_DIR="/opt/banco-alimentos/reporteria"
DB_NAME="banco_alimentos_main"
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"

# 1. Crear backup de la base de datos
echo "📦 Creando backup de la base de datos..."
mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/db_backup.sql

# 2. Detener servicios relacionados
echo "⏹️ Deteniendo servicios..."
systemctl stop nginx
pm2 stop all

# 3. Copiar archivos del sistema de reportería
echo "📁 Copiando archivos del sistema..."
mkdir -p $TARGET_DIR
cp -r $SOURCE_DIR/* $TARGET_DIR/
chown -R nodejs:nodejs $TARGET_DIR

# 4. Instalar dependencias
echo "📦 Instalando dependencias..."
cd $TARGET_DIR
npm ci --production

# 5. Ejecutar migraciones de base de datos
echo "🗄️ Ejecutando migraciones de base de datos..."
psql $DB_NAME < database/schema.sql
psql $DB_NAME < database/integration-views.sql
psql $DB_NAME < database/migration-data.sql

# 6. Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
cp .env.production.example .env.production
sed -i "s/DB_NAME_PLACEHOLDER/$DB_NAME/g" .env.production
sed -i "s/JWT_SECRET_PLACEHOLDER/$(openssl rand -base64 32)/g" .env.production

# 7. Configurar PM2
echo "🔧 Configurando PM2..."
pm2 start ecosystem.config.js --env production

# 8. Configurar Nginx
echo "🌐 Configurando Nginx..."
cp nginx/banco-alimentos.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/banco-alimentos.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 9. Verificar instalación
echo "✅ Verificando instalación..."
sleep 10
curl -f http://localhost:3001/health || { echo "❌ Error: Servicio no responde"; exit 1; }

echo "🎉 Migración completada exitosamente!"
echo "📊 Panel de reportería disponible en: https://sistema.banco-alimentos.org/reporteria"
echo "📖 Documentación en: $TARGET_DIR/docs/"
```

#### 5.2 Script de Validación Post-Migración
```bash
#!/bin/bash
# validate-migration.sh

echo "🔍 Ejecutando validaciones post-migración..."

# Test de conectividad de base de datos
echo "Testing database connection..."
psql $DB_NAME -c "SELECT COUNT(*) FROM usuarios;" || { echo "❌ Error conectando a BD"; exit 1; }

# Test de API endpoints
echo "Testing API endpoints..."
curl -f http://localhost:3001/health || { echo "❌ Health check failed"; exit 1; }
curl -f http://localhost:3001/api/reports/dashboard || { echo "❌ Dashboard API failed"; exit 1; }

# Test de permisos de archivos
echo "Testing file permissions..."
[ -w "$TARGET_DIR/exports" ] || { echo "❌ Exports directory not writable"; exit 1; }

# Test de logs
echo "Testing logging..."
pm2 logs reporteria --lines 50 | grep -q "Server running" || { echo "❌ Server not started properly"; exit 1; }

echo "✅ Todas las validaciones pasaron correctamente!"
```

### Fase 6: Integración en el Frontend Principal

#### 6.1 Componente de Integración para React
```jsx
// MainSystem/src/components/ReporteriaModule.jsx
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../services/auth';

const ReporteriaModule = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reporteriaUrl, setReporteriaUrl] = useState('');

  useEffect(() => {
    // Configurar URL base para el módulo de reportería
    const baseUrl = process.env.REACT_APP_REPORTERIA_URL || '/reporteria';
    const token = getAuthToken();
    
    // Pasar token a través de postMessage para el iframe
    setReporteriaUrl(`${baseUrl}?token=${token}`);
    setIsLoading(false);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="reporteria-loading">
        <div className="spinner"></div>
        <p>Cargando módulo de reportería...</p>
      </div>
    );
  }

  return (
    <div className="reporteria-container" style={{ height: '100vh', width: '100%' }}>
      <iframe
        src={reporteriaUrl}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          borderRadius: '8px'
        }}
        onLoad={handleIframeLoad}
        title="Módulo de Reportería"
        sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
      />
    </div>
  );
};

export default ReporteriaModule;
```

#### 6.2 Integración en el Menú Principal
```jsx
// MainSystem/src/components/MainNavigation.jsx
import { ReportIcon } from '@heroicons/react/24/outline';

const navigationItems = [
  // ... otros items del menú
  {
    name: 'Reportería',
    href: '/reporteria',
    icon: ReportIcon,
    description: 'Generar reportes de inventario, movimientos y donaciones',
    permissions: ['reporteria.view']
  }
];

// Route configuration
// MainSystem/src/App.jsx
import ReporteriaModule from './components/ReporteriaModule';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... otras rutas */}
        <Route 
          path="/reporteria/*" 
          element={
            <ProtectedRoute permissions={['reporteria.view']}>
              <ReporteriaModule />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
```

### Fase 7: Monitoreo y Mantenimiento

#### 7.1 Configuración de Monitoreo
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"

volumes:
  grafana-storage:
```

#### 7.2 Alertas y Notificaciones
```javascript
// monitoring/alerts.js
const nodemailer = require('nodemailer');

const healthChecker = {
  async checkDatabaseConnection() {
    try {
      await query('SELECT 1');
      return { status: 'healthy', component: 'database' };
    } catch (error) {
      this.sendAlert('Database connection failed', error.message);
      return { status: 'unhealthy', component: 'database', error: error.message };
    }
  },

  async checkDiskSpace() {
    const stats = require('fs').statSync('./exports');
    const freeSpace = stats.free / (1024 * 1024 * 1024); // GB
    
    if (freeSpace < 1) {
      this.sendAlert('Low disk space', `Only ${freeSpace.toFixed(2)}GB remaining`);
      return { status: 'warning', component: 'disk', freeSpace };
    }
    
    return { status: 'healthy', component: 'disk', freeSpace };
  },

  async sendAlert(subject, message) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: 'alerts@banco-alimentos.org',
      to: 'admin@banco-alimentos.org',
      subject: `[REPORTERÍA] ${subject}`,
      text: message,
      html: `<h3>${subject}</h3><p>${message}</p><p><em>Sistema de Reportería - ${new Date().toISOString()}</em></p>`
    });
  }
};

// Ejecutar checks cada 5 minutos
setInterval(async () => {
  await healthChecker.checkDatabaseConnection();
  await healthChecker.checkDiskSpace();
}, 5 * 60 * 1000);
```

### Fase 8: Documentación de Soporte

#### 8.1 Runbook para Operaciones
```markdown
# Runbook - Sistema de Reportería

## Procedimientos de Emergencia

### Database Connection Issues
1. Check PostgreSQL service: `systemctl status postgresql`
2. Check connection pool: `pm2 logs reporteria | grep "connection"`
3. Restart service: `pm2 restart reporteria`
4. If persistent, check firewall: `ufw status`

### High Memory Usage
1. Check memory usage: `pm2 monit`
2. Check for memory leaks: `node --inspect server.js`
3. Restart if needed: `pm2 restart reporteria`
4. Clear exports folder: `find ./exports -mtime +7 -delete`

### Failed Report Generation
1. Check logs: `pm2 logs reporteria --lines 100`
2. Verify disk space: `df -h`
3. Test database queries manually
4. Check ExcelJS memory limits

## Maintenance Tasks

### Daily
- Check logs for errors
- Verify backup completion
- Monitor disk usage

### Weekly  
- Clean old export files
- Review performance metrics
- Update security patches

### Monthly
- Full database backup
- Performance optimization
- Security audit
```

#### 8.2 Checklist de Go-Live
```markdown
# Checklist de Go-Live - Sistema de Reportería

## Pre-Deployment
- [ ] Database schema migrated successfully
- [ ] All environment variables configured
- [ ] SSL certificates installed and verified
- [ ] Nginx configuration tested
- [ ] PM2 ecosystem configured
- [ ] Backup procedures tested
- [ ] Monitoring tools configured
- [ ] User permissions configured in main system

## Deployment
- [ ] Application deployed to production server
- [ ] Health checks passing
- [ ] All API endpoints responding correctly
- [ ] Frontend integration working
- [ ] File downloads working correctly
- [ ] Report generation tested with real data

## Post-Deployment
- [ ] User acceptance testing completed
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Support procedures documented
- [ ] Rollback plan documented and tested

## Sign-off
- [ ] Technical Team Lead: ________________
- [ ] System Administrator: _______________
- [ ] Business Owner: ____________________
- [ ] Security Officer: __________________
```

---

Esta guía de integración proporciona un plan completo para integrar el sistema de reportería en el ambiente de producción del banco de alimentos, incluyendo todos los aspectos técnicos, de seguridad y operacionales necesarios.

**Guía de Integración v1.0**  
**Fecha:** Julio 16, 2025  
**Responsable:** Equipo de Desarrollo

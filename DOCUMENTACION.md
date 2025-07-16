# Sistema de Reportería para Banco de Alimentos

## 📋 Descripción del Proyecto

Sistema fullstack desarrollado para generar reportes automatizados de un banco de alimentos, permitiendo la visualización y exportación de datos de inventario, movimientos de productos y donaciones.

## 🏗️ Arquitectura del Sistema

### Tecnologías Utilizadas

**Backend:**
- **Node.js** con Express.js
- **PostgreSQL** como base de datos
- **ExcelJS** para generación de archivos Excel
- **Fast-CSV** para archivos CSV
- **JWT** para autenticación (preparado para producción)
- **dotenv** para variables de entorno

**Frontend:**
- **React 18** con TypeScript
- **CSS Modules** para estilos
- **Fetch API** para comunicación con backend

**Base de Datos:**
- **PostgreSQL 14+** con esquemas relacionales
- **UUID** para identificadores únicos
- **JSONB** para almacenamiento de filtros de reportes

## 📊 Tipos de Reportes Disponibles

### 1. Reporte de Inventario
- **Propósito:** Visualizar el estado actual del inventario
- **Datos incluidos:**
  - Nombre del producto
  - Unidad de medida
  - Cantidad total
  - Cantidad disponible
  - Productos por vencer
  - Porcentaje utilizado
  - Fecha de última actualización

### 2. Reporte de Movimientos de Productos
- **Propósito:** Historial de ingresos y egresos
- **Datos incluidos:**
  - Fecha del movimiento
  - Tipo de movimiento (ingreso/egreso)
  - Producto involucrado
  - Cantidad
  - Usuario responsable
  - Origen del movimiento
  - Observaciones
- **Filtros disponibles:**
  - Rango de fechas
  - Tipo de movimiento
  - Nombre del producto

### 3. Reporte de Donaciones
- **Propósito:** Tracking de productos donados
- **Datos incluidos:**
  - Fecha de donación
  - Información del donante
  - Producto donado
  - Cantidad y unidad
  - Estado del producto (vigente/por vencer/vencido)
  - Cantidad utilizada vs disponible
- **Filtros disponibles:**
  - Rango de fechas
  - Donante específico
  - Nombre del producto

## 🗄️ Estructura de Base de Datos

### Tablas Principales Utilizadas

```sql
-- Tabla de usuarios (donantes y administradores)
usuarios (
  id UUID PRIMARY KEY,
  nombre TEXT,
  rol TEXT,
  tipo_persona TEXT,
  ruc TEXT,
  cedula TEXT,
  direccion TEXT,
  telefono TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Vista de inventario actual
inventario_actual (
  nombre_producto TEXT,
  unidad_medida TEXT,
  cantidad_total NUMERIC,
  cantidad_disponible NUMERIC,
  productos_por_vencer INTEGER,
  fecha_ultima_actualizacion TIMESTAMP
)

-- Tabla de movimientos de productos
movimientos_productos (
  id_movimiento SERIAL PRIMARY KEY,
  tipo_movimiento TEXT NOT NULL,
  id_producto INTEGER,
  id_usuario UUID,
  cantidad NUMERIC NOT NULL,
  fecha_movimiento TIMESTAMP,
  observaciones TEXT
)

-- Tabla de productos donados
productos_donados (
  id_producto SERIAL PRIMARY KEY,
  id_usuario UUID,
  nombre_producto TEXT,
  descripcion TEXT,
  cantidad NUMERIC,
  unidad_medida TEXT,
  fecha_donacion TIMESTAMP,
  fecha_caducidad DATE
)

-- Tabla de historial de reportes generados
reportes_generados (
  id_reporte SERIAL PRIMARY KEY,
  tipo_reporte TEXT NOT NULL,
  id_usuario UUID,
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  parametros_filtro JSONB,
  total_registros INTEGER,
  formato_exportacion TEXT
)
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Configuración del Backend

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Archivo .env requerido:**
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banco_de_alimentos
DB_USER=reporteria_user
DB_PASSWORD=tu_password_seguro

# Servidor
PORT=3001
NODE_ENV=development

# JWT (para producción)
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:3000
```

### 2. Configuración del Frontend

```bash
cd frontend
npm install
```

**Variables de entorno del frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001
```

### 3. Inicialización de Base de Datos

```bash
# Ejecutar esquema de base de datos
psql -h localhost -U reporteria_user -d banco_de_alimentos -f database/schema.sql

# Insertar datos de prueba (opcional)
node insert-test-data.js
```

## 🔧 Ejecución del Sistema

### Desarrollo
```bash
# Backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm start
```

### Producción
```bash
# Backend
npm start

# Frontend (build)
cd frontend
npm run build
```

## 📁 Estructura del Proyecto

```
reporteria/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   └── reportsController.js # Lógica de reportes y exportación
│   ├── middleware/
│   │   └── auth.js              # Autenticación JWT
│   ├── routes/
│   │   └── reports.js           # Rutas de API
│   └── server.js                # Servidor Express
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/          # Layout principal
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Dashboard con estadísticas
│   │   │   ├── InventoryReport.tsx
│   │   │   ├── MovementsReport.tsx
│   │   │   ├── DonationsReport.tsx
│   │   │   └── ReportsHistory.tsx
│   │   ├── services/
│   │   │   ├── api.ts           # Cliente HTTP
│   │   │   └── reportsService.ts # Servicios de reportes
│   │   └── App.tsx
├── database/
│   ├── schema.sql               # Esquema de base de datos
│   └── queries.sql              # Consultas SQL de referencia
├── exports/                     # Archivos Excel/CSV generados
├── docs/                        # Documentación adicional
└── scripts/                     # Scripts de utilidad
```

## 🔄 API Endpoints

### Reportes
- `GET /api/reports/dashboard` - Estadísticas del dashboard
- `GET /api/reports/inventory?export_format=excel` - Reporte de inventario
- `GET /api/reports/movements?fecha_inicio=&fecha_fin=&tipo_movimiento=&producto=&export_format=csv` - Reporte de movimientos
- `GET /api/reports/donations?fecha_inicio=&fecha_fin=&id_usuario=&producto=&export_format=excel` - Reporte de donaciones
- `GET /api/reports/history?tipo_reporte=&limit=50&offset=0` - Historial de reportes

### Parámetros de Exportación
- `export_format`: `excel` | `csv` (opcional, sin este parámetro devuelve JSON)

## 🔒 Sistema de Autenticación

### Desarrollo
- Usuario automático con UUID válido
- Bypass de autenticación JWT

### Producción
- Autenticación JWT requerida
- Middleware de verificación de roles
- Tokens con expiración configurable

## 📈 Características del Sistema

### ✅ Funcionalidades Implementadas

1. **Dashboard Interactivo**
   - Estadísticas en tiempo real
   - Navegación entre reportes
   - Indicadores clave (KPI)

2. **Visualización de Reportes**
   - Tablas responsivas
   - Filtros dinámicos
   - Paginación automática

3. **Exportación de Datos**
   - Archivos Excel con formato profesional
   - Archivos CSV para análisis
   - Headers y estilos personalizados

4. **Historial de Reportes**
   - Registro solo de exportaciones
   - Filtros por tipo de reporte
   - Información de usuario y fecha

5. **Sistema de Filtros**
   - Rangos de fechas
   - Filtros específicos por tipo
   - Combinación de múltiples filtros

### 🎨 Características de UX/UI

- **Diseño Responsivo**: Adaptable a móviles y tablets
- **Tema Profesional**: Colores y tipografía corporativa
- **Navegación Intuitiva**: Menú lateral con iconos claros
- **Feedback Visual**: Estados de carga y confirmaciones
- **Accesibilidad**: Contraste adecuado y navegación por teclado

## 🔗 Integración con Sistema Existente

### 1. Base de Datos
El sistema se conecta a las siguientes tablas existentes:
- `usuarios` - Para información de donantes y administradores
- `productos_donados` - Productos recibidos por donación
- `movimientos_productos` - Historial de movimientos
- `inventario_actual` - Vista del estado actual del inventario

### 2. Autenticación
- **Desarrollo**: Usuario automático para pruebas
- **Producción**: Integrar con sistema JWT existente

### 3. Roles y Permisos
- **Administrador**: Acceso completo a todos los reportes
- **Usuario**: Acceso limitado según configuración
- **Donante**: Solo reportes de sus propias donaciones

### 4. Variables de Entorno de Producción
```env
NODE_ENV=production
DB_HOST=servidor_produccion
DB_NAME=banco_alimentos_prod
JWT_SECRET=secret_super_seguro_produccion
FRONTEND_URL=https://tudominio.com
```

## 🛠️ Scripts de Utilidad

```bash
# Verificar estructura de base de datos
node check-tables.js

# Verificar tabla de reportes
node check-reports-table.js

# Crear usuario de desarrollo
node create-dev-user.js

# Insertar datos de prueba
node insert-test-data.js

# Verificar movimientos
node debug-movements.js
```

## 📊 Monitoreo y Logs

### Logs del Sistema
- Conexiones a base de datos
- Generación de reportes
- Errores de autenticación
- Exportaciones realizadas

### Métricas Importantes
- Tiempo de respuesta de consultas
- Cantidad de reportes generados
- Errores de base de datos
- Uso de recursos del servidor

## 🔧 Mantenimiento

### Limpieza de Archivos
```bash
# Limpiar archivos de exportación antiguos (mensualmente)
find exports/ -name "*.xlsx" -mtime +30 -delete
find exports/ -name "*.csv" -mtime +30 -delete
```

### Optimización de Base de Datos
```sql
-- Limpiar reportes antiguos (trimestral)
DELETE FROM reportes_generados 
WHERE fecha_generacion < NOW() - INTERVAL '90 days';

-- Reindexar tablas principales
REINDEX TABLE reportes_generados;
REINDEX TABLE movimientos_productos;
```

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar credenciales en .env
   - Confirmar que PostgreSQL esté ejecutándose
   - Validar permisos del usuario de base de datos

2. **Error en exportación Excel**
   - Verificar permisos de escritura en carpeta exports/
   - Confirmar instalación de ExcelJS
   - Revisar logs del servidor para detalles

3. **Historial vacío**
   - Solo se registran reportes exportados, no visualizaciones
   - Verificar UUID del usuario en middleware de autenticación

## 🔮 Futuras Mejoras

### Funcionalidades Pendientes
- [ ] Reportes programados (cron jobs)
- [ ] Notificaciones por email
- [ ] Dashboard con gráficos (Chart.js)
- [ ] Exportación a PDF
- [ ] API REST completa
- [ ] Audit trail completo
- [ ] Backup automático de reportes

### Optimizaciones Técnicas
- [ ] Cache de consultas frecuentes
- [ ] Paginación en backend
- [ ] Compresión de archivos grandes
- [ ] CDN para archivos estáticos

## 👥 Equipo de Desarrollo

**Sistema desarrollado como parte del proyecto de vinculación universitaria**

### Contacto y Soporte
Para dudas técnicas o soporte, consultar la documentación adicional en `/docs/` o revisar los logs del sistema.

---

**Versión:** 1.0.0  
**Última actualización:** Julio 16, 2025  
**Compatibilidad:** Node.js 18+, PostgreSQL 14+, React 18+

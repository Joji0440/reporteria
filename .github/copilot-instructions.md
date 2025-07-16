# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Proyecto: Sistema de Reportería para Banco de Alimentos

Este es un sistema fullstack para generar reportes de un banco de alimentos:

### Tecnologías:
- **Backend**: Node.js con Express
- **Frontend**: React
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT
- **Exportación**: Excel/CSV

### Estructura de reportes:
1. **Inventario de productos**: Cantidad total por producto y unidad de medida
2. **Movimientos de productos**: Historial de ingresos y egresos
3. **Productos donados**: Donaciones por usuario, cantidad y fecha

### Reglas de desarrollo:
- Cada reporte generado debe registrarse en la base de datos
- Usar async/await para operaciones asíncronas
- Implementar manejo de errores apropiado
- Seguir principios REST para APIs
- Componentes React funcionales con hooks
- Validación de datos tanto en frontend como backend

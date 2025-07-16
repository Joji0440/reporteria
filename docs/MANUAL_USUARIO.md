# Manual de Usuario - Sistema de Reportería

## 📋 Introducción

El Sistema de Reportería del Banco de Alimentos es una herramienta diseñada para generar informes detallados sobre el inventario, movimientos de productos y donaciones recibidas. Este manual te guiará paso a paso para utilizar todas las funcionalidades del sistema.

### ¿Para quién es este sistema?
- **Administradores**: Acceso completo a todos los reportes y configuraciones
- **Operadores**: Generación de reportes de inventario y movimientos
- **Coordinadores**: Visualización de estadísticas y reportes de donaciones

---

## 🚀 Primeros Pasos

### Acceso al Sistema

1. **URL de Acceso**: https://sistema.banco-alimentos.org/reporteria
2. **Credenciales**: Utiliza las mismas credenciales del sistema principal del banco de alimentos
3. **Permisos**: Debes tener permisos para el módulo de "Reportería"

### Navegación Principal

Al ingresar al sistema verás el **Dashboard** principal con:

```
┌─────────────────────────────────────────────────┐
│  🏠 Dashboard  📊 Reportes  📈 Historial        │
├─────────────────────────────────────────────────┤
│                                                 │
│  📦 Productos en Inventario: 20                 │
│  👥 Usuarios Activos: 4                         │
│  ⚠️  Productos por Vencer: 0                    │
│  🔄 Movimientos Recientes: 30                   │
│                                                 │
│  [Ver Reportes Detallados]                     │
└─────────────────────────────────────────────────┘
```

---

## 📊 Tipos de Reportes

### 1. 📦 Reporte de Inventario

**¿Qué muestra?**
- Todos los productos actualmente disponibles
- Cantidades por producto y unidad de medida
- Estado de cada producto (disponible, por vencer, etc.)

**¿Cuándo usarlo?**
- Para conocer el stock actual
- Antes de planificar distribuciones
- Para control de inventario periódico

**Cómo generarlo:**
1. Ir a **Reportes** → **Inventario**
2. Revisar la tabla en pantalla
3. Para exportar: hacer clic en **"Exportar a Excel"** o **"Exportar a CSV"**

**Ejemplo de datos que verás:**
```
Producto                 | Unidad    | Cantidad | Estado
Arroz Premium           | Kilogramos| 150.00   | Disponible
Aceite de Cocina        | Litros    | 75.50    | Disponible
Frijoles Negros         | Kilogramos| 200.25   | Disponible
```

### 2. 🔄 Reporte de Movimientos

**¿Qué muestra?**
- Historial de ingresos y egresos de productos
- Quién realizó cada movimiento y cuándo
- Cantidades movidas y observaciones

**¿Cuándo usarlo?**
- Para auditar movimientos de productos
- Rastrear de dónde vinieron los productos
- Verificar entregas realizadas

**Filtros disponibles:**
- **Fechas**: Desde/hasta
- **Tipo**: Solo ingresos, solo egresos, o ambos
- **Producto**: Buscar por nombre específico

**Cómo generarlo:**
1. Ir a **Reportes** → **Movimientos**
2. Configurar filtros según necesites:
   - **Fecha Inicio**: Ejemplo: 01/01/2025
   - **Fecha Fin**: Ejemplo: 16/07/2025
   - **Tipo**: Seleccionar "Todos", "Ingreso" o "Egreso"
   - **Producto**: Escribir nombre o dejar vacío para todos
3. Hacer clic en **"Aplicar Filtros"**
4. Para exportar: **"Exportar a Excel"** o **"Exportar a CSV"**

**Ejemplo de datos que verás:**
```
Fecha       | Tipo    | Producto      | Cantidad | Usuario        | Observaciones
16/07/2025  | Ingreso | Arroz Premium | 50.00 kg | María García   | Donación empresa ABC
15/07/2025  | Egreso  | Frijoles      | 20.00 kg | Juan Pérez     | Entrega familia López
```

### 3. 💝 Reporte de Donaciones

**¿Qué muestra?**
- Todas las donaciones recibidas
- Quién donó cada producto
- Fechas y cantidades de donaciones

**¿Cuándo usarlo?**
- Para agradecer a donantes
- Generar reportes para patrocinadores
- Análisis de tendencias de donaciones

**Filtros disponibles:**
- **Fechas**: Período específico de donaciones
- **Donante**: Filtrar por donante específico
- **Producto**: Tipo de producto donado

**Cómo generarlo:**
1. Ir a **Reportes** → **Donaciones**
2. Configurar filtros:
   - **Fecha Inicio/Fin**: Período de consulta
   - **Donante**: Dejar vacío para todos o escribir nombre
   - **Producto**: Dejar vacío para todos o escribir nombre
3. Hacer clic en **"Aplicar Filtros"**
4. Para exportar: **"Exportar a Excel"** o **"Exportar a CSV"**

**Ejemplo de datos que verás:**
```
Fecha       | Donante           | Producto        | Cantidad | Tipo Donante
16/07/2025  | Supermercados XYZ | Arroz Premium   | 100.00kg | Jurídica
15/07/2025  | Ana Rodríguez     | Aceite Cocina   | 20.00L   | Natural
```

---

## 📁 Exportación de Archivos

### Formatos Disponibles

**Excel (.xlsx)**
- Formato profesional con estilos
- Fácil de abrir en Microsoft Excel
- Incluye formato de colores y bordes
- **Recomendado para**: Presentaciones, reportes oficiales

**CSV (.csv)**  
- Formato simple separado por comas
- Compatible con cualquier programa
- Menor tamaño de archivo
- **Recomendado para**: Análisis de datos, importación a otros sistemas

### Proceso de Descarga

1. **Generar el reporte** en pantalla con los filtros deseados
2. **Hacer clic** en el botón de exportación (Excel o CSV)
3. **Esperar** a que se genere el archivo (puede tomar unos segundos)
4. **Descargar** automáticamente comenzará
5. **Ubicación**: Normalmente en tu carpeta "Descargas"

### Nombres de Archivos

Los archivos se generan con nombres descriptivos:
- `inventario_2025-07-16T20-01-47-923Z.xlsx`
- `movimientos_2025-07-16T20-01-47-923Z.csv`
- `donaciones_2025-07-16T20-01-47-923Z.xlsx`

**Formato del nombre**: `[tipo]_[fecha-y-hora].[extensión]`

---

## 📈 Historial de Reportes

### ¿Qué es el Historial?

El historial mantiene un registro de todos los reportes que has generado y descargado, permitiendo:
- Ver qué reportes se han generado
- Cuándo se generaron
- Quién los generó
- Cuántos registros contenían

### Acceder al Historial

1. Hacer clic en **"Historial"** en el menú principal
2. Verás una tabla con todos los reportes generados

### Información Disponible

```
Fecha Generación | Tipo        | Usuario      | Registros | Formato
16/07/2025 20:01 | Inventario  | María García | 20        | Excel
16/07/2025 19:45 | Movimientos | Juan Pérez   | 150       | CSV
15/07/2025 14:30 | Donaciones  | Ana López    | 28        | Excel
```

**Nota importante**: Solo se registran en el historial los reportes que fueron descargados (exportados), no las consultas que solo se visualizaron en pantalla.

---

## 🔍 Consejos y Mejores Prácticas

### Para Obtener Mejores Resultados

1. **Usa filtros específicos**
   - Si buscas datos de un mes específico, configura las fechas exactas
   - Si necesitas datos de un producto, escribe su nombre completo

2. **Exporta con nombres claros**
   - Renombra los archivos descargados si es necesario
   - Ejemplo: `Inventario_Enero_2025.xlsx`

3. **Programa reportes regulares**
   - Inventario: Semanalmente para control de stock
   - Movimientos: Mensualmente para auditorías
   - Donaciones: Mensualmente para reportes a donantes

### Interpretación de Datos

**En Reporte de Inventario:**
- **Cantidad alta + Sin movimientos recientes**: Revisar rotación de productos
- **Cantidad baja**: Puede necesitar reposición
- **Productos por vencer**: Priorizar para distribución

**En Reporte de Movimientos:**
- **Muchos egresos sin ingresos**: Stock puede agotarse
- **Muchos ingresos sin egresos**: Productos pueden acumularse

**En Reporte de Donaciones:**
- **Donaciones grandes esporádicas**: Contactar para regularidad
- **Donaciones pequeñas frecuentes**: Mantener relación

---

## ⚠️ Resolución de Problemas

### Problemas Comunes y Soluciones

**1. "No se pueden cargar los datos"**
- **Causa**: Problema de conexión
- **Solución**: Actualizar la página (F5) y volver a intentar

**2. "El archivo no se descarga"**
- **Causa**: Bloqueador de descargas del navegador
- **Solución**: Permitir descargas para este sitio web

**3. "Los filtros no funcionan"**
- **Causa**: Formato de fecha incorrecto
- **Solución**: Usar formato DD/MM/AAAA (ejemplo: 16/07/2025)

**4. "No veo datos en el reporte"**
- **Posibles causas**:
  - Filtros muy restrictivos
  - No hay datos en el período seleccionado
  - Problema de permisos
- **Solución**: Ampliar el rango de fechas o quitar filtros

**5. "El archivo Excel se abre mal"**
- **Causa**: Versión antigua de Excel
- **Solución**: Usar Excel 2016 o posterior, o Google Sheets

### ¿Cuándo Contactar Soporte?

Contacta al equipo técnico si:
- Los problemas persisten después de seguir las soluciones
- Ves errores de "Error 500" o similares
- Los datos parecen incorrectos o incompletos
- Necesitas permisos adicionales

**Información a proporcionar al contactar soporte:**
- Tipo de reporte que intentabas generar
- Filtros que tenías configurados
- Mensaje de error exacto (tomar captura de pantalla)
- Navegador que utilizas (Chrome, Firefox, etc.)

---

## 📱 Compatibilidad de Navegadores

### Navegadores Recomendados
- ✅ **Google Chrome** 90+ (Recomendado)
- ✅ **Mozilla Firefox** 88+
- ✅ **Microsoft Edge** 90+
- ✅ **Safari** 14+

### Funcionalidades por Navegador

| Función | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| Visualizar reportes | ✅ | ✅ | ✅ | ✅ |
| Exportar Excel | ✅ | ✅ | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ | ✅ | ✅ |
| Filtros avanzados | ✅ | ✅ | ✅ | ⚠️ |

**Nota**: En Safari algunas funciones de filtrado pueden requerir actualizar la página.

---

## 📞 Contacto y Soporte

### Equipo de Soporte Técnico
- **Email**: soporte@banco-alimentos.org
- **Teléfono**: (02) XXX-XXXX ext. 123
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

### Recursos Adicionales
- **Manual técnico**: Disponible en el servidor para administradores
- **Capacitaciones**: Programar con el equipo coordinador
- **Videos tutoriales**: Disponibles en el portal interno

---

**Manual de Usuario v1.0**  
**Última actualización**: Julio 16, 2025  
**Sistema de Reportería - Banco de Alimentos**

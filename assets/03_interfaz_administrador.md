# DISEÑO DE INTERFAZ - PANEL ADMINISTRADOR

## 1. ESTRUCTURA GENERAL

### 1.1 Layout Principal
La interfaz del administrador mantiene una estructura similar a la del dropshipper pero con funcionalidades extendidas:

**Header Superior:**
- Logo ECOMDROP (esquina superior izquierda)
- Breadcrumb de navegación
- Selector de vista (Admin/Dropshipper) para testing
- Notificaciones con contador (campana)
- Mensajes/Chat interno
- Perfil de usuario con menú desplegable
- Selector de idioma
- Botón de ayuda/documentación

**Sidebar Izquierdo (Expandible):**
```
📊 Dashboard
👥 Dropshippers
  ├── Listado
  ├── Solicitudes Pendientes
  ├── Comisiones
  └── Historial
📦 Productos
  ├── Catálogo
  ├── Gestión de Stock
  ├── Importar/Exportar
  └── Categorías
📋 Pedidos
  ├── Todos los Pedidos
  ├── Con Incidencias
  ├── Devoluciones
  └── Tracking Masivo
💰 Finanzas
  ├── Solicitudes de Retiro
  ├── Ingresos Pendientes
  ├── Movimientos
  ├── Facturación
  └── Reportes Financieros
🏭 Proveedores
  ├── Listado
  ├── Depósitos
  └── Performance
🔌 Integraciones
  ├── Shopify
  ├── Mercado Libre
  ├── WooCommerce
  └── APIs
📊 Analytics
  ├── Dashboard Ejecutivo
  ├── Reportes
  └── Constructor de Reportes
💬 Soporte
  ├── Tickets
  ├── Chat WhatsApp
  └── Base de Conocimiento
⚙️ Configuración
  ├── General
  ├── Usuarios Admin
  ├── Roles y Permisos
  ├── Notificaciones
  └── Mantenimiento
🔍 Auditoría
```

**Área Principal de Contenido:**
- Zona de trabajo con scroll independiente
- Footer con información de versión y enlaces legales

## 2. PANTALLAS PRINCIPALES

### 2.1 DASHBOARD EJECUTIVO

**Sección de KPIs (Cards superiores):**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Ventas Hoy      │ Pedidos Activos │ Dropshippers    │ Tasa Conversión │
│ $2,345,678      │ 234             │ 156 activos     │ 3.4%           │
│ ↑ 12% vs ayer   │ ↓ 5% vs ayer    │ 12 nuevos/mes   │ ↑ 0.3%         │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Gráficos Principales:**
- Gráfico de líneas: Evolución de ventas (últimos 30 días)
- Gráfico de barras: Top 10 dropshippers por ventas
- Mapa de calor: Pedidos por hora y día de la semana
- Gráfico circular: Distribución de pedidos por estado

**Alertas y Acciones Rápidas:**
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Alertas Activas (5)                           [Ver todas] │
├──────────────────────────────────────────────────────────────┤
│ 🔴 3 pedidos con más de 48h sin procesar                     │
│ 🟡 Stock bajo en 12 productos críticos                       │
│ 🟡 2 dropshippers con documentación pendiente                │
│ 🔴 Conexión con Shopify Store #23 caída                      │
│ 🟢 15 solicitudes de retiro pendientes de aprobación         │
└──────────────────────────────────────────────────────────────┘
```

**Panel de Actividad Reciente:**
- Timeline con las últimas 20 acciones del sistema
- Filtro rápido por tipo de actividad
- Botón para ver log completo

### 2.2 GESTIÓN DE DROPSHIPPERS

**Barra de Herramientas:**
```
[+ Nuevo Dropshipper] [Importar CSV] [Exportar] [Acciones Masivas ▼]
Buscar: [_______________] [🔍] Filtros: Estado [▼] Comisión [▼] Ventas [▼] [Limpiar]
```

**Tabla Principal:**
```
┌─┬──────┬────────────────┬──────────────┬──────────┬─────────┬───────────┬─────────┬──────────┬─────────┐
│□│ ID   │ Nombre         │ Email        │ CUIT     │ Estado  │ Saldo     │ Ventas  │ Comisión │ Acciones│
├─┼──────┼────────────────┼──────────────┼──────────┼─────────┼───────────┼─────────┼──────────┼─────────┤
│□│ #234 │ Juan Pérez     │ juan@...     │ 20-xxx   │ 🟢Activo│ $12,345   │ $234K   │ 7%       │ 👁️✏️📊🚫│
│□│ #235 │ María García   │ maria@...    │ 27-xxx   │ 🟡Pend. │ $5,678    │ $0      │ 7%       │ 👁️✏️✅❌│
└─┴──────┴────────────────┴──────────────┴──────────┴─────────┴───────────┴─────────┴──────────┴─────────┘
```

**Panel Lateral (al seleccionar dropshipper):**
```
┌─────────────────────────────┐
│ Resumen: Juan Pérez         │
├─────────────────────────────┤
│ 📅 Registrado: 12/03/2024   │
│ 🏪 Tiendas: 3 conectadas    │
│ 📦 Pedidos mes: 45          │
│ 💰 Facturación mes: $234K   │
│ ⭐ Rating: 4.8/5            │
│                             │
│ Acciones Rápidas:           │
│ [Enviar Mensaje]            │
│ [Ajustar Comisión]          │
│ [Ver Historial Completo]    │
│ [Suspender Cuenta]          │
└─────────────────────────────┘
```

### 2.3 APROBACIÓN DE DROPSHIPPERS

**Vista de Solicitud Pendiente:**
```
┌────────────────────────────────────────────────────────────────┐
│ Solicitud #456 - María García          Estado: 🟡 Pendiente    │
├────────────────────────────────────────────────────────────────┤
│ Datos Personales:                    │ Documentación:          │
│ ┌──────────────────────────────┐     │ ┌────────────────┐     │
│ │ Nombre: María García         │     │ │ [📄 CUIT.pdf]  │     │
│ │ Email: maria@ejemplo.com     │     │ │ ✅ Validado AFIP│     │
│ │ Teléfono: +54 11 1234-5678   │     │ │                │     │
│ │ CUIT: 27-12345678-9          │     │ │ [📄 DNI.jpg]   │     │
│ │ Razón Social: García SRL     │     │ │ ✅ Verificado   │     │
│ │ Dirección: Av. Corrientes 123│     │ │                │     │
│ │ Ciudad: Buenos Aires          │     │ │ [📄 CBU.pdf]   │     │
│ └──────────────────────────────┘     │ │ ✅ Cuenta válida│     │
│                                       │ └────────────────┘     │
│ Datos Bancarios:                                               │
│ CBU: 0000003100050341234567                                   │
│ Alias: MARIA.GARCIA.DROP                                       │
│ Banco: Banco Nación                                           │
├────────────────────────────────────────────────────────────────┤
│ Validaciones Automáticas:           │ Análisis de Riesgo:     │
│ ✅ CUIT válido en AFIP             │ Score: 85/100 (Bajo)    │
│ ✅ Email verificado                 │ ✅ Sin antecedentes      │
│ ✅ Teléfono verificado              │ ✅ Datos consistentes    │
│ ✅ CBU válido                      │ ⚠️ Primera vez en sistema│
├────────────────────────────────────────────────────────────────┤
│ Notas del Administrador:                                       │
│ [________________________________________________]              │
│                                                                │
│ [✅ APROBAR] [❌ RECHAZAR] [🔄 SOLICITAR MÁS INFO] [📋 HISTORIAL]│
└────────────────────────────────────────────────────────────────┘
```

### 2.4 GESTIÓN DE PRODUCTOS

**Barra de Herramientas:**
```
[+ Nuevo Producto] [Importar] [Exportar] [Actualización Masiva ▼] [Gestionar Categorías]
Buscar: [_______________] [🔍] Filtros: Categoría [▼] Proveedor [▼] Stock [▼] Estado [▼]
```

**Vista de Producto (Edición):**
```
┌────────────────────────────────────────────────────────────────┐
│ Editar Producto: Aspiradora 2 en 1 1200w        [Guardar] [X] │
├────────────────────────────────────────────────────────────────┤
│ Información Básica:                  │ Imágenes:               │
│ Nombre: [_____________________]      │ ┌──┐ ┌──┐ ┌──┐ ┌──┐   │
│ Descripción:                         │ │📷│ │📷│ │📷│ │➕│   │
│ [________________________           ]│ └──┘ └──┘ └──┘ └──┘   │
│ [________________________           ]│ [Subir] [Desde URL]     │
│                                      │                         │
│ Categorías: [✓] Hogar [✓] Limpieza  │ Especificaciones:       │
│ Tags: [electrodomésticos] [+]        │ Peso: [3.0] kg          │
│                                      │ Alto: [22] cm           │
│ Precios y Stock:                     │ Ancho: [34] cm          │
│ Costo: $[59,999.00]                 │ Prof: [70] cm           │
│ P.Sugerido: $[62,999.00]            │                         │
│ Margen: [5%] (Calculado)             │ Proveedor:              │
│ Stock: [800] unidades                │ [Proveedor4 ▼]          │
│ Stock Min: [50] (alerta)             │ Depósito: [Principal ▼] │
│                                      │ Ref.Interna: [MB-023]   │
│ Visibilidad:                         │                         │
│ ○ Todos los dropshippers             │ SEO:                    │
│ ● Dropshippers específicos:          │ URL: [aspiradora-2-en-1]│
│   [✓] Grupo A [✓] Grupo B [ ] VIP    │ Meta Desc: [_________]  │
├────────────────────────────────────────────────────────────────┤
│ Historial de Cambios:               [Ver todos los cambios]    │
│ • 15/09 14:30 - Admin1: Actualizó precio de $57,999 a $59,999  │
│ • 14/09 10:15 - Sistema: Stock actualizado de 850 a 800        │
│ • 13/09 09:45 - Admin2: Agregó 3 nuevas imágenes              │
└────────────────────────────────────────────────────────────────┘
```

### 2.5 GESTIÓN DE PEDIDOS

**Dashboard de Pedidos:**
```
Estados: [Todos (523)] [Pendiente (45)] [Confirmado (123)] [Preparado (89)]
        [Despachado (156)] [Entregado (98)] [Con Incidencias (12)]

┌────────────────────────────────────────────────────────────────────┐
│ Filtros Avanzados:                                  [Aplicar]      │
│ Dropshipper: [Todos ▼] Fecha: [___] a [___] Monto: $[___] a $[___]│
│ Tienda: [Todas ▼] Transportista: [Todos ▼] Producto: [________]   │
└────────────────────────────────────────────────────────────────────┘
```

**Tabla de Pedidos Extendida:**
```
┌─┬────────┬──────────┬────────────┬────────────┬─────────┬─────────┬──────────┬──────────┬─────────┐
│□│ Pedido │ Fecha    │ Dropshipper│ Cliente    │ Tienda  │ Total   │ Estado   │ Tracking │ Acciones│
├─┼────────┼──────────┼────────────┼────────────┼─────────┼─────────┼──────────┼──────────┼─────────┤
│□│ #1032  │ 26/09 14:30│ Juan P.   │ C.García   │ Shop#1  │ $49,880 │ 🟡A pagar│ N/A      │ 👁️✏️📧🚛│
│□│ #1031  │ 26/09 12:10│ María G.  │ W.Oses     │ Shop#2  │ $49,880 │ 🟣Incid. │ 374E632  │ 👁️✏️📧⚠️│
└─┴────────┴──────────┴────────────┴────────────┴─────────┴─────────┴──────────┴──────────┴─────────┘

Acciones Masivas: [Cambiar Estado ▼] [Generar Etiquetas] [Exportar] [Asignar Transporte]
```

**Panel de Gestión de Incidencias:**
```
┌────────────────────────────────────────────────────────────────┐
│ Pedido #1031 - INCIDENCIA ACTIVA           Prioridad: 🔴 ALTA  │
├────────────────────────────────────────────────────────────────┤
│ Tipo: Producto dañado en tránsito                             │
│ Reportado por: Cliente (via Shopify)                          │
│ Fecha reporte: 26/09/2024 10:30                              │
│                                                               │
│ Evidencia:                                                    │
│ [📷 foto1.jpg] [📷 foto2.jpg] [📄 reclamo.pdf]              │
│                                                               │
│ Historial de Comunicaciones:                                  │
│ ┌──────────────────────────────────────────────────┐         │
│ │ 26/09 10:30 - Cliente: Producto llegó roto        │         │
│ │ 26/09 11:00 - Soporte: Solicitamos fotos          │         │
│ │ 26/09 11:30 - Cliente: Adjunto evidencia          │         │
│ │ 26/09 12:00 - Admin: Escalado a proveedor         │         │
│ └──────────────────────────────────────────────────┘         │
│                                                               │
│ Acciones Disponibles:                                        │
│ [Autorizar Reembolso] [Reenviar Producto] [Contactar Proveedor]│
│ [Escalar] [Cerrar Incidencia] [Agregar Nota]                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.6 GESTIÓN FINANCIERA

**Panel de Solicitudes de Retiro:**
```
┌────────────────────────────────────────────────────────────────┐
│ Solicitudes de Retiro Pendientes (15)     Total: $1,234,567    │
├────────────────────────────────────────────────────────────────┤
│ Filtros: [Pendientes] [Aprobadas] [Rechazadas] [Todas]        │
└────────────────────────────────────────────────────────────────┘

┌─┬──────┬────────────┬──────────┬───────────┬──────────┬────────────┬─────────┐
│□│ ID   │ Dropshipper│ Fecha    │ Monto     │ Saldo    │ Estado     │ Acciones│
├─┼──────┼────────────┼──────────┼───────────┼──────────┼────────────┼─────────┤
│□│ #415 │ Juan P.    │ 29/09 09:20│ $10,000 │ $12,345  │ ⏳Pendiente│ ✅❌📄👁️│
│□│ #413 │ María G.   │ 26/09 19:32│ $50,000 │ $65,432  │ ⏳Pendiente│ ✅❌📄👁️│
└─┴──────┴────────────┴──────────┴───────────┴──────────┴────────────┴─────────┘

[Aprobar Seleccionados] [Rechazar Seleccionados] [Exportar para Banco]
```

**Detalle de Solicitud de Retiro:**
```
┌────────────────────────────────────────────────────────────────┐
│ Solicitud #415 - Juan Pérez                 [Aprobar] [Rechazar]│
├────────────────────────────────────────────────────────────────┤
│ Información de la Solicitud:      │ Datos Bancarios:          │
│ Monto solicitado: $10,000.00     │ CBU: 00000031000503412345 │
│ Saldo actual: $12,345.00         │ Alias: JUAN.PEREZ.DROP    │
│ Saldo post-retiro: $2,345.00     │ Banco: Banco Nación       │
│                                   │ Tipo: Caja de Ahorro      │
│ Historial de Retiros:             │                           │
│ • 15/09: $8,000 ✅ Aprobado      │ Validación:               │
│ • 01/09: $15,000 ✅ Aprobado     │ ✅ CBU válido             │
│ • 15/08: $12,000 ✅ Aprobado     │ ✅ Titular coincide       │
│ Total últimos 30 días: $35,000   │ ✅ Sin deudas pendientes  │
│                                   │                           │
│ Notas del administrador:                                       │
│ [____________________________________________]                 │
└────────────────────────────────────────────────────────────────┘
```

**Dashboard Financiero:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Ingresos Mes    │ Comisiones      │ Retiros Pend.   │ Saldo Sistema   │
│ $12,345,678     │ $864,197        │ $234,567        │ $5,678,901      │
│ ↑ 15% vs mes ant│ 7% promedio     │ 15 solicitudes  │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

📊 Gráficos:
[Flujo de caja diario] [Comisiones por dropshipper] [Proyección mensual]
```

### 2.7 GESTIÓN DE PROVEEDORES

**Listado de Proveedores:**
```
┌─┬────────┬─────────────────┬──────────┬───────────┬──────────┬─────────┬─────────┐
│□│ Código │ Nombre          │ CUIT     │ Productos │ Pedidos  │ Rating  │ Acciones│
├─┼────────┼─────────────────┼──────────┼───────────┼──────────┼─────────┼─────────┤
│□│ PROV01 │ Depósito Central│ 30-xxxxx │ 234       │ 1,234    │ ⭐4.8   │ 👁️✏️📊⚙️│
│□│ PROV02 │ Importadora XYZ │ 33-xxxxx │ 567       │ 892      │ ⭐4.2   │ 👁️✏️📊⚙️│
└─┴────────┴─────────────────┴──────────┴───────────┴──────────┴─────────┴─────────┘
```

**Performance de Proveedor:**
```
┌────────────────────────────────────────────────────────────────┐
│ Performance: Depósito Central (PROV01)      Período: Sept 2024 │
├────────────────────────────────────────────────────────────────┤
│ KPIs:                                                          │
│ ┌───────────────┬───────────────┬───────────────┬────────────┐│
│ │ Tiempo Prep.  │ Tasa Error    │ Disponibilidad│ Satisfacción││
│ │ 2.3 días      │ 0.8%          │ 98.5%        │ 4.8/5      ││
│ │ ✅ Objetivo   │ ✅ Objetivo   │ ✅ Objetivo   │ ✅ Objetivo ││
│ └───────────────┴───────────────┴───────────────┴────────────┘│
│                                                                │
│ Productos con Problemas:                                       │
│ • ECOMDROP123: 3 devoluciones (defecto de fabricación)        │
│ • ECOMDROP456: Stock inconsistente reportado 5 veces          │
│                                                                │
│ [Ver Detalle Completo] [Contactar Proveedor] [Auditar]        │
└────────────────────────────────────────────────────────────────┘
```

### 2.8 INTEGRACIONES

**Panel de Integraciones:**
```
┌────────────────────────────────────────────────────────────────┐
│ Integraciones Activas                                         │
├────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│ │   Shopify   │ │Mercado Libre│ │ WooCommerce │              │
│ │     ✅      │ │     ⚠️      │ │     ❌      │              │
│ │ 45 tiendas  │ │ 12 cuentas  │ │ 0 tiendas   │              │
│ │[Configurar] │ │[Configurar] │ │[Configurar] │              │
│ └─────────────┘ └─────────────┘ └─────────────┘              │
└────────────────────────────────────────────────────────────────┘
```

**Configuración Shopify:**
```
┌────────────────────────────────────────────────────────────────┐
│ Configuración: Shopify                         [Guardar] [Test]│
├────────────────────────────────────────────────────────────────┤
│ API Credentials:                                               │
│ API Key: [********************************]                   │
│ Secret: [********************************]                    │
│ Webhook URL: https://api.ecomdrop.com/webhooks/shopify        │
│                                                                │
│ Sincronización:                                               │
│ [✓] Sincronizar productos automáticamente                     │
│ [✓] Actualizar stock en tiempo real                          │
│ [✓] Importar pedidos automáticamente                         │
│ [ ] Sincronizar precios                                      │
│                                                                │
│ Mapeo de Estados:                                             │
│ Shopify "pending" → Ecomdrop [Pendiente ▼]                   │
│ Shopify "paid" → Ecomdrop [A pagar ▼]                        │
│ Shopify "fulfilled" → Ecomdrop [Entregado ▼]                 │
│                                                                │
│ Logs de Sincronización:                    [Ver logs completos]│
│ • 29/09 14:30 - ✅ Sincronización exitosa (45 tiendas)        │
│ • 29/09 14:00 - ⚠️ Error en tienda #23: Token expirado        │
│ • 29/09 13:30 - ✅ Sincronización exitosa (44 tiendas)        │
└────────────────────────────────────────────────────────────────┘
```

### 2.9 ANALYTICS Y REPORTES

**Constructor de Reportes:**
```
┌────────────────────────────────────────────────────────────────┐
│ Constructor de Reportes                   [Guardar] [Ejecutar] │
├────────────────────────────────────────────────────────────────┤
│ Nombre del Reporte: [_________________________]               │
│                                                                │
│ Fuente de Datos:                                              │
│ [✓] Ventas [ ] Productos [✓] Dropshippers [ ] Finanzas        │
│                                                                │
│ Campos Seleccionados:            Campos Disponibles:          │
│ ┌─────────────────┐              ┌─────────────────┐         │
│ │ • Fecha         │ ← → Agregar  │ • Cliente       │         │
│ │ • Dropshipper   │ Quitar       │ • Provincia     │         │
│ │ • Total Venta   │              │ • Método Pago   │         │
│ │ • Comisión      │              │ • Transportista │         │
│ └─────────────────┘              └─────────────────┘         │
│                                                                │
│ Filtros:                                                       │
│ Período: [01/09/2024] a [30/09/2024]                         │
│ Dropshipper: [Todos ▼]                                        │
│ Monto mínimo: $[_____]                                        │
│                                                                │
│ Agrupación: [Por día ▼]  Ordenar por: [Fecha ▼] [Desc ▼]     │
│                                                                │
│ Programación:                                                 │
│ [ ] Generar automáticamente: [Diario ▼] a las [09:00]        │
│ [ ] Enviar por email a: [_________________________]          │
└────────────────────────────────────────────────────────────────┘
```

### 2.10 SOPORTE Y COMUNICACIONES

**Centro de Soporte:**
```
┌────────────────────────────────────────────────────────────────┐
│ Centro de Soporte - Tickets Activos (23)                      │
├────────────────────────────────────────────────────────────────┤
│ Prioridad: [🔴 Alta (5)] [🟡 Media (12)] [🟢 Baja (6)]       │
└────────────────────────────────────────────────────────────────┘

┌─┬──────┬──────────┬────────────┬─────────────────┬─────────┬──────────┬─────────┐
│□│ ID   │ Fecha    │ Dropshipper│ Asunto          │ Prior.  │ Estado   │ Asignado│
├─┼──────┼──────────┼────────────┼─────────────────┼─────────┼──────────┼─────────┤
│□│ #789 │ 29/09 14:30│ Juan P.  │ Error al conectar│ 🔴 Alta │ Abierto  │ Admin1  │
│□│ #788 │ 29/09 12:15│ María G. │ Consulta comisión│ 🟡 Media│ En curso │ Soporte2│
└─┴──────┴──────────┴────────────┴─────────────────┴─────────┴──────────┴─────────┘
```

**Chat WhatsApp Integrado:**
```
┌────────────────────────────────────────────────────────────────┐
│ WhatsApp Business - Conversaciones Activas (8)                │
├────────────────────────┬───────────────────────────────────────┤
│ Conversaciones:         │ Juan Pérez                 🟢 En línea│
│ ┌──────────────────┐   ├───────────────────────────────────────┤
│ │ 🟢 Juan P.   (2) │   │                                       │
│ │ 🟢 María G.  (1) │   │ JP: Hola, tengo un problema con...   │
│ │ ⚪ Carlos R.     │   │                                       │
│ │ ⚪ Ana L.        │   │ Soporte: Hola Juan, ¿en qué puedo... │
│ │ 🟢 Pedro M.  (3) │   │                                       │
│ └──────────────────┘   │ JP: No puedo ver mis pedidos         │
│                        │                                       │
│ [Plantillas ▼]         │ [___________________________] [Enviar]│
│ [Transferir]          │ [📎] [😊] [🔗 Adjuntar enlace]        │
└────────────────────────┴───────────────────────────────────────┘
```

### 2.11 CONFIGURACIÓN DEL SISTEMA

**Panel de Configuración General:**
```
┌────────────────────────────────────────────────────────────────┐
│ Configuración General                              [Guardar]   │
├────────────────────────────────────────────────────────────────┤
│ Información de la Empresa:                                    │
│ Nombre: [ECOMLATAM SRL]                                       │
│ CUIT: [30-71234567-8]                                        │
│ Dirección: [_________________________________]                │
│                                                                │
│ Configuración Regional:                                       │
│ Moneda: [ARS - Peso Argentino ▼]                             │
│ Zona Horaria: [America/Buenos_Aires ▼]                        │
│ Formato Fecha: [DD/MM/YYYY ▼]                                │
│ Separador Decimal: [, ▼]                                      │
│                                                                │
│ Límites del Sistema:                                          │
│ Retiro mínimo: $[5,000]                                      │
│ Retiro máximo: $[500,000]                                    │
│ Comisión por defecto: [7]%                                   │
│ Días para procesar retiro: [2]                               │
│                                                                │
│ Notificaciones del Sistema:                                   │
│ [✓] Enviar resumen diario a administradores                  │
│ [✓] Alertar stock bajo (umbral: [50] unidades)               │
│ [✓] Notificar nuevos registros de dropshippers               │
│ [✓] Alertar pedidos sin procesar > [48] horas                │
└────────────────────────────────────────────────────────────────┘
```

**Gestión de Roles y Permisos:**
```
┌────────────────────────────────────────────────────────────────┐
│ Gestión de Roles                        [+ Nuevo Rol]         │
├────────────────────────────────────────────────────────────────┤
│ Rol: Administrador                              [Editar]      │
├────────────────────────────────────────────────────────────────┤
│ Permisos:                                                     │
│                                                                │
│ Dashboard:           Dropshippers:        Productos:          │
│ [✓] Ver             [✓] Ver               [✓] Ver             │
│ [✓] Exportar        [✓] Crear             [✓] Crear           │
│                     [✓] Editar            [✓] Editar          │
│                     [✓] Eliminar          [✓] Eliminar        │
│                     [✓] Aprobar           [✓] Importar        │
│                                                                │
│ Pedidos:            Finanzas:             Configuración:      │
│ [✓] Ver             [✓] Ver               [✓] Ver             │
│ [✓] Editar          [✓] Aprobar retiros   [✓] Editar          │
│ [✓] Cancelar        [✓] Ajustes manuales  [ ] Roles           │
│ [✓] Cambiar estado  [✓] Generar reportes  [ ] Sistema         │
│                                                                │
│ Usuarios con este rol: (5)                                    │
│ • admin@ecomdrop.com (Master)                                 │
│ • supervisor1@ecomdrop.com                                    │
│ • supervisor2@ecomdrop.com                                    │
└────────────────────────────────────────────────────────────────┘
```

## 3. ELEMENTOS DE INTERFAZ COMUNES

### 3.1 Modales y Diálogos

**Modal de Confirmación Estándar:**
```
┌──────────────────────────────────────┐
│ ⚠️ Confirmar Acción                  │
├──────────────────────────────────────┤
│                                      │
│ ¿Está seguro de aprobar el retiro   │
│ de $10,000 para Juan Pérez?         │
│                                      │
│ Esta acción no se puede deshacer.   │
│                                      │
│    [Cancelar]  [Confirmar]           │
└──────────────────────────────────────┘
```

### 3.2 Notificaciones

**Toast Notifications (esquina superior derecha):**
```
┌─────────────────────────────────┐
│ ✅ Éxito                    [X] │
│ Retiro aprobado exitosamente    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️ Advertencia              [X] │
│ Stock bajo en 5 productos       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ❌ Error                    [X] │
│ No se pudo procesar solicitud   │
└─────────────────────────────────┘
```

### 3.3 Badges y Estados

**Estados de Pedidos:**
- 🔵 Pendiente (azul)
- 🟡 A pagar (amarillo)
- 🟣 Con incidencias (morado)
- 🟢 Confirmado (verde)
- 🔷 Preparado (celeste)
- 🟦 Despachado (azul marino)
- ✅ Entregado (verde con check)
- 🔴 Cancelado (rojo)
- 🔄 Devuelto (gris con flecha)

**Estados de Usuarios:**
- 🟢 Activo
- 🟡 Pendiente
- 🔴 Suspendido
- ⚫ Inactivo
- 🔵 En revisión

### 3.4 Acciones Rápidas (Tooltips)

Al pasar el mouse sobre íconos de acción:
- 👁️ "Ver detalles"
- ✏️ "Editar"
- 🗑️ "Eliminar"
- 📊 "Ver estadísticas"
- 📧 "Enviar email"
- 💬 "Enviar mensaje"
- 📄 "Ver documentos"
- ⚙️ "Configurar"
- 🔒 "Bloquear"
- 🔓 "Desbloquear"
- 💰 "Ver movimientos"
- 📦 "Ver productos"
- 🚛 "Tracking"
- ⚠️ "Ver incidencia"

## 4. FUNCIONALIDADES ESPECIALES

### 4.1 Búsqueda Global (Comando + K)

```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Búsqueda Rápida                                  [ESC] │
├────────────────────────────────────────────────────────────┤
│ [Buscar pedidos, dropshippers, productos...]              │
│                                                           │
│ Resultados Recientes:                                     │
│ 📦 Pedido #1032 - Juan Gottardi                          │
│ 👤 Dropshipper - María García                            │
│ 📦 Producto - Aspiradora 2 en 1                          │
│                                                           │
│ Acciones Rápidas:                                        │
│ → Crear nuevo pedido                                     │
│ → Agregar dropshipper                                    │
│ → Importar productos                                     │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Panel de Actividad en Tiempo Real

```
┌────────────────────────────────────────┐
│ 🔴 Actividad en Vivo                   │
├────────────────────────────────────────┤
│ • 14:32 - Nuevo pedido #1033 ($45,000) │
│ • 14:31 - Juan P. solicitó retiro      │
│ • 14:30 - Stock actualizado ECOMDROP123│
│ • 14:28 - María G. se conectó          │
│ • 14:25 - Pedido #1032 confirmado      │
│ [Pausar] [Ver Todo]                    │
└────────────────────────────────────────┘
```

### 4.3 Modo Oscuro

Toggle en header para cambiar entre modo claro/oscuro, manteniendo la coherencia visual y legibilidad en ambos modos.

### 4.4 Responsive Design

La interfaz debe adaptarse a diferentes resoluciones:
- Desktop: Layout completo con sidebar expandido
- Tablet: Sidebar colapsable, tablas con scroll horizontal
- Mobile: Menú hamburguesa, vistas simplificadas, acciones principales destacadas

## 5. CONSIDERACIONES FUNCIONALES

### 5.1 Performance
- Lazy loading para tablas con muchos registros
- Paginación configurable (10/25/50/100 items)
- Caché de búsquedas frecuentes
- Actualización en tiempo real vía WebSockets

### 5.2 Seguridad
- Confirmación para acciones críticas
- Log de auditoría para todas las acciones
- Timeout de sesión configurable
- 2FA para acciones financieras

### 5.3 Accesibilidad
- Navegación completa por teclado
- Atajos de teclado documentados
- Alto contraste disponible
- Textos alternativos en imágenes

### 5.4 Internacionalización
- Soporte multi-idioma
- Formatos de fecha/moneda localizados
- Zona horaria configurable por usuario
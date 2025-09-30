# CASOS DE USO - MÓDULO ADMINISTRADOR

## 1. GESTIÓN DE USUARIOS Y DROPSHIPPERS

### CU-ADM-001: Listar Todos los Dropshippers
**Actor:** Administrador
**Precondición:** Estar autenticado como administrador
**Flujo Principal:**
1. El administrador accede al módulo "Gestión de Dropshippers"
2. El sistema muestra tabla con todos los dropshippers registrados:
   - ID de dropshipper
   - Nombre completo
   - Email
   - CUIT/Razón social
   - Estado (Activo/Inactivo/Pendiente/Suspendido)
   - Fecha de registro
   - Saldo en billetera
   - Total de ventas
   - Comisiones generadas
   - Tiendas conectadas
   - Último acceso
3. El administrador puede ordenar por cualquier columna
4. El administrador puede buscar por nombre, email o CUIT
5. El administrador puede filtrar por estado
6. El administrador puede exportar la lista a Excel/CSV
**Postcondición:** El administrador visualiza información completa de dropshippers

### CU-ADM-002: Aprobar Registro de Nuevo Dropshipper
**Actor:** Administrador
**Precondición:** Existe solicitud de registro pendiente
**Flujo Principal:**
1. El sistema notifica al administrador de nuevos registros
2. El administrador accede a "Solicitudes Pendientes"
3. El sistema muestra lista de dropshippers pendientes de aprobación
4. El administrador selecciona un registro pendiente
5. El sistema muestra:
   - Datos personales completos
   - Documentación adjunta (CUIT, identificación)
   - Datos bancarios
   - Validación automática de AFIP
6. El administrador revisa la información
7. El administrador hace clic en "Aprobar"
8. El sistema activa la cuenta del dropshipper
9. El sistema envía email de bienvenida al dropshipper
**Flujo Alternativo:**
- 7a. El administrador rechaza el registro
  - El administrador ingresa motivo del rechazo
  - El sistema envía notificación al solicitante
  - El registro queda en estado "Rechazado"
**Postcondición:** Dropshipper aprobado y activo en el sistema

### CU-ADM-003: Suspender/Activar Dropshipper
**Actor:** Administrador
**Precondición:** Dropshipper existente en el sistema
**Flujo Principal:**
1. El administrador busca al dropshipper
2. El administrador accede al perfil del dropshipper
3. El sistema muestra opciones de estado
4. El administrador selecciona "Suspender" o "Activar"
5. El administrador ingresa motivo de la acción
6. El sistema solicita confirmación
7. El administrador confirma
8. El sistema actualiza el estado
9. El sistema registra la acción en el historial
10. El sistema notifica al dropshipper por email
**Postcondición:** Estado del dropshipper actualizado

### CU-ADM-004: Gestionar Comisiones de Dropshippers
**Actor:** Administrador
**Precondición:** Configuración de comisiones activa
**Flujo Principal:**
1. El administrador accede a "Configuración de Comisiones"
2. El sistema muestra:
   - Comisión general actual (7%)
   - Lista de comisiones especiales por dropshipper
3. El administrador puede:
   - Modificar comisión general
   - Asignar comisión especial a dropshipper específico
   - Establecer comisiones por categoría de producto
   - Definir comisiones escalonadas por volumen
4. El administrador configura los valores
5. El administrador define fecha de vigencia
6. El sistema valida los cambios
7. El administrador confirma
8. El sistema aplica nuevas comisiones
**Postcondición:** Comisiones actualizadas en el sistema

### CU-ADM-005: Ver Historial de Dropshipper
**Actor:** Administrador
**Precondición:** Dropshipper seleccionado
**Flujo Principal:**
1. El administrador accede al perfil del dropshipper
2. El administrador selecciona pestaña "Historial"
3. El sistema muestra timeline con:
   - Cambios de estado
   - Modificaciones de datos
   - Solicitudes de retiro
   - Problemas reportados
   - Interacciones con soporte
   - Cambios de comisión
4. El administrador puede filtrar por tipo de evento
5. El administrador puede exportar el historial
**Postcondición:** Administrador conoce historial completo del dropshipper

## 2. GESTIÓN DE PRODUCTOS Y CATÁLOGO

### CU-ADM-006: Agregar Nuevo Producto
**Actor:** Administrador
**Precondición:** Estar en módulo de productos
**Flujo Principal:**
1. El administrador hace clic en "Nuevo Producto"
2. El sistema muestra formulario con campos:
   - Nombre del producto
   - Descripción detallada
   - Categoría (selector múltiple)
   - Código SKU único
   - Código de proveedor
   - Imágenes (múltiples, drag & drop)
   - Precio de costo
   - Precio sugerido de venta
   - Margen de ganancia
   - Stock disponible
   - Stock mínimo para alerta
   - Proveedor (selector)
   - Dimensiones (peso, alto, ancho, profundidad)
   - Referencia interna
   - Tags/etiquetas
   - Visibilidad (Todos/Grupos específicos)
3. El administrador completa todos los campos requeridos
4. El administrador hace clic en "Guardar"
5. El sistema valida información
6. El sistema genera código único ECOMDROP
7. El sistema publica el producto
**Postcondición:** Nuevo producto disponible en catálogo

### CU-ADM-007: Editar Producto Existente
**Actor:** Administrador
**Precondición:** Producto existente en catálogo
**Flujo Principal:**
1. El administrador busca el producto
2. El administrador hace clic en "Editar"
3. El sistema muestra formulario con datos actuales
4. El administrador modifica los campos necesarios
5. El administrador puede:
   - Cambiar imágenes
   - Actualizar precios
   - Modificar stock
   - Cambiar visibilidad
   - Actualizar descripción
6. El administrador guarda cambios
7. El sistema registra modificación en historial
8. El sistema notifica a dropshippers si hay cambios críticos
**Postcondición:** Producto actualizado en catálogo

### CU-ADM-008: Gestionar Stock de Productos
**Actor:** Administrador
**Precondición:** Productos en catálogo
**Flujo Principal:**
1. El administrador accede a "Gestión de Stock"
2. El sistema muestra:
   - Lista de productos con stock actual
   - Alertas de stock bajo
   - Productos sin stock
3. El administrador puede:
   - Actualizar stock manualmente
   - Cargar archivo CSV con actualizaciones masivas
   - Configurar alertas de stock mínimo
   - Ver historial de movimientos de stock
4. El administrador realiza ajustes necesarios
5. El sistema actualiza disponibilidad
6. El sistema notifica a dropshippers de cambios importantes
**Postcondición:** Stock actualizado en tiempo real

### CU-ADM-009: Configurar Visibilidad de Productos
**Actor:** Administrador
**Precondición:** Productos en catálogo
**Flujo Principal:**
1. El administrador selecciona producto(s)
2. El administrador accede a "Configurar Visibilidad"
3. El sistema muestra opciones:
   - Visible para todos
   - Visible para grupos específicos
   - Visible para dropshippers específicos
   - Oculto temporalmente
4. El administrador selecciona visibilidad
5. Si es específica, selecciona dropshippers/grupos
6. El administrador confirma cambios
7. El sistema aplica restricciones de visibilidad
**Postcondición:** Visibilidad configurada según criterios

### CU-ADM-010: Importar/Exportar Catálogo
**Actor:** Administrador
**Precondición:** Módulo de productos
**Flujo Principal para Importar:**
1. El administrador hace clic en "Importar Productos"
2. El sistema muestra plantilla de importación
3. El administrador carga archivo CSV/Excel
4. El sistema valida formato y datos
5. El sistema muestra preview de productos a importar
6. El administrador confirma importación
7. El sistema procesa y carga productos
8. El sistema muestra reporte de importación
**Flujo Principal para Exportar:**
1. El administrador aplica filtros deseados
2. El administrador hace clic en "Exportar"
3. El sistema genera archivo con catálogo
4. El sistema descarga archivo
**Postcondición:** Catálogo importado/exportado exitosamente

## 3. GESTIÓN DE PEDIDOS Y LOGÍSTICA

### CU-ADM-011: Monitorear Todos los Pedidos
**Actor:** Administrador
**Precondición:** Estar en módulo de pedidos
**Flujo Principal:**
1. El administrador accede a "Gestión de Pedidos"
2. El sistema muestra dashboard con:
   - Total de pedidos por estado
   - Gráficos de evolución
   - Alertas de pedidos problemáticos
   - Métricas de cumplimiento
3. El administrador visualiza tabla maestra con:
   - Todos los pedidos del sistema
   - Dropshipper asignado
   - Cliente final
   - Tienda origen
   - Estado actual
   - Tiempo en estado actual
   - Valor del pedido
   - Tracking de envío
4. El administrador puede filtrar por:
   - Dropshipper
   - Estado
   - Fecha
   - Tienda
   - Proveedor
**Postcondición:** Administrador tiene visibilidad total de pedidos

### CU-ADM-012: Cambiar Estado de Pedido
**Actor:** Administrador
**Precondición:** Pedido existente
**Flujo Principal:**
1. El administrador selecciona pedido(s)
2. El administrador hace clic en "Cambiar Estado"
3. El sistema muestra estados disponibles según estado actual
4. El administrador selecciona nuevo estado
5. El administrador ingresa motivo/observación
6. El sistema valida transición de estado
7. El administrador confirma
8. El sistema actualiza estado
9. El sistema notifica al dropshipper
10. El sistema registra en historial
**Postcondición:** Estado de pedido actualizado

### CU-ADM-013: Gestionar Pedidos con Incidencias
**Actor:** Administrador
**Precondición:** Pedidos con problemas reportados
**Flujo Principal:**
1. El sistema muestra alertas de pedidos con incidencias
2. El administrador accede a "Pedidos con Incidencias"
3. El sistema muestra lista priorizada por severidad
4. El administrador selecciona pedido problemático
5. El sistema muestra:
   - Detalle del problema
   - Historial del pedido
   - Comunicaciones relacionadas
   - Dropshipper involucrado
6. El administrador toma acción:
   - Contactar proveedor
   - Autorizar reembolso
   - Generar reenvío
   - Escalar a supervisor
7. El administrador documenta resolución
8. El sistema actualiza estado
**Postcondición:** Incidencia gestionada y documentada

### CU-ADM-014: Configurar Transportistas y Envíos
**Actor:** Administrador
**Precondición:** Módulo de configuración
**Flujo Principal:**
1. El administrador accede a "Gestión de Transportistas"
2. El sistema muestra transportistas actuales (ej: Urbano)
3. El administrador puede:
   - Agregar nuevo transportista
   - Configurar tarifas por zona
   - Establecer tiempos de entrega
   - Definir zonas de cobertura
   - Configurar API de tracking
4. El administrador configura parámetros
5. El sistema valida configuración
6. El administrador activa transportista
7. El sistema habilita para selección en pedidos
**Postcondición:** Transportistas configurados y disponibles

### CU-ADM-015: Generar Etiquetas de Envío Masivas
**Actor:** Administrador
**Precondición:** Pedidos confirmados pendientes de envío
**Flujo Principal:**
1. El administrador filtra pedidos confirmados
2. El administrador selecciona múltiples pedidos
3. El administrador hace clic en "Generar Etiquetas"
4. El sistema conecta con API de transportista
5. El sistema genera etiquetas para cada pedido
6. El sistema consolida en PDF único o múltiple
7. El administrador descarga etiquetas
8. El sistema actualiza estado a "Preparado"
**Postcondición:** Etiquetas generadas y pedidos actualizados

## 4. GESTIÓN FINANCIERA Y FACTURACIÓN

### CU-ADM-016: Aprobar/Rechazar Solicitudes de Retiro
**Actor:** Administrador
**Precondición:** Solicitudes de retiro pendientes
**Flujo Principal:**
1. El sistema notifica solicitudes pendientes
2. El administrador accede a "Solicitudes de Retiro"
3. El sistema muestra lista con:
   - Dropshipper solicitante
   - Monto solicitado
   - Saldo disponible
   - Datos bancarios
   - Historial de retiros previos
4. El administrador revisa solicitud
5. El administrador verifica:
   - Saldo suficiente
   - Datos bancarios válidos
   - Sin deudas pendientes
6. El administrador aprueba o rechaza
7. Si aprueba:
   - Sistema genera orden de pago
   - Sistema descuenta de billetera
   - Sistema notifica al dropshipper
8. Si rechaza:
   - Administrador ingresa motivo
   - Sistema notifica rechazo
**Postcondición:** Solicitud procesada

### CU-ADM-017: Confirmar Ingresos de Dinero
**Actor:** Administrador
**Precondición:** Solicitudes de ingreso con comprobantes
**Flujo Principal:**
1. El administrador accede a "Ingresos Pendientes"
2. El sistema muestra solicitudes con:
   - Dropshipper
   - Monto declarado
   - Comprobante adjunto
   - Datos de transferencia
3. El administrador verifica en sistema bancario
4. El administrador confirma coincidencia
5. El administrador aprueba el ingreso
6. El sistema acredita en billetera del dropshipper
7. El sistema genera comprobante
8. El sistema notifica al dropshipper
**Flujo Alternativo:**
- 4a. No coincide el monto
  - Administrador rechaza con observación
  - Sistema notifica discrepancia
**Postcondición:** Ingreso procesado y acreditado

### CU-ADM-018: Generar Reportes Financieros
**Actor:** Administrador
**Precondición:** Datos financieros en sistema
**Flujo Principal:**
1. El administrador accede a "Reportes Financieros"
2. El sistema ofrece tipos de reportes:
   - Ventas por período
   - Comisiones generadas
   - Movimientos de billetera
   - Estado de cuentas por dropshipper
   - Proyección de pagos
   - Análisis de márgenes
3. El administrador selecciona tipo de reporte
4. El administrador configura:
   - Período (fechas)
   - Dropshippers (todos o específicos)
   - Formato (PDF, Excel)
   - Nivel de detalle
5. El sistema genera reporte
6. El administrador descarga o visualiza
**Postcondición:** Reporte generado con información solicitada

### CU-ADM-019: Gestionar Facturación a Dropshippers
**Actor:** Administrador
**Precondición:** Ventas realizadas en el período
**Flujo Principal:**
1. El administrador accede a "Facturación"
2. El sistema muestra ventas pendientes de facturar
3. El administrador selecciona período de facturación
4. El sistema calcula:
   - Total de ventas por dropshipper
   - Comisiones a cobrar
   - Costos de envío
   - Ajustes y bonificaciones
5. El administrador revisa y ajusta si necesario
6. El administrador genera facturas
7. El sistema crea facturas electrónicas
8. El sistema envía a dropshippers
9. El sistema registra en contabilidad
**Postcondición:** Facturas generadas y enviadas

### CU-ADM-020: Realizar Ajustes en Billeteras
**Actor:** Administrador
**Precondición:** Necesidad de ajuste manual
**Flujo Principal:**
1. El administrador busca dropshipper
2. El administrador accede a su billetera
3. El administrador hace clic en "Ajuste Manual"
4. El administrador ingresa:
   - Tipo (Débito/Crédito)
   - Monto
   - Motivo detallado
   - Documento respaldo (opcional)
5. El sistema solicita confirmación
6. El administrador confirma con contraseña
7. El sistema aplica ajuste
8. El sistema registra en historial
9. El sistema notifica al dropshipper
**Postcondición:** Ajuste aplicado y documentado

## 5. GESTIÓN DE PROVEEDORES

### CU-ADM-021: Administrar Proveedores
**Actor:** Administrador
**Precondición:** Módulo de proveedores
**Flujo Principal:**
1. El administrador accede a "Gestión de Proveedores"
2. El sistema muestra lista de proveedores con:
   - Código de proveedor
   - Nombre/Razón social
   - CUIT
   - Productos asociados
   - Estado (Activo/Inactivo)
   - Calificación
3. El administrador puede:
   - Agregar nuevo proveedor
   - Editar información
   - Activar/Desactivar
   - Ver historial de pedidos
   - Configurar depósitos
**Postcondición:** Proveedores gestionados en el sistema

### CU-ADM-022: Configurar Depósitos por Proveedor
**Actor:** Administrador
**Precondición:** Proveedor registrado
**Flujo Principal:**
1. El administrador selecciona proveedor
2. El administrador accede a "Depósitos"
3. El administrador configura:
   - Nombre del depósito (ej: "Depósito Ecomdrop")
   - Dirección completa
   - Horarios de operación
   - Contacto responsable
   - Capacidad de procesamiento
4. El administrador asigna productos al depósito
5. El sistema valida configuración
6. El administrador activa depósito
**Postcondición:** Depósito configurado y operativo

### CU-ADM-023: Monitorear Performance de Proveedores
**Actor:** Administrador
**Precondición:** Historial de operaciones
**Flujo Principal:**
1. El administrador accede a "Performance de Proveedores"
2. El sistema muestra métricas por proveedor:
   - Tiempo promedio de preparación
   - Tasa de incidencias
   - Disponibilidad de stock
   - Calidad de productos
   - Cumplimiento de entregas
3. El administrador puede:
   - Ver detalle por período
   - Comparar proveedores
   - Generar reportes
   - Establecer KPIs
4. El administrador identifica proveedores problemáticos
5. El administrador toma acciones correctivas
**Postcondición:** Performance monitoreada y documentada

## 6. GESTIÓN DE INTEGRACIONES

### CU-ADM-024: Configurar Integración con Shopify
**Actor:** Administrador
**Precondición:** Acceso a configuración de integraciones
**Flujo Principal:**
1. El administrador accede a "Integraciones"
2. El administrador selecciona "Shopify"
3. El administrador configura:
   - API Key de la aplicación
   - Secret Key
   - Webhooks endpoints
   - Mapeo de campos
   - Sincronización de inventario
4. El administrador configura reglas:
   - Frecuencia de sincronización
   - Manejo de conflictos
   - Actualización de precios
   - Gestión de stock
5. El administrador prueba conexión
6. El sistema valida configuración
7. El administrador activa integración
**Postcondición:** Integración con Shopify operativa

### CU-ADM-025: Monitorear Conexiones de Tiendas
**Actor:** Administrador
**Precondición:** Tiendas conectadas al sistema
**Flujo Principal:**
1. El administrador accede a "Monitor de Conexiones"
2. El sistema muestra:
   - Todas las tiendas conectadas
   - Estado de cada conexión
   - Última sincronización
   - Errores o advertencias
   - Volumen de transacciones
3. El administrador puede:
   - Ver logs de sincronización
   - Forzar resincronización
   - Pausar conexión problemática
   - Ver historial de errores
4. El sistema alerta conexiones caídas
5. El administrador toma acciones correctivas
**Postcondición:** Conexiones monitoreadas y estables

## 7. GESTIÓN DE CONFIGURACIÓN Y SISTEMA

### CU-ADM-026: Configurar Parámetros del Sistema
**Actor:** Administrador
**Precondición:** Permisos de administrador master
**Flujo Principal:**
1. El administrador accede a "Configuración del Sistema"
2. El sistema muestra secciones:
   - Configuración general
   - Parámetros de negocio
   - Límites y restricciones
   - Notificaciones
   - Seguridad
3. El administrador puede configurar:
   - Moneda del sistema
   - Zona horaria
   - Formatos de fecha
   - Límites de retiro
   - Tiempos de procesamiento
   - Reglas de negocio
4. El administrador guarda cambios
5. El sistema solicita confirmación
6. El sistema aplica configuración
**Postcondición:** Sistema configurado según parámetros

### CU-ADM-027: Gestionar Roles y Permisos
**Actor:** Administrador Master
**Precondición:** Acceso a gestión de seguridad
**Flujo Principal:**
1. El administrador accede a "Roles y Permisos"
2. El sistema muestra roles existentes:
   - Administrador Master
   - Administrador
   - Supervisor
   - Soporte
   - Dropshipper
3. El administrador puede:
   - Crear nuevo rol
   - Editar permisos de rol
   - Asignar roles a usuarios
   - Configurar restricciones
4. Para cada rol define acceso a:
   - Módulos
   - Funciones específicas
   - Tipos de datos
   - Acciones permitidas
5. El administrador guarda configuración
**Postcondición:** Roles y permisos configurados

### CU-ADM-028: Auditar Actividades del Sistema
**Actor:** Administrador
**Precondición:** Log de auditoría activo
**Flujo Principal:**
1. El administrador accede a "Auditoría"
2. El sistema muestra registro de:
   - Accesos al sistema
   - Modificaciones de datos
   - Transacciones financieras
   - Cambios de configuración
   - Acciones administrativas
3. El administrador puede filtrar por:
   - Usuario
   - Tipo de acción
   - Módulo
   - Fecha/hora
   - Resultado (éxito/error)
4. El administrador puede exportar logs
5. El administrador identifica actividades sospechosas
**Postcondición:** Actividades auditadas y documentadas

## 8. GESTIÓN DE COMUNICACIONES Y SOPORTE

### CU-ADM-029: Gestionar Notificaciones del Sistema
**Actor:** Administrador
**Precondición:** Sistema de notificaciones configurado
**Flujo Principal:**
1. El administrador accede a "Gestión de Notificaciones"
2. El sistema muestra tipos de notificaciones:
   - Email
   - WhatsApp
   - Notificaciones push
   - SMS
3. El administrador configura plantillas para:
   - Bienvenida
   - Confirmación de pedido
   - Cambio de estado
   - Aprobación de retiro
   - Alertas de stock
4. El administrador personaliza:
   - Contenido del mensaje
   - Variables dinámicas
   - Diseño (para emails)
   - Triggers de envío
5. El administrador prueba notificaciones
6. El administrador activa plantillas
**Postcondición:** Notificaciones configuradas y activas

### CU-ADM-030: Atender Tickets de Soporte
**Actor:** Administrador/Soporte
**Precondición:** Tickets creados por dropshippers
**Flujo Principal:**
1. El administrador accede a "Tickets de Soporte"
2. El sistema muestra cola de tickets con:
   - Prioridad
   - Dropshipper
   - Asunto
   - Categoría
   - Tiempo de espera
   - Estado
3. El administrador selecciona ticket
4. El sistema muestra:
   - Historial de conversación
   - Datos del dropshipper
   - Pedidos relacionados
   - Tickets previos
5. El administrador responde o toma acción
6. El administrador puede:
   - Escalar a supervisor
   - Cambiar prioridad
   - Asignar a otro agente
   - Cerrar ticket
7. El sistema notifica al dropshipper
**Postcondición:** Ticket atendido y documentado

### CU-ADM-031: Gestionar Chat de WhatsApp
**Actor:** Administrador/Soporte
**Precondición:** WhatsApp Business API configurado
**Flujo Principal:**
1. El sistema recibe mensaje de WhatsApp
2. El administrador ve notificación en panel
3. El administrador accede a "Chat WhatsApp"
4. El sistema muestra:
   - Conversaciones activas
   - Historial del dropshipper
   - Información contextual
5. El administrador responde consulta
6. El administrador puede:
   - Enviar archivos
   - Compartir enlaces
   - Crear ticket si necesario
   - Transferir a otro agente
7. El sistema registra conversación
**Postcondición:** Consulta atendida vía WhatsApp

## 9. GESTIÓN DE REPORTES Y ANALYTICS

### CU-ADM-032: Generar Dashboard Ejecutivo
**Actor:** Administrador
**Precondición:** Datos operativos disponibles
**Flujo Principal:**
1. El administrador accede a "Dashboard Ejecutivo"
2. El sistema muestra en tiempo real:
   - KPIs principales
   - Ventas del día/mes
   - Dropshippers activos
   - Tasa de conversión
   - Productos más vendidos
   - Incidencias abiertas
   - Proyección de ingresos
3. El administrador puede:
   - Personalizar widgets
   - Cambiar períodos
   - Drill-down en métricas
   - Exportar dashboard
4. El sistema actualiza automáticamente
**Postcondición:** Vista ejecutiva disponible

### CU-ADM-033: Analizar Comportamiento de Dropshippers
**Actor:** Administrador
**Precondición:** Historial de actividad
**Flujo Principal:**
1. El administrador accede a "Analytics de Dropshippers"
2. El sistema muestra análisis de:
   - Frecuencia de pedidos
   - Ticket promedio
   - Productos preferidos
   - Horarios de actividad
   - Tasa de cancelación
   - Satisfacción del cliente
3. El administrador identifica:
   - Top performers
   - Dropshippers en riesgo
   - Oportunidades de crecimiento
   - Necesidades de capacitación
4. El administrador genera acciones basadas en datos
**Postcondición:** Insights de comportamiento obtenidos

### CU-ADM-034: Generar Reportes Personalizados
**Actor:** Administrador
**Precondición:** Constructor de reportes disponible
**Flujo Principal:**
1. El administrador accede a "Constructor de Reportes"
2. El administrador selecciona fuente de datos:
   - Ventas
   - Productos
   - Dropshippers
   - Finanzas
   - Logística
3. El administrador configura:
   - Campos a incluir
   - Filtros
   - Agrupaciones
   - Ordenamiento
   - Formato de salida
4. El administrador puede:
   - Previsualizar reporte
   - Guardar como plantilla
   - Programar generación automática
5. El sistema genera reporte
**Postcondición:** Reporte personalizado disponible

## 10. GESTIÓN DE CONTINGENCIAS

### CU-ADM-035: Gestionar Devoluciones y Reembolsos
**Actor:** Administrador
**Precondición:** Solicitud de devolución recibida
**Flujo Principal:**
1. El sistema notifica solicitud de devolución
2. El administrador accede a "Gestión de Devoluciones"
3. El sistema muestra:
   - Pedido original
   - Motivo de devolución
   - Estado del producto
   - Dropshipper involucrado
   - Cliente final
4. El administrador evalúa solicitud
5. El administrador decide:
   - Aprobar devolución completa
   - Aprobar devolución parcial
   - Rechazar devolución
   - Ofrecer alternativa
6. Si aprueba:
   - Sistema genera guía de retorno
   - Sistema ajusta inventario
   - Sistema procesa reembolso
   - Sistema ajusta comisiones
7. El sistema notifica a todas las partes
**Postcondición:** Devolución procesada correctamente

### CU-ADM-036: Resolver Disputas entre Partes
**Actor:** Administrador
**Precondición:** Disputa reportada
**Flujo Principal:**
1. El administrador recibe alerta de disputa
2. El administrador accede a "Gestión de Disputas"
3. El sistema muestra:
   - Partes involucradas
   - Naturaleza del conflicto
   - Evidencia presentada
   - Historial de comunicaciones
   - Impacto económico
4. El administrador investiga:
   - Revisa documentación
   - Contacta a las partes
   - Solicita información adicional
5. El administrador toma decisión:
   - Asigna responsabilidad
   - Define compensaciones
   - Establece acciones correctivas
6. El sistema implementa resolución
7. El sistema documenta caso
**Postcondición:** Disputa resuelta y documentada

### CU-ADM-037: Gestionar Mantenimiento del Sistema
**Actor:** Administrador
**Precondición:** Necesidad de mantenimiento
**Flujo Principal:**
1. El administrador programa ventana de mantenimiento
2. El administrador configura:
   - Fecha y hora de inicio
   - Duración estimada
   - Mensaje de mantenimiento
   - Servicios afectados
3. El sistema notifica a usuarios con anticipación
4. El administrador inicia modo mantenimiento
5. El sistema muestra página de mantenimiento
6. El administrador realiza tareas necesarias
7. El administrador finaliza mantenimiento
8. El sistema restablece operación normal
9. El sistema notifica fin de mantenimiento
**Postcondición:** Mantenimiento completado sin pérdida de datos
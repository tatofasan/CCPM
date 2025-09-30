# CASOS DE USO - MÓDULO DROPSHIPPER

## 1. GESTIÓN DE DASHBOARD/HOME

### CU-001: Visualizar Dashboard Principal
**Actor:** Dropshipper
**Precondición:** El dropshipper debe estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede al menú "Home" desde el menú lateral izquierdo
2. El sistema muestra el dashboard con:
   - Saludo personalizado con el nombre del usuario
   - Filtros de fecha (fecha inicial y fecha final) con botón "Aplicar"
   - Botón "Más filtros" para opciones adicionales
   - Botón "Limpiar" para resetear filtros
   - Panel de "Estados de pedidos" con indicadores visuales
   - Panel de "Productos más vendidos"
   - Panel de "Estado de facturación"
**Postcondición:** El dropshipper visualiza el resumen de su operación

### CU-002: Filtrar Información del Dashboard
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Dashboard
**Flujo Principal:**
1. El dropshipper selecciona fecha inicial usando el selector de fecha
2. El dropshipper selecciona fecha final usando el selector de fecha
3. El dropshipper hace clic en botón "Aplicar"
4. El sistema actualiza todos los paneles con la información del período seleccionado
**Flujo Alternativo:**
- 3a. El dropshipper hace clic en "Más filtros"
  - El sistema despliega filtros adicionales
  - El dropshipper configura filtros adicionales
  - El dropshipper hace clic en "Aplicar"
- 3b. El dropshipper hace clic en "Limpiar"
  - El sistema resetea todos los filtros a valores por defecto

### CU-003: Analizar Estados de Pedidos
**Actor:** Dropshipper
**Precondición:** Estar en el Dashboard
**Flujo Principal:**
1. El sistema muestra el panel "Estados de pedidos" con:
   - Indicador de % de tasa de pedidos entregados
   - Estados con cantidad de pedidos:
     * A pagar (color naranja)
     * Con incidencias (color morado)
     * Confirmado (color verde)
     * Preparado (color rosa)
     * Despachado (color azul)
     * Cancelado (color gris)
2. El dropshipper visualiza la distribución de sus pedidos por estado
**Postcondición:** El dropshipper comprende el estado actual de sus pedidos

### CU-004: Visualizar Productos Más Vendidos
**Actor:** Dropshipper
**Precondición:** Estar en el Dashboard
**Flujo Principal:**
1. El sistema muestra en el panel "Productos más vendidos":
   - Imagen del producto
   - Nombre del producto
   - Código del producto (ej: ECOMDROP34-1)
   - Cantidad vendida
2. El dropshipper identifica sus productos con mejor desempeño
**Postcondición:** El dropshipper conoce sus productos más exitosos

### CU-005: Analizar Estado de Facturación
**Actor:** Dropshipper
**Precondición:** Estar en el Dashboard
**Flujo Principal:**
1. El sistema muestra el panel "Estado de facturación" con:
   - Sección "En pedidos entregados" con:
     * Gasto en envíos
     * Costo de productos
     * Comisión
     * Cobro contra-reembolso
     * Ganancia (resaltada en verde)
     * Facturación total
   - Sección "Gasto en envíos de pedidos devueltos"
2. El dropshipper visualiza el desglose financiero completo
3. Cada monto muestra el valor en formato moneda ($0,00)
**Postcondición:** El dropshipper comprende su situación financiera actual

## 2. GESTIÓN DE PRODUCTOS

### CU-006: Buscar Productos en el Catálogo
**Actor:** Dropshipper
**Precondición:** Estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede al menú "Productos" desde el menú lateral
2. El sistema muestra la interfaz de productos con:
   - Botón "Ordenar" para clasificación
   - Botón "Filtrar" con indicador numérico de filtros activos
   - Campo de búsqueda con botón de búsqueda
   - Botón "Limpiar" para resetear búsqueda
3. El dropshipper ingresa términos de búsqueda en el campo
4. El dropshipper hace clic en el botón de búsqueda o presiona Enter
5. El sistema muestra productos que coinciden con la búsqueda
**Flujo Alternativo:**
- 3a. El dropshipper hace clic en "Filtrar"
  - El sistema despliega opciones de filtrado
  - El dropshipper selecciona filtros deseados
  - El sistema aplica filtros y actualiza la lista
- 3b. El dropshipper hace clic en "Ordenar"
  - El sistema muestra opciones de ordenamiento
  - El dropshipper selecciona criterio de orden
  - El sistema reordena la lista de productos

### CU-007: Visualizar Catálogo de Productos
**Actor:** Dropshipper
**Precondición:** Estar en la sección de Productos
**Flujo Principal:**
1. El sistema muestra productos en formato de tarjetas con:
   - Imagen principal del producto
   - Nombre del producto
   - Etiquetas de categoría (ej: "Herramientas y Ferretería", "Salud y Bienestar")
   - Precio de venta al público
   - Precio sugerido
   - Stock disponible (unidades)
   - Proveedor (ej: WAREA01, Proveedor4)
   - Tag de proveedor (ej: "Depósito Ecomdrop")
   - Código del producto (ej: ECOMDROP15-1)
   - Botón de copia de código
2. El dropshipper navega por el catálogo usando scroll
3. El sistema muestra indicador de versión en la parte inferior (ej: Versión: 2.14.0)
**Postcondición:** El dropshipper visualiza el catálogo completo de productos disponibles

### CU-008: Ver Detalle de Producto
**Actor:** Dropshipper
**Precondición:** Estar visualizando el catálogo de productos
**Flujo Principal:**
1. El dropshipper hace clic en una tarjeta de producto
2. El sistema muestra popup modal con:
   - Botón X para cerrar en esquina superior derecha
   - Nombre completo del producto como título
   - Galería de imágenes del producto
   - Sección "Especificaciones" expandible con:
     * Stock disponible
     * Precio de costo
     * Precio sugerido
     * Referencia interna
   - Sección "Dimensiones" con:
     * Peso en kg
     * Medidas (alto x ancho x profundidad en cm)
   - Sección "Proveedor" con nombre del proveedor
   - Indicador "Visible para todos" o restricciones de visibilidad
   - Código del producto con botón de copia
   - Tag "Cuidado del Hogar" u otra categoría
3. El dropshipper revisa la información detallada
4. El dropshipper hace clic en X o fuera del modal para cerrar
**Postcondición:** El dropshipper obtiene información completa del producto

### CU-009: Copiar Código de Producto
**Actor:** Dropshipper
**Precondición:** Estar visualizando un producto (catálogo o detalle)
**Flujo Principal:**
1. El dropshipper identifica el código del producto (ej: ECOMDROP569-5)
2. El dropshipper hace clic en el botón de copia junto al código
3. El sistema copia el código al portapapeles
4. El sistema muestra confirmación visual de copia exitosa
**Postcondición:** El código del producto está disponible en el portapapeles

## 3. GESTIÓN DE PEDIDOS

### CU-010: Visualizar Lista de Pedidos
**Actor:** Dropshipper
**Precondición:** Estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede al menú "Pedidos" desde el menú lateral
2. El sistema muestra la interfaz de pedidos con:
   - Filtros de fecha (inicial y final) con botón "Aplicar"
   - Botón "Ordenar" para clasificación
   - Botón "Más filtros" para opciones avanzadas
   - Campo de búsqueda
   - Botón "Limpiar" para resetear
   - Botón "Escanear etiqueta"
   - Botón "Exportar" para descargar información
   - Botón "Ver historial"
3. El sistema muestra pestañas de estados:
   - Todos (con contador total)
   - Pendiente
   - En revisión
   - A pagar
   - Con incidencias
   - Confirmado
   - Preparado
   - Despachado
   - Entregado
   - Devuelto
   - Cancelado
4. El sistema muestra tabla de pedidos con columnas:
   - Código de pedido (ej: #1032)
   - Fecha de creación
   - Cliente (nombre completo)
   - Tienda (logo de Shopify)
   - Total ($)
   - Estado (con color distintivo)
   - Etiqueta (con opciones de acción)
   - Seguimiento (código de tracking)
   - Fecha de actualización
**Postcondición:** El dropshipper visualiza todos sus pedidos

### CU-011: Filtrar Pedidos
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Pedidos
**Flujo Principal:**
1. El dropshipper selecciona una pestaña de estado específico
2. El sistema filtra y muestra solo pedidos en ese estado
**Flujo Alternativo A - Filtrar por fecha:**
1. El dropshipper selecciona fecha inicial
2. El dropshipper selecciona fecha final
3. El dropshipper hace clic en "Aplicar"
4. El sistema muestra pedidos del período seleccionado
**Flujo Alternativo B - Búsqueda:**
1. El dropshipper ingresa término de búsqueda (código, cliente, etc.)
2. El dropshipper presiona Enter o hace clic en buscar
3. El sistema muestra pedidos que coinciden
**Flujo Alternativo C - Filtros avanzados:**
1. El dropshipper hace clic en "Más filtros"
2. El sistema despliega opciones adicionales de filtrado
3. El dropshipper configura los filtros deseados
4. El dropshipper aplica los filtros
5. El sistema actualiza la lista según criterios seleccionados

### CU-012: Ver Detalle de Pedido
**Actor:** Dropshipper
**Precondición:** Estar visualizando la lista de pedidos
**Flujo Principal:**
1. El dropshipper hace clic en una fila de pedido
2. El sistema muestra pantalla de "Detalle del pedido" con:
   - Botón "Volver" para regresar a la lista
   - Sección "Historial" expandible con timeline de eventos
   - Sección "Productos" con:
     * Imagen del producto
     * Nombre y descripción
     * Código de producto
     * Cantidad
     * Precio por unidad
     * Subtotal
     * Acciones disponibles
   - Panel lateral "Resumen" con:
     * Estado actual del pedido
     * Código de pedido (#1032)
     * Total del pedido
     * Productos (cantidad)
     * Comisión
     * Envío
     * Ganancia
     * Monto a pagar
   - Información adicional:
     * Dirección de entrega completa
     * Cliente (nombre y email)
     * Fecha de creación
     * Transporte (ej: Urbano)
     * Modo de pago
     * Tienda origen (Shopify)
     * Etiqueta con opción de agregar
3. El dropshipper revisa toda la información del pedido
4. El dropshipper puede hacer clic en "Volver" para regresar
**Postcondición:** El dropshipper accede a información completa del pedido

### CU-013: Registrar Pago de Pedido
**Actor:** Dropshipper
**Precondición:** Estar en el detalle de un pedido con estado "A pagar"
**Flujo Principal:**
1. El dropshipper visualiza el botón "Registrar pago" en color fucsia
2. El dropshipper hace clic en "Registrar pago"
3. El sistema muestra formulario de registro de pago
4. El dropshipper completa información de pago
5. El dropshipper confirma el registro
6. El sistema actualiza el estado del pedido
7. El sistema registra el movimiento en la billetera
**Flujo Alternativo:**
- 2a. El dropshipper hace clic en "Cancelar"
  - El sistema cierra el formulario sin guardar cambios
**Postcondición:** El pago del pedido queda registrado en el sistema

### CU-014: Exportar Pedidos
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de pedidos con pedidos listados
**Flujo Principal:**
1. El dropshipper aplica los filtros deseados (opcional)
2. El dropshipper hace clic en botón "Exportar"
3. El sistema genera archivo con la información de pedidos filtrados
4. El sistema descarga el archivo al dispositivo del dropshipper
**Postcondición:** El dropshipper obtiene archivo con información de pedidos

### CU-015: Ver Historial de Pedido
**Actor:** Dropshipper
**Precondición:** Estar en el detalle de un pedido
**Flujo Principal:**
1. El dropshipper hace clic en la sección "Historial"
2. El sistema expande/colapsa la sección mostrando:
   - Timeline cronológico de eventos
   - Fecha y hora de cada evento
   - Descripción del evento
   - Usuario que realizó la acción (si aplica)
3. El dropshipper revisa la evolución del pedido
**Postcondición:** El dropshipper comprende el historial completo del pedido

## 4. GESTIÓN DE BILLETERA

### CU-016: Visualizar Movimientos de Billetera
**Actor:** Dropshipper
**Precondición:** Estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede a "Billetera > Movimientos" desde el menú lateral
2. El sistema muestra:
   - Panel superior con tres indicadores:
     * Saldo en billetera ($)
     * Saldo a retirar ($)
     * Saldo proyectado ($)
   - Filtros de fecha con botón "Aplicar"
   - Botón "Más filtros"
   - Campo de búsqueda
   - Botón "Limpiar"
   - Botón "Exportar"
   - Pestañas: "Movimientos" y "Resumen"
3. En la pestaña "Movimientos", el sistema muestra tabla con:
   - Fecha y hora del movimiento
   - Motivo (tipo de transacción)
   - Observaciones
   - Tipo de cuenta
   - Tienda (Shopify)
   - Monto (positivo en verde, negativo en rojo)
   - Operación (botón de información)
4. El dropshipper revisa sus movimientos financieros
**Postcondición:** El dropshipper visualiza el historial de transacciones

### CU-017: Filtrar Movimientos
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Movimientos
**Flujo Principal:**
1. El dropshipper selecciona fecha inicial
2. El dropshipper selecciona fecha final
3. El dropshipper hace clic en "Aplicar"
4. El sistema actualiza la lista mostrando solo movimientos del período
**Flujo Alternativo:**
- 3a. El dropshipper hace clic en "Más filtros"
  - El sistema muestra opciones adicionales
  - El dropshipper configura filtros adicionales
  - El sistema aplica todos los filtros seleccionados

### CU-018: Ver Resumen de Movimientos
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Movimientos
**Flujo Principal:**
1. El dropshipper hace clic en la pestaña "Resumen"
2. El sistema muestra consolidado de movimientos por tipo:
   - Total de débitos
   - Total de créditos
   - Saldo del período
   - Desglose por tipo de operación
3. El dropshipper analiza el resumen financiero
**Postcondición:** El dropshipper comprende su situación financiera consolidada

### CU-019: Solicitar Retiro de Dinero
**Actor:** Dropshipper
**Precondición:** Tener saldo disponible en billetera
**Flujo Principal:**
1. El dropshipper accede a "Billetera > Solicitudes" desde el menú
2. El sistema muestra pantalla de solicitudes con:
   - Filtros y búsqueda
   - Botón "Ingresar dinero"
   - Botón "Cuenta bancaria"
   - Botón "Retirar dinero"
   - Pestañas: Todas, Pendientes, Aprobadas, Rechazadas
3. El dropshipper hace clic en "Retirar dinero"
4. El sistema muestra formulario de retiro
5. El dropshipper ingresa monto a retirar
6. El dropshipper selecciona cuenta bancaria destino
7. El dropshipper confirma la solicitud
8. El sistema crea la solicitud con estado "Pendiente"
**Postcondición:** Se genera solicitud de retiro pendiente de aprobación

### CU-020: Ingresar Dinero a Billetera
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Solicitudes
**Flujo Principal:**
1. El dropshipper hace clic en botón "Ingresar dinero"
2. El sistema muestra modal con:
   - Título "Ingresar dinero"
   - Texto explicativo sobre transferencia bancaria
   - Datos bancarios de la cuenta destino:
     * Titular de la cuenta (ECOMLATAM SRL)
     * Número de cuenta
     * CUIT
     * CBU
     * ALIAS
     * Logo/referencia ECOMDROP
   - Campo "Monto" para ingresar cantidad
   - Campo "Comprobante de transferencia" con botón "Seleccionar archivo"
   - Campo "Observaciones (opcional)"
   - Nota sobre plazo de procesamiento (48 horas hábiles)
   - Botón "Enviar"
3. El dropshipper realiza transferencia bancaria externa
4. El dropshipper ingresa el monto transferido
5. El dropshipper adjunta comprobante de transferencia
6. El dropshipper agrega observaciones (opcional)
7. El dropshipper hace clic en "Enviar"
8. El sistema registra la solicitud de ingreso
**Postcondición:** Se registra solicitud de ingreso pendiente de confirmación

### CU-021: Ver Estado de Solicitudes
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Solicitudes
**Flujo Principal:**
1. El sistema muestra tabla de solicitudes con:
   - ID de solicitud
   - Tipo (Ingreso/Retiro)
   - Fecha y hora de solicitud
   - Monto solicitado
   - Estado con barra de progreso visual:
     * Pendiente (amarillo)
     * Aprobada (verde)
     * Rechazada (rojo)
   - Fecha de revisión (cuando aplica)
   - Botón de operación/detalles
2. El dropshipper puede filtrar por pestaña:
   - Todas: muestra todas las solicitudes
   - Pendientes: solo solicitudes en proceso
   - Aprobadas: solicitudes completadas
   - Rechazadas: solicitudes denegadas
3. El dropshipper visualiza el estado de sus solicitudes
**Postcondición:** El dropshipper conoce el estado de sus transacciones

### CU-022: Gestionar Cuenta Bancaria
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Solicitudes
**Flujo Principal:**
1. El dropshipper hace clic en "Cuenta bancaria"
2. El sistema muestra formulario de datos bancarios:
   - CBU/CVU
   - Alias
   - Titular de la cuenta
   - Tipo de cuenta (Caja de ahorro/Cuenta corriente)
   - Banco
3. El dropshipper completa/actualiza sus datos bancarios
4. El dropshipper guarda los cambios
5. El sistema valida y almacena la información bancaria
**Postcondición:** Los datos bancarios quedan registrados para retiros

## 5. GESTIÓN DE CONEXIONES

### CU-023: Visualizar Tiendas Conectadas
**Actor:** Dropshipper
**Precondición:** Estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede a "Conexiones" desde el menú lateral
2. El sistema muestra:
   - Mensaje explicativo sobre conexión con tiendas
   - Link a "nuestra aplicación" para instalación
   - Barra de búsqueda con:
     * Botón "Ordenar"
     * Botón "Filtrar"
     * Campo de búsqueda
     * Botón de búsqueda
   - Botón "Limpiar" para resetear
   - Botón "Agregar" para nueva conexión
   - Botón "Exportar" para descargar información
3. El sistema muestra tabla de conexiones con:
   - ID de conexión
   - Nombre de la tienda
   - Tipo de conexión (logo Shopify)
   - URL de la tienda
   - Fecha de creación
   - Estado (Conectada/Desconectada)
   - Indicador "SI" de actividad
   - Acciones disponibles (editar, eliminar, desconectar)
4. El dropshipper visualiza todas sus tiendas conectadas
**Postcondición:** El dropshipper conoce el estado de sus integraciones

### CU-024: Agregar Nueva Conexión
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla de Conexiones
**Flujo Principal:**
1. El dropshipper hace clic en botón "Agregar"
2. El sistema muestra formulario de nueva conexión
3. El dropshipper selecciona tipo de tienda (Shopify)
4. El dropshipper ingresa URL de la tienda
5. El dropshipper completa datos de autenticación
6. El sistema valida la conexión
7. El sistema confirma conexión exitosa
8. La nueva tienda aparece en la lista con estado "Conectada"
**Flujo Alternativo:**
- 6a. La validación falla
  - El sistema muestra mensaje de error
  - El dropshipper corrige los datos
  - Regresa al paso 5
**Postcondición:** Nueva tienda conectada al sistema

### CU-025: Editar Conexión Existente
**Actor:** Dropshipper
**Precondición:** Tener al menos una tienda conectada
**Flujo Principal:**
1. El dropshipper identifica la tienda a editar
2. El dropshipper hace clic en botón de editar (lápiz)
3. El sistema muestra formulario con datos actuales
4. El dropshipper modifica los datos necesarios
5. El dropshipper guarda los cambios
6. El sistema valida y actualiza la conexión
**Postcondición:** Conexión actualizada con nuevos parámetros

### CU-026: Desconectar Tienda
**Actor:** Dropshipper
**Precondición:** Tener una tienda con estado "Conectada"
**Flujo Principal:**
1. El dropshipper identifica la tienda a desconectar
2. El dropshipper hace clic en el interruptor de estado
3. El sistema solicita confirmación
4. El dropshipper confirma la desconexión
5. El sistema cambia el estado a "Desconectada"
6. El sistema deja de sincronizar con esa tienda
**Postcondición:** Tienda desconectada, sin sincronización activa

### CU-027: Eliminar Conexión
**Actor:** Dropshipper
**Precondición:** Tener al menos una tienda en la lista
**Flujo Principal:**
1. El dropshipper identifica la tienda a eliminar
2. El dropshipper hace clic en botón eliminar (papelera)
3. El sistema muestra diálogo de confirmación
4. El dropshipper confirma la eliminación
5. El sistema elimina la conexión permanentemente
6. La tienda desaparece de la lista
**Flujo Alternativo:**
- 4a. El dropshipper cancela la eliminación
  - El sistema mantiene la conexión sin cambios
**Postcondición:** Conexión eliminada del sistema

## 6. GESTIÓN DE CUENTA

### CU-028: Ver Información de Cuenta
**Actor:** Dropshipper
**Precondición:** Estar autenticado en el sistema
**Flujo Principal:**
1. El dropshipper accede a "Mi cuenta" desde el menú lateral
2. El sistema muestra formulario con secciones:
   - Imagen de perfil con opción "Cargar"
   - Información del Dropshipper:
     * Estado (Activa/Inactiva)
     * Botón "Solicitar baja"
     * Texto sobre comisión del 7% sobre ventas
   - Información del Proveedor (si aplica)
   - Datos personales:
     * Nombre
     * País (selector)
     * Ciudad (selector)
   - Datos de facturación:
     * Tipo de identificador (CUIT)
     * Número de identificador
     * Razón social
   - Botón "Guardar" para salvar cambios
3. El dropshipper visualiza toda su información
**Postcondición:** El dropshipper accede a su información personal

### CU-029: Actualizar Información Personal
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla Mi cuenta
**Flujo Principal:**
1. El dropshipper modifica los campos editables:
   - Nombre
   - País
   - Ciudad
2. El dropshipper hace clic en "Guardar"
3. El sistema valida los datos ingresados
4. El sistema guarda los cambios
5. El sistema muestra confirmación de actualización
**Flujo Alternativo:**
- 3a. Validación falla
  - El sistema muestra errores específicos
  - El dropshipper corrige los datos
  - Regresa al paso 2
**Postcondición:** Información personal actualizada

### CU-030: Cargar Imagen de Perfil
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla Mi cuenta
**Flujo Principal:**
1. El dropshipper hace clic en "Cargar" bajo la imagen
2. El sistema abre selector de archivos
3. El dropshipper selecciona imagen desde su dispositivo
4. El sistema valida formato y tamaño de imagen
5. El sistema carga y muestra la nueva imagen
6. El dropshipper hace clic en "Guardar"
7. El sistema confirma el cambio
**Flujo Alternativo:**
- 4a. Imagen no válida
  - El sistema muestra mensaje de error
  - El dropshipper selecciona otra imagen
**Postcondición:** Nueva imagen de perfil configurada

### CU-031: Solicitar Baja de Cuenta
**Actor:** Dropshipper
**Precondición:** Tener cuenta activa
**Flujo Principal:**
1. El dropshipper hace clic en "Solicitar baja"
2. El sistema muestra advertencia sobre consecuencias
3. El dropshipper confirma la solicitud
4. El sistema registra solicitud de baja
5. El sistema envía notificación al administrador
6. El estado cambia a "Pendiente de baja"
**Flujo Alternativo:**
- 3a. El dropshipper cancela
  - El sistema mantiene la cuenta activa
**Postcondición:** Solicitud de baja registrada

### CU-032: Actualizar Datos de Facturación
**Actor:** Dropshipper
**Precondición:** Estar en la pantalla Mi cuenta
**Flujo Principal:**
1. El dropshipper modifica datos de facturación:
   - Tipo de identificador
   - Número de identificador (CUIT)
   - Razón social
2. El dropshipper hace clic en "Guardar"
3. El sistema valida formato de CUIT
4. El sistema valida razón social
5. El sistema guarda los cambios
6. El sistema confirma actualización
**Flujo Alternativo:**
- 3a. CUIT inválido
  - El sistema muestra error de formato
  - El dropshipper corrige el número
**Postcondición:** Datos de facturación actualizados

## 7. NAVEGACIÓN Y FUNCIONES GENERALES

### CU-033: Navegar por el Sistema
**Actor:** Dropshipper
**Precondición:** Estar autenticado
**Flujo Principal:**
1. El dropshipper visualiza el menú lateral con opciones:
   - Home (ícono casa)
   - Productos (ícono paquete)
   - Dropshipper (expandible):
     * Pedidos
     * Conexiones
   - Billetera (expandible):
     * Movimientos
     * Solicitudes
   - Mi cuenta (ícono usuario)
   - Cuenta (expandible):
     * Usuarios
     * Términos y Privacidad
   - Acerca de
2. El dropshipper hace clic en cualquier opción
3. El sistema carga la pantalla correspondiente
4. El menú mantiene indicación visual de sección activa
**Postcondición:** El dropshipper accede a la sección deseada

### CU-034: Cerrar Sesión
**Actor:** Dropshipper
**Precondición:** Estar autenticado
**Flujo Principal:**
1. El dropshipper hace clic en su nombre/avatar en esquina superior derecha
2. El sistema muestra menú desplegable con opción "fasan ignacio"
3. El dropshipper selecciona opción de cerrar sesión
4. El sistema cierra la sesión
5. El sistema redirige a pantalla de login
**Postcondición:** Sesión cerrada, usuario debe autenticarse nuevamente

### CU-035: Cambiar Idioma
**Actor:** Dropshipper
**Precondición:** Estar en cualquier pantalla del sistema
**Flujo Principal:**
1. El dropshipper identifica selector de idioma en esquina superior derecha
2. El dropshipper hace clic en el selector
3. El sistema muestra idiomas disponibles
4. El dropshipper selecciona nuevo idioma
5. El sistema recarga la interfaz en el idioma seleccionado
**Postcondición:** Interfaz mostrada en el idioma seleccionado

### CU-036: Usar WhatsApp de Soporte
**Actor:** Dropshipper
**Precondición:** Estar en cualquier pantalla del sistema
**Flujo Principal:**
1. El dropshipper identifica ícono de WhatsApp (generalmente flotante)
2. El dropshipper hace clic en el ícono
3. El sistema abre WhatsApp Web o aplicación móvil
4. Se inicia conversación con soporte de Ecomdrop
5. El dropshipper envía su consulta
**Postcondición:** Comunicación iniciada con soporte

### CU-037: Ver Versión del Sistema
**Actor:** Dropshipper
**Precondición:** Estar en cualquier pantalla principal
**Flujo Principal:**
1. El dropshipper navega al pie de la pantalla
2. El sistema muestra "Versión: X.X.X" (ej: 2.14.0)
3. El dropshipper identifica la versión actual
**Postcondición:** Dropshipper conoce versión del sistema
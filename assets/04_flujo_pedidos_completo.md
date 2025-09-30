# FLUJO COMPLETO DE PEDIDOS - PLATAFORMA ECOMDROP

## DIAGRAMA DE FLUJO GENERAL

```
SHOPIFY → SINCRONIZACIÓN → WEBAPP → DROPSHIPPER → CONFIRMACIÓN → DESPACHO
   ↓                          ↓          ↓             ↓              ↓
[TC/COD]              [Estado:Pendiente] [Revisa]  [Validación]  [Guía Envío]
                                         [Edita]    [Saldo]      [Admin]
```

## 1. ENTRADA DE PEDIDOS DESDE SHOPIFY

### 1.1 TIPOS DE PAGO EN ORIGEN

#### PAGO CON TARJETA DE CRÉDITO (TC)
- Cliente paga el total en Shopify con tarjeta
- El dinero queda retenido en la cuenta del dropshipper en Shopify
- El pedido se marca como "PAGADO" en origen

#### PAGO CONTRA ENTREGA (COD - Cash on Delivery)
- Cliente selecciona pagar al recibir el producto
- No hay cobro inmediato en Shopify
- El pedido se marca como "COD" en origen
- El cobro se realiza en el momento de la entrega física

### 1.2 SINCRONIZACIÓN AUTOMÁTICA

**Proceso:**
1. Shopify genera webhook al crear pedido
2. La WebApp recibe la notificación instantáneamente
3. Se importan todos los datos del pedido:
   - Información del cliente
   - Dirección de entrega
   - Productos y cantidades
   - Método de pago (TC o COD)
   - Monto total
4. El pedido se crea automáticamente en la WebApp
5. **TODOS los pedidos inician en estado: PENDIENTE**

## 2. GESTIÓN DEL PEDIDO POR EL DROPSHIPPER

### CU-038: Recibir Pedido Sincronizado desde Shopify
**Actor:** Sistema/Dropshipper
**Precondición:** Tienda Shopify conectada y configurada
**Flujo Principal:**
1. Cliente realiza compra en tienda Shopify del dropshipper
2. Shopify determina método de pago:
   - TC: Pago completo con tarjeta
   - COD: Pago contra entrega
3. Sistema sincroniza automáticamente el pedido
4. Pedido aparece en WebApp con estado "PENDIENTE"
5. Sistema notifica al dropshipper del nuevo pedido
6. Dropshipper ve el pedido en su lista con indicador de tipo de pago
**Postcondición:** Pedido disponible para revisión en estado Pendiente

### CU-039: Revisar y Editar Pedido Pendiente
**Actor:** Dropshipper
**Precondición:** Pedido en estado "Pendiente"
**Flujo Principal:**
1. Dropshipper accede a la lista de pedidos
2. Identifica pedidos en estado "Pendiente" (nuevos)
3. Dropshipper hace clic en el pedido para ver detalles
4. Sistema muestra información editable:
   - Datos del cliente (nombre, teléfono, email)
   - Dirección de entrega completa
   - Productos del pedido (no editables)
   - Notas o instrucciones especiales
5. Dropshipper puede modificar:
   - Corregir errores en la dirección
   - Actualizar teléfono de contacto
   - Agregar instrucciones de entrega
6. Dropshipper guarda cambios si los hay
7. El pedido permanece en estado "Pendiente"
**Flujo Alternativo:**
- 5a. Dropshipper detecta problema grave
  - Puede cancelar el pedido
  - Debe especificar motivo
**Postcondición:** Pedido revisado y listo para confirmar

### CU-040: Confirmar Pedido con Pago TC
**Actor:** Dropshipper
**Precondición:**
- Pedido en estado "Pendiente"
- Tipo de pago: Tarjeta de Crédito
- Saldo suficiente en billetera
**Flujo Principal:**
1. Dropshipper revisa el pedido pendiente pagado con TC
2. Dropshipper hace clic en "Confirmar Pedido"
3. Sistema muestra resumen de cobros:
   - Costo del producto: $X
   - Costo del envío: $Y
   - Comisión plataforma (7% del total): $Z
   - **TOTAL A COBRAR: $X + $Y + $Z**
4. Sistema valida saldo en billetera del dropshipper
5. Si hay saldo suficiente:
   - Sistema descuenta el total de la billetera
   - Pedido cambia a estado "CONFIRMADO"
   - Sistema genera guía de envío automáticamente
   - Se notifica al administrador para despacho
**Flujo Alternativo:**
- 4a. Saldo insuficiente en billetera
  - Sistema muestra mensaje: "Saldo insuficiente"
  - Pedido cambia a estado "REGISTRAR PAGO"
  - Se muestra monto faltante
  - Dropshipper debe cargar saldo primero
**Postcondición:** Pedido confirmado y listo para despacho

### CU-041: Confirmar Pedido con Pago COD
**Actor:** Dropshipper
**Precondición:**
- Pedido en estado "Pendiente"
- Tipo de pago: COD (Contra entrega)
- Saldo suficiente para cubrir envío
**Flujo Principal:**
1. Dropshipper revisa el pedido COD pendiente
2. Dropshipper hace clic en "Confirmar Pedido"
3. Sistema muestra resumen de cobros:
   - Costo del envío: $Y
   - **TOTAL A COBRAR AHORA: Solo $Y (envío)**
   - Nota: "Producto y comisión se cobrarán del COD al entregar"
4. Sistema valida saldo en billetera >= costo envío
5. Si hay saldo suficiente:
   - Sistema descuenta SOLO el costo de envío
   - Pedido cambia a estado "CONFIRMADO"
   - Sistema genera guía de envío con marca COD
   - Se registra deuda pendiente:
     * Costo producto: $X (a cobrar del COD)
     * Comisión 7%: $Z (a cobrar del COD)
**Flujo Alternativo:**
- 4a. Saldo insuficiente para envío
  - Sistema muestra: "Saldo insuficiente para envío"
  - Pedido cambia a estado "REGISTRAR PAGO"
  - Dropshipper debe cargar al menos el costo del envío
**Postcondición:** Pedido confirmado, envío cobrado, resto pendiente COD

### CU-042: Gestionar Pedido en Estado "Registrar Pago"
**Actor:** Dropshipper
**Precondición:** Pedido en estado "Registrar Pago" por saldo insuficiente
**Flujo Principal:**
1. Dropshipper identifica pedidos en "Registrar Pago"
2. Sistema muestra en cada pedido:
   - Monto requerido para confirmar
   - Saldo actual en billetera
   - Diferencia a cubrir
3. Dropshipper carga saldo en billetera (ver CU-020)
4. Una vez con saldo suficiente, vuelve al pedido
5. Dropshipper hace clic nuevamente en "Registrar Pago"
6. Sistema re-valida el saldo
7. Si ahora hay saldo suficiente:
   - Aplica el cobro correspondiente (TC o COD)
   - Pedido pasa a estado "CONFIRMADO"
   - Se genera guía de envío
**Flujo Alternativo:**
- 7a. Aún no hay saldo suficiente
  - Permanece en "Registrar Pago"
  - Se actualiza el monto faltante
**Postcondición:** Pedido confirmado tras cargar saldo necesario

## 3. PROCESO POST-CONFIRMACIÓN

### 3.1 PEDIDOS CON PAGO TC (Tarjeta)

**Cobros realizados al confirmar:**
- ✅ Costo del producto
- ✅ Costo del envío
- ✅ Comisión 7% sobre total

**Flujo financiero:**
1. Dinero descontado de billetera del dropshipper
2. Si pedido se entrega exitosamente:
   - El dinero cobrado en Shopify (del cliente) va al dropshipper
   - La plataforma ya cobró sus costos
3. Si pedido se devuelve:
   - Dropshipper debe reembolsar al cliente en Shopify
   - Plataforma evalúa devolución de costos caso por caso

### 3.2 PEDIDOS CON PAGO COD

**Cobros realizados al confirmar:**
- ✅ SOLO costo del envío

**Cobros pendientes del COD:**
- ⏳ Costo del producto
- ⏳ Comisión 7% sobre total del ticket

**Flujo financiero:**
1. Al confirmar: Solo se cobra envío de la billetera
2. Al entregar exitosamente:
   - Transportista cobra total al cliente
   - Del COD cobrado se descuenta:
     * Costo del producto → Para la plataforma
     * Comisión 7% → Para la plataforma
     * Resto → Se acredita al dropshipper
3. Si no se entrega (rechazo/no está):
   - Dropshipper pierde el costo del envío
   - No se cobran producto ni comisión
   - Producto vuelve al stock

## 4. ESTADOS COMPLETOS DEL PEDIDO

### Estados y Transiciones

```
PENDIENTE (inicial)
    ↓
[Dropshipper revisa y edita si necesario]
    ↓
¿Tiene saldo suficiente?
    ├─ SÍ → CONFIRMADO
    └─ NO → REGISTRAR PAGO
              ↓
        [Carga saldo]
              ↓
         CONFIRMADO
              ↓
         PREPARADO
              ↓
         DESPACHADO
              ↓
    ┌─────────┴─────────┐
ENTREGADO          DEVUELTO
```

### Descripción de Estados

1. **PENDIENTE**: Pedido recién sincronizado, editable
2. **REGISTRAR PAGO**: Sin saldo suficiente para confirmar
3. **CONFIRMADO**: Pagado y listo para preparar
4. **CON INCIDENCIAS**: Problema detectado
5. **PREPARADO**: Producto empacado
6. **DESPACHADO**: En camino con transportista
7. **ENTREGADO**: Cliente recibió el producto
8. **DEVUELTO**: Producto retornado al depósito
9. **CANCELADO**: Pedido anulado

## 5. VALIDACIONES Y REGLAS DE NEGOCIO

### 5.1 Validación de Saldo

**Para pedidos TC:**
```
Saldo Requerido = Costo Producto + Costo Envío + (Total × 0.07)
```

**Para pedidos COD:**
```
Saldo Requerido = Costo Envío (solo)
```

### 5.2 Restricciones

- **No se puede confirmar sin saldo**: Sistema bloquea confirmación
- **Pedidos confirmados no son editables**: Garantiza integridad
- **COD requiere validación especial**: Zonas de cobertura COD
- **Límites de COD**: Montos máximos para pago contra entrega

### 5.3 Automatizaciones

1. **Sincronización instantánea**: Webhook Shopify → WebApp
2. **Cálculo automático de comisiones**: 7% sobre total
3. **Generación de guías**: Al confirmar pedido
4. **Actualización de saldos**: En tiempo real
5. **Notificaciones**: Email/Push en cambios de estado

## 6. CASOS ESPECIALES

### 6.1 Pedido Mixto (Múltiples productos)
- Se cobra el total como unidad
- Comisión sobre suma total
- Si es COD, todo se maneja como COD

### 6.2 Cambio de Dirección Post-Confirmación
- Requiere intervención del administrador
- Puede generar costo adicional de envío
- Se notifica al transportista

### 6.3 Cliente No Disponible (COD)
- Primer intento: Se agenda reintento
- Segundo intento: Costo adicional
- Tercer intento: Devolución automática

### 6.4 Producto Sin Stock Post-Confirmación
- Notificación inmediata al dropshipper
- Opciones:
  - Esperar restock
  - Cambiar por producto similar
  - Cancelar y reembolsar

## 7. MÉTRICAS Y REPORTES

### 7.1 Para el Dropshipper
- Tasa de confirmación de pedidos
- Tiempo promedio pendiente → confirmado
- Pedidos en "Registrar Pago"
- Ratio TC vs COD
- Tasa de devolución por tipo de pago

### 7.2 Para el Administrador
- Pedidos sin confirmar > 24 horas
- Dropshippers con saldo insuficiente recurrente
- Tasa de éxito COD vs TC
- Costos de devolución por período

## 8. INTEGRACIONES REQUERIDAS

### 8.1 Con Shopify
- Webhook de nuevo pedido
- Actualización de estado de pedido
- Información de tracking
- Gestión de reembolsos

### 8.2 Con Sistema de Pagos
- Validación de saldo en tiempo real
- Descuento automático de billetera
- Registro de transacciones
- Conciliación de COD

### 8.3 Con Transportista
- Generación de guías
- Tracking en tiempo real
- Confirmación de entrega
- Gestión de COD
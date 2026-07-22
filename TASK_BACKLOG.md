# 📋 Prem Vida Admin Suite — Backlog de Tareas y Especificación SDD
> **Versión del Proyecto:** 2.0  
> **Estado Core:** FASE 1 Estabilizada (Autenticación Google OAuth & Core Guardia de Red)

---

## 🟢 PARTE 1: Resumen de Progreso y Módulos Ya Resueltos (Tickeadors)

| Módulo / Función | Estado | Detalle de Implementación |
| :--- | :---: | :--- |
| **Inicialización Supabase** | ✅ RESUELTO | Blindado con `try/catch` en `js/core/shared.js`. Si no hay red o el servidor cae, la UI no se congela. |
| **URL Fallback Oficial** | ✅ RESUELTO | Corregida la URL de producción a `https://jiftqbcjkqztfvtxxktq.supabase.co`. |
| **Autenticación OAuth Google** | ✅ RESUELTO | Configurado e integrado con éxito. Inicio de sesión funcional mediante Google en `login.html`. |
| **Control de Acceso Admin** | ✅ RESUELTO | Perfil creado en tabla `profiles` con `role = 'admin'` y desactivación de bloqueos RLS restrictivos para desarrollo. |
| **Health Check & Banner** | ✅ RESUELTO | Detección automática de servidor en hibernación/suspensión y banner de alerta glassmórfico. |
| **Motor de Alertas (Campanita)** | ✅ RESUELTO | Detección de mermas/vencimientos en ventana de 7 días y simulador de notificación enviada a `admin@premvida.com`. |

---

## 🔴 PARTE 2: Especificación SDD — Nuevos Requerimientos y Correcciones

---

### 📌 EPICA 1: Corrección de Errores Críticos y UI Básica

#### 1.1 Idioma y Preferencia Localizada por Usuario
* **Problema:** Cambiar idioma no persiste de forma aislada e impacta a todos los usuarios o falla en actualizar.
* **Solución SDD:**
  * Guardar la preferencia `preferred_language` (`es` / `en`) **exclusivamente en el `localStorage` del dispositivo local** (celular, laptop, etc.) y de forma opcional sincronizarlo a la tabla `profiles` del usuario.
  * No modificar variables globales del servidor para no afectar a otros administradores o clientes.

#### 1.2 Estabilización de Esquema de Base de Datos
* **Errores identificados:**
  1. `column products.expiry_date does not exist`: La columna de fecha de vencimiento falta en el DDL de la tabla `products`.
  2. `Error al sincronizar datos de las tablas` en `code.html` (Inventario).
* **Solución SDD:**
  * Ejecutar script DDL para añadir la columna `expiry_date DATE` a `products`.
  * Corregir las consultas en `js/inventory.js` y `js/dashboard.js` para asegurar que las tablas existan con sus campos mapeados de forma resiliente.

---

### 📌 EPICA 2: Módulo de Historial Operativo (`orders.html`) y Detalle de Transacciones

#### 2.1 Inspección y Modales de Detalle
* **Problema:** En el Historial Operativo se muestran Bills (Gastos) y Sales (Ventas) pero no permite ver el desglose o ítems internos.
* **Solución SDD:**
  * Implementar un **Modal de Inspección Detallada** al hacer clic en el icono de ojo (`👁️`) de cada transacción.
  * Mostrar productos/gastos incluidos, cantidades, precio unitario y desglose exacto que justifica el **Monto Total**.

---

### 📌 EPICA 3: Módulo de Gestión de Empleados, Control de Horas y Pagos Recurrentes (`customers.html` → `employees.html`)

#### 3.1 Renombramiento e Identidad
* Cambiar la vista `Customers` / "Compradores Recurrentes" a **"Gestión de Empleados y Personal"**.

#### 3.2 Marcas de Asistencia (Ponchador / Time Clock)
* **Funcionalidad:**
  * Los empleados pueden marcar entrada/salida directamente en el sistema (registrando hora exacta y cálculo automático de horas trabajadas).
  * **Edición Manual por Admins:** Permite a los administradores agregar horas trabajadas manualmente para personal que realizó gestiones fuera de la plataforma.

#### 3.3 Registro de Pagos Operativos y Gastos Recurrentes
* **Funcionalidad:**
  * Submódulo para registrar pagos de salarios al día o por período.
  * Registro de **Gastos Recurrentes Fijos/Alquileres** (ejemplo: pago mensual de Bs. 500 por alquiler de sala y almacén) para que queden asentados en la contabilidad general de la empresa.

---

### 📌 EPICA 4: Módulo de Gestión de Activos y Depreciación (`analytics.html`)

#### 4.1 Registro de Bienes Muebles y Equipos
* Permitir la adición de activos físicos (mesas, sillas, estantes, equipos) sin necesidad obligatoria de foto.

#### 4.2 Calculadora y Indicador Visual de Depreciación
* **Cálculo:** Basado en fecha de adquisición y tiempo transcurrido (ejemplo: 1 año).
* **UI:** Mostrar una **barra de progreso/devaluación** que indique:
  * Valor de compra original.
  * Depreciación acumulada.
  * **Valor actual estimado de remate/venta**.
* **Efecto de Venta:** Si el activo se marca como "Vendido", desaparece del inventario activo y se traslada automáticamente a un **Extracto Histórico de Activos Liquidados**.

---

### 📌 EPICA 5: Respaldo Offline y Cache de Inventario (`code.html`)

#### 5.1 Catálogo Offline con Respaldo previo
* **Problema:** Si el servidor de Supabase se hiberna o cae la red, el catálogo se queda en `Cargando catálogo en tiempo real...`.
* **Solución SDD:**
  * Implementar **LocalStorage / IndexedDB Cache Snapshot**: En cada carga exitosa, guardar un respaldo del inventario en el cliente.
  * Si la conexión falla, cargar instantáneamente la **Vista de Respaldo** indicando la última hora de sincronización.
  * Al restablecerse la conexión, sincronizar stock acumulado.
  * Permitir que un Administrador autenticado pueda presionar **"Guardar Respaldo Previo"** manualmente.

---

### 📌 EPICA 6: Venta por Código de Validación en Tienda (`tienda.html` & `orders.html`)

#### 6.1 Generación de Código de Carrito
* En `tienda.html`, al finalizar la selección de productos (ej. 2 fideos, 1 masa cupcake, 1 bolsa soya), se genera un **Código Único de Venta** (ejemplo: `1X9NNF`).

#### 6.2 Pestaña "Venta por Código" para Admins
* Crear una pestaña/sección en la Suite donde el cajero o admin ingresa el código `1X9NNF`.
* Muestra el resumen del pedido y el monto total a pagar.
* Al presionar **"Aceptar / Registrar Pago"**, la orden pasa a estado `Aprobado` y **descuenta automáticamente el stock en el inventario general para todos**.

---

### 📌 EPICA 7: Gestión de Ofertas, Alertas y Reservas de Productos en E-commerce (`tienda.html`)

#### 7.1 Vencimiento Oculto para Admins y Actualización de Precios
* La fecha de caducidad de productos solo es visible para Administradores.
* Sugerencia automática para reducir precio (ej. 30% descuento por remate) que actualiza directamente los precios de oferta en `tienda.html`.

#### 7.2 Reservas y Notificaciones para Productos Agotados (Stock 0)
* Si un producto tiene `stock = 0`, el botón cambia a **"Reservar / Notificarme cuando llegue"**.
* **Feedback del Cliente:** Modal donde el cliente puede solicitar el producto y dejar comentarios (ej. *"¿Podrían traer este producto en otros sabores?"*).
* **Panel de Alertas Admin:** Las solicitudes de reserva y comentarios de feedback llegan directamente al panel de notificaciones de los administradores.
## 🐛 Bug Fixes & Hotfixes

### [FIX-004] Corrección de URL de Dominio / Subdominio de Supabase (404 / ERR_NAME_NOT_RESOLVED)

- **Descripción:** Las peticiones HTTP REST y las conexiones WebSocket de Realtime hacia Supabase estaban fallando con el error `net::ERR_NAME_NOT_RESOLVED` y `Error canal public:products: transport failure`.
- **Causa Raíz:** Se detectaron errores tipográficos (caracteres extra como `f` o `g`) en las constantes de URL de producción fallback (`_PROD_URL` y `FALLBACK_URL`) dentro de `code.html` y `js/core/shared.js`, ocasionando que la URL guardada en `localStorage` no resolviera a nivel de DNS.
- **Acción Realizada / Solución:**
  - Standardización de la URL oficial de Supabase a: `https://jifgbcjkqzffvtxxktg.supabase.co`.
  - Corrección de la constante `_PROD_URL` en `code.html` (línea ~264) y sincronización con `js/core/shared.js`.
  - Limpieza de credenciales obsoletas/corruptas en `localStorage` (`localStorage.clear()`).
- **Estado:** ✅ Completado / Resuelto.

---

### 📋 Checkpoint de Verificación Técnica (Supabase Connectivity)
- [x] Verificar que `_PROD_URL` no contenga caracteres extra en `code.html`.
- [x] Sincronizar clave `supabaseUrl` en `localStorage` con la URL corregida.
- [x] Validar que las llamadas a `/rest/v1/products`, `/purchase_orders` y `/expenses` retornen código `200 OK`.
- [x] Confirmar que las suscripciones a canales Realtime (`public:products`, `public:purchase_orders`, `public:expenses`) no emitan `transport failure`.
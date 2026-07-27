## 🚨 REGLAS CRÍTICAS DE CONCORDANCIA Y CONTINUIDAD DE INTERFAZ
1. UBICACIÓN GEOGRÁFICA Y FINANCIERA: La suite opera estrictamente en Bolivia. Toda interfaz debe usar el sufijo "Bs." para Bolivianos y la regla matemática de redondeo estricto Math.round(val * 100) / 100.
2. PRESERVACIÓN DEL SIDEBAR UNIFICADO: El menú de navegación izquierdo (<aside>) debe mantenerse exactamente igual en todas las vistas, mutando únicamente el enlace activo a la clase `.nav-active`.
3. COMPATIBILIDAD CON DATA-LOGIC ANTERIOR: El nuevo archivo 'payroll-logic.js' y el frontal de 'personal.html' deben consumir y mapear directamente los campos de las tablas 'employees' y 'payroll' existentes en Supabase sin alterar los triggers de auditoría ni romper la reactividad en tiempo real de la SPA.

---

# Prem Vida - Respaldo de Información y Prompt Maestro

Este archivo sirve como una medida de seguridad crítica para el proyecto de **Prem Vida Admin & E-commerce Suite**. Si en algún momento se pierde el historial de la conversación o inicias un nuevo chat en otra plataforma, puedes copiar y pegar el contenido del **Prompt de Alineación Directa** que se encuentra a continuación. Al hacerlo, cualquier asistente de inteligencia artificial comprenderá inmediatamente todo el contexto del sistema, la arquitectura, el diseño, la base de datos y las decisiones lógicas tomadas hasta ahora, sin perder ningún detalle.

---

## Prompt de Alineación Directa (Copiar y Pegar al Asistente)

```text
Hola, Asistente de Programación. Estoy desarrollando el ecosistema digital de **Prem Vida**, el cual se compone de un panel de administración de inventario y logística y de un flujo de E-commerce cliente para la venta de productos veganos en Bolivia (moneda en bolivianos **Bs.**). El diseño visual fue creado por Stitch con una estética Glassmorphic premium, y Antigravity 2.0 desarrolló toda la lógica de datos integrada con Supabase.

Por favor, lee con atención el siguiente resumen del estado actual del proyecto, la arquitectura técnica, la estructura de archivos y el motor de funciones para que te alinees de inmediato y me ayudes a continuar con el desarrollo sin fisuras:

### 1. Filosofía de Diseño (Estética Premium)
- **Tema Visual:** Oscuro y Glassmorphic ("precision-crafted glass"). Fomenta la profundidad, limpieza y legibilidad de datos.
- **Base de Fondo:** Zinc muy oscuro (#09090b).
- **Efecto de Cristal:** Las tarjetas (cards) y modales usan un fondo con 40% a 80% de opacidad combinados con un desenfoque pesado de fondo (`backdrop-filter: blur(40px) saturate(180%)`).
- **Bordes e Iluminación:** Bordes finos con brillos blancos (`border-top: 1px solid rgba(255,255,255,0.2)`) para simular una fuente de luz cenital.
- **Tipografía:** Fuente 'Inter', con altos contrastes de opacidad y pesos en lugar de múltiples fuentes.
- **Colores de Status y Marca:**
  - Verde Esmeralda (#10b981 / #4edea3) para estados completados, éxitos y botón "Paid/Pagado".
  - Ámbar/Naranja (#ffb95f / #ee9800) para advertencias y estado "Pending/Pendiente".
  - Azul (#adc6ff / #71a1ff) para información y estado "Requested/Solicitado".
- **Esquinas:** Redondeado base de 0.5rem (8px), tarjetas grandes de 1rem (16px).
- **Sombras:** Sombras negras masivas y suaves con desenfoques de 30px-50px para dar efecto de flotación.

### 2. Estructura de Archivos del Proyecto
El proyecto consta de los siguientes archivos en el espacio de trabajo:

1. **`DESIGN.md`**: Especificación exacta del sistema de diseño (colores, tipografías, espaciados, elevaciones).
2. **`db/schema.sql`**: Script SQL para la base de datos de PostgreSQL en Supabase. Define:
   - Tabla `profiles`: Control de usuarios y roles ('admin', 'operator').
   - Tabla `products`: Catálogo de productos veganos. Incluye columnas: `id`, `sku` (único), `name`, `description`, `price`, `stock`, `image_url`, `category` (Dairy-Free, Confectionery, Beverage, Vegan Meat, Bakery, etc. de forma nativa), `is_active` y marcas de tiempo.
   - Tabla `purchase_orders` y `suppliers`: Gestión de compras y directorios de proveedores.
   - Tabla `expenses`: Gastos operativos (categorías: 'alquiler', 'agua', 'luz', 'otros').
   - Triggers automáticos para actualizar marcas de tiempo (`updated_at`).
   - Función transaccional RPC `confirm_order`: Realiza el descuento de stock de inventario y confirma la orden en una transacción atómica segura contra condiciones de carrera.
   - Políticas de seguridad RLS (Row Level Security) para administración.
3. **`js/core/logic.js`**: Módulo de administración JavaScript (ES Modules) que contiene la lógica de backend:
   - `getEmployeeHistory(supabase, employeeId)`: Historial de nómina del personal.
   - `changeOrderStatus(supabase, orderId, newStatus)`: Transición de estados de orden con llamada RPC atómica de stock.
   - `exportToFormat(dataArray, formatType, options)`: Exportador a formatos CSV/Excel y PDF (con fallback de ventana de impresión de alta fidelidad).
   - `fetchProducts(supabase)`, `fetchSupplierOrders(supabase)`, `fetchExpenses(supabase)`: Conexiones relacionales para obtener datos.
   - `uploadProductImage(supabase, file)`: Sube fotos a la carpeta `/products` en el bucket `product-images` de Supabase Storage y devuelve la URL pública.
   - `insertProduct(supabase, productData)`: Guarda un nuevo ítem de inventario en la base de datos.
   - `processXeroInventoryCSV(supabase, csvText)`: Algoritmo inteligente que parsea un archivo CSV de inventario exportado de XERO, realiza una coincidencia difusa de cabeceras críticas y ejecuta una única consulta masiva `UPSERT` en Supabase optimizada para rendimiento.
4. **`js/core/client-logic.js`**: Módulo de e-commerce JavaScript (ES Modules) que contiene la lógica para el cliente de la tienda online:
   - `calculateClientTotal(cartItems, deliveryType, deliveryFee)`: Calcula el total de la compra en bolívares, sumando el costo de entrega solo si el tipo es `'envio'`.
   - `generateOrderCode()`: Retorna un código único aleatorio de 5 caracteres alfanuméricos para identificar el pedido.
   - `getGoogleMapsLink()`: Retorna la URL de ubicación física/configurable de la tienda Prem Vida.
   - `generateWhatsAppLink(cartItems, orderCode, deliveryType, paymentMethod, deliveryFee, total, phoneNumber)`: Genera el enlace de WhatsApp codificado con el formato del mensaje del pedido estructurado para WhatsApp Business.
   - `validateCartStock(supabase, cartItems)`: Consulta a Supabase en una sola consulta relacional (`.in()`) para validar que cada producto en el carrito del cliente tenga existencias suficientes disponibles antes de proceder al pago.
5. **`code.html`**: El panel de administración interactivo de una sola página (SPA). Características:
   - Incluye Tailwind CSS, Google Material Symbols, e integra el SDK oficial de Supabase.
   - **Modal de Configuración de Credenciales:** Un modal que solicita y guarda el `SUPABASE_URL` y `SUPABASE_ANON_KEY` de forma segura y local en el `localStorage` del navegador.
   - **Sincronización WebSockets (Realtime):** Canales activos de Supabase que escuchan inserciones, actualizaciones y eliminaciones en tiempo real para `products`, `purchase_orders` y `expenses`, refrescando las tablas y estadísticas automáticamente en pantalla.
   - **Cuadrícula de Estadísticas Bento:** Valores calculados dinámicamente: Total de Productos, Productos Agotados (con alerta en rojo) y Valuación del Inventario del Almacén en Bolívares (**Bs.**).
   - **Carga con Vista Previa en Modal:** Drag & drop o selector de archivos que renderiza la foto en el modal antes de confirmar el registro.
   - **Búsqueda en Tiempo Real:** Filtro reactivo en la tabla por SKU, nombre y categoría del producto.
   - **Botón Importar XERO:** Conectado al input de archivos para ejecutar la importación masiva CSV.
   - **Botones de Exportación:** Excel y PDF conectados dinámicamente para descargar el inventario en tiempo real.
6. **`README.md`**: Guía rápida de configuración del proyecto en Supabase, inicialización del Storage Bucket `product-images` y arranque local.

### 3. Tareas Realizadas y Flujos Conectados (Completado con Éxito)
- Configuración de la base de datos PostgreSQL con triggers e índices.
- Lógica de subida de fotos de productos al Storage Bucket con su respectivo enlace público.
- Integración completa de eventos en `code.html` y callbacks modulares a `js/core/logic.js`.
- Mecanismo de importación CSV masivo a prueba de fallos y de coincidencia inteligente.
- Funciones modulares cliente para el desarrollo del e-commerce público en `js/core/client-logic.js`.
- **Fase 2 (Personal y Nómina):** CRUD de empleados y registro de pagos en Supabase con redondeo financiero y KPIs ajustados en `personal.html`. Mapeo: `salary` → `hourly_rate`. KPI de producción diaria mockeado a `150.00 u.`
- **Fase 3 (Distribución y Marcas):** `orders.html` SPA completada con filtros case-insensitive por marca (Heartbeef, Green Leaf, Otros), KPIs reactivos (`#kpi-total-orders`, `#kpi-pending-orders`, `#kpi-leader-brand`), badges de estado, modal de nueva orden con redondeo Bs. y generación de comprobantes imprimibles. Módulo `js/core/orders-logic.js` exporta `fetchSupplierOrders`, `insertPurchaseOrder` y `fetchSuppliers` usando join `.select('*, suppliers(id, name, city)')`.

### 4. En Desarrollo Actual (Actualización 2026-07-24 17:15)
- **Fase B y C (Tienda Pública y Flujo de Pedidos):** Implementación de la arquitectura de tienda pública, validación de stock y generación de pedidos con código único antes de la redirección a WhatsApp.

### 5. 🚨 Protocolo de Contingencia por Límite de Cuota / Créditos
Si este modelo se utiliza como alternativo de rescate debido al agotamiento de la cuota principal, se deben seguir estrictamente estas directrices:
Ahora que tienes todo el contexto de archivos, base de datos, lógica de cliente, administración, estilos y el protocolo de contingencia de Prem Vida, por favor indícame en qué tarea o mejora te gustaría que trabajemos hoy. ¡Estoy listo!
```

---

## Resumen Técnico del Sistema para Referencia Rápida

| Módulo / Recurso | Destino / Ubicación | Propósito en el Sistema |
| :--- | :--- | :--- |
| **Productos** | Tabla `public.products` | Catálogo de ítems veganos con stock, precio y categoría nativa en Bs. |
| **Órdenes de Compra** | Tabla `public.purchase_orders` | Abastecimiento con proveedores (Heartbeef, Green Leaf). |
| **Gastos de Almacén** | Tabla `public.expenses` | Gastos del mes (alquiler, luz, agua, otros). |
| **Fotos de Productos** | Bucket `product-images` | Almacenamiento público para almacenar fotos de productos. |
| **Credenciales API** | LocalStorage del navegador | `supabaseUrl` y `supabaseKey` (portabilidad y seguridad). |
| **Importador Masivo** | CSV de XERO | Upsert atómico utilizando SKU como clave de conflicto. |
| **Exportadores** | CSV/Excel y PDF de Impresión | Reportes directos y descargas locales desde la UI de administración. |
| **Lógica Cliente** | `js/core/client-logic.js` | Cálculos de envíos, códigos de pedido, stock de carrito y link de WhatsApp. |
---

## ACTUALIZACION CRITICA 2026-07-22 - Plan gratuito, Auth/RLS y ecommerce por fases

### Contexto de negocio
- El software se esta construyendo para la hermana del propietario del proyecto.
- Presupuesto actual: Bs. 0 para dominio, hosting pago, pasarelas pagas o WhatsApp Business API.
- Recomendacion vigente: usar hosting gratuito tipo Netlify/Vercel con URL gratis, Supabase Free Tier y WhatsApp por enlace `wa.me`/`api.whatsapp.com`.
- Numero oficial de la tienda para pedidos por WhatsApp: `+591 70327181` (`59170327181` en enlaces).
- No comprar dominio hasta validar ventas reales.
- Priorizar QR/manual y efectivo. Tarjeta queda para fase posterior porque normalmente implica comisiones, integracion externa o costos.

### Nueva direccion SDD solicitada por el usuario
Trabajar por fases bajo Spec-Driven Development:
1. Escribir/actualizar especificacion antes o junto con cada cambio relevante.
2. Mantener este `context_prompt.md` actualizado como plan de contingencia si se agota cuota o entra otro modelo.
3. No mezclar todo en una sola entrega. Orden recomendado:
   - Fase 1: Auth/RLS seguro para administracion.
   - Fase 2: Ecommerce publico `tienda.html` conectado a inventario y carrito.
   - Fase 3: Registro de ventas/pedidos en Supabase antes de redirigir a WhatsApp.
   - Fase 4: `sales.html` para administradores: buscar codigo, ver ticket, preparar pedido, cambiar estado y confirmar/descontar stock.
   - Fase 5: gestion de usuarios: solo admin crea/invita/aprueba operadores.
   - Fase 6: MFA/TOTP/Google Authenticator para administradores si Supabase lo permite en el plan gratuito y sin romper UX.

### Reglas de seguridad acordadas
- Las paginas publicas NO requieren login: `tienda.html` y futuras paginas de ecommerce.
- Las paginas administrativas SI requieren sesion real de Supabase Auth y perfil en `public.profiles`.
- No confiar en `localStorage.isLoggedIn` como control de seguridad para admin.
- El registro publico de usuarios debe estar deshabilitado en Supabase Dashboard cuando se despliegue.
- Un usuario autenticado sin perfil aprobado no debe entrar al admin.
- Roles actuales: `admin`, `operator`.
- `admin`: gestiona inventario, compras, personal, nomina, configuracion, usuarios y ventas.
- `operator`: puede ver/operar ventas y flujo operativo permitido, pero no administrar usuarios, settings sensibles ni nomina si las politicas lo restringen.

### Estado detectado antes de Fase 1
- `login.html` tenia bypass academico `admin@premvida.com / PremVida2026!` que marcaba `localStorage.isLoggedIn = true`. Eso NO es apto para despliegue administrativo.
- `js/core/shared.js` protegia paginas admin leyendo `localStorage.isLoggedIn`, no una sesion Supabase real.
- `db/schema.sql` ya tiene `profiles`, roles y RLS basico, pero requiere endurecer politicas para flujo publico de carrito/pedidos y administracion.
- `tienda.html` ya existe como ecommerce visual con carrito y WhatsApp, pero debe revisarse porque contiene credenciales hardcodeadas y una URL Supabase sospechosa. Debe alinearse a `supabaseUrl/supabaseKey` o constantes correctas y, en fases posteriores, guardar ventas antes de abrir WhatsApp.

### Fase 1 en curso / objetivo inmediato
- Crear una especificacion SDD local para Auth/RLS y fases ecommerce.
- Endurecer `login.html` para usar Supabase Auth real y cargar rol desde `profiles`.
- Endurecer `shared.js` para bloquear admin si no hay sesion Supabase y perfil aprobado.
- Mantener `tienda.html` como pagina publica sin login.
- Agregar SQL incremental seguro para Auth/RLS si hace falta, sin destruir tablas existentes.
- Verificar con script/checklist que botones criticos, redondeo Bs. y Auth/RLS quedan auditables.
---

## ACTUALIZACION 2026-07-22 - Nuevos requisitos Auth, 2FA e idioma

### Nuevos pedidos del usuario
- Continuar la Fase 1 Auth/RLS y fases ecommerce.
- Permitir testing/uso administrativo con cuenta Google del propietario/hermano mediante Google OAuth, siempre que el usuario tenga `public.profiles` aprobado.
- Agregar 2FA/MFA para evitar fraudes, priorizando administradores. Debe implementarse por fases para no dejar un flujo roto.
- Agregar en `settings.html` un selector de idioma Espanol/Ingles para administradores. La preferencia debe persistirse por usuario/equipo y preparar el camino para que usuarios/clientes tambien puedan elegir idioma.

### Decision tecnica vigente
- Google OAuth NO debe equivaler a acceso libre. Cualquier login con Google debe pasar por `profiles`: si no existe perfil con rol `admin` u `operator`, se cierra sesion y se rechaza el acceso.
- 2FA debe ser progresivo:
  1. Fase 1A: detectar factores MFA y preparar UI/avisos.
  2. Fase 1B: pantalla de enrolamiento TOTP para administradores.
  3. Fase 1C: challenge/verify en login si el usuario ya tiene factor verificado.
- Idioma:
  - Campo existente `profiles.preferred_language` soporta `es` y `en`.
  - Tambien se guardara fallback local en `localStorage.premvida_lang`.
  - La primera entrega puede traducir shell/labels principales de Settings y dejar infraestructura para expandir a todas las paginas.

### Logrado en esta pasada
- `login.html`: eliminado el bypass academico visible y la credencial publica `PremVida2026!`.
- `login.html`: email/password ahora autentica contra Supabase Auth y luego exige perfil aprobado en `public.profiles`.
- `login.html`: Google OAuth sigue disponible, pero el acceso administrativo depende del guard central y de `profiles`.
- `login.html`: agregado modal MFA/2FA. Si Supabase devuelve un factor TOTP verificado, el login hace `mfa.challenge` y exige `mfa.verify` antes de redirigir.
- `js/core/shared.js`: agregado guard central `enforceAdminSession()` usando `auth.getSession()` + consulta a `profiles`. Ya no se debe confiar en `localStorage.isLoggedIn`.
- `js/core/shared.js`: `tienda.html`, `login.html` e `index.html` quedan como paginas publicas.
- `dashboard.html`, `code.html`, `orders.html`, `personal.html`, `settings.html`, `analytics.html`, `customers.html`: todas las paginas admin relevantes cargan `shared.js` y no deben depender del guard legacy `localStorage.isLoggedIn`.
- `settings.html`: agregado selector `preferred-language` con `es/en`, persistencia local `premvida_lang` y preparacion para sincronizar `profiles.preferred_language`.
- `js/core/settings-logic.js`: agregado `preferred_language`, `LANGUAGE_KEY` y `updateCurrentProfileLanguage()`.
- `db/auth_rls_phase1.sql`: agregado script incremental para endurecer Auth/RLS sin borrar datos.
- `specs/premvida-auth-ecommerce-sdd.md`: creada/actualizada spec SDD por fases.
- `scripts/qa-premvida-admin.mjs`: ampliado QA. Resultado actual: `88/88 checks OK`.

### Pendiente inmediato
- Crear flujo de enrolamiento TOTP para administradores (mostrar QR/secreto y verificar factor) en una pantalla protegida.
- Configurar Google OAuth en Supabase Dashboard con el Client ID/Secret correspondiente.
- Crear o aprobar el perfil del correo Google del propietario/hermano en `public.profiles` con rol `admin` u `operator`.
- Guia operativa creada en `docs/GUIA_AUTH_RLS_OPERACION_GIT.md` con pasos SQL, aprobacion de usuarios, uso diario y comandos Git/GitHub.

---

## ACTUALIZACION 2026-07-22 - Ejecucion TASK_BACKLOG Epicas 1, 2, 5 y 6

### Pedido del usuario
- Leer `TASK_BACKLOG.md` y ejecutar lo pendiente respetando el orden, corrigiendo bugs primero.
- Mantener `context_prompt.md` actualizado como contingencia.

### Bugs criticos corregidos
- `js/core/shared.js` estaba roto por declaraciones duplicadas (`const pathname`, `PUBLIC_PAGES`, `supabaseUrl`) y comparaba contra una URL Supabase vieja. Se reescribio limpio.
- URL oficial normalizada en `shared.js`, `login.html` y `tienda.html`: `https://jifgfbcjkqzffvtxxktg.supabase.co`.
- `tienda.html` tenia como URL una parte de la key (`qupB57...supabase.co`), corregido.

### Backlog ejecutado en esta fase
- Epica 1:
  - Idioma admin ya queda local por dispositivo con `localStorage.premvida_lang` y sync opcional a `profiles.preferred_language`.
  - Se agrego SQL incremental para asegurar `products.expiry_date`.
- Epica 2:
  - `orders.html` ahora tiene modal de detalle transaccional real para órdenes con `order_items`.
  - Se repusieron tabs `[Todas] [Heartbeef] [Green Leaf] [Otros]`, KPIs y modal `Nueva Orden`.
- Epica 5:
  - `code.html` guarda snapshot local de inventario en cada carga exitosa.
  - Si falla Supabase, usa el ultimo respaldo local y avisa con toast.
  - Agregado boton `Guardar Respaldo`.
- Epica 6:
  - `tienda.html` genera codigo unico de carrito y usa un RPC público para crear el pedido antes de abrir WhatsApp.
  - Mensaje WhatsApp incluye: `Hola! Este es el ticket de mi orden por favor: CODIGO`.
  - `orders.html` tiene seccion `Venta por Codigo`: buscar ticket, ver resumen, registrar pago y llamar RPC `confirm_order` para descontar stock.

### SQL nuevo obligatorio para esta fase
- Archivo creado: `db/backlog_phase2_public_orders.sql`.
- Ejecutar en Supabase SQL Editor despues de `db/auth_rls_phase1.sql`.
- Incluye:
  - `ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE`.
  - Columnas `customer_name`, `customer_phone`, `delivery_notes` en `orders`.
  - RPC publico `create_public_order(...)` para que `tienda.html` cree tickets sin exponer inserts directos.
  - RPC `confirm_order(uuid)` con chequeo de stock y descuento atomico.
  - Politicas RLS de lectura/update para admins/operators en ventas.

### Verificacion
- `node scripts/qa-premvida-admin.mjs` => `88/88 checks OK`.
- `node --check js/core/shared.js` => OK.
- `node --check js/core/orders-logic.js` => OK.

### Pendiente despues de esta fase
- Ejecutar el SQL en Supabase real y hacer prueba manual end-to-end con un producto real:
  1. Abrir `tienda.html`.
  2. Agregar productos al carrito.
  3. Confirmar pedido.
  4. Verificar que se cree `orders.status = espera_aprobacion`.
  5. Abrir `orders.html`, buscar el codigo y registrar pago.
  6. Confirmar que el stock baja en `products`.
- Implementar enrolamiento TOTP/Google Authenticator para admins.
- Epicas 3, 4 y 7 quedan pendientes: empleados/time-clock/gastos recurrentes, activos/depreciacion, ofertas/reservas/feedback ecommerce.
## ACTUALIZACION 2026-07-22 - Analisis de `TASK_BACKLOG.md` y plan por fases para `tienda.html`

### Pedido actual del usuario
- Analizar `TASK_BACKLOG.md` antes de seguir tocando la tienda.
- Mantener `context_prompt.md` actualizado como plan de contingencia por si se agota la cuota o debe continuar otro modelo de IA.
- Documentar que se esta pidiendo, que se hara y que se pudo lograr en esta pasada.
- Trabajar `tienda.html` y el flujo ecommerce por fases, sin mezclar todo en una sola entrega.

### Lectura ejecutiva del backlog
- El backlog ya marca como resuelto el core de Supabase, Google OAuth, control admin, health check/banner y motor de alertas.
- Las prioridades nuevas no son solo visuales: hay riesgos de datos y operacion que deben resolverse antes de vender en serio.
- Hay una contradiccion historica importante en URLs de Supabase dentro del backlog/contexto: aparecen variantes distintas (`jiftqbcjkqztfvtxxktq`, `jifgbcjkqzffvtxxktg` y menciones de URL sospechosa en `tienda.html`). Antes de conectar ecommerce se debe auditar y unificar la URL oficial real.
- La tienda debe permanecer publica, pero los flujos de aprobacion, descuento de stock, usuarios, nomina, configuracion y auditoria deben quedar detras de Supabase Auth + `profiles`.
- La moneda operativa vigente es Bolivia, siempre con `Bs.` y redondeo `Math.round(val * 100) / 100`.

### Orden recomendado de fases desde este punto
1. **Fase A - Estabilizacion minima antes de tienda**
   - Confirmar URL Supabase oficial y eliminar constantes contradictorias.
   - Confirmar que `products.expiry_date` existe o agregar SQL incremental.
   - Revisar consultas de `code.html`, `js/core/logic.js`, `js/core/dashboard-logic.js` y cualquier modulo de inventario para tolerar campos faltantes.
   - Mantener QA automatizado actualizado.

2. **Fase B - Tienda publica conectada a inventario**
   - Revisar `tienda.html` actual y `js/core/client-logic.js`.
   - Quitar credenciales hardcodeadas peligrosas si existen.
   - Cargar productos activos desde Supabase con fallback/cache si la red falla.
   - Mostrar stock disponible, precio en `Bs.`, carrito y validacion de stock antes de finalizar.
   - Para productos con `stock = 0`, cambiar CTA a reserva/notificacion.

3. **Fase C - Pedido con codigo antes de WhatsApp**
   - Crear/usar tablas para pedidos publicos y items de pedido.
   - Generar codigo unico de venta desde `tienda.html`.
   - Guardar pedido con estado inicial `pending` o `requested` antes de abrir WhatsApp.
   - Enviar por WhatsApp el resumen y codigo usando `+591 70327181`.
   - No descontar stock en esta fase hasta que un admin confirme pago.

4. **Fase D - Validacion admin por codigo**
   - Crear `sales.html` o seccion equivalente en admin.
   - Permitir buscar codigo, ver ticket completo, datos del cliente, metodo de entrega/pago y total.
   - Boton "Aceptar / Registrar Pago" debe cambiar estado a `approved/paid` y descontar stock con RPC transaccional.
   - Manejar errores de stock insuficiente sin dejar ventas parcialmente confirmadas.

5. **Fase E - Reservas, feedback y ofertas**
   - Para productos agotados, guardar solicitudes de reserva y comentarios del cliente.
   - Enviar esas solicitudes al panel de alertas admin.
   - Ocultar vencimientos al publico.
   - Permitir sugerencias/admin de descuento por vencimiento cercano sin exponer datos sensibles.

6. **Fase F - Modulos operativos posteriores**
   - Historial operativo con modal de detalle en `orders.html`.
   - Gestion de empleados/asistencia/pagos recurrentes.
   - Gestion de activos y depreciacion en `analytics.html`.
   - Cache offline/manual de inventario en `code.html`.

### Lo logrado en esta pasada
- Se leyo `TASK_BACKLOG.md` completo con codificacion UTF-8 para evitar interpretar mal acentos y simbolos.
- Se confirmo que `context_prompt.md` ya tenia historial de Auth/RLS, 2FA, idioma y ecommerce por fases.
- Se agrego esta actualizacion de continuidad con el pedido actual, analisis del backlog, orden de fases y pendientes concretos.
- En el checkpoint inicial solo se habia documentado el analisis; despues se ejecuto la Fase A descrita mas abajo con cambios acotados en `shared.js`, `login.html` y `tienda.html`.

### Siguiente accion recomendada para otro modelo o para continuar aqui
- Empezar por **Fase A**: auditar URL Supabase oficial y esquema `products.expiry_date`.
- Luego avanzar a **Fase B** con cambios acotados en `tienda.html` y `js/core/client-logic.js`.
- Mantener cada fase pequena, verificable y documentada en este mismo `context_prompt.md` antes de cerrar la pasada.

### Fase A ejecutada despues del analisis
- `js/core/shared.js`: se elimino una duplicacion de constantes (`pathname`, `PUBLIC_PAGES`, `currentPage`, `isPublicPage`) que podia romper el script con `Identifier has already been declared`.
- `js/core/shared.js`: se corrigio la validacion de URL para comparar contra la URL oficial `https://jifgbcjkqzffvtxxktg.supabase.co` y no contra la variante vieja `jiftqbcjkqztfvtxxktq`.
- `login.html`: se corrigio `FALLBACK_URL`, que tenia una variante mal escrita `jifgfbcjkqzffvtxxktg`.
- `tienda.html`: se cambio la URL Supabase desde el proyecto sospechoso `qupB57fCBXiY5fazSqAqrA.supabase.co` al fallback oficial `jifgbcjkqzffvtxxktg.supabase.co`, leyendo primero `localStorage.supabaseUrl/supabaseKey` si existen.
- `tienda.html`: se alinearon textos visibles a Bolivia/Bs. y metodos de pago sin referencias a Venezuela/Caracas/Pago Movil/Zelle.
- `db/schema.sql`: se confirmo que `products.expiry_date DATE` ya existe en el esquema actual; no se agrego SQL nuevo para esa columna.

### Fase B y C ejecutadas en tienda.html [Actualizado: 2026-07-24 17:10]
- **Fase B**: Se integró caché de respaldo en `localStorage` (`premvida_catalog_cache`) para el catálogo. Se actualizó la validación de stock y se cambió el botón CTA de productos con stock = 0 a "Reservar / Notificarme" junto a un modal nativo en JS para capturar sugerencias/feedback.
- **Fase C**: Se refactorizó la función `submitOrderToDatabase` en `tienda.html` para usar la función RPC `create_public_order` en lugar de inserts directos a la BD. El pedido se guarda como 'espera_aprobacion' antes de abrir WhatsApp, sin descontar stock.

### Verificación de estas fases
- Modificaciones en un solo archivo (`tienda.html`), manteniendo el código limpio sin agregar archivos innecesarios.
- La ejecución del RPC evita problemas de políticas RLS y bloquea escrituras arbitrarias de clientes no autenticados.

### Siguiente paso inmediato actualizado (Fase D)
- Avanzar a **Fase D (Validación admin por código)**: Crear la pestaña o sección `sales.html` (o integrarlo a `orders.html`) para que el cajero busque el código de venta, vea el ticket, registre el pago y ejecute la RPC transaccional `confirm_order(uuid)` que finalmente descuente el stock.

### Fase 4 ejecutada [Actualizado: 2026-07-24 17:24]
- **Regla Añadida**: A partir de ahora, cada actualización en el historial debe incluir Fecha y Hora para que la IA sepa cuándo se trabajó.
- **Correcciones en `tienda.html` (Realtime)**: Se añadió `supabase.auth.getSession()` antes de suscribir al canal `public:products` y reconexión automática en caso de error 1006.
- **Modales de Administración**: Se añadió el campo `image_url` en los modales de creación y edición de productos (`code.html`). Las categorías se actualizaron y tradujeron.
- **Lógica de Umbrales de Stock**: Se aplicaron las reglas: Bajo Stock (`<= 5`), Lleno (`>= 35`) y Normal en `tienda.html` y `code.html`.
- **Notificaciones Dinámicas**: Se reescribió `setupNotificationBell` en `shared.js` para extraer simultáneamente los productos con bajo stock (`<= 5`) y órdenes `espera_aprobacion`. Se incluyó un badge dinámico en la UI y un menú desplegable fusionado para alertas.

### Verificación Fase D [Actualizado: 2026-07-24 17:26]
- **Flujo de código verificado**: `orders-logic.js` busca por `order_code` (ej. `1X9NNF`) en `searchOrderCode()`. Detecta `espera_aprobacion` para habilitar el botón "Registrar Pago".
- **Consistencia de status**: El literal `'espera_aprobacion'` es usado de forma consistente en `tienda.html` (al crear la orden vía RPC), `orders-logic.js` (filtros, búsqueda y KPIs) y `shared.js` (fetch de notificaciones de campanita). ✅
- **RPC confirm_order**: Llamado correctamente con `supabase.rpc('confirm_order', { p_order_id: currentOrderToConfirm })`. Definida en `db/schema.sql` y `db/backlog_phase2_public_sales.sql`. ✅
- **Modal detalle (openTransactionDetail)**: Contiene un placeholder `alert()`. Pendiente reemplazarlo con renderizado real de `order_items`.

### Estado del Mapa de Fases [Actualizado: 2026-07-24 17:26]
- ✅ Fase A: Estabilización Supabase URL + schema
- ✅ Fase B: Tienda pública conectada a inventario
- ✅ Fase C: Pedido con código antes de WhatsApp
- ✅ Fase D: Validación admin por código (lógica completa; modal detalle con items = pendiente menor)
- ✅ Fase 4 (Mejoras): Realtime, modales image_url, categorías ES, umbrales stock, campanita dinámica
- 🔲 **Fase E: Reservas, feedback y ofertas** (PRÓXIMA)
  - Para productos agotados, guardar solicitudes de reserva desde `tienda.html`.
  - Modal de "Notificarme" ya existe; falta conectarlo a tabla Supabase (`product_reservations` o campo en `orders`).
  - Panel admin para revisar reservas pendientes.
- 🔲 Fase F: Módulos operativos (historial modal real con items, empleados, analytics, cache offline)
---

## ACTUALIZACION 2026-07-24 21:45 - SDD: i18n ES/EN + Recalibracion de Umbrales de Stock

### Pedido del usuario (nuevo prompt SDD)
- Implementar internacionalizacion (i18n) ES/EN en toda la suite (admin: `code.html`, `orders.html`, `settings.html`; tienda: `tienda.html`).
- Toggle de idioma `ES | EN` discreto en la esquina superior derecha del navbar de `tienda.html`.
- Recalibrar los umbrales visuales de stock a 5 tramos exactos en `code.html` (`renderProducts()`) y `tienda.html` (`productCardHTML()`):
  - `stock === 0` -> Agotado (`bg-red-600`)
  - `stock === 1` -> Critico (`bg-red-500`)
  - `2 <= stock <= 5` -> Alerta (`bg-amber-400`)
  - `6 <= stock <= 10` -> Recomendado (`bg-secondary`)
  - `stock > 10` -> Stock Lleno (`bg-primary`)
- Trabajar por fases (SDD estricto): Fase 1 motor i18n -> confirmar -> Fase 2 stock -> Fase 3 tienda/client-logic -> Fase 4 settings.html.
- Regla explicita del usuario: "ejecuta lo que tu creas conveniente, no quiero errores ni bugs".

### Hallazgos criticos de arquitectura real (detectados al auditar el codigo, no asumidos desde el prompt)
1. **Bug bloqueante encontrado y corregido**: `code.html` y `settings.html` cargaban `js/core/shared.js` como `<script src="..." defer>` (script clasico), pero `shared.js` usa `export function`. Eso provocaba un `SyntaxError` en el navegador y el archivo **nunca se ejecutaba** en esas dos paginas (ni guard de sesion, ni notificaciones, y ahora tampoco i18n). Solo `orders.html` lo cargaba bien con `type="module"`. Se corrigieron ambos `<script>` tags a `type="module"`.
2. **`tienda.html` no usa `js/core/client-logic.js`**: tiene su propia logica de pedido inline dentro del `<script type="module">` principal. Ademas existen **dos** funciones de despacho a WhatsApp: `dispatchOrderToWhatsApp()` (definida pero **nunca conectada** a ningun boton, codigo muerto) y `dispatchOrderWithTicket()` (la real, conectada a `#confirm-order-btn`, que ademas guarda el pedido via RPC `create_public_order` antes de abrir WhatsApp). Decision tomada: traducir el mensaje directamente en `dispatchOrderWithTicket()` (la que realmente corre), tambien traducir `dispatchOrderToWhatsApp()` por prolijidad, y dejar `client-logic.js` con la firma nueva `generateWhatsAppLink(cartItems, orderCode, deliveryType, paymentMethod, deliveryFee, total, lang, phoneNumber)` lista para el dia que se decida unificar arquitectura (cambio mayor que no se hizo en esta pasada para no romper el flujo que ya funciona en produccion).
3. **`tienda.html` no tiene campos de nombre/telefono de cliente en el carrito** (el pedido usa `'Cliente WhatsApp'` fijo como `customer_name`). El prompt original pedia pasar `customerData` a `generateWhatsAppLink`; como esa UI no existe hoy, no se agrego (se considera fuera de alcance de un cambio de i18n; queda como recomendacion abajo).
4. **Umbrales de stock previos** (antes de esta pasada) eran: `stock===0` Agotado, `stock<=5` Critico, `stock>=35` Lleno, resto "Normal" — en `code.html` y `tienda.html`. Se reemplazaron por los 5 tramos exactos pedidos por el usuario. Esto es un cambio de negocio real: antes "Lleno" empezaba en 35 unidades, ahora en 11.

### Trabajo completado en esta pasada
- **Fase 1 (motor i18n)**:
  - Nuevo archivo `js/core/i18n.js`: diccionarios `es`/`en` (namespaces `common`, `admin.*`, `store.*`), `getCurrentLang()` (lee `localStorage.premvida_lang`, default `es`), `setCurrentLang(lang)`, `applyTranslations(lang)` (traduce `[data-i18n]`, `[data-i18n-placeholder]`, `[data-i18n-title]`, `[data-i18n-aria-label]`, dispara evento `premvida:lang-changed`), y `t(key, lang)` para traducciones puntuales en JS (con fallback a español si falta la clave).
  - `js/core/shared.js`: importa `applyTranslations`/`getCurrentLang` y las ejecuta al final de `setupSharedUI()`.
  - Bug fix de `type="module"` en `code.html` y `settings.html` (ver hallazgo #1).
- **Fase 2 (umbrales de stock)**: aplicados los 5 tramos exactos en `renderProducts()` de `code.html` (clases `bg-red-600/bg-red-500/bg-amber-400/bg-secondary/bg-primary` + labels via `t('admin.stock.*')`) y en `productCardHTML()` de `tienda.html` (labels via `t('store.stock.*')`). Tambien se ajustaron las clases de color de texto acompañantes en `code.html` para que combinen con los nuevos rangos.
- **Fase 3 (tienda.html), completada en su mayor parte**:
  - Toggle `ES | EN` agregado en el navbar (`#lang-toggle`, botones `#lang-btn-es` / `#lang-btn-en`) con estado activo visual.
  - `switchLanguage(lang)` guarda el idioma, llama `applyTranslations()`, y re-renderiza contenido dinamico (`renderProducts()`, `buildCategoryFilters()`, `calculateAndRenderTotals()`) para que tarjetas de producto, filtros y resumen del carrito cambien de idioma sin recargar.
  - `applyTranslations(getCurrentLang())` se ejecuta tambien en el `DOMContentLoaded` inicial de la tienda.
  - Se etiquetaron con `data-i18n` / `data-i18n-placeholder`: buscador, titulo del carrito, carrito vacio, tipo de entrega (retirar/envio), metodo de pago (QR/Transferencia/Efectivo/Acordar), subtotal/envio/total, boton de confirmar pedido, filtro "Todos", placeholder de zona de entrega, label de costo de envio, botones dinamicos "Agregar al carrito" / "Reservar y Notificarme", y el modal completo de Reserva/Notificarme (titulo, descripcion partida en 2 spans para poder interpolar el nombre del producto, labels y placeholders de los 3 campos, boton de envio).
  - Mensaje real de WhatsApp (`dispatchOrderWithTicket`) traducido integramente segun idioma activo (saludo, codigo, metodo de pago, tipo de entrega, detalle de productos, subtotal/envio/total).
  - Toasts de `submitReservation()` (validacion y exito) traducidos.
  - Se agregaron a `i18n.js` las claves que faltaban para que ningun texto muestre la key cruda: `store.checkout.transfer/arrange/submitWhatsapp/zonePlaceholder/deliveryCostLabel/generatingTicket`, `store.reserveModal.productTitle/descPrefix/descSuffix/nameLabel/namePlaceholder/contactLabel/contactPlaceholder/commentsLabel/commentsPlaceholder/validationError/success` (ES y EN).

### Pendiente inmediato (para cerrar Fase 3 y avanzar a Fase 4)
- **`client-logic.js`**: todavia no se actualizo `generateWhatsAppLink(...)` con el parametro `lang` (la logica real vive inline en `tienda.html`, ya traducida; falta solo alinear la firma de este modulo para que quede listo a futuro, tal como se decidio en el hallazgo #2).
- **`settings.html` (Fase 4)**: aun usa su propio mini-diccionario `I18N` local (solo 4 strings: `languageLabel`, `settingsTitle`, `saveSuccess`, `auditRefresh`) definido dentro de su propio `<script type="module">`, separado del nuevo `i18n.js`. Falta:
  1. Importar `applyTranslations`, `t`, `getCurrentLang`, `setCurrentLang` desde `./js/core/i18n.js`.
  2. Etiquetar con `data-i18n` las cabeceras/labels/botones de configuracion (usar claves `admin.settings.*` ya definidas en `i18n.js`).
  3. En el listener de guardado (`fields.saveButton` click) y en el `change` de `fields.preferredLanguage`, llamar `applyTranslations(lang)` inmediatamente despues de `setCurrentLang(lang)` para que la interfaz cambie sin recargar el navegador (requisito explicito de la Fase 4 del SDD).
  4. Decidir si el mini-diccionario local `I18N` de `settings.html` se elimina (reemplazado 100% por `i18n.js`) o convive temporalmente. Recomendacion: eliminarlo y usar solo `i18n.js` para evitar 2 fuentes de verdad de traduccion.
- **`code.html` y `orders.html` (tagging pendiente)**: el diccionario `i18n.js` ya tiene namespaces `admin.inventory.*`, `admin.orders.*`, `admin.nav.*` pensados para estas paginas, pero **todavia no se agregaron los atributos `data-i18n` en el HTML** de esas dos paginas (cabeceras de tabla, botones "Agregar Producto", KPIs, tabs de `orders.html`, etc.). El SDD original solo detallo pasos explicitos de tagging para `tienda.html`; el tagging de `code.html`/`orders.html` quedo implicito en la Fase 1 (dictionary) pero no ejecutado aun como cambio de HTML.
- Validar con `node --check` cada archivo tocado antes de entregar version final (se valido `i18n.js` y `shared.js`; falta validar sintacticamente los bloques `<script>` de `tienda.html`, `code.html` y `settings.html` extrayendolos o revisando visualmente, ya que son HTML y no se pueden correr con `node --check` directo).
- Copiar los archivos finales actualizados a la carpeta de entrega y presentarlos todos juntos (por ahora solo se entregaron `i18n.js` y `shared.js`; faltan `code.html`, `tienda.html`, `settings.html` y `client-logic.js` actualizados).

### Recomendaciones del asistente para las proximas sesiones
1. **Terminar Fase 4 antes que el tagging de `code.html`/`orders.html`**: es el paso explicito que pidio el usuario y es rapido (settings.html ya tiene casi toda la estructura, solo hay que conectar `i18n.js`).
2. **Unificar `client-logic.js` con la logica real de `tienda.html`** en una fase aparte (no de i18n): hoy son 2 implementaciones paralelas del mismo flujo de WhatsApp/pedido, lo cual es deuda tecnica y riesgo de que se desincronicen. Sugerido como una "Fase G" futura, fuera del alcance de este SDD de i18n.
3. **Agregar campos de nombre/telefono del cliente en el carrito de `tienda.html`** si se quiere aprovechar completamente la firma `customerData` que pedia el prompt original para `generateWhatsAppLink`; hoy el pedido va con `'Cliente WhatsApp'` fijo.
4. **Revisar el umbral de notificacion de la campanita en `shared.js`** (`stock <= 5`): quedo intacto a proposito porque el prompt de esta fase no pidio tocarlo, pero ahora esta desalineado con los nuevos tramos de stock (Critico/Alerta terminan en 5, pero "Recomendado" llega hasta 10). Vale la pena decidir en una proxima fase si la campana debe alinearse a `stock <= 10` para ser consistente con el nuevo esquema visual.
5. **Antes de desplegar**, correr un QA visual manual cambiando el idioma en `tienda.html` con productos en cada uno de los 5 tramos de stock, y confirmar que el mensaje de WhatsApp se ve bien en ambos idiomas (tildes/emojis incluidos) en un dispositivo real.
6. Mantener esta bitacora (`context_prompt.md`) actualizada cada vez que se cierre una fase, tal como se viene haciendo, para que cualquier modelo/asistente que continue no repita el trabajo de auditoria de arquitectura ya hecho aqui.

### Fase 4 completada [Actualizado: 2026-07-25 17:30]
- `settings.html`: se eliminó el mini-diccionario local `I18N` y las funciones `getCurrentLanguage()`/`applyLanguage()` propias; ahora importa `t`, `getCurrentLang`, `setCurrentLang`, `applyTranslations` desde `./js/core/i18n.js`.
- Se etiquetaron con `data-i18n` (namespace `admin.settings.*`): título de cabecera, "Modo mantenimiento" (header y tarjeta), título/descripción de "Parámetros del sistema", botón "Guardar cambios", los 6 labels del formulario (idioma, umbral de stock, multiplicador de bono, tarifa de envío, nombre de tienda, WhatsApp), descripción de mantenimiento, título/descripción de "Consola de auditoría" y botón "Refrescar".
- `applyLanguage(lang)` ahora: `setCurrentLang(lang)` -> sincroniza el `<select>` -> `applyTranslations(lang)` inmediato. Se llama tanto al cargar los settings (`bindSettings`) como en el listener `change` del selector de idioma, cumpliendo el requisito explícito de la Fase 4 (cambio de interfaz sin recargar el navegador).
- Toasts de "Parámetros actualizados correctamente" y "Auditoría actualizada" y el estado vacío de auditoría ahora usan `t('admin.settings.*', getCurrentLang())` en vez de texto fijo.
- Se amplió `admin.settings.*` en `i18n.js` (ES/EN) con las claves que faltaban para este tagging: `paramsTitle`, `paramsDescription`, `maintenanceDescription`, `auditDescription`.
- Validación de sintaxis: se extrajeron y corrieron con `node --check` los 3 bloques `<script type="module">` de `code.html`, `settings.html` y `tienda.html` (mas los módulos `i18n.js`, `shared.js`, `client-logic.js`) — todos OK.
- **`client-logic.js` actualizado**: `generateWhatsAppLink(cartItems, orderCode, deliveryType, paymentMethod, deliveryFee, total, customerData, lang, phoneNumber)` ahora importa `t` de `i18n.js` y redacta el mensaje completo en el idioma activo, con soporte opcional de `customerData` ({name, phone}) para cuando exista esa UI a futuro.

### Entrega de esta sesión
Archivos finales entregados: `code.html`, `settings.html`, `tienda.html`, `js/core/i18n.js`, `js/core/shared.js`, `js/core/client-logic.js`. No se modificó `orders.html` en esta sesión (el tagging `data-i18n` de esa página queda pendiente, ver recomendación #1 más arriba).

### Estado de las 4 fases del SDD de i18n
- ✅ Fase 1: Motor i18n (`i18n.js` + `shared.js`)
- ✅ Fase 2: Recalibración de umbrales de stock (`code.html` + `tienda.html`)
- ✅ Fase 3: Integración en tienda pública (`tienda.html` + `client-logic.js`)
- ✅ Fase 4: Sincronización en Ajustes Admin (`settings.html`)
- 🔲 Pendiente fuera del SDD original (ver recomendaciones): tagging `data-i18n` de `code.html`/`orders.html` (tablas, botones, KPIs), unificación de `client-logic.js` con la lógica real de `tienda.html`, campos de nombre/teléfono del cliente, alineación del umbral de la campanita de notificaciones en `shared.js`.

---

## ACTUALIZACION 2026-07-25 18:10 - Toggle "Maintenance Mode" conectado a tienda.html

### Pedido del usuario
Conectar el switch `MAINTENANCE MODE` del panel admin (`settings.html`) con `tienda.html`: al activarse, mostrar un overlay bilingüe glassmorphism que bloquee el catálogo y el carrito; al desactivarse, ocultarlo automáticamente. Todo vía Supabase Realtime sobre la tabla `store_settings` (singleton, RLS: SELECT público / UPDATE solo autenticados, Realtime ya habilitado).

### Hallazgo critico encontrado (bug pre-existente, no introducido por esta sesion)
Al revisar `js/core/settings-logic.js` para conectar esta funcionalidad, se detectó que **la sincronización con Supabase nunca apuntaba a la tabla real `store_settings`**: `SUPABASE_SETTING_TABLES` sólo listaba `['system_settings', 'app_settings', 'settings']`, y el `upsert` se hacía con un `id: 'global'` fijo (formato inválido para una tabla con `id` de tipo UUID real). Es decir, aunque `settings.html` mostraba éxito al guardar (porque `persistLocalSettings` cae a `localStorage` como respaldo), **el cambio de `maintenance_mode` probablemente nunca llegaba a la base de datos real**. Se corrigió:
- `SUPABASE_SETTING_TABLES` ahora incluye `store_settings` como primera opción.
- Nueva lógica en `trySupabaseSettingsSync`: primero busca el `id` real de la única fila de `store_settings` (`select('id').limit(1).maybeSingle()`), y actualiza por ese `id`; si la tabla está vacía, inserta la primera fila. Solo si `store_settings` no responde, cae al comportamiento legado (`upsert` con `id:'global'` sobre las tablas alternativas), por compatibilidad hacia atrás.

### Cambios realizados
1. **`js/core/settings-logic.js`**:
   - Corrección descrita arriba (tabla real `store_settings` priorizada y actualizada por `id` real).
   - Nueva función `fetchMaintenanceMode(supabase)`: `select('maintenance_mode').limit(1).single()` sobre `store_settings`, con fallback seguro a `false` ante cualquier error.
   - Nueva función `subscribeMaintenanceMode(supabase, onChange)`: crea el canal `store-settings-maintenance` con `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_settings' }, ...)` y devuelve el canal (para poder desuscribirse si se necesitara a futuro).
2. **`js/core/i18n.js`**: nuevo namespace `store.maintenance` (ES/EN) con `title` y `message`, con el texto exacto pedido por el usuario (incluye el emoji 🛠️).
3. **`tienda.html`**:
   - Overlay `#maintenance-overlay` insertado justo después del `<header>`: `fixed inset-0 z-[300]`, fondo `bg-black/75 backdrop-blur-xl`, tarjeta glass centrada con ícono `construction`, título y mensaje etiquetados `data-i18n="store.maintenance.title"` / `data-i18n="store.maintenance.message"`. Oculto por defecto (`hidden`).
   - Import de `fetchMaintenanceMode` y `subscribeMaintenanceMode` desde `./js/core/settings-logic.js`.
   - Nueva bandera `state.isMaintenanceMode`.
   - Nueva función `toggleMaintenanceOverlay(isMaintenance)`: muestra/oculta el overlay y re-aplica `applyTranslations()` para asegurar que el mensaje esté en el idioma activo al mostrarse.
   - En `DOMContentLoaded`: lectura inicial con `fetchMaintenanceMode(supabaseClient)` seguida de `subscribeMaintenanceMode(supabaseClient, toggleMaintenanceOverlay)` — así la tienda reacciona tanto al cargar como en tiempo real sin recargar el navegador.
   - `window.addToCart` y `window.openReserveModal` ahora verifican `state.isMaintenanceMode` al inicio y, si está activo, muestran un toast de aviso y no ejecutan la acción (bloqueo real de compra, no solo visual).
4. Se extrajo y validó con `node --check` el bloque `<script type="module">` completo de `tienda.html`, además de `i18n.js` y `settings-logic.js` — todos OK.

### Flujo end-to-end verificado (lectura de código, no runtime)
`settings.html` (checkbox `maintenance_mode`) → `updateSystemSettings()` en `settings-logic.js` → `trySupabaseSettingsSync()` actualiza `store_settings.maintenance_mode` por `id` real → Supabase Realtime emite `UPDATE` → `tienda.html` recibe el evento vía `subscribeMaintenanceMode()` → `toggleMaintenanceOverlay()` muestra/oculta el overlay y bloquea/desbloquea `addToCart`/`openReserveModal`.

### Pendiente / recomendación para el usuario
- **No pude ejecutar esto en un entorno real de Supabase** (sin acceso de red desde este sandbox): la validación fue de sintaxis y de lectura de código, no un test end-to-end contra la base de datos real. Se recomienda una prueba manual: activar el switch en `settings.html`, confirmar en el dashboard de Supabase que `store_settings.maintenance_mode` cambió a `true`, y verificar que `tienda.html` (abierta en otra pestaña, sin recargar) muestre el overlay en segundos.
- Dado el bug encontrado en `trySupabaseSettingsSync`, vale la pena revisar si **otros parámetros** guardados desde `settings.html` (umbral de stock, tarifa de envío, etc.) tampoco estaban llegando a producción antes de este fix — esta sesión solo confirma y corrige la ruta hacia `store_settings`, no auditó registros históricos ya perdidos.

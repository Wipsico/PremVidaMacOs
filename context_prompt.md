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

### 4. En Desarrollo Actual
- **Fase 4 (Configuraciones y Auditoría):** Creación del panel de control de variables globales del sistema y visor reactivo de la tabla de logs de auditoría generados por los triggers de Supabase.

### 5. 🚨 Protocolo de Contingencia por Límite de Cuota / Créditos
Si este modelo se utiliza como alternativo de rescate debido al agotamiento de la cuota principal, se deben seguir estrictamente estas directrices:
1. **Sin Introducciones ni Teoría:** Ir directo al grano, omitiendo explicaciones de qué es el archivo o por qué falló el anterior.
2. **Código de Producción Completo:** No entregar fragmentos incompletos con comentarios tipo `// ... resto del código aquí ...`. Escribir el bloque modificado completo listo para sustitución.
3. **Mapeo de Rutas Físicas:** Especificar las modificaciones en archivos reales en la ruta local `D:\Proyectos\PremVidaMacOs-main`. Estructurar la respuesta con el nombre exacto del archivo como encabezado principal para facilitar la copia y reemplazo.
4. **Respetar la Integridad Financiera:** Todo cálculo de inventario o venta debe procesarse bajo la moneda del proyecto: Bolivianos (Bs.) y con el redondeo estricto `Math.round(val * 100) / 100`.

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

### Verificacion de esta fase
- `node --check js/core/shared.js`: OK.
- `node scripts/qa-premvida-admin.mjs`: falla con `72/88 checks OK`. Los fallos detectados estan concentrados en `orders.html` y validaciones historicas de ordenes/Bs.; no se corrigieron en esta Fase A porque el usuario pidio avanzar por fases y el foco era estabilizar contexto/Auth/tienda.

### Siguiente paso inmediato actualizado
- Continuar con **Fase B**: cache/fallback de catalogo en `tienda.html`, validacion robusta de stock y preparacion para reserva/notificacion cuando `stock = 0`.
- Despues seguir con **Fase C**: guardar pedido con codigo en Supabase antes de abrir WhatsApp, sin descontar stock hasta confirmacion admin.
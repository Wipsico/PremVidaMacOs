# Prem Vida - Respaldo de Información y Prompt Maestro

Este archivo sirve como una medida de seguridad crítica para el proyecto de **Prem Vida Admin & E-commerce Suite**. Si en algún momento se pierde el historial de la conversación o inicias un nuevo chat en otra plataforma, puedes copiar y pegar el contenido del **Prompt de Alineación Directa** que se encuentra a continuación. Al hacerlo, cualquier asistente de inteligencia artificial comprenderá inmediatamente todo el contexto del sistema, la arquitectura, el diseño, la base de datos y las decisiones lógicas tomadas hasta ahora, sin perder ningún detalle.

---

## Prompt de Alineación Directa (Copiar y Pegar al Asistente)

```text
Hola, Asistente de Programación. Estoy desarrollando el ecosistema digital de **Prem Vida**, el cual se compone de un panel de administración de inventario y logística y de un flujo de E-commerce cliente para la venta de productos veganos en Venezuela (moneda en bolívares **Bs.**). El diseño visual fue creado por Stitch con una estética Glassmorphic premium, y Antigravity 2.0 desarrolló toda la lógica de datos integrada con Supabase.

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
   - Función transaccional RPC `confirm_sale`: Realiza el descuento de stock de inventario y confirma la venta en una transacción atómica segura contra condiciones de carrera.
   - Políticas de seguridad RLS (Row Level Security) para administración.
3. **`js/core/logic.js`**: Módulo de administración JavaScript (ES Modules) que contiene la lógica de backend:
   - `getEmployeeHistory(supabase, employeeId)`: Historial de nómina del personal.
   - `changeSaleStatus(supabase, saleId, newStatus)`: Transición de estados de venta con llamada RPC atómica de stock.
   - `exportToFormat(dataArray, formatType, options)`: Exportador a formatos CSV/Excel y PDF (con fallback de ventana de impresión de alta fidelidad).
   - `fetchProducts(supabase)`, `fetchSupplierOrders(supabase)`, `fetchExpenses(supabase)`: Conexiones relacionales para obtener datos.
   - `uploadProductImage(supabase, file)`: Sube fotos a la carpeta `/products` en el bucket `product-images` de Supabase Storage y devuelve la URL pública.
   - `insertProduct(supabase, productData)`: Guarda un nuevo ítem de inventario en la base de datos.
   - `processXeroInventoryCSV(supabase, csvText)`: Algoritmo inteligente que parsea un archivo CSV de inventario exportado de XERO, realiza una coincidencia difusa de cabeceras críticas y ejecuta una única consulta masiva `UPSERT` en Supabase optimizada para rendimiento.
4. **`js/core/client-logic.js`**: Módulo de e-commerce JavaScript (ES Modules) que contiene la lógica para el cliente de la tienda online:
   - `calculateClientTotal(cartItems, deliveryType, deliveryFee)`: Calcula el total de la compra en bolívares, sumando el costo de entrega solo si el tipo es `'envio'`.
   - `generateOrderCode()`: Retorna un código único aleatorio de 5 caracteres alfanuméricos para identificar el pedido.
   - `getGoogleMapsLink()`: Retorna la URL de la ubicación física de la tienda Prem Vida en Caracas.
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

### 3. Tareas Realizadas y Flujos Conectados
- Configuración de la base de datos PostgreSQL con triggers e índices.
- Lógica de subida de fotos de productos al Storage Bucket con su respectivo enlace público.
- Integración completa de eventos en `code.html` y callbacks modulares a `js/core/logic.js`.
- Mecanismo de importación CSV masivo a prueba de fallos y de coincidencia inteligente.
- Funciones modulares cliente para el desarrollo del e-commerce público en `js/core/client-logic.js`.

Ahora que tienes todo el contexto de archivos, base de datos, lógica de cliente, administración y estilos de Prem Vida, por favor indícame en qué tarea o mejora te gustaría que trabajemos hoy. ¡Estoy listo!
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

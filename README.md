# Prem Vida - Panel de Administración e Integración de E-commerce

Bienvenido al ecosistema de desarrollo de **Prem Vida**, una interfaz administrativa y de e-commerce de alta fidelidad, reactiva en tiempo real. Diseñada con una estética **Glassmorphic** oscura, esta solución está conectada con **Supabase** para base de datos, almacenamiento de imágenes y sincronización en tiempo real.

---

## Estructura de Archivos del Proyecto

El espacio de trabajo está compuesto por los siguientes módulos y archivos clave:

1.  **`code.html`**: Interfaz de usuario de una sola página (SPA) para la administración. Administra credenciales locales en `localStorage`, sincroniza tablas relacionales mediante WebSockets, gestiona el inventario y calcula estadísticas financieras en tiempo real en bolívares (**Bs.**).
2.  **`DESIGN.md`**: Especificación completa del sistema de diseño (paletas cromáticas HSL, fuentes Inter, efectos glassmorphic, opacidades y elevaciones).
3.  **`db/schema.sql`**: Esquema relacional optimizado de base de datos en PostgreSQL para Supabase, incluyendo tablas de inventario (`products` con columna `category` nativa), órdenes de compra (`purchase_orders`), proveedores (`suppliers`), gastos (`expenses`), nómina (`payroll`) y políticas RLS.
4.  **`js/core/logic.js`**: Módulo de backend y administración. Contiene la lógica de nómina, cambio transaccional de estados de venta, exportación de reportes limpios a Excel/PDF y el importador masivo inteligente de CSV de XERO.
5.  **`js/core/client-logic.js`**: Módulo de cliente y e-commerce. Resuelve el procesamiento lógico del flujo del carrito de compras, validación de inventario en servidor y el enlace de redirección a WhatsApp Business.

---

## Módulos y Funciones de Lógica

### 1. Motor de Administración (`js/core/logic.js`)
- **`fetchProducts(supabase)`**: Obtiene los productos del catálogo ordenados por fecha de creación.
- **`fetchSupplierOrders(supabase)`**: Consulta relacional con JOIN para listar compras por proveedor.
- **`fetchExpenses(supabase)`**: Obtiene los gastos operativos registrados.
- **`uploadProductImage(supabase, file)`**: Sube la imagen del producto a la carpeta `/products` en el bucket público `product-images` y devuelve su URL.
- **`insertProduct(supabase, productData)`**: Registra de forma atómica un nuevo ítem en la tabla `products`.
- **`processXeroInventoryCSV(supabase, csvText)`**: Parsea el formato CSV de XERO, realiza coincidencia difusa de cabeceras de columnas y ejecuta un `UPSERT` masivo en lote en base a la restricción única de SKU.
- **`exportToFormat(dataArray, formatType, options)`**: Compila conjuntos de datos en archivos descargables CSV/Excel o genera definiciones PDF de alta fidelidad para impresión.
- **`changeSaleStatus(supabase, saleId, newStatus)`**: Transición de estados de venta con llamada RPC a la función atómica de descuento de stock.

### 2. Motor del E-commerce Cliente (`js/core/client-logic.js`)
- **`calculateClientTotal(cartItems, deliveryType, deliveryFee)`**: Calcula el total definitivo en Bs. Suma el costo de entrega variable (`deliveryFee`) únicamente si el tipo de entrega es `'envio'`.
- **`generateOrderCode()`**: Genera y retorna un identificador alfanumérico aleatorio corto de 5 caracteres para la orden de compra.
- **`getGoogleMapsLink()`**: Retorna la URL de localización física de la tienda de Prem Vida para pedidos en modalidad de retiro en local.
- **`generateWhatsAppLink(cartItems, orderCode, deliveryType, paymentMethod, deliveryFee, total, phoneNumber)`**: Compila un mensaje estructurado y legible con el desglose del pedido (cantidades, subtotal de productos, costo de envío, método de pago, código e importe final en Bs.) y devuelve el enlace de WhatsApp codificado.
- **`validateCartStock(supabase, cartItems)`**: Consulta en tiempo real las existencias físicas de los IDs de producto del carrito en la tabla de Supabase, validando que se cuente con la disponibilidad suficiente. Retorna un booleano y un mensaje descriptivo en caso de discrepancia.

---

## Configuración y Despliegue

Consulte el manual original de base de datos en [db/schema.sql](file:///d:/Will/Proyectos/Prem%20MacOS/db/schema.sql) para inicializar las tablas en Supabase. Cree el bucket público de almacenamiento llamado `product-images` en su consola de Supabase y asigne políticas RLS permisivas para inserciones de archivos de imágenes.

# Prem Vida - Ecosistema de Administración e E-commerce

Bienvenido al ecosistema unificado de **Prem Vida**, una plataforma integral de alta fidelidad que consta de un panel administrativo avanzado y una tienda en línea orientada al cliente. Ambas interfaces son reactivas en tiempo real y están diseñadas bajo una estética **Glassmorphic** oscura y premium. 

Todo el sistema está directamente enlazado a **Supabase**, utilizando una arquitectura de base de datos relacional para inventario, ventas, compras y nómina.

---

## 🏗 Arquitectura del Ecosistema

El proyecto ha sido rediseñado como una arquitectura de aplicaciones de una sola página (SPA) que se comunican de forma atómica y reactiva con el backend.

1. **Panel de Administración (`code.html`)**
   - Panel de control integral para gestión interna.
   - Sincroniza datos relacionales (gastos, nómina, compras a proveedores) mediante WebSockets.
   - Administra el catálogo de inventario.
   - Implementa cálculos financieros y estadísticos en bolívares (**Bs.**) en tiempo real.
   - Cuenta con integración inteligente de inventario vía archivos CSV (XERO).

2. **Tienda del Cliente (`tienda.html`)**
   - SPA de comercio electrónico independiente.
   - **Renderizado Reactivo Realtime:** Escucha eventos de la tabla `products` en el canal `public:products` y actualiza inmediatamente stock, precios y estado visual (sin recargar la página).
   - **Carrito de Compras con Validación:** Prevención asíncrona de errores de stock (no se pueden añadir más productos del límite máximo).
   - **Despachador Automatizado:** Una vez conformado el carrito, el pedido se procesa localmente y se genera una factura estructurada que se envía automáticamente vía **WhatsApp Business**.

3. **Núcleo de Lógica (`js/core/logic.js`)**
   - Proveedor central de lógica de negocio y wrappers de Supabase.
   - `processXeroInventoryCSV`: Parser que lee, procesa difusamente cabeceras e importa de manera masiva catálogos usando la instrucción atómica `UPSERT` sobre el conflicto en el `sku`.
   - `changeSaleStatus`: Manejador de transacciones (RPC) que permite realizar descuentos de inventario atómicos durante confirmaciones de venta.
   - Funciones para generar exportaciones limpias y estructuradas a PDF y CSV.

4. **Sistema de Diseño (`DESIGN.md`)**
   - Documento que define la identidad visual de la aplicación.
   - Colores base (Surface, Primary `#4edea3`, Secondary, Variantes de texto).
   - Componentes glassmorphic (blur, opacidades de capa, iluminación).
   - Micro-interacciones y tiempos de animación CSS.

5. **Base de Datos (`db/schema.sql`)**
   - Esquema relacional optimizado (PostgreSQL) desplegado en Supabase.
   - Tablas centrales: `products`, `sales`, `purchase_orders`, `suppliers`, `expenses`, `payroll`.
   - Políticas RLS (Row Level Security) y Funciones (RPC) para garantizar integridad.

---

## 🔒 Control de Calidad y Blindaje

La versión de producción del sistema ha pasado por un proceso de blindaje exhaustivo para prevenir errores en tiempo de ejecución:

- **Sincronización Realtime:** La tienda y el panel están suscritos a eventos WebSockets. Un cambio de precio o stock en el panel se ve reflejado en milisegundos en la pantalla del cliente.
- **Validaciones Defensivas:** Todos los scripts de interacción con la API están envueltos en bloques `try/catch`. 
- **DOM Safety:** Las lógicas están protegidas por eventos `DOMContentLoaded` y comprobaciones de nulos para todos los nodos inyectados.
- **Precisión Matemática:** Los cálculos del carrito y financieros fuerzan un redondeo algorítmico `Math.round(val * 100) / 100` y salidas visuales de `toFixed(2)` para mitigar los errores clásicos de punto flotante de JavaScript.

---

## ⚙️ Configuración y Despliegue

### Credenciales Oficiales de Producción
El sistema ya cuenta con las credenciales embebidas (a prueba de fallos) correspondientes al entorno de producción oficial:
- **Supabase URL:** `https://qupB57fCBXiY5fazSqAqrA.supabase.co`
- **WhatsApp Destino:** `+59170327181`

### Inicialización Local
1. Simplemente abra `code.html` o `tienda.html` en su navegador de preferencia (recomendado usar una extensión como *Live Server* para evitar bloqueos CORS locales).
2. Para la configuración de la BD, ejecute el contenido de `db/schema.sql` en el SQL Editor de su dashboard de Supabase.
3. Asegúrese de que el bucket `product-images` sea público y tenga políticas RLS para carga y visualización de imágenes.

---

*Desarrollado para el equipo de la facultad como demostración técnica de integración de e-commerce, gestión reactiva de inventarios y patrones de diseño modernos. (Historial vivo de cambios)*

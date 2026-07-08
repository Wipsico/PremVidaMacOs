# 🌿 Prem Vida — Suite Administrativa Modular

> **Stack:** HTML5 · Vanilla JS (ES Modules) · Tailwind CSS CDN · Supabase (PostgreSQL + Storage + Realtime)  
> **Diseño:** Glassmorphism oscuro · Material Symbols · Inter typeface

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)  
2. [Arquitectura de Archivos](#arquitectura-de-archivos)  
3. [Credenciales de Prueba](#credenciales-de-prueba)  
4. [Configuración de Supabase](#configuración-de-supabase)  
5. [Guía de Módulos](#guía-de-módulos)  
6. [Base de Datos (Schema)](#base-de-datos-schema)  
7. [Changelog de Estabilización](#changelog-de-estabilización)  
8. [Nota Anti-Hibernación](#nota-anti-hibernación)  

---

## Descripción General

**Prem Vida** es una suite de administración web para gestionar el inventario, ventas, clientes y analíticas de una tienda de productos veganos y saludables. La suite está construida como una aplicación modular de archivos HTML estáticos que se conectan a **Supabase** como backend-as-a-service.

### Características Principales

| Módulo         | Descripción                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `login.html`   | Autenticación segura con bypass de facultad y soporte para Google OAuth      |
| `dashboard.html` | Bento Grid con métricas en tiempo real, gráfico SVG de ventas, alertas de stock |
| `code.html`    | Gestión de inventario con CRUD, importación CSV de XERO, exportación PDF/Excel |
| `customers.html` | Base de compradores recurrentes con KPIs de fidelización y búsqueda en vivo |
| `analytics.html` | Rotación de stock, alertas de vencimiento y mermas por categoría           |
| `settings.html`  | Gestión de credenciales Supabase con recarga dinámica                      |

---

## Arquitectura de Archivos

```
Prem MacOS/
├── index.html          → Redirige a login.html (entry point)
├── login.html          → Pantalla de inicio de sesión
├── dashboard.html      → Panel principal con métricas
├── code.html           → Inventario y catálogo de productos
├── customers.html      → Base de clientes
├── analytics.html      → Análisis de stock y mermas
├── orders.html         → Órdenes de proveedores (pendiente)
├── settings.html       → Configuración de credenciales
│
├── js/
│   └── core/
│       ├── shared.js           → Lógica central: sesión, auth guard, banner anti-hibernación
│       ├── logic.js            → Funciones Supabase: CRUD productos, CSV XERO, exportación
│       └── dashboard-logic.js  → Stats del dashboard, fallback datos, renderizador SVG
│
└── db/
    └── schema.sql      → Estructura completa de la base de datos PostgreSQL
```

---

## Credenciales de Prueba

> ⚠️ **Solo para evaluación académica y demostración.** No usar en producción real.

| Campo    | Valor                  |
|----------|------------------------|
| Email    | `admin@premvida.com`   |
| Password | `PremVida2026!`        |

Estas credenciales activan un **bypass de autenticación** local que no requiere conexión a Supabase. Al usarlas:
- Se marca `localStorage.isLoggedIn = 'true'`
- Se redirige directamente al Dashboard
- El sistema funciona en modo simulado con datos demo curados

---

## Configuración de Supabase

### Opción A — Credenciales en la UI

1. Abre `settings.html` o haz clic en el ícono ⚙️ del header.
2. Pega tu **Supabase Project URL** y tu **Anon Public Key**.
3. Haz clic en "Guardar y Conectar" — el sistema se reconecta automáticamente.

### Opción B — Auto-inyección en código

En `code.html` (líneas ~421-432), se puede preconfigurar la URL y Key directamente:

```javascript
const _PROD_URL = 'https://TU-PROYECTO.supabase.co';
const _PROD_KEY = 'TU_ANON_KEY';
```

### Claves necesarias

| Variable              | Dónde obtenerla                                        |
|-----------------------|--------------------------------------------------------|
| `SUPABASE_URL`        | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY`   | Supabase Dashboard → Project Settings → API → anon key    |

---

## Guía de Módulos

### `js/core/shared.js`
- Control global de sesión (`isLoggedIn`)
- Redirect automático a `login.html` si no hay sesión activa
- Dropdown de perfil con opción de Logout
- Bypass de prueba para `admin@premvida.com / PremVida2026!`
- **Interceptor de hibernación:** Si detecta `TypeError: Failed to fetch`, inyecta automáticamente un banner Glassmorphic de advertencia con instrucciones para reactivar el servidor.

### `js/core/logic.js`
- `fetchProducts(supabase)` — Trae todos los productos activos
- `fetchSupplierOrders(supabase)` — Trae órdenes de proveedores con JOIN a `suppliers`
- `fetchExpenses(supabase)` — Trae gastos operativos
- `uploadProductImage(supabase, file)` — Sube imágenes al Storage con ruta única
- `insertProduct(supabase, data)` — Inserta producto con redondeo `Math.round(price * 100) / 100` y campo `sale_price`
- `processXeroInventoryCSV(supabase, csvText)` — Importa inventario desde exportaciones de XERO
- `exportToFormat(products, format, options)` — Exporta a CSV/Excel o PDF imprimible

### `js/core/dashboard-logic.js`
- `fetchDashboardStats(supabase)` — Queries paralelas con fallback automático a datos simulados
- `renderSalesChart(containerId, labelsId, data)` — Renderizador SVG de gráfico lineal con área degradada y curvas bezier

---

## Base de Datos (Schema)

Ejecutar el archivo `db/schema.sql` en **SQL Editor** de Supabase para crear la estructura completa.

### Tablas principales

#### `products`
| Columna       | Tipo              | Descripción                          |
|---------------|-------------------|--------------------------------------|
| `id`          | UUID              | PK, generado automáticamente         |
| `sku`         | TEXT UNIQUE       | Código de referencia único           |
| `name`        | TEXT              | Nombre del producto                  |
| `description` | TEXT              | Notas de almacenamiento              |
| `price`       | NUMERIC(10,2)     | Precio regular en Bolivianos         |
| `sale_price`  | NUMERIC(10,2)     | Precio de oferta (nullable)          |
| `stock`       | INTEGER           | Unidades disponibles                 |
| `category`    | TEXT              | Categoría del producto               |
| `image_url`   | TEXT              | URL de la imagen en Storage          |
| `is_active`   | BOOLEAN           | Si está activo en catálogo           |
| `created_at`  | TIMESTAMPTZ       | Fecha de inserción                   |

#### `suppliers`
| Columna     | Tipo    | Descripción           |
|-------------|---------|----------------------|
| `id`        | UUID    | PK                   |
| `name`      | TEXT    | Nombre del proveedor |
| `email`     | TEXT    | Contacto             |
| `phone`     | TEXT    | Teléfono             |

#### `purchase_orders`
| Columna        | Tipo          | Descripción                              |
|----------------|---------------|------------------------------------------|
| `id`           | UUID          | PK                                       |
| `supplier_id`  | UUID          | FK → suppliers                           |
| `total_amount` | NUMERIC(10,2) | Monto total en Bs.                       |
| `status`       | TEXT          | `pendiente` / `solicitado` / `pagado`   |
| `created_at`   | TIMESTAMPTZ   | Fecha de la orden                        |

#### `expenses`
| Columna     | Tipo          | Descripción                                          |
|-------------|---------------|-----------------------------------------------------|
| `id`        | UUID          | PK                                                  |
| `category`  | TEXT          | `alquiler` / `luz` / `agua` / `otros`               |
| `amount`    | NUMERIC(10,2) | Monto en Bs.                                        |
| `period`    | TEXT          | Mes/año de referencia                               |

#### `sales`
| Columna        | Tipo          | Descripción                                |
|----------------|---------------|--------------------------------------------|
| `id`           | UUID          | PK                                         |
| `total_amount` | NUMERIC(10,2) | Total de la venta                          |
| `status`       | TEXT          | `pendiente` / `confirmado` / `cancelado`  |
| `created_at`   | TIMESTAMPTZ   | Fecha de la venta                          |

---

## Changelog de Estabilización

### v1.4.0 — 2026-07-08
- ✅ **`analytics.html`** — Nuevo panel: rotación de stock, alertas de vencimiento crítico, barras de degradación animadas, distribución por categoría.
- ✅ **`customers.html`** — Nuevo módulo: tabla de compradores con KPIs, búsqueda en vivo, avatares con iniciales generadas dinámicamente.
- ✅ **`dashboard.html`** — Bento Grid con gráfico SVG de tendencia de ventas y panel de alertas de stock crítico.
- ✅ **`js/core/dashboard-logic.js`** — Stats reales desde Supabase con fallback a datos curados. Renderizador SVG bezier.
- ✅ **`code.html`** — Campo `sale_price` con precio tachado en tabla. Fallback `onerror` en imágenes. Redondeo `Math.round`.
- ✅ **`js/core/logic.js`** — `insertProduct` soporta `sale_price` con redondeo y URL de imagen fallback.

### v1.3.0 — 2026-07-08
- ✅ **`shared.js`** — Interceptor de hibernación global con banner Glassmorphic.
- ✅ **`login.html`** — Bypass de prueba para `admin@premvida.com`.
- ✅ **`settings.html`** — Gestión de credenciales con recarga dinámica.

### v1.2.0 — 2026-07-08
- ✅ **`db/schema.sql`** — Añadida columna `sale_price NUMERIC(10,2)`.
- ✅ **`code.html`** — Módulo de inventario con realtime, importación XERO, exportación Excel/PDF.

### v1.1.0 — Sesión anterior
- ✅ Estructura base: HTML + Tailwind CSS Glassmorphism.
- ✅ Conexión Supabase con `createClient`.

---

## Nota Anti-Hibernación

> **Problema conocido en Supabase Free Tier:**  
> Los proyectos gratuitos de Supabase se suspenden automáticamente después de **7 días de inactividad**. Cuando esto ocurre, las peticiones HTTP arrojan `TypeError: Failed to fetch`.

### Solución automática implementada

La suite detecta este error y muestra un banner de advertencia en la parte superior de la pantalla:

```
⚠️ Servidor en suspensión. Si el catálogo no carga,
   por favor ingresa a Supabase y dale a 'Restore Project'.
```

### Solución manual

1. Ve a [supabase.com](https://supabase.com) → Tus proyectos.
2. Si el proyecto muestra "Paused", haz clic en **"Restore Project"**.
3. Espera 30–60 segundos y recarga la página.

### Recomendación para producción

- Configura un **ping periódico** (cada 3 días) con un cron job gratuito, por ejemplo mediante [cron-job.org](https://cron-job.org), apuntando a cualquier endpoint REST de tu proyecto Supabase.
- O actualiza al plan **Pro** de Supabase para eliminar la hibernación.

---

*Documentación generada para Prem Vida Admin Suite — Proyecto académico de gestión de inventario vegano.*

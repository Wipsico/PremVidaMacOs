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
9. [Guía de Despliegue en GitHub y Vercel](#guía-de-despliegue-en-github-y-vercel)

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
- `renderOrdersChart(containerId, labelsId, data)` — Renderizador SVG de gráfico lineal con área degradada y curvas bezier

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

#### `orders`
| Columna        | Tipo          | Descripción                                |
|----------------|---------------|--------------------------------------------|
| `id`           | UUID          | PK                                         |
| `order_code`   | TEXT          | Código único del pedido                    |
| `total_amount` | NUMERIC(12,2) | Total de la orden                          |
| `payment_method`| TEXT         | Método de pago utilizado                   |
| `status`       | TEXT          | `draft` / `espera_aprobacion` / `confirmado` |
| `delivery_type`| TEXT          | `pickup` / `delivery`                      |
| `operator_id`  | UUID          | FK → profiles del operador que gestionó la orden |
| `created_at`   | TIMESTAMPTZ   | Fecha de la orden                          |

---

## Changelog de Estabilización

### v1.5.0 — 2026-07-14 (Fase de Estabilización y Despliegue)
- ✅ **Auto-inyección de Llaves** — Conexión directa a Supabase mediante fallback de credenciales reales si el `localStorage` está vacío.
- ✅ **`db/schema.sql`** — Añadida tabla `customers` y campo `expiry_date` en `products`.
- ✅ **Estabilización de UI** — Reemplazo total de datos "mock" en `analytics.html` y `customers.html` por conexión real a la base de datos de Supabase.
- ✅ **Integridad Matemática** — Redondeos estrictos a 2 decimales en el módulo de inventario (`js/core/logic.js`) para prevenir derivas flotantes y se ha corregido el resaltado verde del `sale_price` en `code.html`.
- ✅ **Documentación** — Generación de `.gitignore` para el entorno frontend y esta guía de despliegue en GitHub/Vercel.

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

---

## Guía de Despliegue en GitHub y Vercel

Esta sección es una guía paso a paso para los compañeros de la facultad sobre cómo inicializar Git localmente, conectar con GitHub y publicar la tienda gratuitamente en **GitHub Pages** o **Vercel**.

### 1. Inicialización de Git Local (Terminal)

Abre la terminal en la carpeta del proyecto y ejecuta los siguientes comandos en orden:

```bash
# 1. Inicializar el repositorio Git
git init

# 2. Agregar todos los archivos al tracking (respeta el .gitignore)
git add .

# 3. Crear el primer commit
git commit -m "feat: estabilización inicial v1.5.0, conexión real a Supabase e Inventario robusto"

# 4. Crear la rama principal (main)
git branch -M main

# 5. Conectar con el repositorio remoto de GitHub (reemplazar con tu URL real)
git remote add origin https://github.com/Wipsico/PremVidaMacOs.git

# 6. Subir el código a GitHub
git push -u origin main
```

### 2. Despliegue Gratuito (Opciones)

#### Opción A: GitHub Pages (Más rápido)
1. Ve a tu repositorio en GitHub.
2. Ve a **Settings** > **Pages** (en el menú izquierdo).
3. Bajo **Build and deployment**, en **Source**, selecciona `Deploy from a branch`.
4. En **Branch**, selecciona `main` y la carpeta `/ (root)`. Haz clic en **Save**.
5. Espera unos minutos y tu sitio estará vivo en: `https://[tu-usuario].github.io/PremVidaMacOs`

#### Opción B: Vercel (Recomendado para mayor velocidad y CDN global)
1. Inicia sesión en [Vercel.com](https://vercel.com/) con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Importa el repositorio `PremVidaMacOs`.
4. En la configuración (Build and Output Settings), deja el **Framework Preset** en `Other` (ya que es HTML/JS estático).
5. Haz clic en **Deploy**.
6. En segundos, Vercel generará una URL pública segura (ej. `premvida-macos.vercel.app`).

> **Nota de Seguridad:** Al ser una aplicación Frontend Vanilla JS, las credenciales de Supabase (`URL` y `Anon Key`) son públicas por definición. Esto es normal en arquitecturas Serverless con Supabase; la seguridad recae en las políticas RLS (Row Level Security) que se han configurado en la base de datos a través de `schema.sql`.

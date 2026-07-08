# Prem Vida - Ecosistema de Administración e E-commerce

Bienvenido al ecosistema unificado de **Prem Vida**, una plataforma integral de alta fidelidad que consta de un panel administrativo avanzado y una tienda en línea orientada al cliente. Ambas interfaces son reactivas en tiempo real y están diseñadas bajo una estética **Glassmorphic** oscura y premium. 

Todo el sistema está directamente enlazado a **Supabase**, utilizando una arquitectura de base de datos relacional para inventario, ventas, compras y nómina.

---

## 🏗 Arquitectura del Ecosistema

El proyecto ha sido rediseñado como una arquitectura de aplicaciones de una sola página (SPA) que se comunican de forma atómica y reactiva con el backend.

1. **Panel de Administración (`code.html`)**
   - Panel de control integral para gestión interna.
   - Sincroniza datos relacionales (gastos, nómina, compras a proveedores) mediante WebSockets.
   - Administra el catálogo de inventario, buscador global para filtrar existencias y gestión de promociones (**ofertas destacadas**).
   - Generador nativo de **Reportes PDF** y exportación de catálogos en CSV/Excel.
   - Cuenta con integración inteligente de inventario vía archivos CSV (XERO).

2. **Tienda del Cliente (`tienda.html`)**
   - SPA de comercio electrónico independiente.
   - **Internacionalización (i18n):** Soporte multi-idioma (Español e Inglés) integrado.
   - **Renderizado Reactivo Realtime:** Escucha eventos de la tabla `products` y actualiza inmediatamente stock, precios y estado visual.
   - **Buscador en Tiempo Real:** Filtra productos de inmediato mientras el usuario escribe.
   - **Despachador Automatizado:** Procesamiento local que genera una factura estructurada enviada automáticamente vía **WhatsApp Business**.

3. **Núcleo de Lógica (`js/core/logic.js` & `js/core/client-logic.js`)**
   - Proveedor central de lógica de negocio y wrappers de Supabase.
   - Exportador PDF y Excel local sin dependencias pesadas de backend.

---

## 🔒 Control de Calidad y Blindaje

La versión de producción del sistema ha pasado por un proceso de blindaje exhaustivo para prevenir errores en tiempo de ejecución:

- **Sincronización Realtime:** La tienda y el panel están suscritos a eventos WebSockets. Un cambio de precio o stock se ve reflejado en milisegundos.
- **Validaciones Defensivas:** Todos los scripts de interacción con la API están envueltos en bloques `try/catch`.
- **Precisión Matemática:** Cálculos financieros fuerzan un redondeo algorítmico `Math.round(val * 100) / 100`.

---

## 🚀 Guía de Despliegue Oficial (GitHub Pages / Vercel)

Esta sección explica cómo subir este proyecto a GitHub y publicarlo en internet de forma gratuita para que los clientes puedan acceder a la tienda desde cualquier lugar del mundo.

### 1. Inicialización de Git (Solo la primera vez)

Abre la terminal (Git Bash o Command Prompt) en la carpeta del proyecto y ejecuta secuencialmente los siguientes comandos:

```bash
# 1. Inicializar el repositorio
git init

# 2. Agregar todos los archivos (el archivo .gitignore filtrará la basura automáticamente)
git add .

# 3. Hacer el primer commit
git commit -m "feat: Versión 1.0 - Tienda Online Prem Vida"

# 4. Cambiar el nombre de la rama principal a 'main'
git branch -M main

# 5. Enlazar el repositorio local con tu repositorio remoto de GitHub
git remote add origin https://github.com/Wipsico/PremVidaMacOs.git

# 6. Subir los archivos a GitHub (forzar sobrescritura en caso de existir archivos base)
git push -u origin main -f
```

### 2. Despliegue en GitHub Pages (Opción Más Fácil)

Dado que este proyecto está construido puramente en HTML, CSS y JS del lado del cliente (sin servidor Node.js o PHP, gracias a Supabase), **GitHub Pages** es la solución ideal.

1. Ve a la página de tu repositorio en GitHub: `https://github.com/Wipsico/PremVidaMacOs`
2. Ve a la pestaña **Settings** (Configuración) en la barra superior.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. Bajo la sección **Build and deployment**, en **Source**, selecciona `Deploy from a branch`.
5. En **Branch**, selecciona `main` y la carpeta `/(root)`.
6. Haz clic en **Save**.
7. En unos 2 o 3 minutos, tu sitio estará en vivo en un enlace que GitHub te proporcionará (ejemplo: `https://Wipsico.github.io/PremVidaMacOs/tienda.html`).

### 3. Despliegue en Vercel (Recomendado para Producción)

Si deseas mayor velocidad global y soporte futuro para dominios personalizados:

1. Ve a [Vercel](https://vercel.com/) y crea una cuenta o inicia sesión con GitHub.
2. Haz clic en el botón **Add New...** y luego en **Project**.
3. Importa tu repositorio `PremVidaMacOs`.
4. El "Framework Preset" se detectará automáticamente como `Other` (HTML plano).
5. Deja la configuración por defecto y presiona **Deploy**.
6. ¡Listo! Vercel te dará una URL de producción (ejemplo: `premvida.vercel.app`).
   - *Nota: Para entrar a la tienda debes ir a `midominio.vercel.app/tienda.html` o al panel administrativo en `midominio.vercel.app/code.html`.*

---

*Desarrollado para el equipo de la facultad como demostración técnica de integración de e-commerce, gestión reactiva de inventarios y patrones de diseño modernos.*

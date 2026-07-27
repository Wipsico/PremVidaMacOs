/**
 * Prem Vida - i18n Core Module
 * Motor central de traduccion ES/EN para el panel admin (code.html, orders.html,
 * settings.html) y la tienda publica (tienda.html).
 *
 * Uso:
 *   import { applyTranslations, getCurrentLang, t } from './i18n.js';
 *   applyTranslations();               // traduce todo lo marcado con [data-i18n]
 *   t('store.cart.title');             // obtiene un string traducido para usarlo en JS
 *
 * Convenciones de marcado en HTML:
 *   data-i18n="clave"              -> reemplaza textContent
 *   data-i18n-placeholder="clave"  -> reemplaza placeholder (inputs/textarea)
 *   data-i18n-title="clave"        -> reemplaza atributo title (tooltips)
 *   data-i18n-aria-label="clave"   -> reemplaza aria-label
 */

const LANG_STORAGE_KEY = 'premvida_lang';
const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

export const translations = {
    es: {
        // ==========================================
        // COMUN / COMPARTIDO
        // ==========================================
        common: {
            save: 'Guardar',
            cancel: 'Cancelar',
            close: 'Cerrar',
            delete: 'Eliminar',
            edit: 'Editar',
            confirm: 'Confirmar',
            search: 'Buscar',
            loading: 'Cargando...',
            noResults: 'No se encontraron resultados.',
            actions: 'Acciones',
            all: 'Todas',
            logout: 'Cerrar sesión',
        },

        // ==========================================
        // ADMIN - CODE.HTML (Inventario)
        // ==========================================
        admin: {
            nav: {
                dashboard: 'Panel',
                inventory: 'Inventario',
                orders: 'Órdenes',
                personal: 'Personal',
                analytics: 'Analítica',
                customers: 'Clientes',
                settings: 'Configuración',
            },
            inventory: {
                title: 'Gestión de Inventario',
                subtitle: 'Administra tu catálogo de productos veganos',
                addProduct: 'Agregar Producto',
                importXero: 'Importar XERO',
                exportExcel: 'Exportar Excel',
                exportPdf: 'Exportar PDF',
                saveBackup: 'Guardar Respaldo',
                searchPlaceholder: 'Buscar por SKU, nombre o categoría...',
                kpiTotalProducts: 'Total de Productos',
                kpiOutOfStock: 'Productos Agotados',
                kpiValuation: 'Valuación del Inventario',
                table: {
                    product: 'Producto',
                    sku: 'SKU',
                    price: 'Precio',
                    stock: 'Stock',
                    category: 'Categoría',
                    actions: 'Acciones',
                    empty: 'No se encontraron productos en el inventario.',
                    noDescription: 'Sin descripción',
                },
                editProduct: 'Editar producto',
                deleteProduct: 'Eliminar producto',
                modal: {
                    newTitle: 'Nuevo Producto',
                    editTitle: 'Editar Producto',
                    name: 'Nombre',
                    sku: 'SKU',
                    description: 'Descripción',
                    price: 'Precio (Bs.)',
                    salePrice: 'Precio de Oferta (Bs.)',
                    stock: 'Stock',
                    category: 'Categoría',
                    imageUrl: 'URL de Imagen',
                    uploadImage: 'Subir imagen',
                    submit: 'Guardar Producto',
                    submitEdit: 'Guardar Cambios',
                },
                deleteModal: {
                    title: '¿Eliminar producto?',
                    warning: 'Esta acción no se puede deshacer.',
                    confirm: 'Eliminar',
                },
            },
            // Etiquetas de umbral de stock (Fase 2)
            stock: {
                agotado: 'Agotado',
                critico: '⚠ Crítico',
                alerta: '⚠ Alerta',
                recomendado: 'Recomendado',
                lleno: 'Stock Lleno ✓',
                units: 'unidades',
            },
            orders: {
                title: 'Órdenes de Proveedores',
                newOrder: 'Nueva Orden',
                tabs: { all: 'Todas', heartbeef: 'Heartbeef', greenleaf: 'Green Leaf', otros: 'Otros' },
                kpiTotal: 'Total de Órdenes',
                kpiPending: 'Órdenes Pendientes',
                kpiLeaderBrand: 'Marca Líder',
                salesByCode: 'Venta por Código',
                searchCode: 'Buscar código de venta...',
                registerPayment: 'Registrar Pago',
                status: {
                    espera_aprobacion: 'Espera de Aprobación',
                    aprobado: 'Aprobado',
                    pagado: 'Pagado',
                    cancelado: 'Cancelado',
                    pendiente: 'Pendiente',
                },
                table: {
                    code: 'Código',
                    supplier: 'Proveedor',
                    brand: 'Marca',
                    total: 'Total',
                    status: 'Estado',
                    date: 'Fecha',
                },
            },
            settings: {
                title: 'Configuración general',
                paramsTitle: 'Parámetros del sistema',
                paramsDescription: 'Ajusta los valores globales de la suite para stock, bonos, entregas y modo de mantenimiento en Bolivia.',
                languageLabel: 'Idioma de interfaz',
                stockAlertThreshold: 'Umbral de stock crítico',
                bonusMultiplier: 'Multiplicador de bonos',
                deliveryFee: 'Tarifa de entrega (Bs.)',
                storeName: 'Nombre de la tienda',
                whatsappNumber: 'Número de WhatsApp',
                maintenanceMode: 'Modo mantenimiento',
                maintenanceDescription: 'Activa bloqueos operativos globales para la suite.',
                save: 'Guardar cambios',
                saveSuccess: 'Parámetros actualizados correctamente.',
                auditTitle: 'Consola de auditoría',
                auditDescription: 'Seguimiento de operaciones del sistema.',
                auditRefresh: 'Refrescar',
                auditRefreshed: 'Auditoría actualizada.',
                auditEmpty: 'No hay eventos de auditoría disponibles por el momento.',
            },
        },

        // ==========================================
        // TIENDA - TIENDA.HTML
        // ==========================================
        store: {
            brand: 'Prem Vida',
            tagline: 'Tienda Vegana',
            navbar: {
                searchPlaceholder: 'Buscar productos veganos...',
                cartAria: 'Abrir carrito',
            },
            filters: {
                all: 'Todas',
                category: 'Categoría',
            },
            product: {
                addToCart: 'Agregar al carrito',
                reserveNotify: 'Reservar / Notificarme',
                vegan: 'Vegan',
            },
            stock: {
                agotado: 'Agotado',
                critico: '⚠ Crítico',
                alerta: '⚠ Alerta',
                recomendado: 'Recomendado',
                lleno: 'Stock Lleno ✓',
            },
            cart: {
                title: 'Tu Carrito',
                empty: 'Tu carrito está vacío.',
                subtotal: 'Subtotal',
                deliveryFee: 'Costo de Envío',
                total: 'Total',
                checkout: 'Finalizar Pedido',
                continueShopping: 'Seguir Comprando',
            },
            checkout: {
                title: 'Finalizar Pedido',
                deliveryType: 'Tipo de Entrega',
                delivery: 'Envío a domicilio',
                pickup: 'Retirar en tienda',
                paymentMethod: 'Método de Pago',
                cash: 'Efectivo',
                qr: 'QR',
                transfer: 'Transferencia',
                arrange: 'Acordar',
                customerName: 'Nombre completo',
                customerPhone: 'Teléfono',
                notes: 'Notas adicionales',
                submit: 'Confirmar Pedido',
                submitWhatsapp: 'Confirmar Pedido por WhatsApp',
                submitting: 'Procesando...',
                generatingTicket: 'Generando ticket...',
                zonePlaceholder: 'Zona / barrio / referencia de entrega',
                deliveryCostLabel: 'Costo de envío:',
            },
            reserveModal: {
                title: 'Reservar / Notificarme',
                productTitle: 'Reservar Producto',
                description: 'Te avisaremos cuando este producto vuelva a estar disponible.',
                descPrefix: 'El producto',
                descSuffix: 'está agotado. Déjanos tus datos para notificarte cuando vuelva a estar en stock o registrar tu interés.',
                nameLabel: 'Tu Nombre',
                namePlaceholder: 'Ej. Ana Pérez',
                contactLabel: 'WhatsApp / Contacto',
                contactPlaceholder: 'Tu número para avisarte',
                commentsLabel: 'Comentarios / Sugerencias',
                commentsPlaceholder: 'Ej. ¿Podrían traer en otros sabores?',
                submit: 'Enviar Solicitud',
                validationError: 'Por favor ingresa tu nombre y número de contacto.',
                success: '¡Solicitud enviada! Te avisaremos cuando haya stock.',
            },
            maintenance: {
                title: '🛠️ ¡Atención querido usuario!',
                message: 'Estamos trabajando en rellenar la tienda con tus productos favoritos y refrescando nuestro catálogo. Vuelve muy pronto.',
            },
            whatsapp: {
                greeting: 'Hola! Este es el ticket de mi orden por favor',
                newOrderTitle: 'Nuevo Pedido - Prem Vida',
                orderCode: 'Código de Pedido',
                paymentMethod: 'Método de Pago',
                deliveryType: 'Tipo de Entrega',
                deliveryHome: 'Envío a domicilio',
                deliveryPickup: 'Recoger en tienda física',
                deliveryCost: 'Costo',
                productsDetail: 'Detalle de Productos',
                total: 'TOTAL DEFINITIVO',
                thanks: 'Muchas gracias por su preferencia.',
            },
        },
    },

    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            delete: 'Delete',
            edit: 'Edit',
            confirm: 'Confirm',
            search: 'Search',
            loading: 'Loading...',
            noResults: 'No results found.',
            actions: 'Actions',
            all: 'All',
            logout: 'Log out',
        },

        admin: {
            nav: {
                dashboard: 'Dashboard',
                inventory: 'Inventory',
                orders: 'Orders',
                personal: 'Staff',
                analytics: 'Analytics',
                customers: 'Customers',
                settings: 'Settings',
            },
            inventory: {
                title: 'Inventory Management',
                subtitle: 'Manage your vegan product catalog',
                addProduct: 'Add Product',
                importXero: 'Import XERO',
                exportExcel: 'Export Excel',
                exportPdf: 'Export PDF',
                saveBackup: 'Save Backup',
                searchPlaceholder: 'Search by SKU, name or category...',
                kpiTotalProducts: 'Total Products',
                kpiOutOfStock: 'Out of Stock Products',
                kpiValuation: 'Inventory Valuation',
                table: {
                    product: 'Product',
                    sku: 'SKU',
                    price: 'Price',
                    stock: 'Stock',
                    category: 'Category',
                    actions: 'Actions',
                    empty: 'No products found in inventory.',
                    noDescription: 'No description',
                },
                editProduct: 'Edit product',
                deleteProduct: 'Delete product',
                modal: {
                    newTitle: 'New Product',
                    editTitle: 'Edit Product',
                    name: 'Name',
                    sku: 'SKU',
                    description: 'Description',
                    price: 'Price (Bs.)',
                    salePrice: 'Sale Price (Bs.)',
                    stock: 'Stock',
                    category: 'Category',
                    imageUrl: 'Image URL',
                    uploadImage: 'Upload image',
                    submit: 'Save Product',
                    submitEdit: 'Save Changes',
                },
                deleteModal: {
                    title: 'Delete product?',
                    warning: 'This action cannot be undone.',
                    confirm: 'Delete',
                },
            },
            stock: {
                agotado: 'Out of Stock',
                critico: '⚠ Critical',
                alerta: '⚠ Low Stock',
                recomendado: 'Recommended',
                lleno: 'Fully Stocked ✓',
                units: 'units',
            },
            orders: {
                title: 'Supplier Orders',
                newOrder: 'New Order',
                tabs: { all: 'All', heartbeef: 'Heartbeef', greenleaf: 'Green Leaf', otros: 'Other' },
                kpiTotal: 'Total Orders',
                kpiPending: 'Pending Orders',
                kpiLeaderBrand: 'Leading Brand',
                salesByCode: 'Sale by Code',
                searchCode: 'Search sale code...',
                registerPayment: 'Register Payment',
                status: {
                    espera_aprobacion: 'Awaiting Approval',
                    aprobado: 'Approved',
                    pagado: 'Paid',
                    cancelado: 'Cancelled',
                    pendiente: 'Pending',
                },
                table: {
                    code: 'Code',
                    supplier: 'Supplier',
                    brand: 'Brand',
                    total: 'Total',
                    status: 'Status',
                    date: 'Date',
                },
            },
            settings: {
                title: 'General settings',
                paramsTitle: 'System parameters',
                paramsDescription: 'Adjust the suite\'s global values for stock, bonuses, deliveries, and maintenance mode in Bolivia.',
                languageLabel: 'Interface language',
                stockAlertThreshold: 'Critical stock threshold',
                bonusMultiplier: 'Bonus multiplier',
                deliveryFee: 'Delivery fee (Bs.)',
                storeName: 'Store name',
                whatsappNumber: 'WhatsApp number',
                maintenanceMode: 'Maintenance mode',
                maintenanceDescription: 'Enables global operational locks for the suite.',
                save: 'Save changes',
                saveSuccess: 'Settings updated successfully.',
                auditTitle: 'Audit console',
                auditDescription: 'System operations tracking.',
                auditRefresh: 'Refresh',
                auditRefreshed: 'Audit refreshed.',
                auditEmpty: 'No audit events available at the moment.',
            },
        },

        store: {
            brand: 'Prem Vida',
            tagline: 'Vegan Store',
            navbar: {
                searchPlaceholder: 'Search vegan products...',
                cartAria: 'Open cart',
            },
            filters: {
                all: 'All',
                category: 'Category',
            },
            product: {
                addToCart: 'Add to cart',
                reserveNotify: 'Reserve / Notify me',
                vegan: 'Vegan',
            },
            stock: {
                agotado: 'Out of Stock',
                critico: '⚠ Critical',
                alerta: '⚠ Low Stock',
                recomendado: 'Recommended',
                lleno: 'Fully Stocked ✓',
            },
            cart: {
                title: 'Your Cart',
                empty: 'Your cart is empty.',
                subtotal: 'Subtotal',
                deliveryFee: 'Delivery Fee',
                total: 'Total',
                checkout: 'Checkout',
                continueShopping: 'Continue Shopping',
            },
            checkout: {
                title: 'Checkout',
                deliveryType: 'Delivery Type',
                delivery: 'Home delivery',
                pickup: 'Store pickup',
                paymentMethod: 'Payment Method',
                cash: 'Cash',
                qr: 'QR',
                transfer: 'Bank Transfer',
                arrange: 'Arrange',
                customerName: 'Full name',
                customerPhone: 'Phone',
                notes: 'Additional notes',
                submit: 'Confirm Order',
                submitWhatsapp: 'Confirm Order via WhatsApp',
                submitting: 'Processing...',
                generatingTicket: 'Generating ticket...',
                zonePlaceholder: 'Area / neighborhood / delivery reference',
                deliveryCostLabel: 'Delivery cost:',
            },
            reserveModal: {
                title: 'Reserve / Notify me',
                productTitle: 'Reserve Product',
                description: "We'll let you know when this product is back in stock.",
                descPrefix: 'The product',
                descSuffix: 'is out of stock. Leave your details so we can notify you when it is back in stock, or share your interest.',
                nameLabel: 'Your Name',
                namePlaceholder: 'e.g. Ana Perez',
                contactLabel: 'WhatsApp / Contact',
                contactPlaceholder: 'Your number so we can notify you',
                commentsLabel: 'Comments / Suggestions',
                commentsPlaceholder: 'e.g. Could you bring other flavors?',
                submit: 'Send Request',
                validationError: 'Please enter your name and contact number.',
                success: 'Request sent! We will let you know when it is back in stock.',
            },
            maintenance: {
                title: '🛠️ Notice to our customers!',
                message: 'We are currently restocking your favorite products and updating our store. Please check back shortly.',
            },
            whatsapp: {
                greeting: 'Hello! Here is the ticket for my order, please',
                newOrderTitle: 'New Order - Prem Vida',
                orderCode: 'Order Code',
                paymentMethod: 'Payment Method',
                deliveryType: 'Delivery Type',
                deliveryHome: 'Home delivery',
                deliveryPickup: 'Pickup at physical store',
                deliveryCost: 'Cost',
                productsDetail: 'Order Details',
                total: 'FINAL TOTAL',
                thanks: 'Thank you very much for your preference.',
            },
        },
    },
};

/**
 * Obtiene el idioma activo desde localStorage (clave premvida_lang).
 * Por defecto 'es' si no hay valor guardado o es invalido.
 * @returns {'es'|'en'}
 */
export function getCurrentLang() {
    try {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
    } catch (err) {
        return DEFAULT_LANG;
    }
}

/**
 * Guarda el idioma activo en localStorage.
 * @param {'es'|'en'} lang
 * @returns {'es'|'en'} El idioma efectivamente guardado (normalizado).
 */
export function setCurrentLang(lang) {
    const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    try {
        localStorage.setItem(LANG_STORAGE_KEY, safeLang);
    } catch (err) {
        console.warn('[i18n] No se pudo persistir el idioma en localStorage.', err);
    }
    return safeLang;
}

/**
 * Resuelve una clave con notacion de puntos (ej. "store.cart.title")
 * dentro del diccionario indicado.
 * @param {Object} dict
 * @param {string} key
 * @returns {string|undefined}
 */
function resolveKey(dict, key) {
    return key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), dict);
}

/**
 * Traduce una clave puntual. Util para mensajes generados dinamicamente en JS
 * (ej. plantillas de WhatsApp, labels de stock, toasts).
 * @param {string} key - ej. "store.whatsapp.total"
 * @param {'es'|'en'} [lang] - Si se omite, usa getCurrentLang().
 * @returns {string} Texto traducido, o la propia key si no se encuentra.
 */
export function t(key, lang) {
    const activeLang = SUPPORTED_LANGS.includes(lang) ? lang : getCurrentLang();
    const value = resolveKey(translations[activeLang], key);
    if (value !== undefined) return value;

    // Fallback a español si la clave no existe en el idioma solicitado
    const fallback = resolveKey(translations[DEFAULT_LANG], key);
    if (fallback !== undefined) return fallback;

    console.warn(`[i18n] Clave de traducción no encontrada: "${key}"`);
    return key;
}

/**
 * Recorre el DOM y aplica traducciones a todos los elementos marcados con
 * data-i18n, data-i18n-placeholder, data-i18n-title y data-i18n-aria-label.
 * @param {'es'|'en'} [lang] - Si se omite, usa getCurrentLang().
 */
export function applyTranslations(lang) {
    const activeLang = SUPPORTED_LANGS.includes(lang) ? lang : getCurrentLang();

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const value = t(key, activeLang);
        if (value !== undefined) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (!key) return;
        const value = t(key, activeLang);
        if (value !== undefined) el.setAttribute('placeholder', value);
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (!key) return;
        const value = t(key, activeLang);
        if (value !== undefined) el.setAttribute('title', value);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (!key) return;
        const value = t(key, activeLang);
        if (value !== undefined) el.setAttribute('aria-label', value);
    });

    document.documentElement.lang = activeLang;

    // Notifica a otros módulos (ej. renderProducts, productCardHTML) que el
    // idioma cambió, para que puedan re-renderizar contenido dinámico.
    document.dispatchEvent(new CustomEvent('premvida:lang-changed', { detail: { lang: activeLang } }));
}

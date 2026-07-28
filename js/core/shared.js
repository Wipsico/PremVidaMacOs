/**
 * Prem Vida - Shared Core Module
 * Centraliza Supabase, Auth/RLS, health check, UI común y alertas.
 */

import { applyTranslations, getCurrentLang } from './i18n.js';

// ── Configuración Global ──────────────────────────────────────────────
const OFFICIAL_SUPABASE_URL = 'https://jifgfbcjkqzffvtxxktg.supabase.co';
const OFFICIAL_SUPABASE_KEY = 'sb_publishable_qupB57fCBXiY5fazSqAqrA_o1FVIjKp';
const PUBLIC_PAGES = ['login.html', 'tienda.html', 'index.html'];

const pathname = window.location.pathname;
const currentPage = pathname.split('/').pop() || 'index.html';
const isLoginPage = currentPage === 'login.html';
const isPublicPage = PUBLIC_PAGES.includes(currentPage);

// ── Normalización de Credenciales Supabase ───────────────────────────
let supabaseUrl = localStorage.getItem('supabaseUrl');
let supabaseKey = localStorage.getItem('supabaseKey');

if (supabaseUrl !== OFFICIAL_SUPABASE_URL || !supabaseKey) {
    supabaseUrl = OFFICIAL_SUPABASE_URL;
    supabaseKey = OFFICIAL_SUPABASE_KEY;
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    console.info('[Prem Vida] Supabase URL normalizada a producción.');
}

// ── Inicialización Única del Cliente Supabase ─────────────────────────
if (supabaseUrl && supabaseKey && typeof supabase !== 'undefined') {
    try {
        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true }
        });
    } catch (err) {
        window.supabaseClient = null;
        console.error('[shared.js] No se pudo inicializar Supabase.', err);
    }
} else {
    window.supabaseClient = null;
    console.warn('[shared.js] Supabase no está disponible. Modo degradado activo.');
}

// ── Funciones Utilitarias Exportables ─────────────────────────────────
export function bs(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
}

export function formatCurrency(val) {
    return `Bs. ${bs(val).toFixed(2)}`;
}

export function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// ── Ciclo de Vida Principal ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const authorized = await enforceAdminSession();
    if (!authorized && !isPublicPage) return;

    setupSharedUI();
    if (window.supabaseClient && authorized && !isLoginPage) {
        checkSupabaseConnection();
    }
});

// ── Guard de Autenticación y Rol ──────────────────────────────────────
async function enforceAdminSession() {
    if (isPublicPage) return true;

    if (!window.supabaseClient) {
        redirectToLogin('missing-client');
        return false;
    }

    try {
        const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();
        const session = sessionData?.session;
        if (sessionError || !session) {
            clearLegacyAuthState();
            redirectToLogin('missing-session');
            return false;
        }

        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('id, name, role, preferred_language')
            .eq('id', session.user.id)
            .in('role', ['admin', 'operator'])
            .single();

        if (profileError || !profile) {
            await window.supabaseClient.auth.signOut();
            clearLegacyAuthState();
            redirectToLogin('missing-profile');
            return false;
        }

        window.currentUserProfile = profile;
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userName', profile.name || session.user.email || 'Admin Prem Vida');
        if (profile.preferred_language && !localStorage.getItem('premvida_lang')) {
            localStorage.setItem('premvida_lang', profile.preferred_language);
        }
        localStorage.removeItem('isLoggedIn');
        return true;
    } catch (err) {
        console.error('[shared.js] Error validando sesión administrativa:', err);
        clearLegacyAuthState();
        redirectToLogin('auth-error');
        return false;
    }
}

function clearLegacyAuthState() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
}

function redirectToLogin(reason) {
    if (isLoginPage) return;
    const next = encodeURIComponent(currentPage || 'dashboard.html');
    window.location.href = `login.html?reason=${encodeURIComponent(reason)}&next=${next}`;
}

// ── Logout Seguro ─────────────────────────────────────────────────────
window.premVidaLogout = async function premVidaLogout() {
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (err) {
        console.warn('[shared.js] No se pudo cerrar sesión en Supabase:', err);
    } finally {
        clearLegacyAuthState();
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
};

// ── Health Check & Banners ────────────────────────────────────────────
async function checkSupabaseConnection() {
    try {
        const { error } = await window.supabaseClient.from('products').select('id').limit(1);
        if (error) {
            console.warn('[shared.js] Health check con error:', error.message);
            showSuspensionBanner();
        }
    } catch (err) {
        console.warn('[shared.js] Conexión fallida, se muestra banner de contingencia:', err);
        showSuspensionBanner();
    }
}

function showSuspensionBanner() {
    if (document.getElementById('supabase-suspension-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'supabase-suspension-banner';
    banner.className = 'w-full backdrop-blur-md border-b text-amber-200 px-6 py-3 text-center text-sm font-medium flex items-center justify-center gap-3 z-[100] sticky top-0';
    banner.style.cssText = 'background:rgba(120,80,0,0.88);border-bottom:1px solid rgba(245,158,11,0.4);';
    banner.innerHTML = `
        <span class="material-symbols-outlined text-lg text-amber-400">warning</span>
        <span><strong>Servidor sin respuesta:</strong> si el catálogo no carga, revisa Supabase o usa el respaldo offline.</span>
        <button type="button" id="btn-close-supabase-banner" class="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
    document.getElementById('btn-close-supabase-banner')?.addEventListener('click', () => banner.remove());
}

// ── Inicializador UI UI Compartida ───────────────────────────────────
function setupSharedUI() {
    if (typeof setupAvatarDropdown === 'function') setupAvatarDropdown();
    if (typeof setupActiveSidebarLink === 'function') setupActiveSidebarLink();
    if (typeof setupToastHelper === 'function') setupToastHelper();
    if (typeof setupNotificationBell === 'function') setupNotificationBell();
    if (typeof applyTranslations === 'function' && typeof getCurrentLang === 'function') {
        applyTranslations(getCurrentLang());
    }
}

// ── Helpers Internos de Sanear Texto ──────────────────────────────────
function safeEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Dropdown de Perfil y Avatar ────────────────────────────────────────
export function setupAvatarDropdown() {
    // 1. Buscamos el botón de avatar en el header
    const avatarBtn = document.querySelector('#avatar-btn, header img, .header img, [data-alt="Admin avatar"]');
    if (!avatarBtn) return;

    const avatarContainer = avatarBtn.parentElement;
    if (avatarContainer) {
        avatarContainer.classList.add('relative');
    }
    avatarBtn.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');

    // 2. Si el menú desplegable no existe aún en el DOM, lo creamos
    let dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) {
        const userName = localStorage.getItem('userName') || window.currentUserProfile?.name || 'Admin Prem Vida';
        const userRole = localStorage.getItem('userRole') || 'admin';
        
        dropdown = document.createElement('div');
        dropdown.id = 'profile-dropdown';
        dropdown.className = 'absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 shadow-2xl p-2 hidden z-[90]';
        dropdown.style.cssText = 'background:rgba(19,19,21,0.95);backdrop-filter:blur(24px);';
        dropdown.innerHTML = `
            <div class="px-4 py-3 border-b border-white/5 text-xs">
                <p class="font-semibold text-sm mb-0.5" style="color:#e5e1e4">${safeEscape(userName)}</p>
                <p class="truncate opacity-70" style="color:#bbcabf">${safeEscape(userRole)}</p>
            </div>
            <div class="p-1 space-y-1">
                <a href="settings.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/5" style="color:#bbcabf">
                    <span class="material-symbols-outlined text-lg">settings</span>
                    <span>Configuración</span>
                </a>
                <button id="btn-logout" type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm text-left transition-colors font-medium">
                    <span class="material-symbols-outlined text-lg">logout</span>
                    <span>Cerrar sesión</span>
                </button>
            </div>
        `;
        (avatarContainer || document.body).appendChild(dropdown);
    }

    // 3. Control de Apertura / Cierre
    avatarBtn.onclick = (event) => {
        event.stopPropagation();
        dropdown.classList.toggle('hidden');
    };

    dropdown.onclick = (event) => {
        event.stopPropagation();
    };

    document.onclick = (event) => {
        if (!dropdown.contains(event.target) && event.target !== avatarBtn) {
            dropdown.classList.add('hidden');
        }
    };

    // 4. Conexión del Botón Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof window.premVidaLogout === 'function') {
                window.premVidaLogout();
            } else {
                window.location.href = 'login.html';
            }
        };
    }
}

// ── Iluminación de Enlace Activo en Sidebar ────────────────────────────
export function setupActiveSidebarLink() {
    const navLinks = document.querySelectorAll('aside nav a');
    if (!navLinks.length) return;

    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || !window.location.pathname.includes(href)) return;
        
        navLinks.forEach((item) => {
            item.classList.remove('nav-active');
            const icon = item.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        });

        link.classList.add('nav-active');
        const activeIcon = link.querySelector('.material-symbols-outlined');
        if (activeIcon) activeIcon.style.fontVariationSettings = "'FILL' 1";
    });
}

// ── Notificaciones Toast Flotantes ─────────────────────────────────────
export function setupToastHelper() {
    window.showToast = function showToast(icon, message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMsg = document.getElementById('toast-message') || document.getElementById('toast-msg');
        if (!toast || !toastIcon || !toastMsg) return;

        toastIcon.textContent = icon;
        toastMsg.textContent = message;

        // Mostrar Toast limpiando transformaciones previas
        toast.classList.remove('translate-y-20', 'translate-y-24', 'translate-y-full', 'opacity-0', 'pointer-events-none');
        toast.classList.add('opacity-100', 'translate-y-0');

        toastIcon.className = 'material-symbols-outlined';
        if (type === 'error') toastIcon.classList.add('text-red-500');
        else if (type === 'warning') toastIcon.classList.add('text-amber-400');
        else if (type === 'info') toastIcon.classList.add('text-blue-400');
        else toastIcon.classList.add('text-primary');

        window.clearTimeout(window.__premVidaToastTimer);
        window.__premVidaToastTimer = window.setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
            toast.classList.remove('opacity-100', 'translate-y-0');
        }, 4200);
    };
}

// ── Función Helper para Sanitizar HTML ────────────────────────────────
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ── Campana de Notificaciones ──────────────────────────────────────────
export function setupNotificationBell() {
    const bellBtn = document.getElementById('btn-notifications');
    if (!bellBtn || bellBtn.dataset.bound === 'true') return;
    bellBtn.dataset.bound = 'true';
    
    const bellContainer = bellBtn.parentElement;
    if (bellContainer) {
        bellContainer.classList.add('relative');
    }

    // Crear el elemento badge (contador rojo)
    let badge = document.getElementById('notification-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'notification-badge';
        badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full hidden pointer-events-none z-10';
        (bellContainer || bellBtn).appendChild(badge);
    }

    // Consulta inicial para mostrar el badge
    fetchNotificationData().then(data => {
        const totalAlerts = data.lowStock.length + data.pendingOrders.length;
        if (totalAlerts > 0) {
            badge.textContent = totalAlerts > 9 ? '9+' : totalAlerts;
            badge.classList.remove('hidden');
        }
    });

    // Evento de clic en la campana
    bellBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await triggerNotificationAlerts(bellContainer || document.body);
    });
}

// ── Consulta de Notificaciones en Supabase ────────────────────────────
async function fetchNotificationData() {
    let lowStock = [];
    let pendingOrders = [];

    if (window.supabaseClient) {
        try {
            // Consultar productos con stock bajo (<= 5)
            const { data: stockData } = await window.supabaseClient
                .from('products')
                .select('id, name, stock')
                .lte('stock', 5)
                .order('stock', { ascending: true });
            
            // Consultar órdenes pendientes (espera_aprobacion)
            const { data: orderData } = await window.supabaseClient
                .from('orders')
                .select('id, code, total_amount, created_at')
                .eq('status', 'espera_aprobacion')
                .order('created_at', { ascending: false });

            lowStock = stockData || [];
            pendingOrders = orderData || [];
        } catch (err) {
            console.warn('[shared.js] Error al consultar notificaciones:', err);
        }
    }
    return { lowStock, pendingOrders };
}

// ── Disparador y Actualizador del Estado de Notificaciones ────────────
async function triggerNotificationAlerts(container) {
    const data = await fetchNotificationData();
    const totalAlerts = data.lowStock.length + data.pendingOrders.length;

    // Actualizar Badge
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (totalAlerts > 0) {
            badge.textContent = totalAlerts > 9 ? '9+' : totalAlerts;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (totalAlerts === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('check_circle', 'No hay notificaciones pendientes.', 'success');
        }
        const existingDropdown = document.getElementById('notifications-dropdown');
        if (existingDropdown) existingDropdown.classList.add('hidden');
        return;
    }

    showNotificationDropdown(container, data.lowStock, data.pendingOrders);
}

// ── Renderizado del Menú Desplegable de Notificaciones ───────────────
function showNotificationDropdown(container, lowStock, pendingOrders) {
    let dropdown = document.getElementById('notifications-dropdown');
    
    // Si ya existe, lo removemos para forzar el renderizado con datos actualizados
    if (dropdown) {
        const isHidden = dropdown.classList.contains('hidden');
        dropdown.remove();
        if (!isHidden) return; // Si estaba visible y presionan la campana, se cierra
    }

    const buildStockRows = () => lowStock.map(p => `
        <div class="flex items-center justify-between gap-3 py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded cursor-pointer transition-colors" onclick="window.location.href='inventory.html'">
            <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-amber-400 text-sm">inventory_2</span>
                <p class="text-xs font-semibold truncate text-white/90">${escapeHtml(p.name)}</p>
            </div>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'} whitespace-nowrap">
                Stock: ${p.stock}
            </span>
        </div>`).join('');

    const buildOrderRows = () => pendingOrders.map(o => `
        <div class="flex items-center justify-between gap-3 py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded cursor-pointer transition-colors" onclick="window.location.href='orders.html'">
            <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-blue-400 text-sm">shopping_cart</span>
                <div class="flex flex-col">
                    <p class="text-xs font-semibold text-white/90">Orden ${escapeHtml(o.code)}</p>
                    <p class="text-[10px] text-white/50">Bs. ${Number(o.total_amount).toFixed(2)}</p>
                </div>
            </div>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-400 whitespace-nowrap">Pendiente</span>
        </div>`).join('');

    dropdown = document.createElement('div');
    dropdown.id = 'notifications-dropdown';
    dropdown.className = 'absolute right-0 top-full mt-2 w-80 max-h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[90]';
    dropdown.style.cssText = 'background:rgba(19,19,21,0.95);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);';
    
    dropdown.innerHTML = `
        <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 class="font-bold text-sm text-white/90 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">notifications</span>
                Notificaciones
            </h3>
        </div>
        <div class="overflow-y-auto p-2 flex-1">
            ${lowStock.length > 0 ? `
                <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 mt-1">Alertas de Stock</p>
                ${buildStockRows()}
            ` : ''}
            ${pendingOrders.length > 0 ? `
                <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 mt-3">Órdenes Pendientes</p>
                ${buildOrderRows()}
            ` : ''}
        </div>
    `;

    container.appendChild(dropdown);

    // Detener propagación de clics dentro del dropdown
    dropdown.addEventListener('click', (event) => event.stopPropagation());

    // Cierre al hacer clic afuera (un único handler global)
    const closeHandler = (e) => {
        if (!container.contains(e.target)) {
            dropdown.classList.add('hidden');
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
}
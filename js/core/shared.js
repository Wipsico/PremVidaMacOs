/**
 * Prem Vida - Shared Core Module
 * Centraliza Supabase, Auth/RLS, health check, UI común y alertas.
 */

<<<<<<< HEAD
import { applyTranslations, getCurrentLang } from './i18n.js';

=======
// ✅ Agrega la 'f' extra después de jifg
>>>>>>> 654acb1 ( Trabajo 28/07/26)
const OFFICIAL_SUPABASE_URL = 'https://jifgfbcjkqzffvtxxktg.supabase.co';
const OFFICIAL_SUPABASE_KEY = 'sb_publishable_qupB57fCBXiY5fazSqAqrA_o1FVIjKp';
const PUBLIC_PAGES = ['login.html', 'tienda.html', 'index.html'];

const pathname = window.location.pathname;
const currentPage = pathname.split('/').pop() || 'index.html';
const isLoginPage = currentPage === 'login.html';
const isPublicPage = PUBLIC_PAGES.includes(currentPage);

let supabaseUrl = localStorage.getItem('supabaseUrl');
let supabaseKey = localStorage.getItem('supabaseKey');

<<<<<<< HEAD
if (supabaseUrl !== OFFICIAL_SUPABASE_URL || !supabaseKey) {
    supabaseUrl = OFFICIAL_SUPABASE_URL;
    supabaseKey = OFFICIAL_SUPABASE_KEY;
=======
const FALLBACK_URL = OFFICIAL_SUPABASE_URL;
const FALLBACK_KEY = OFFICIAL_SUPABASE_KEY;

if (supabaseUrl !== FALLBACK_URL || !supabaseKey) {
    supabaseUrl = FALLBACK_URL;
    supabaseKey = FALLBACK_KEY;
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    console.info('[Prem Vida] Supabase URL normalizada a produccion.');
}

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
    console.warn('[shared.js] Supabase no esta disponible. Modo degradado activo.');
}

if (supabaseUrl !== FALLBACK_URL) {
    supabaseUrl = FALLBACK_URL;
    supabaseKey = FALLBACK_KEY;
>>>>>>> 654acb1 ( Trabajo 28/07/26)
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    console.info('[Prem Vida] Supabase URL normalizada a producción.');
}

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

// Funciones utilitarias exportables
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

document.addEventListener('DOMContentLoaded', async () => {
    const authorized = await enforceAdminSession();
    if (!authorized && !isPublicPage) return;

    setupSharedUI();
    if (window.supabaseClient && authorized && !isLoginPage) {
        checkSupabaseConnection();
    }
});

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

window.premVidaLogout = async function premVidaLogout() {
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (err) {
        console.warn('[shared.js] No se pudo cerrar sesión en Supabase:', err);
    } finally {
        // Limpiamos todo el almacenamiento local para que no quede ninguna sesión activa
        clearLegacyAuthState();
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirigimos al login reemplazando el historial para evitar rebotes
        window.location.replace('login.html');
    }
};
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

function setupSharedUI() {
    setupAvatarDropdown();
    setupActiveSidebarLink();
    setupToastHelper();
    setupNotificationBell();
    applyTranslations(getCurrentLang());
}

function setupAvatarDropdown() {
    // Busca la imagen del avatar o cualquier botón de perfil en la cabecera
    const avatarBtn = document.querySelector('#avatar-btn, header img, .header img, [data-alt="Admin avatar"]');
    if (!avatarBtn) return;

    const avatarContainer = avatarBtn.parentElement;
    avatarContainer.classList.add('relative');
    avatarBtn.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');
    
    // Si ya existe el dropdown, solo aseguramos el evento
    let dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) {
        const userName = localStorage.getItem('userName') || window.currentUserProfile?.name || 'Admin Prem Vida';
        dropdown = document.createElement('div');
        dropdown.id = 'profile-dropdown';
        dropdown.className = 'absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 shadow-2xl p-2 hidden z-[90]';
        dropdown.style.cssText = 'background:rgba(19,19,21,0.95);backdrop-filter:blur(24px);';
        dropdown.innerHTML = `
            <div class="px-4 py-3 border-b border-white/5 text-xs">
                <p class="font-semibold text-sm mb-0.5" style="color:#e5e1e4">${escapeHtml(userName)}</p>
                <p class="truncate opacity-70" style="color:#bbcabf">${escapeHtml(localStorage.getItem('userRole') || 'admin')}</p>
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
        avatarContainer.appendChild(dropdown);
    }

    // Eventos del dropdown
    avatarBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    };

    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    dropdown.onclick = (e) => e.stopPropagation();

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = () => window.premVidaLogout();
    }
}

  function setupAvatarDropdown() {
    // 1. Buscamos cualquier elemento visual del perfil en la cabecera
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
                <p class="font-semibold text-sm mb-0.5" style="color:#e5e1e4">${escapeHtml(userName)}</p>
                <p class="truncate opacity-70" style="color:#bbcabf">${escapeHtml(userRole)}</p>
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

    // 3. Asignación directa con onclick
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

    // 4. Conectamos el botón de cerrar sesión
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            window.premVidaLogout();
        };
    }
}
function setupActiveSidebarLink() {
    const navLinks = document.querySelectorAll('aside nav a');
    navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || !window.location.pathname.includes(href)) return;
        navLinks.forEach((item) => {
            item.classList.remove('nav-active');
            const icon = item.querySelector('.material-symbols-outlined');
            if (icon) icon.style.variationSettings = "'FILL' 0";
        });
        link.classList.add('nav-active');
        const activeIcon = link.querySelector('.material-symbols-outlined');
        if (activeIcon) activeIcon.style.variationSettings = "'FILL' 1";
    });
}

function setupToastHelper() {
    window.showToast = function showToast(icon, message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMsg = document.getElementById('toast-message') || document.getElementById('toast-msg');
        if (!toast || !toastIcon || !toastMsg) return;

        toastIcon.textContent = icon;
        toastMsg.textContent = message;
        toast.classList.remove('translate-y-20', 'translate-y-24', 'opacity-0', 'pointer-events-none');
        toast.classList.add('opacity-100');
        toastIcon.className = 'material-symbols-outlined';
        if (type === 'error') toastIcon.classList.add('text-red-500');
        else if (type === 'warning') toastIcon.classList.add('text-amber-400');
        else if (type === 'info') toastIcon.classList.add('text-blue-400');
        else toastIcon.classList.add('text-primary');

        window.clearTimeout(window.__premVidaToastTimer);
        window.__premVidaToastTimer = window.setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
            toast.classList.remove('opacity-100');
        }, 4200);
    };
}

function setupNotificationBell() {
    const bellBtn = document.getElementById('btn-notifications');
    if (!bellBtn || bellBtn.dataset.bound === 'true') return;
    bellBtn.dataset.bound = 'true';
    
    const bellContainer = bellBtn.parentElement;
    bellContainer.classList.add('relative');

    // Create badge element
    const badge = document.createElement('span');
    badge.id = 'notification-badge';
    badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full hidden';
    bellContainer.appendChild(badge);

    // Initial fetch to show badge
    fetchNotificationData().then(data => {
        const totalAlerts = data.lowStock.length + data.pendingOrders.length;
        if (totalAlerts > 0) {
            badge.textContent = totalAlerts > 9 ? '9+' : totalAlerts;
            badge.classList.remove('hidden');
        }
    });

    bellBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await triggerNotificationAlerts(bellContainer);
    });
}

async function fetchNotificationData() {
    let lowStock = [];
    let pendingOrders = [];

    if (window.supabaseClient) {
        try {
            // Fetch low stock (<= 5)
            const { data: stockData } = await window.supabaseClient
                .from('products')
                .select('id, name, stock')
                .lte('stock', 5)
                .order('stock', { ascending: true });
            
            // Fetch pending orders (espera_aprobacion)
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

async function triggerNotificationAlerts(container) {
    const data = await fetchNotificationData();
    const totalAlerts = data.lowStock.length + data.pendingOrders.length;

    // Update badge
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
        window.showToast?.('check_circle', 'No hay notificaciones pendientes.', 'success');
        return;
    }

    showNotificationDropdown(container, data.lowStock, data.pendingOrders);
}

function showNotificationDropdown(container, lowStock, pendingOrders) {
    let dropdown = document.getElementById('notifications-dropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        return;
    }

    const buildStockRows = () => lowStock.map(p => `
        <div class="flex items-center justify-between gap-3 py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded cursor-pointer transition-colors" onclick="window.location.href='code.html'">
            <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-amber-400 text-sm">inventory_2</span>
                <p class="text-xs font-semibold truncate text-on-surface">${escapeHtml(p.name)}</p>
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
                    <p class="text-xs font-semibold text-on-surface">Orden ${escapeHtml(o.code)}</p>
                    <p class="text-[10px] text-on-surface-variant">Bs. ${Number(o.total_amount).toFixed(2)}</p>
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
            <h3 class="font-bold text-sm text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">notifications</span>
                Notificaciones
            </h3>
        </div>
        <div class="overflow-y-auto p-2 flex-1">
            ${lowStock.length > 0 ? `
                <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-1 mt-1">Alertas de Stock</p>
                ${buildStockRows()}
            ` : ''}
            ${pendingOrders.length > 0 ? `
                <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-1 mt-3">Órdenes Pendientes</p>
                ${buildOrderRows()}
            ` : ''}
        </div>
    `;

    container.appendChild(dropdown);

    // Cierre click fuera
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    dropdown.addEventListener('click', (event) => event.stopPropagation());
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
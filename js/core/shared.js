/**
 * Prem Vida - Shared Core Module
 * Centraliza Supabase, Auth/RLS, health check, UI comun y alertas.
 */

const OFFICIAL_SUPABASE_URL = 'https://jifgfbcjkqzffvtxxktg.supabase.co';
const OFFICIAL_SUPABASE_KEY = 'sb_publishable_qupB57fCBXiY5fazSqAqrA_o1FVIjKp';
const PUBLIC_PAGES = ['login.html', 'tienda.html', 'index.html'];

const pathname = window.location.pathname;
const currentPage = pathname.split('/').pop() || 'index.html';
const isLoginPage = currentPage === 'login.html';
const isPublicPage = PUBLIC_PAGES.includes(currentPage);

let supabaseUrl = localStorage.getItem('supabaseUrl');
let supabaseKey = localStorage.getItem('supabaseKey');

if (supabaseUrl !== OFFICIAL_SUPABASE_URL || !supabaseKey) {
    supabaseUrl = OFFICIAL_SUPABASE_URL;
    supabaseKey = OFFICIAL_SUPABASE_KEY;
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
        console.error('[shared.js] Error validando sesion administrativa:', err);
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
        if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    } catch (err) {
        console.warn('[shared.js] No se pudo cerrar sesion en Supabase:', err);
    } finally {
        clearLegacyAuthState();
        window.location.href = 'login.html';
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
        console.warn('[shared.js] Conexion fallida, se muestra banner de contingencia:', err);
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
        <span><strong>Servidor sin respuesta:</strong> si el catalogo no carga, revisa Supabase o usa el respaldo offline.</span>
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
}

function setupAvatarDropdown() {
    const avatarBtn = document.querySelector('#avatar-btn, .header img, [data-alt="Admin avatar"]');
    if (!avatarBtn) return;

    const avatarContainer = avatarBtn.parentElement;
    avatarContainer.classList.add('relative');
    avatarBtn.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');

    if (!document.getElementById('profile-dropdown')) {
        const userName = localStorage.getItem('userName') || window.currentUserProfile?.name || 'Admin Prem Vida';
        const dropdown = document.createElement('div');
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
                    <span>Configuracion</span>
                </a>
                <button id="btn-logout" type="button" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm text-left transition-colors font-medium">
                    <span class="material-symbols-outlined text-lg">logout</span>
                    <span>Cerrar sesion</span>
                </button>
            </div>
        `;
        avatarContainer.appendChild(dropdown);
    }

    const dropdown = document.getElementById('profile-dropdown');
    avatarBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    dropdown.addEventListener('click', (event) => event.stopPropagation());
    document.getElementById('btn-logout')?.addEventListener('click', () => window.premVidaLogout());
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
    bellBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await triggerExpiryAlerts();
    });
}

async function triggerExpiryAlerts() {
    const adminEmail = 'admin@premvida.com';
    const today = new Date();
    const alertDate = new Date(today);
    alertDate.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const alertDateStr = alertDate.toISOString().split('T')[0];
    let expiringSoon = [];
    let alreadyExpired = [];

    if (window.supabaseClient) {
        try {
            const { data: soon } = await window.supabaseClient
                .from('products')
                .select('id, name, category, expiry_date, price, stock')
                .not('expiry_date', 'is', null)
                .gte('expiry_date', todayStr)
                .lte('expiry_date', alertDateStr)
                .order('expiry_date', { ascending: true });

            const { data: expired } = await window.supabaseClient
                .from('products')
                .select('id, name, category, expiry_date, price, stock')
                .not('expiry_date', 'is', null)
                .lt('expiry_date', todayStr)
                .gt('stock', 0)
                .order('expiry_date', { ascending: true });

            expiringSoon = soon || [];
            alreadyExpired = expired || [];
        } catch (err) {
            console.warn('[shared.js] No se pudieron consultar alertas de vencimiento:', err);
        }
    }

    const totalAlerts = expiringSoon.length + alreadyExpired.length;
    console.group(`[Prem Vida] Reporte de alertas -> ${adminEmail}`);
    console.log(`Fecha: ${new Date().toLocaleString('es-BO')}`);
    console.log(`Vencidos con stock: ${alreadyExpired.length}`);
    console.log(`Por vencer en 7 dias: ${expiringSoon.length}`);
    console.groupEnd();

    if (totalAlerts === 0) {
        window.showToast?.('check_circle', 'Sin alertas de vencimiento en los proximos 7 dias.', 'success');
        return;
    }

    window.showToast?.('warning', `${totalAlerts} alerta(s) de vencimiento. Reporte generado.`, 'warning');
    showBellAlertModal(alreadyExpired, expiringSoon);
}

function showBellAlertModal(expired, expiringSoon) {
    document.getElementById('modal-bell-alerts')?.remove();

    const rows = [...expired, ...expiringSoon].map((product) => {
        const price = Math.round((Number(product.price) || 0) * 100) / 100;
        const remate = Math.round(price * 0.7 * 100) / 100;
        const days = Math.ceil((new Date(product.expiry_date) - new Date()) / 86400000);
        const badge = days < 0
            ? '<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-400">VENCIDO</span>'
            : `<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300">Vence en ${days}d</span>`;

        return `
            <div class="flex items-center justify-between gap-3 py-2.5 border-b border-white/5">
                <div class="min-w-0">
                    <p class="text-xs font-semibold truncate" style="color:#e5e1e4">${escapeHtml(product.name)}</p>
                    <p class="text-[10px]" style="color:#bbcabf">${escapeHtml(product.category || 'Sin categoria')} - Stock: ${Number(product.stock) || 0}</p>
                </div>
                <div class="text-right shrink-0 space-y-1">
                    ${badge}
                    <p class="text-[10px] font-bold" style="color:#4edea3">Bs. ${remate.toFixed(2)} remate</p>
                </div>
            </div>`;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'modal-bell-alerts';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center';
    modal.style.cssText = 'background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);';
    modal.innerHTML = `
        <div class="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
             style="background:rgba(19,19,21,0.96);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.15);">
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 class="font-bold text-base flex items-center gap-2" style="color:#e5e1e4">
                    <span class="material-symbols-outlined text-amber-400">notifications_active</span>
                    Alertas de merma
                </h3>
                <button id="btn-close-bell-modal" type="button" class="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                    <span class="material-symbols-outlined text-sm" style="color:#bbcabf">close</span>
                </button>
            </div>
            <p class="text-xs" style="color:#bbcabf">Reporte local generado para revision administrativa.</p>
            <div class="max-h-72 overflow-y-auto pr-1">${rows}</div>
            <button id="btn-dismiss-bell-modal" type="button" class="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style="background:#4edea3;color:#003824;box-shadow:0 8px 24px rgba(78,222,163,0.2)">
                Gestionar inventario
            </button>
        </div>`;

    document.body.appendChild(modal);
    document.getElementById('btn-close-bell-modal')?.addEventListener('click', () => modal.remove());
    document.getElementById('btn-dismiss-bell-modal')?.addEventListener('click', () => {
        modal.remove();
        window.location.href = 'code.html';
    });
    modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.remove();
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

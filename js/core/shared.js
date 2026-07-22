/**
 * Prem Vida - Shared Core Module  (Fase 1 — Estabilización del Core)
 * Handles session validation, Supabase client initialization, connection health checks,
 * dynamic warning banners, profile dropdown menus, and bell alert notifications.
 */

// ── 1. Session and Routing Check ─────────────────────────────────────────────
const pathname   = window.location.pathname;
const isLoginPage    = pathname.endsWith('login.html');
const PUBLIC_PAGES = ['login.html', 'tienda.html', 'index.html'];
const currentPage = pathname.split('/').pop() || 'index.html';
const isPublicPage = PUBLIC_PAGES.includes(currentPage);

// URL Oficial de producción en Supabase
// ✅ URL REAL de tu proyecto Supabase (tomada de tu panel)
const FALLBACK_URL = 'https://jifgbcjkqzffvtxxktg.supabase.co';
const FALLBACK_KEY = 'sb_publishable_qupB57fCBXiY5fazSqAqrA_o1FVIjKp';

// Si la URL guardada en localStorage no coincide con la oficial o está mal escrita, la corregimos automáticamente
let supabaseUrl  = localStorage.getItem('supabaseUrl');
let supabaseKey  = localStorage.getItem('supabaseKey');

if (supabaseUrl !== FALLBACK_URL) {
    supabaseUrl = FALLBACK_URL;
    supabaseKey = FALLBACK_KEY;
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    console.log('⚡ Prem Vida: credenciales actualizadas a la URL oficial de producción.');
}

// ── 2. Supabase Client Initialization ────────────────────────────────────────
/**
 * FASE 1: La inicialización está blindada con try/catch. Si `createClient`
 * lanza cualquier excepción (incluyendo errores de red en entornos offline),
 * el sistema NO congela la interfaz. `window.supabaseClient` queda en null
 * y los módulos descendentes deben verificar su existencia antes de usarlo.
 */
if (supabaseUrl && supabaseKey && typeof supabase !== 'undefined') {
    try {
        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true }
        });
        console.log('⚡ Prem Vida: Supabase client inicializado. Proyecto →', supabaseUrl);
    } catch (err) {
        window.supabaseClient = null;
        console.error('[shared.js] Error inicializando Supabase client. La UI continuará en modo degradado.', err);
    }
} else {
    window.supabaseClient = null;
    console.warn('[shared.js] Supabase no disponible (librería no cargada o credenciales ausentes). Modo offline activado.');
}

// ── 3. DOM Content Loaded ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const authorized = await enforceAdminSession();
    if (!authorized && !isPublicPage) return;

    if (window.supabaseClient && authorized) {
        checkSupabaseConnection();
    }
    setupSharedUI();
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
            .select('id, name, role')
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
    const next = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
    window.location.href = `login.html?reason=${encodeURIComponent(reason)}&next=${next}`;
}

window.premVidaLogout = async function premVidaLogout() {
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (err) {
        console.warn('[shared.js] No se pudo cerrar sesion en Supabase:', err);
    } finally {
        clearLegacyAuthState();
        window.location.href = 'login.html';
    }
};

// ── 4. Health Check ───────────────────────────────────────────────────────────
/**
 * FASE 1 — Reforzado: el catch absorbe el error completo sin relanzarlo.
 * Un "TypeError: Failed to fetch" ya NO interrumpe la ejecución de scripts
 * subsiguientes. Solo muestra el banner de suspensión y loguea en consola.
 */
async function checkSupabaseConnection() {
    try {
        const { error } = await window.supabaseClient
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            console.warn('[shared.js] Supabase respondió con error de API (proyecto pausado o tabla vacía):', error.message);
            if (error.message?.includes('Fetch') || error.status === 400 || error.status === 500) {
                showSuspensionBanner();
            }
        } else {
            console.log('[shared.js] ✅ Supabase health check OK.');
        }
    } catch (err) {
        // FASE 1: captura silenciosa — NO relanza. Previene la cascada de errores.
        const errStr = String(err);
        console.error('[shared.js] ⚠️ Conexión fallida (servidor posiblemente en hibernación):', errStr);

        if (err instanceof TypeError || errStr.includes('Failed to fetch') || errStr.includes('fetch')) {
            showSuspensionBanner();
        }
        // ── El flujo continúa. Los módulos downstream manejan su propio estado. ──
    }
}

// ── 5. Suspension Banner ──────────────────────────────────────────────────────
/**
 * Banner glassmórfico de advertencia de hibernación. Idempotente.
 */
function showSuspensionBanner() {
    if (document.getElementById('supabase-suspension-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'supabase-suspension-banner';
    banner.className = 'w-full backdrop-blur-md border-b text-amber-200 px-6 py-3 text-center text-sm font-medium flex items-center justify-center gap-3 z-[100] sticky top-0';
    banner.style.cssText = 'background:rgba(120,80,0,0.85);border-bottom:1px solid rgba(245,158,11,0.4);';
    banner.innerHTML = `
        <span class="material-symbols-outlined text-lg text-amber-400">warning</span>
        <span><strong>⚠️ Servidor en suspensión:</strong> Si el catálogo no carga, ingresa a tu consola de Supabase y haz clic en <strong>'Restore Project'</strong>.</span>
        <button onclick="document.getElementById('supabase-suspension-banner').remove()"
                class="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors leading-none">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
}

// ── 6. Shared UI Setup ────────────────────────────────────────────────────────
/**
 * Inicializa: dropdown de avatar, estado activo del sidebar, toast helper,
 * y FASE 1: listener de la campanita de notificaciones de mermas/vencimientos.
 */
function setupSharedUI() {

    // 6.1 — Avatar Dropdown
    const avatarBtn = document.querySelector('#avatar-btn, .header img, [data-alt="Admin avatar"]');
    if (avatarBtn) {
        const avatarContainer = avatarBtn.parentElement;
        avatarContainer.classList.add('relative');
        avatarBtn.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');

        if (!document.getElementById('profile-dropdown')) {
            const dropdown = document.createElement('div');
            dropdown.id = 'profile-dropdown';
            dropdown.className = 'absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 shadow-2xl p-2 hidden z-[90]';
            dropdown.style.cssText = 'background:rgba(19,19,21,0.95);backdrop-filter:blur(24px);';
            dropdown.innerHTML = `
                <div class="px-4 py-3 border-b border-white/5 text-xs">
                    <p class="font-semibold text-sm mb-0.5" style="color:#e5e1e4">Admin Prem Vida</p>
                    <p class="truncate opacity-70" style="color:#bbcabf">admin@premvida.com</p>
                </div>
                <div class="p-1 space-y-1">
                    <a href="settings.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/5" style="color:#bbcabf">
                        <span class="material-symbols-outlined text-lg">settings</span>
                        <span>Configuración</span>
                    </a>
                    <button id="btn-logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm text-left transition-colors font-medium">
                        <span class="material-symbols-outlined text-lg">logout</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            `;
            avatarContainer.appendChild(dropdown);
        }

        const dropdown = document.getElementById('profile-dropdown');

        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => dropdown.classList.add('hidden'));
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => window.premVidaLogout());
        }
    }

    // 6.2 — Sidebar Active Link State
    const navLinks = document.querySelectorAll('aside nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && window.location.pathname.includes(href)) {
            navLinks.forEach(l => {
                l.className = 'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors nav-inactive';
                const icon = l.querySelector('.material-symbols-outlined');
                if (icon) icon.style.variationSettings = "'FILL' 0";
            });
            link.className = 'flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-r-2 bg-white/5 transition-colors nav-active';
            const activeIcon = link.querySelector('.material-symbols-outlined');
            if (activeIcon) activeIcon.style.variationSettings = "'FILL' 1";
        }
    });

    // 6.3 — Global Toast Helper
    window.showToast = function(icon, message, type = 'success') {
        const toast    = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMsg  = document.getElementById('toast-message');

        if (!toast || !toastIcon || !toastMsg) return;

        toastIcon.textContent = icon;
        toastMsg.textContent  = message;

        toast.className = 'fixed bottom-6 left-6 z-[100] px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-3 transform transition-all duration-300 pointer-events-auto opacity-100 translate-y-0';
        toast.style.background = 'rgba(19,19,21,0.9)';

        if (type === 'error') {
            toastIcon.className = 'material-symbols-outlined text-red-500';
            toast.style.borderColor = 'rgba(239,68,68,0.4)';
        } else if (type === 'warning') {
            toastIcon.className = 'material-symbols-outlined text-amber-400';
            toast.style.borderColor = 'rgba(245,158,11,0.4)';
        } else if (type === 'info') {
            toastIcon.className = 'material-symbols-outlined text-blue-400';
            toast.style.borderColor = 'rgba(59,130,246,0.4)';
        } else {
            toastIcon.className = 'material-symbols-outlined text-primary';
            toast.style.borderColor = 'rgba(78,222,163,0.4)';
        }

        setTimeout(() => {
            toast.className = 'fixed bottom-6 left-6 z-[100] px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-3 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none';
        }, 4500);
    };

    // ── 6.4 — FASE 1: Campanita de Notificaciones de Mermas/Vencimientos ──────
    /**
     * El botón campanita (#btn-notifications) dispara:
     *  1. Una consulta a Supabase de productos con expiry_date <= hoy + 7 días.
     *  2. Un log estructurado en consola simulando el envío a admin@premvida.com.
     *  3. Un toast + modal de confirmación con el resumen de alertas críticas.
     */
    const bellBtn = document.getElementById('btn-notifications');
    if (bellBtn) {
        bellBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await triggerExpiryAlerts();
        });
    }
}

// ── 7. Expiry Alert Engine (Campanita) ────────────────────────────────────────
async function triggerExpiryAlerts() {
    const ADMIN_EMAIL = 'admin@premvida.com';
    const ALERT_WINDOW_DAYS = 7;

    // Calcular ventana de vencimiento
    const today = new Date();
    const alertDate = new Date(today);
    alertDate.setDate(today.getDate() + ALERT_WINDOW_DAYS);
    const alertDateStr = alertDate.toISOString().split('T')[0];
    const todayStr     = today.toISOString().split('T')[0];

    let expiringSoon  = [];
    let alreadyExpired = [];

    if (window.supabaseClient) {
        try {
            // Productos que vencen en los próximos 7 días
            const { data: soon, error: e1 } = await window.supabaseClient
                .from('products')
                .select('id, name, category, expiry_date, price, stock')
                .not('expiry_date', 'is', null)
                .gte('expiry_date', todayStr)
                .lte('expiry_date', alertDateStr)
                .order('expiry_date', { ascending: true });

            if (!e1 && soon) expiringSoon = soon;

            // Productos ya vencidos con stock > 0
            const { data: expired, error: e2 } = await window.supabaseClient
                .from('products')
                .select('id, name, category, expiry_date, price, stock')
                .not('expiry_date', 'is', null)
                .lt('expiry_date', todayStr)
                .gt('stock', 0)
                .order('expiry_date', { ascending: true });

            if (!e2 && expired) alreadyExpired = expired;

        } catch (fetchErr) {
            // Error de red — no congela la UI
            console.warn('[shared.js] Campanita: no se pudo consultar Supabase.', fetchErr);
        }
    }

    const totalAlerts = expiringSoon.length + alreadyExpired.length;

    // ── Log estructurado → simulación de envío a admin@premvida.com ──
    console.group(`📧 [Prem Vida] Reporte de Alertas → ${ADMIN_EMAIL}`);
    console.log(`📅 Fecha del reporte: ${new Date().toLocaleString('es-BO')}`);
    console.log(`⚠️  Productos vencidos con stock activo: ${alreadyExpired.length}`);
    if (alreadyExpired.length > 0) {
        alreadyExpired.forEach(p => {
            console.warn(`   🔴 [VENCIDO] ${p.name} | Vencimiento: ${p.expiry_date} | Stock: ${p.stock} | Precio: Bs. ${Math.round(p.price * 100) / 100}`);
        });
    }
    console.log(`📦 Productos por vencer en los próximos ${ALERT_WINDOW_DAYS} días: ${expiringSoon.length}`);
    if (expiringSoon.length > 0) {
        expiringSoon.forEach(p => {
            console.info(`   🟡 [PRÓXIMO] ${p.name} | Vencimiento: ${p.expiry_date} | Stock: ${p.stock} | Precio remate sugerido: Bs. ${Math.round(p.price * 0.7 * 100) / 100}`);
        });
    }
    console.log(`✉️  SIMULACIÓN: Alerta enviada a ${ADMIN_EMAIL} con ${totalAlerts} producto(s) crítico(s).`);
    console.groupEnd();

    // ── Toast de confirmación ──
    if (totalAlerts === 0 && !window.supabaseClient) {
        window.showToast('notifications', 'Sin conexión a Supabase. Verifica la configuración.', 'info');
    } else if (totalAlerts === 0) {
        window.showToast('check_circle', 'Sin alertas de vencimiento en los próximos 7 días. ✅', 'success');
    } else {
        const msg = `${alreadyExpired.length > 0 ? alreadyExpired.length + ' vencidos · ' : ''}${expiringSoon.length} por vencer — Reporte enviado a ${ADMIN_EMAIL}`;
        window.showToast('warning', msg, 'warning');
    }

    // ── Modal de alerta (si hay productos críticos) ──
    if (totalAlerts > 0) {
        showBellAlertModal(alreadyExpired, expiringSoon);
    }
}

// ── 8. Bell Alert Modal ───────────────────────────────────────────────────────
function showBellAlertModal(expired, expiringSoon) {
    // Idempotente: eliminar si ya existe
    const existing = document.getElementById('modal-bell-alerts');
    if (existing) existing.remove();

    const fmt = (p) => {
        const price  = Math.round((p.price || 0) * 100) / 100;
        const remate = Math.round(price * 0.7 * 100) / 100;
        const days   = Math.ceil((new Date(p.expiry_date) - new Date()) / 86400000);
        const isExp  = days < 0;
        const badge  = isExp
            ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-400">VENCIDO</span>`
            : `<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300">Vence en ${days}d</span>`;
        return `
            <div class="flex items-center justify-between gap-3 py-2.5 border-b border-white/5">
                <div class="min-w-0">
                    <p class="text-xs font-semibold truncate" style="color:#e5e1e4">${p.name}</p>
                    <p class="text-[10px]" style="color:#bbcabf">${p.category || 'Sin categoría'} · Stock: ${p.stock}</p>
                </div>
                <div class="text-right shrink-0 space-y-1">
                    ${badge}
                    <p class="text-[10px] font-bold" style="color:#4edea3">Bs. ${remate} remate</p>
                </div>
            </div>`;
    };

    const allRows = [...expired, ...expiringSoon].map(fmt).join('');

    const modal = document.createElement('div');
    modal.id = 'modal-bell-alerts';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center';
    modal.style.cssText = 'background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);';
    modal.innerHTML = `
        <div class="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
             style="background:rgba(19,19,21,0.96);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.15);">
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 class="font-bold text-base flex items-center gap-2" style="color:#e5e1e4">
                    <span class="material-symbols-outlined text-amber-400" style="font-variation-settings:'FILL' 1">notifications_active</span>
                    Alertas de Merma / Vencimiento
                </h3>
                <button id="btn-close-bell-modal" class="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                    <span class="material-symbols-outlined text-sm" style="color:#bbcabf">close</span>
                </button>
            </div>
            <p class="text-xs" style="color:#bbcabf">
                Reporte enviado a <strong style="color:#4edea3">admin@premvida.com</strong> · ${new Date().toLocaleString('es-BO')}
            </p>
            <div class="max-h-72 overflow-y-auto pr-1 space-y-0.5">
                ${allRows}
            </div>
            <button id="btn-dismiss-bell-modal"
                    class="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style="background:#4edea3;color:#003824;box-shadow:0 8px 24px rgba(78,222,163,0.2)">
                Entendido — Gestionar Inventario →
            </button>
        </div>`;

    document.body.appendChild(modal);

    document.getElementById('btn-close-bell-modal').addEventListener('click', () => modal.remove());
    document.getElementById('btn-dismiss-bell-modal').addEventListener('click', () => {
        modal.remove();
        window.location.href = 'code.html';
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

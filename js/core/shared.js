/**
 * Prem Vida - Shared Core Module
 * Handles session validation, Supabase client initialization, connection health checks,
 * dynamic warning banners, and profile dropdown menus.
 */

// 1. Session and Routing Check
const pathname = window.location.pathname;
const isLoginPage = pathname.endsWith('login.html');
const isSettingsPage = pathname.endsWith('settings.html');

const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
const supabaseUrl = localStorage.getItem('supabaseUrl');
const supabaseKey = localStorage.getItem('supabaseKey');

if (!isLoggedIn && !isLoginPage) {
    window.location.href = 'login.html';
}

if (isLoggedIn && !supabaseUrl && !supabaseKey && !isSettingsPage && !isLoginPage) {
    window.location.href = 'settings.html';
}

// 2. Supabase Client Initialization
if (supabaseUrl && supabaseKey && typeof supabase !== 'undefined') {
    try {
        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.error('Error initializing Supabase client:', err);
    }
}

// Run on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    // 3. Health Check for Supabase (Anti-Hibernation Banner)
    if (window.supabaseClient) {
        checkSupabaseConnection();
    }

    // 4. Setup Global UI elements (Dropdowns, Logout, Maintenance)
    setupSharedUI();
});

/**
 * Validates the connection to Supabase and handles hibernated states.
 */
async function checkSupabaseConnection() {
    try {
        // Tries a fast lightweight query to check if connection responds
        const { error } = await window.supabaseClient.from('products').select('id').limit(1);
        if (error) {
            console.warn('Supabase returned an API error, project might be paused or empty:', error.message);
            // If it's a connection or authentication issue
            if (error.message.includes('Fetch') || error.status === 400 || error.status === 500) {
                showSuspensionBanner();
            }
        }
    } catch (err) {
        console.error('Connection health check failed:', err);
        // "TypeError: Failed to fetch" is caught here when server is sleeping/hibernate
        if (err instanceof TypeError || String(err).includes('Failed to fetch') || String(err).includes('fetch')) {
            showSuspensionBanner();
        }
    }
}

/**
 * Creates and displays a premium Glassmorphic warning banner at the top of the viewport.
 */
function showSuspensionBanner() {
    if (document.getElementById('supabase-suspension-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'supabase-suspension-banner';
    // Style as a premium Glassmorphic amber warning banner
    banner.className = 'w-full bg-amber-500/20 backdrop-blur-md border-b border-amber-500/30 text-amber-200 px-6 py-3 text-center text-sm font-medium flex items-center justify-center gap-3 z-[100] sticky top-0 animate-in slide-in-from-top duration-300';
    banner.innerHTML = `
        <span class="material-symbols-outlined text-lg text-amber-400">warning</span>
        <span><strong>⚠️ Servidor en suspensión:</strong> Si el catálogo no carga, por favor ingresa a tu consola de Supabase y dale a <strong>'Restore Project'</strong>.</span>
        <button onclick="document.getElementById('supabase-suspension-banner').remove()" class="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors leading-none">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;
    
    // Insert banner as the very first element in the body
    document.body.insertBefore(banner, document.body.firstChild);
}

/**
 * Initializes shared dropdown menus, logout handlers, and Toast notifications.
 */
function setupSharedUI() {
    // 1. User Profile Dropdown Toggle
    const avatarBtn = document.querySelector('.header img, [data-alt="Admin avatar"]');
    if (avatarBtn) {
        // Find or create dropdown
        const avatarContainer = avatarBtn.parentElement;
        avatarContainer.classList.add('relative');
        avatarBtn.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');

        // Create Dropdown Menu
        const dropdown = document.createElement('div');
        dropdown.id = 'profile-dropdown';
        dropdown.className = 'absolute right-0 mt-3 w-56 rounded-2xl glass-modal border border-white/10 shadow-2xl p-2 hidden z-[90]';
        dropdown.innerHTML = `
            <div class="px-4 py-3 border-b border-white/5 text-xs text-on-surface-variant">
                <p class="font-semibold text-on-surface text-sm mb-0.5">Admin Prem Vida</p>
                <p class="truncate opacity-70">admin@premvida.com</p>
            </div>
            <div class="p-1 space-y-1">
                <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 text-sm transition-colors">
                    <span class="material-symbols-outlined text-lg">person</span>
                    <span>Ver Perfil / Mi Cuenta</span>
                </a>
                <a href="settings.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 text-sm transition-colors">
                    <span class="material-symbols-outlined text-lg">settings</span>
                    <span>Configuración</span>
                </a>
                <button id="btn-logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm text-left transition-colors font-medium">
                    <span class="material-symbols-outlined text-lg">logout</span>
                    <span>Cerrar Sesión (Logout)</span>
                </button>
            </div>
        `;
        avatarContainer.appendChild(dropdown);

        // Toggle visibility
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Close on click outside
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });
        
        dropdown.addEventListener('click', (e) => e.stopPropagation());

        // Logout action
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            });
        }
    }

    // 2. Sidebar Link Active states based on pathname
    const navLinks = document.querySelectorAll('aside nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && window.location.pathname.includes(href)) {
            // Remove active classes from all links
            navLinks.forEach(l => {
                l.className = 'flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-white/5 transition-colors';
                const icon = l.querySelector('.material-symbols-outlined');
                if (icon) icon.style.variationSettings = "'FILL' 0";
            });
            // Set active class on matching link
            link.className = 'flex items-center gap-3 px-4 py-3 rounded-xl text-primary font-bold border-r-2 border-primary bg-white/5 transition-colors';
            const activeIcon = link.querySelector('.material-symbols-outlined');
            if (activeIcon) activeIcon.style.variationSettings = "'FILL' 1";
        }
    });

    // 3. Global Toast Notifications Helper
    window.showToast = function(icon, message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMsg = document.getElementById('toast-message');
        
        if (!toast || !toastIcon || !toastMsg) return;

        toastIcon.textContent = icon;
        toastMsg.textContent = message;

        // Custom borders/colors based on type
        toast.className = 'fixed bottom-6 left-6 z-[100] px-5 py-4 rounded-xl bg-surface/90 border border-white/15 shadow-2xl backdrop-blur-md flex items-center gap-3 transform transition-all duration-300 pointer-events-auto opacity-100 translate-y-0';
        
        if (type === 'error') {
            toastIcon.className = 'material-symbols-outlined text-red-500';
            toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        } else if (type === 'warning') {
            toastIcon.className = 'material-symbols-outlined text-amber-500';
            toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        } else if (type === 'info') {
            toastIcon.className = 'material-symbols-outlined text-blue-400';
            toast.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        } else {
            toastIcon.className = 'material-symbols-outlined text-primary';
            toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        }

        // Hide after 4 seconds
        setTimeout(() => {
            toast.className = 'fixed bottom-6 left-6 z-[100] px-5 py-4 rounded-xl bg-surface/90 border border-white/15 shadow-2xl backdrop-blur-md flex items-center gap-3 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none';
        }, 4000);
    };
}

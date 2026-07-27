/**
 * Prem Vida — Settings & Audit Logic Module (Fase 4)
 * ES6 Module. Manages system parameters and audit stream rendering.
 *
 * Currency  : Bolivianos (Bs.) — Bolivia
 * Rounding  : Math.round(val * 100) / 100
 * Storage   : System settings → localStorage plus optional Supabase table sync
 */

export const bs = (val) => Math.round((parseFloat(val) || 0) * 100) / 100;

const SETTINGS_KEY = 'premvida_system_settings';
export const LANGUAGE_KEY = 'premvida_lang';
const DEFAULT_SETTINGS = {
    stock_alert_threshold: 5,
    bonus_multiplier: 1.0,
    delivery_fee_bs: 15.0,
    store_name: 'Prem Vida',
    whatsapp_number: '',
    preferred_language: 'es',
    maintenance_mode: false,
    last_updated: null,
};

const SUPABASE_SETTING_TABLES = ['store_settings', 'system_settings', 'app_settings', 'settings'];
// Tabla real de producción confirmada: singleton, RLS (SELECT público / UPDATE solo
// autenticados) y con Realtime ya habilitado en supabase_realtime.
const PRIMARY_SETTINGS_TABLE = 'store_settings';

function getLocalSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const saved = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...saved };
    } catch (error) {
        console.warn('[settings-logic] No se pudieron leer las preferencias locales:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

function persistLocalSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.preferred_language) {
        localStorage.setItem(LANGUAGE_KEY, settings.preferred_language);
    }
    return settings;
}

async function trySupabaseSettingsSync(supabase, settings) {
    if (!supabase) return settings;

    // Tabla real de producción (store_settings): fila singleton. Se busca su id
    // real primero (no se asume 'global' ni un UUID fijo) y se actualiza por id;
    // si aún no existe ninguna fila, se inserta la primera.
    try {
        const { data: existing, error: selectError } = await supabase
            .from(PRIMARY_SETTINGS_TABLE)
            .select('id')
            .limit(1)
            .maybeSingle();

        if (!selectError) {
            if (existing?.id) {
                const { error: updateError } = await supabase
                    .from(PRIMARY_SETTINGS_TABLE)
                    .update(settings)
                    .eq('id', existing.id);
                if (!updateError) return settings;
                console.warn(`[settings-logic] No se pudo actualizar ${PRIMARY_SETTINGS_TABLE}:`, updateError);
            } else {
                const { error: insertError } = await supabase
                    .from(PRIMARY_SETTINGS_TABLE)
                    .insert(settings);
                if (!insertError) return settings;
                console.warn(`[settings-logic] No se pudo crear la fila inicial de ${PRIMARY_SETTINGS_TABLE}:`, insertError);
            }
        }
    } catch (error) {
        console.warn(`[settings-logic] ${PRIMARY_SETTINGS_TABLE} no está disponible para sincronización:`, error);
    }

    // Fallback legado: intenta tablas alternativas con upsert genérico por id='global'
    // (compatibilidad con instalaciones antiguas que no usan store_settings).
    for (const table of SUPABASE_SETTING_TABLES.filter((t) => t !== PRIMARY_SETTINGS_TABLE)) {
        try {
            const payload = {
                id: 'global',
                ...settings,
            };
            const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
            if (!error) return settings;
        } catch (error) {
            console.warn(`[settings-logic] ${table} no está disponible para sincronización:`, error);
        }
    }

    return settings;
}

export async function fetchSystemSettings(supabase) {
    const localSettings = getLocalSettings();

    if (!supabase) return localSettings;

    for (const table of SUPABASE_SETTING_TABLES) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (!error && Array.isArray(data) && data[0]) {
                const remoteSettings = { ...localSettings, ...data[0] };
                persistLocalSettings(remoteSettings);
                return remoteSettings;
            }
        } catch (error) {
            console.warn(`[settings-logic] ${table} no está disponible:`, error);
        }
    }

    return localSettings;
}

export async function updateSystemSettings(supabase, settingsData) {
    const threshold = parseInt(settingsData.stock_alert_threshold, 10);
    if (Number.isNaN(threshold) || threshold < 0) {
        throw new Error('El umbral de stock crítico debe ser un número entero ≥ 0.');
    }

    const multiplier = parseFloat(settingsData.bonus_multiplier);
    if (Number.isNaN(multiplier) || multiplier < 1.0 || multiplier > 3.0) {
        throw new Error('El multiplicador de bonos debe estar entre 1.00 y 3.00.');
    }

    const deliveryFee = bs(settingsData.delivery_fee_bs);
    if (deliveryFee < 0) {
        throw new Error('La tarifa de entrega no puede ser negativa.');
    }

    const preferredLanguage = ['es', 'en'].includes(settingsData.preferred_language)
        ? settingsData.preferred_language
        : 'es';

    const toSave = {
        stock_alert_threshold: threshold,
        bonus_multiplier: bs(multiplier),
        delivery_fee_bs: deliveryFee,
        store_name: String(settingsData.store_name || 'Prem Vida').trim(),
        whatsapp_number: String(settingsData.whatsapp_number || '').trim(),
        preferred_language: preferredLanguage,
        maintenance_mode: Boolean(settingsData.maintenance_mode),
        last_updated: new Date().toISOString(),
    };

    persistLocalSettings(toSave);
    await trySupabaseSettingsSync(supabase, toSave);
    await updateCurrentProfileLanguage(supabase, preferredLanguage);
    return toSave;
}

/**
 * Consulta el estado actual de maintenance_mode en la tabla store_settings.
 * Pensada para tienda.html (página pública): es una consulta liviana de una sola
 * columna, no requiere el resto de parámetros del sistema.
 *
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @returns {Promise<boolean>} true si la tienda está en mantenimiento.
 */
export async function fetchMaintenanceMode(supabase) {
    if (!supabase) return false;
    try {
        const { data, error } = await supabase
            .from(PRIMARY_SETTINGS_TABLE)
            .select('maintenance_mode')
            .limit(1)
            .single();
        if (error) throw error;
        return Boolean(data?.maintenance_mode);
    } catch (error) {
        console.warn('[settings-logic] No se pudo consultar maintenance_mode:', error);
        return false;
    }
}

/**
 * Se suscribe en tiempo real (Supabase Realtime) a cambios de UPDATE sobre la
 * fila de store_settings, para reaccionar de inmediato cuando el admin activa o
 * desactiva el modo mantenimiento, sin necesidad de recargar tienda.html.
 *
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {(isMaintenance: boolean) => void} onChange - Callback con el nuevo estado.
 * @returns {Object|null} El canal de Supabase Realtime (para poder desuscribirse con channel.unsubscribe()).
 */
export function subscribeMaintenanceMode(supabase, onChange) {
    if (!supabase || typeof onChange !== 'function') return null;

    const channel = supabase
        .channel('store-settings-maintenance')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: PRIMARY_SETTINGS_TABLE },
            (payload) => {
                onChange(Boolean(payload.new?.maintenance_mode));
            }
        )
        .subscribe();

    return channel;
}

export async function updateCurrentProfileLanguage(supabase, preferredLanguage) {
    const lang = ['es', 'en'].includes(preferredLanguage) ? preferredLanguage : 'es';
    localStorage.setItem(LANGUAGE_KEY, lang);
    if (!supabase) return { preferred_language: lang };

    try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return { preferred_language: lang };

        const { data, error } = await supabase
            .from('profiles')
            .update({ preferred_language: lang })
            .eq('id', userId)
            .select('id, preferred_language')
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.warn('[settings-logic] No se pudo sincronizar idioma de perfil:', error);
        return { preferred_language: lang };
    }
}

export async function fetchAuditLogs(supabase, limit = 120) {
    if (!supabase) {
        throw new Error('[settings-logic] Cliente de Supabase no provisto.');
    }

    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('id, user_name, action, table_name, previous_data, new_data, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (!error && Array.isArray(data)) {
            return data.map((row) => ({
                id: row.id,
                table: row.table_name || 'audit_logs',
                operation: String(row.action || 'INSERT').toUpperCase(),
                actor: row.user_name || 'Administrador',
                summary: `${row.action || 'EVENTO'} · ${row.table_name || 'Sistema'}`,
                raw: row,
                created_at: row.created_at,
            }));
        }
    } catch (error) {
        console.warn('[settings-logic] La tabla audit_logs no está disponible. Usando fallback de auditoría:', error);
    }

    const PER_TABLE = Math.ceil(limit / 5);
    const [ordersRes, expensesRes, payrollRes, employeesRes, ordersHistoryRes] = await Promise.allSettled([
        supabase.from('purchase_orders').select('id, total_amount, status, created_at, updated_at, suppliers(name)').order('created_at', { ascending: false }).limit(PER_TABLE),
        supabase.from('expenses').select('id, category, amount, payment_date, created_at, updated_at').order('created_at', { ascending: false }).limit(PER_TABLE),
        supabase.from('payroll').select('id, amount_paid, status, payment_date, created_at, updated_at, employees(name)').order('created_at', { ascending: false }).limit(PER_TABLE),
        supabase.from('employees').select('id, name, role, active, created_at, updated_at').order('created_at', { ascending: false }).limit(PER_TABLE),
        supabase.from('orders').select('id, order_code, total_amount, status, payment_method, delivery_type, created_at, updated_at').order('created_at', { ascending: false }).limit(PER_TABLE),
    ]);

    const events = [];

    if (ordersRes.status === 'fulfilled' && !ordersRes.value.error) {
        for (const row of ordersRes.value.data || []) {
            const supplierName = row.suppliers?.name || 'Proveedor desconocido';
            const isUpdate = row.updated_at && row.updated_at !== row.created_at;
            events.push({
                id: row.id,
                table: 'purchase_orders',
                operation: isUpdate ? 'UPDATE' : 'INSERT',
                actor: 'Administrador',
                summary: `${isUpdate ? 'Actualización de' : 'Nueva'} orden · ${supplierName} · Bs. ${bs(row.total_amount).toFixed(2)}`,
                amount_bs: bs(row.total_amount),
                status: row.status,
                raw: row,
                created_at: isUpdate ? row.updated_at : row.created_at,
            });
        }
    }

    if (expensesRes.status === 'fulfilled' && !expensesRes.value.error) {
        for (const row of expensesRes.value.data || []) {
            const isUpdate = row.updated_at && row.updated_at !== row.created_at;
            events.push({
                id: row.id,
                table: 'expenses',
                operation: isUpdate ? 'UPDATE' : 'INSERT',
                actor: 'Administrador',
                summary: `${isUpdate ? 'Gasto actualizado' : 'Gasto registrado'} · ${capitalize(row.category)} · Bs. ${bs(row.amount).toFixed(2)}`,
                amount_bs: bs(row.amount),
                raw: row,
                created_at: isUpdate ? row.updated_at : row.created_at,
            });
        }
    }

    if (payrollRes.status === 'fulfilled' && !payrollRes.value.error) {
        for (const row of payrollRes.value.data || []) {
            const empName = row.employees?.name || 'Empleado';
            const isUpdate = row.updated_at && row.updated_at !== row.created_at;
            events.push({
                id: row.id,
                table: 'payroll',
                operation: isUpdate ? 'UPDATE' : 'INSERT',
                actor: 'Sistema Nómina',
                summary: `${isUpdate ? 'Pago actualizado' : 'Registro de pago'} · ${empName} · Bs. ${bs(row.amount_paid).toFixed(2)}`,
                amount_bs: bs(row.amount_paid),
                status: row.status,
                raw: row,
                created_at: isUpdate ? row.updated_at : row.created_at,
            });
        }
    }

    if (employeesRes.status === 'fulfilled' && !employeesRes.value.error) {
        for (const row of employeesRes.value.data || []) {
            const isUpdate = row.updated_at && row.updated_at !== row.created_at;
            const action = !row.active ? 'Baja de empleado' : isUpdate ? 'Empleado actualizado' : 'Alta de empleado';
            events.push({
                id: row.id,
                table: 'employees',
                operation: isUpdate ? 'UPDATE' : 'INSERT',
                actor: 'RRHH / Admin',
                summary: `${action} · ${row.name} · ${row.role}`,
                raw: row,
                created_at: isUpdate ? row.updated_at : row.created_at,
            });
        }
    }

    if (ordersHistoryRes.status === 'fulfilled' && !ordersHistoryRes.value.error) {
        for (const row of ordersHistoryRes.value.data || []) {
            const isUpdate = row.updated_at && row.updated_at !== row.created_at;
            events.push({
                id: row.id,
                table: 'orders',
                operation: isUpdate ? 'UPDATE' : 'INSERT',
                actor: 'Operador / Sistema',
                summary: `${isUpdate ? 'Orden actualizada' : 'Nueva orden'} · #${row.order_code} · Bs. ${bs(row.total_amount).toFixed(2)}`,
                amount_bs: bs(row.total_amount),
                status: row.status,
                raw: row,
                created_at: isUpdate ? row.updated_at : row.created_at,
            });
        }
    }

    events.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return events.slice(0, limit);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

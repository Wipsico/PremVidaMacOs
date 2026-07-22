/**
 * Prem Vida — Orders Logic Module (Fase 3)
 * ES6 Module. CRUD operations for purchase_orders ↔ suppliers.
 *
 * Currency  : Bolivianos (Bs.) — Bolivia
 * Rounding  : Math.round(val * 100) / 100
 * DB tables : purchase_orders, suppliers
 */

// ─── Financial helper ──────────────────────────────────────────────────────────
/** Strict Boliviano rounding: Math.round(val * 100) / 100 */
const bs = (val) => Math.round((parseFloat(val) || 0) * 100) / 100;

// ─── Fetch all purchase orders (with supplier join) ────────────────────────────
/**
 * Retrieves every purchase order from Supabase, joining the related supplier row.
 * Results are sorted chronologically (newest first).
 *
 * @param  {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Array<{
 *   id: string,
 *   total_amount: number,   // Bs. rounded
 *   status: string,         // 'pendiente' | 'solicitado' | 'pagado'
 *   created_at: string,
 *   suppliers: { id: string, name: string, city?: string } | null
 * }>>}
 */
export async function fetchSupplierOrders(supabase) {
    if (!supabase) throw new Error('[orders-logic] Cliente de Supabase no provisto.');

    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(id, name, city)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[orders-logic] fetchSupplierOrders →', error.message);
        throw error;
    }

    return (data || []).map(order => ({
        ...order,
        total_amount: bs(order.total_amount),
    }));
}

// ─── Insert a new purchase order ───────────────────────────────────────────────
/**
 * Inserts a new purchase order in Supabase, applying strict financial rounding
 * to total_amount before saving. Returns the inserted row (with supplier join).
 *
 * @param  {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param  {{ supplier_id: string, total_amount: number|string, status?: string }} orderData
 * @returns {Promise<object>}
 */
export async function insertPurchaseOrder(supabase, orderData) {
    if (!supabase) throw new Error('[orders-logic] Cliente de Supabase no provisto.');

    const VALID_STATUSES = ['pendiente', 'solicitado', 'pagado'];

    const roundedAmount = bs(orderData.total_amount);

    // --- Validation ---
    if (!orderData.supplier_id) {
        throw new Error('Debes seleccionar un proveedor.');
    }
    if (roundedAmount <= 0) {
        throw new Error('El monto total debe ser mayor a Bs. 0.00.');
    }

    const payload = {
        supplier_id:  orderData.supplier_id,
        total_amount: roundedAmount,
        status:       VALID_STATUSES.includes((orderData.status || '').toLowerCase())
                          ? orderData.status.toLowerCase()
                          : 'pendiente',
        // created_at is handled by Supabase default (now())
    };

    const { data, error } = await supabase
        .from('purchase_orders')
        .insert([payload])
        .select('*, suppliers(id, name, city)')
        .single();

    if (error) {
        console.error('[orders-logic] insertPurchaseOrder →', error.message);
        throw error;
    }

    return {
        ...data,
        total_amount: bs(data.total_amount),
    };
}

// ─── Fetch all suppliers ───────────────────────────────────────────────────────
/**
 * Returns every supplier sorted alphabetically. Used to populate the
 * "Proveedor" <select> inside the New Order modal.
 *
 * @param  {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Array<{ id: string, name: string, city?: string }>>}
 */
export async function fetchSuppliers(supabase) {
    if (!supabase) throw new Error('[orders-logic] Cliente de Supabase no provisto.');

    const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, city')
        .order('name', { ascending: true });

    if (error) {
        console.error('[orders-logic] fetchSuppliers →', error.message);
        throw error;
    }

    return data || [];
}

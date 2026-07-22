/**
 * Prem Vida — Payroll Logic Module (Fase 2)
 * Pure ES6 Module. Handles CRUD operations for employees and payroll.
 * Currency: Bolivianos (Bs.) | Rounding: Math.round(val * 100) / 100
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Standard financial rounding for Prem Vida */
const bs = (val) => Math.round((val || 0) * 100) / 100;

// ─── User-Requested Functions ──────────────────────────────────────────────────

/**
 * Retrieves all employees, sorted alphabetically by name.
 * Mocks daily_production to 150.00 for each employee.
 * @param {object} supabase - Supabase client
 * @returns {Promise<Array>}
 */
export async function fetchEmployees(supabase) {
    try {
        if (!supabase) throw new Error("Cliente de Supabase no provisto.");
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return (data || []).map(e => ({
            ...e,
            hourly_rate: bs(e.hourly_rate),
            daily_production: 150.00 // Salvador del KPI de Producción mockeado
        }));
    } catch (error) {
        console.error("❌ Error en fetchEmployees:", error.message);
        throw error;
    }
}

/**
 * Inserts a new employee. Maps input fields to existing database schema fields:
 * - salary / hourly_rate -> hourly_rate
 * - status / active -> active
 * Omit daily_production as it does not exist in the DB schema.
 * @param {object} supabase - Supabase client
 * @param {object} empData - Employee details
 * @returns {Promise<object>}
 */
export async function insertEmployee(supabase, empData) {
    try {
        if (!supabase) throw new Error("Cliente de Supabase no provisto.");
        const rawSalary = empData.salary !== undefined ? empData.salary : empData.hourly_rate;
        const safeSalary = bs(parseFloat(rawSalary));

        // Map status or active input to active boolean
        const isActive = empData.active !== undefined
            ? Boolean(empData.active)
            : (empData.status === undefined || empData.status === 'Activo');

        const cleanData = {
            name: empData.name,
            role: empData.role || 'Operario',
            hourly_rate: safeSalary,
            active: isActive,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('employees').insert([cleanData]).select();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("❌ Error en insertEmployee:", error.message);
        throw error;
    }
}

/**
 * Terminates (permanently deletes) an employee from the database by ID.
 * @param {object} supabase - Supabase client
 * @param {string} id - Employee UUID
 * @returns {Promise<boolean>}
 */
export async function terminateEmployee(supabase, id) {
    try {
        if (!supabase) throw new Error("Cliente de Supabase no provisto.");
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error("❌ Error en terminateEmployee:", error.message);
        throw error;
    }
}

/**
 * Retrieves payroll records, optionally filtered by employee ID.
 * Selects only existing database fields, omitting payment_method to prevent DB query errors.
 * @param {object} supabase - Supabase client
 * @param {string|null} employeeId - Employee UUID (optional)
 * @returns {Promise<Array>}
 */
export async function fetchPayrollHistory(supabase, employeeId = null) {
    try {
        if (!supabase) throw new Error("Cliente de Supabase no provisto.");
        let query = supabase.from('payroll').select('id, employee_id, payment_date, amount_paid, status, employees ( name, role )');
        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }
        const { data, error } = await query.order('payment_date', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({
            ...p,
            amount_paid: bs(p.amount_paid)
        }));
    } catch (error) {
        console.error("❌ Error en fetchPayrollHistory:", error.message);
        throw error;
    }
}

// ─── Frontend Compatibility Wrappers ──────────────────────────────────────────

/**
 * Wrapper for frontend compatibity to create employee.
 */
export async function createEmployee(supabase, { name, role, hourly_rate }) {
    const result = await insertEmployee(supabase, { name, role, hourly_rate });
    return Array.isArray(result) ? result[0] : result;
}

/**
 * Updates editable fields of an employee.
 */
export async function updateEmployee(supabase, id, payload) {
    if (!supabase) throw new Error('Supabase no disponible.');
    const patch = {};
    if (payload.name !== undefined) patch.name = String(payload.name).trim();
    if (payload.role !== undefined) patch.role = String(payload.role).trim();
    if (payload.hourly_rate !== undefined) patch.hourly_rate = bs(parseFloat(payload.hourly_rate));
    if (payload.active !== undefined) patch.active = Boolean(payload.active);

    const { data, error } = await supabase
        .from('employees')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`updateEmployee: ${error.message}`);
    return data;
}

/**
 * Toggles an employee's active status (soft delete/activation).
 */
export async function toggleEmployeeActive(supabase, id, active) {
    try {
        if (!supabase) throw new Error("Cliente de Supabase no provisto.");
        const { data, error } = await supabase
            .from('employees')
            .update({ active: Boolean(active) })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("❌ Error en toggleEmployeeActive:", error.message);
        throw error;
    }
}

/**
 * Calculates current month KPIs for the payroll module.
 * Treats 'hourly_rate' as the monthly salary to avoid exponential scale distortion.
 */
export async function fetchPayrollKPIs(supabase) {
    const defaultKPIs = { monthlyPayroll: 0, activeEmployees: 0, pendingPayments: 0 };
    if (!supabase) return defaultKPIs;

    const [employeesRes, pendingRes] = await Promise.allSettled([
        supabase.from('employees')
            .select('hourly_rate')
            .eq('active', true),
        supabase.from('payroll')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendiente'),
    ]);

    let monthlyPayroll = 0;
    let activeEmployees = 0;
    let pendingPayments = 0;

    if (employeesRes.status === 'fulfilled' && !employeesRes.value.error) {
        const activeEmpsList = employeesRes.value.data || [];
        activeEmployees = activeEmpsList.length;
        // Sumamos directamente la tarifa de los empleados activos (asumida como sueldo mensual equivalente)
        monthlyPayroll = bs(
            activeEmpsList.reduce((sum, e) => sum + (parseFloat(e.hourly_rate) || 0), 0)
        );
    }

    if (pendingRes.status === 'fulfilled' && !pendingRes.value.error) {
        pendingPayments = pendingRes.value.count ?? 0;
    }

    return { monthlyPayroll, activeEmployees, pendingPayments };
}

/**
 * Registers a payroll payment.
 */
export async function registerPayment(supabase, { employee_id, payment_date, amount_paid, status = 'pendiente' }) {
    if (!supabase) throw new Error('Supabase no disponible.');

    const clean = {
        employee_id,
        payment_date,
        amount_paid: bs(parseFloat(amount_paid)),
        status: ['pendiente', 'pagado'].includes(status) ? status : 'pendiente',
    };

    if (!clean.employee_id) throw new Error('Debe seleccionar un empleado.');
    if (!clean.payment_date) throw new Error('La fecha de pago es obligatoria.');
    if (clean.amount_paid <= 0) throw new Error('El monto debe ser mayor a Bs. 0.');

    const { data, error } = await supabase
        .from('payroll')
        .insert([clean])
        .select()
        .single();

    if (error) throw new Error(`registerPayment: ${error.message}`);
    return data;
}

/**
 * Updates status of a payroll payment ('pendiente' <-> 'pagado').
 */
export async function updatePaymentStatus(supabase, payrollId, status) {
    if (!supabase) throw new Error('Supabase no disponible.');
    if (!['pendiente', 'pagado'].includes(status)) {
        throw new Error(`Status inválido: "${status}". Use 'pendiente' o 'pagado'.`);
    }

    const { data, error } = await supabase
        .from('payroll')
        .update({ status })
        .eq('id', payrollId)
        .select()
        .single();

    if (error) throw new Error(`updatePaymentStatus: ${error.message}`);
    return data;
}

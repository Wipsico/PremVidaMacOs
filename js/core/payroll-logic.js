/**
 * Prem Vida — Payroll Logic Module
 * Módulo de gestión de personal, empleados y nómina.
 */

const bs = (val) => Math.round((val || 0) * 100) / 100;

export async function fetchEmployees(supabase) {
    if (!supabase) throw new Error("Cliente de Supabase no provisto.");
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(e => ({
        ...e,
        hourly_rate: bs(e.hourly_rate),
        daily_production: 150.00
    }));
}

export async function insertEmployee(supabase, empData) {
    if (!supabase) throw new Error("Cliente de Supabase no provisto.");
    const rawSalary = empData.salary !== undefined ? empData.salary : empData.hourly_rate;
    const safeSalary = bs(parseFloat(rawSalary));

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
}

export async function toggleEmployeeActive(supabase, id, active) {
    if (!supabase) throw new Error("Cliente de Supabase no provisto.");
    const { data, error } = await supabase
        .from('employees')
        .update({ active: Boolean(active) })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function fetchPayrollKPIs(supabase) {
    const defaultKPIs = { monthlyPayroll: 0, activeEmployees: 0, pendingPayments: 0 };
    if (!supabase) return defaultKPIs;

    const [employeesRes, pendingRes] = await Promise.allSettled([
        supabase.from('employees').select('hourly_rate').eq('active', true),
        supabase.from('payroll').select('id', { count: 'exact', head: true }).eq('status', 'pendiente'),
    ]);

    let monthlyPayroll = 0;
    let activeEmployees = 0;
    let pendingPayments = 0;

    if (employeesRes.status === 'fulfilled' && !employeesRes.value.error) {
        const activeEmpsList = employeesRes.value.data || [];
        activeEmployees = activeEmpsList.length;
        monthlyPayroll = bs(activeEmpsList.reduce((sum, e) => sum + (parseFloat(e.hourly_rate) || 0), 0));
    }

    if (pendingRes.status === 'fulfilled' && !pendingRes.value.error) {
        pendingPayments = pendingRes.value.count ?? 0;
    }

    return { monthlyPayroll, activeEmployees, pendingPayments };
}

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
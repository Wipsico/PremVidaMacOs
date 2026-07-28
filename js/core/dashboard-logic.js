/**
 * Prem Vida – Dashboard Logic Module
 * Módulo optimizado y blindado para estadísticas y gráficos del panel.
 */

const FALLBACK_STATS = {
    revenue: 8432.50,
    ordersCount: 38,
    criticalCount: 3,
    valuation: 127840.00,
    criticalProducts: [
        { name: 'Leche de Almendras 1L', stock: 2, category: 'Dairy-Free' },
        { name: 'Queso Cheddar Vegano 200g', stock: 1, category: 'Dairy-Free' },
        { name: 'Hamburguesa de Lentejas (4u)', stock: 3, category: 'Vegan Meat' },
    ],
    chartData: [1840, 2350, 3120, 2780, 4560, 8432],
};

export async function fetchDashboardStats(supabase) {
    if (!supabase) {
        console.info('[Dashboard] Sin cliente Supabase — usando datos demostrativos.');
        return FALLBACK_STATS;
    }

    try {
        const [ordersRes, productsRes] = await Promise.all([
            supabase.from('orders').select('total_amount, status'),
            supabase.from('products').select('id, name, price, stock, category, is_active')
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (productsRes.error) throw productsRes.error;

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];

        // 1. Ingresos Totales (Ventas confirmadas con normalización segura)
        const revenue = orders
            .filter(o => String(o.status || '').trim().toLowerCase() === 'confirmado')
            .reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);

        // 2. Conteo total de órdenes
        const ordersCount = orders.length;

        // 3. Productos activos en stock crítico (< 5 unidades)
        const criticalProducts = products.filter(p => p.is_active && Number(p.stock) < 5);

        // 4. Valuación total del almacén segura
        const valuation = products.reduce(
            (acc, p) => acc + (parseFloat(p.price || 0) * parseInt(p.stock || 0, 10)),
            0
        );

        const chartData = buildChartData(revenue);

        const result = {
            revenue: Math.round(revenue * 100) / 100,
            ordersCount,
            criticalCount: criticalProducts.length,
            valuation: Math.round(valuation * 100) / 100,
            criticalProducts: criticalProducts.slice(0, 5),
            chartData,
        };

        if (ordersCount === 0 && products.length === 0) {
            return { ...FALLBACK_STATS, ...result };
        }

        return result;

    } catch (err) {
        console.error('[Dashboard] Error al obtener estadísticas:', err);
        throw err;
    }
}

function buildChartData(totalRevenue) {
    if (totalRevenue <= 0) return FALLBACK_STATS.chartData;
    const weights = [0.05, 0.10, 0.16, 0.14, 0.22, 0.33];
    return weights.map(w => Math.round(w * totalRevenue * 100) / 100);
}

export function renderOrdersChart(containerId, labelsId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Respaldo de ancho si el contenedor está oculto temporalmente
    const W = container.clientWidth || 640;
    const H = 180;
    const PAD = { top: 20, right: 20, bottom: 30, left: 20 };

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...data, 1) * 1.15;
    const minVal = 0;
    const dataPointsCount = data.length > 1 ? data.length - 1 : 1;

    const pts = data.map((v, i) => ({
        x: PAD.left + (i / dataPointsCount) * innerW,
        y: PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH,
        v,
    }));

    const linePath = pts.reduce((path, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cpX = (prev.x + p.x) / 2;
        return `${path} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    const areaPath = `${linePath} L ${lastPt.x} ${H - PAD.bottom} L ${firstPt.x} ${H - PAD.bottom} Z`;

    const dots = pts.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#4edea3" stroke="#09090b" stroke-width="2"/>
    `).join('');

    container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="w-full h-full overflow-visible">
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.30"/>
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.00"/>
                </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#chartGrad)"/>
            <path d="${linePath}" fill="none" stroke="#4edea3" stroke-width="2.5" stroke-linecap="round"/>
            ${dots}
        </svg>`;

    const labelsEl = document.getElementById(labelsId);
    if (labelsEl) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        labelsEl.innerHTML = months.map(m => `<span>${m}</span>`).join('');
    }
}
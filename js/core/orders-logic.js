/**
 * Prem Vida - Órdenes, historial operativo y venta por código.
 * Con flujo de estados, menú desplegable de acciones y control de inventario.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.supabaseClient;
    const tableBody = document.getElementById('orders-table-body');
    const codeInput = document.getElementById('order-code-input');
    const searchBtn = document.getElementById('btn-search-order-code');
    const confirmBtn = document.getElementById('btn-confirm-order-code');
    const codeResult = document.getElementById('order-code-result');
    let currentCodeSale = null;
    let currentRows = [];

    const ORDER_TABLE = 'orders';
    const ORDER_ITEMS_TABLE = 'order_items';
    const PRODUCTS_TABLE = 'products';

    const mockOrders = [
        { id: 'PV-0041', entity: 'Distribuidora Vegana Oriente', type: 'Bill (Gasto)', amount: 1420.00, status: 'completada', raw: null },
        { id: 'PV-0042', entity: 'Cliente WhatsApp', type: 'Sale (Venta)', amount: 185.50, status: 'aprobado', raw: null },
        { id: 'PV-0043', entity: 'Mariela Justiniano', type: 'Sale (Venta)', amount: 90.00, status: 'espera_aprobacion', raw: null },
    ];

    await loadOrders();

    // Filtros por marca o tab
    document.addEventListener('pv:orders-tab-change', (event) => {
        renderOrders(filterRowsByBrand(currentRows.length ? currentRows : mockOrders, event.detail?.tab || 'todas'));
    });

    // Conexión de Botones e Interfaz Principal
    searchBtn?.addEventListener('click', searchOrderCode);
    codeInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') searchOrderCode();
    });
    confirmBtn?.addEventListener('click', confirmCurrentOrder);
    document.getElementById('btn-export-orders')?.addEventListener('click', exportVisibleRows);
    document.getElementById('btn-print-summary')?.addEventListener('click', () => window.print());
    document.getElementById('btn-add-brand')?.addEventListener('click', openBrandPrompt);
    document.getElementById('btn-close-transaction-modal')?.addEventListener('click', closeTransactionModal);
    
    document.getElementById('transaction-modal')?.addEventListener('click', (event) => {
        if (event.target.id === 'transaction-modal') closeTransactionModal();
    });

    // Cargar órdenes desde Supabase
    async function loadOrders() {
        if (!tableBody) return;

        if (!supabase) {
            currentRows = mockOrders;
            renderOrders(currentRows);
            return;
        }

        try {
            const { data: orders, error } = await supabase
                .from(ORDER_TABLE)
                .select('id, order_code, customer_name, customer_phone, delivery_type, delivery_notes, payment_method, total_amount, status, created_at')
                .order('created_at', { ascending: false })
                .limit(25);

            if (error) throw error;

            currentRows = (orders || []).map((order) => ({
                id: order.order_code || order.id.slice(0, 8),
                entity: order.customer_name || order.customer_phone || 'Cliente tienda',
                type: 'Sale (Venta)',
                amount: Number(order.total_amount || 0),
                status: order.status || 'espera_aprobacion',
                brand: inferBrand(order),
                raw: order,
            }));

            renderOrders(currentRows.length ? currentRows : mockOrders);
        } catch (error) {
            console.warn('[orders] Error cargando órdenes:', error);
            currentRows = mockOrders;
            renderOrders(currentRows);
        }
    }

    // Renderizar filas con Selector Unificado de Acciones
    function renderOrders(rows) {
        updateKpis(rows);
        tableBody.innerHTML = rows.map((order) => {
            const rawId = order.raw?.id || order.id;
            const status = String(order.status).toLowerCase();
            const isSale = order.type.includes('Sale');
            const isPending = ['pendiente', 'espera_aprobacion', 'espera-aprobacion', 'draft'].includes(status);

            // Generar opciones del selector según el estado de la orden
            let selectOptions = `<option value="" disabled selected>Acciones...</option>`;

            if (isPending) {
                selectOptions += `
                    <option value="aprobar">🟢 Aprobar</option>
                    <option value="cancelar">🟡 Cancelar</option>
                    <option value="eliminar">🔴 Eliminar</option>
                `;
            } else if (['aprobado', 'confirmado'].includes(status)) {
                selectOptions += `
                    <option value="registrar-venta">🔵 Registrar Venta</option>
                    <option value="cancelar">🟡 Cancelar (Devolver Stock)</option>
                    <option value="eliminar">🔴 Eliminar (Devolver Stock)</option>
                `;
            } else if (status === 'cancelada') {
                selectOptions += `
                    <option value="eliminar">🔴 Eliminar</option>
                `;
            } else if (status === 'completada') {
                selectOptions += `
                    <option value="" disabled>✔️ Venta Completada</option>
                `;
            }

            return `
                <tr class="border-b border-zinc-800/40 hover:bg-zinc-900/20 transition">
                    <td class="px-6 py-4 font-mono text-zinc-400">${escapeHtml(order.id)}</td>
                    <td class="px-6 py-4 font-medium text-white">${escapeHtml(order.entity)}</td>
                    <td class="px-6 py-4">
                        <span class="text-xs px-2.5 py-1 rounded-md font-medium ${isSale ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}">${escapeHtml(order.type)}</span>
                    </td>
                    <td class="px-6 py-4 font-semibold text-emerald-400">Bs. ${roundBs(order.amount).toFixed(2)}</td>
                    <td class="px-6 py-4">
                        <span class="text-xs px-2.5 py-1 rounded-full font-medium ${isPending ? 'bg-amber-500/10 text-amber-400' : status === 'completada' ? 'bg-blue-500/10 text-blue-400' : status === 'cancelada' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}">${escapeHtml(order.status)}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="inline-flex items-center gap-2">
                            <select data-id="${escapeHtml(rawId)}" data-status="${status}" class="action-select bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
                                ${selectOptions}
                            </select>
                            <button data-order-id="${escapeHtml(rawId)}" class="btn-view-order text-zinc-400 hover:text-white transition material-symbols-outlined text-base p-1 rounded-lg hover:bg-zinc-800" title="Ver detalle">visibility</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Event Listeners para abrir detalles
        tableBody.querySelectorAll('.btn-view-order').forEach((button) => {
            button.addEventListener('click', () => openTransactionDetail(button.dataset.orderId));
        });

        // Event Listeners para las opciones del desplegable
        tableBody.querySelectorAll('.action-select').forEach((select) => {
            select.addEventListener('change', async (e) => {
                const action = e.target.value;
                const id = e.target.dataset.id;
                const currentStatus = e.target.dataset.status;

                if (action === 'aprobar') {
                    await cambiarEstadoOrden(id, 'aprobado');
                } else if (action === 'registrar-venta') {
                    await cambiarEstadoOrden(id, 'completada');
                } else if (action === 'cancelar') {
                    const revertir = ['aprobado', 'confirmado'].includes(String(currentStatus).toLowerCase());
                    await cambiarEstadoOrden(id, 'cancelada', revertir);
                } else if (action === 'eliminar') {
                    await eliminarOrden(id, currentStatus);
                }

                e.target.selectedIndex = 0;
            });
        });
    }

    // Cambio de estado y gestión de stock
    async function cambiarEstadoOrden(ordenId, nuevoEstado, revertirStock = false) {
        if (!supabase) {
            const targetRow = currentRows.find(r => (r.raw?.id || r.id) === ordenId);
            if (targetRow) targetRow.status = nuevoEstado;
            renderOrders(currentRows);
            window.showToast?.('info', `Estado simulado cambiado a: ${nuevoEstado}`, 'info');
            return;
        }

        try {
            if (revertirStock) {
                await manejarDevolucionStock(ordenId);
            } else if (nuevoEstado === 'aprobado') {
                await manejarDescuentoStock(ordenId);
            }

            const { error } = await supabase
                .from(ORDER_TABLE)
                .update({ status: nuevoEstado })
                .eq('id', ordenId);

            if (error) throw error;

            window.showToast?.('check_circle', `Orden actualizada a: ${nuevoEstado}`, 'success');
            await loadOrders();
        } catch (error) {
            console.error('[orders] Error al actualizar estado:', error);
            window.showToast?.('error', `Error: ${error.message}`, 'error');
        }
    }

    // Eliminación de órdenes
    async function eliminarOrden(ordenId, estadoActual) {
        if (!confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) return;

        try {
            if (!supabase) {
                currentRows = currentRows.filter(r => (r.raw?.id || r.id) !== ordenId);
                renderOrders(currentRows);
                window.showToast?.('check_circle', 'Registro eliminado correctamente', 'success');
                return;
            }

            if (['aprobado', 'confirmado'].includes(String(estadoActual).toLowerCase())) {
                await manejarDevolucionStock(ordenId);
            }

            const { error } = await supabase
                .from(ORDER_TABLE)
                .delete()
                .eq('id', ordenId);

            if (error) throw error;

            window.showToast?.('check_circle', 'Orden eliminada correctamente', 'success');
            await loadOrders();
        } catch (error) {
            console.error('[orders] Error al eliminar orden:', error);
            window.showToast?.('error', `Error al eliminar: ${error.message}`, 'error');
        }
    }

    // Descontar inventario al aprobar
    async function manejarDescuentoStock(ordenId) {
        try {
            const { data: items } = await supabase.from(ORDER_ITEMS_TABLE).select('product_id, quantity').eq('order_id', ordenId);
            if (!items || !items.length) return;

            for (const item of items) {
                if (item.product_id) {
                    // Intenta usar RPC o actualización directa
                    const { error: rpcErr } = await supabase.rpc('decrement_product_stock', { p_id: item.product_id, p_qty: item.quantity });
                    if (rpcErr) {
                        const { data: prod } = await supabase.from(PRODUCTS_TABLE).select('stock').eq('id', item.product_id).single();
                        if (prod) {
                            const newStock = Math.max(0, (prod.stock || 0) - (item.quantity || 1));
                            await supabase.from(PRODUCTS_TABLE).update({ stock: newStock }).eq('id', item.product_id);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[orders] Error al descontar stock:', err);
        }
    }

    // Reponer inventario al cancelar/eliminar
    async function manejarDevolucionStock(ordenId) {
        try {
            const { data: items } = await supabase.from(ORDER_ITEMS_TABLE).select('product_id, quantity').eq('order_id', ordenId);
            if (!items || !items.length) return;

            for (const item of items) {
                if (item.product_id) {
                    const { error: rpcErr } = await supabase.rpc('increment_product_stock', { p_id: item.product_id, p_qty: item.quantity });
                    if (rpcErr) {
                        const { data: prod } = await supabase.from(PRODUCTS_TABLE).select('stock').eq('id', item.product_id).single();
                        if (prod) {
                            const newStock = (prod.stock || 0) + (item.quantity || 1);
                            await supabase.from(PRODUCTS_TABLE).update({ stock: newStock }).eq('id', item.product_id);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[orders] Error al devolver stock:', err);
        }
    }

    function filterRowsByBrand(rows, tab) {
        if (!tab || tab === 'todas') return rows;
        const knownTabs = ['heartbeef', 'green-leaf', 'otros'];
        if (knownTabs.includes(tab)) {
            return rows.filter((row) => row.brand === tab);
        }
        const normalizedTag = tab.replace(/-/g, ' ').toLowerCase();
        return rows.filter((row) => {
            const haystack = `${row.entity || ''} ${row.raw?.customer_name || ''} ${row.raw?.delivery_notes || ''}`.toLowerCase();
            return haystack.includes(normalizedTag);
        });
    }

    function inferBrand(sale) {
        const text = `${sale.order_code || ''} ${sale.customer_name || ''} ${sale.delivery_notes || ''}`.toLowerCase();
        if (text.includes('heartbeef')) return 'heartbeef';
        if (text.includes('green') || text.includes('leaf')) return 'green-leaf';
        return 'otros';
    }

    function updateKpis(rows) {
        const pending = rows.filter((row) => ['pendiente', 'espera_aprobacion', 'draft'].includes(String(row.status).toLowerCase())).length;
        const counts = rows.reduce((acc, row) => {
            const key = row.brand || 'otros';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const leader = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        const labels = { heartbeef: 'Heartbeef', 'green-leaf': 'Green Leaf', otros: 'Otros', '-': '-' };
        
        const kpiTotal = document.getElementById('kpi-total-orders');
        const kpiPending = document.getElementById('kpi-pending-orders');
        const kpiLeader = document.getElementById('kpi-leader-brand');
        
        if (kpiTotal) kpiTotal.textContent = rows.length;
        if (kpiPending) kpiPending.textContent = pending;
        if (kpiLeader) kpiLeader.textContent = labels[leader] || leader;
    }

    function openBrandPrompt() {
        const rawLabel = prompt('Ingresa el nombre de la empresa o marca para filtrar:');
        const label = String(rawLabel || '').trim();
        if (!label) return;
        const slug = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        if (!slug) return;

        if (document.getElementById(`tab-${slug}`)) {
            if (typeof window.switchTab === 'function') window.switchTab(slug);
            return;
        }

        const container = document.getElementById('orders-filter-actions');
        if (!container) return;

        const button = document.createElement('button');
        button.id = `tab-${slug}`;
        button.dataset.brand = slug;
        button.type = 'button';
        button.className = 'order-tab px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-semibold border border-zinc-700';
        button.textContent = label;
        button.addEventListener('click', () => {
            if (typeof window.switchTab === 'function') window.switchTab(slug);
        });
        container.appendChild(button);
        if (typeof window.switchTab === 'function') window.switchTab(slug);
    }

    async function searchOrderCode() {
        const code = codeInput?.value.trim().toUpperCase();
        currentCodeSale = null;
        if (confirmBtn) confirmBtn.disabled = true;

        if (!code) {
            renderCodeResult('warning', 'Ingresa un código de venta.');
            return;
        }
        if (!supabase) {
            renderCodeResult('error', 'Supabase no está disponible en esta sesión.');
            return;
        }

        try {
            const order = await fetchOrderWithItemsByCode(code);
            currentCodeSale = order;
            if (confirmBtn) confirmBtn.disabled = ['confirmado', 'completada'].includes(order.status);
            renderOrderCodeResult(order);
        } catch (error) {
            console.error('[orders] Error buscando código:', error);
            renderCodeResult('error', error.message || 'No se encontró el ticket.');
        }
    }

    async function confirmCurrentOrder() {
        if (!currentCodeSale || !supabase || !confirmBtn) return;
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span>Confirmando...';

        try {
            await cambiarEstadoOrden(currentCodeSale.id, 'aprobado');
            window.showToast?.('check_circle', 'Pago registrado y orden aprobada correctamente.', 'success');
            await searchOrderCode();
            await loadOrders();
        } catch (error) {
            console.error('[orders] Error confirmando venta:', error);
            window.showToast?.('error', `No se pudo confirmar: ${error.message}`, 'error');
            confirmBtn.disabled = false;
        } finally {
            confirmBtn.innerHTML = originalHtml;
        }
    }

    async function openTransactionDetail(orderId) {
        const matchingRow = currentRows.find((row) => row.raw?.id === orderId) || currentRows.find((row) => row.id === orderId);
        const sale = matchingRow?.raw;
        if (!supabase || !sale) {
            const mock = createMockSaleDetail(orderId);
            openTransactionModal('Detalle de Transacción', buildSaleDetailHtml(mock));
            return;
        }

        try {
            const detail = await fetchOrderWithItemsByCode(sale.order_code || sale.id);
            if (!detail.items?.length) {
                const mock = createMockSaleDetail(detail.order_code || sale.order_code || sale.id, sale);
                openTransactionModal(`Ticket ${escapeHtml(detail.order_code || sale.order_code || sale.id)}`, buildSaleDetailHtml(mock));
                return;
            }
            openTransactionModal(`Ticket ${escapeHtml(detail.order_code)}`, buildSaleDetailHtml(detail));
        } catch (error) {
            const mock = createMockSaleDetail(orderId, sale);
            openTransactionModal('Detalle de Transacción', buildSaleDetailHtml(mock));
        }
    }

    function createMockSaleDetail(orderId, sale = {}) {
        const sampleProducts = [
            { sku: 'HB-101', name: 'Hamburguesa Heartbeef', unit_price: 78.50 },
            { sku: 'GL-022', name: 'Ensalada Green Leaf', unit_price: 42.00 },
            { sku: 'PV-009', name: 'Paquete Vegan Snack', unit_price: 25.00 },
            { sku: 'PV-011', name: 'Bebida Natural', unit_price: 18.75 },
        ];
        const baseItems = sale.items?.length ? sale.items : [
            { quantity: 2, unit_price: 78.50, products: { name: 'Hamburguesa Heartbeef', sku: 'HB-101', category: 'Heartbeef' } },
            { quantity: 1, unit_price: 42.00, products: { name: 'Ensalada Green Leaf', sku: 'GL-022', category: 'Green Leaf' } },
        ];
        const items = baseItems.map((item, index) => {
            if (!item.products) {
                const product = sampleProducts[index % sampleProducts.length];
                return { quantity: item.quantity || 1, unit_price: item.unit_price || product.unit_price, products: product };
            }
            return item;
        });

        const subtotal = roundBs(items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0));
        const taxes = roundBs(subtotal * 0.16);
        const total = roundBs(subtotal + taxes);
        const when = sale.created_at ? new Date(sale.created_at) : new Date();

        return {
            order_code: orderId || sale.order_code || `MOCK-${Date.now()}`,
            customer_name: sale.customer_name || sale.entity || 'Cliente Demo',
            customer_phone: sale.customer_phone || 'N/A',
            payment_method: sale.payment_method || 'Pago Móvil',
            status: sale.status || 'Pendiente',
            delivery_type: sale.delivery_type || 'Retiro en tienda',
            delivery_notes: sale.delivery_notes || 'Mock data generado automáticamente',
            created_at: when.toISOString(),
            items,
            subtotal,
            taxes,
            total_amount: total,
        };
    }

    async function fetchOrderWithItemsByCode(code) {
        const { data: order, error: orderError } = await supabase
            .from(ORDER_TABLE)
            .select('id, order_code, customer_name, customer_phone, delivery_type, delivery_notes, payment_method, total_amount, status, created_at')
            .eq('order_code', code)
            .single();

        if (orderError || !order) {
            throw new Error('Ticket no encontrado.');
        }

        const itemsResult = await supabase
            .from(ORDER_ITEMS_TABLE)
            .select('quantity, unit_price, products(name, sku, category)')
            .eq('order_id', order.id);

        if (itemsResult.error) throw itemsResult.error;

        return { ...order, items: itemsResult.data || [] };
    }

    function renderOrderCodeResult(sale) {
        renderCodeResult('success', buildSaleDetailHtml(sale));
    }

    function renderCodeResult(type, content) {
        if (!codeResult) return;
        codeResult.classList.remove('hidden');
        const color = type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-amber-400' : 'text-zinc-300';
        codeResult.innerHTML = content.includes('<') ? content : `<p class="${color}">${escapeHtml(content)}</p>`;
    }

    function openTransactionModal(title, body) {
        const modalTitle = document.getElementById('transaction-modal-title');
        const modalBody = document.getElementById('transaction-modal-body');
        const modal = document.getElementById('transaction-modal');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = body;
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function closeTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    function exportVisibleRows() {
        const rows = currentRows.length ? currentRows : mockOrders;
        const csv = ['ID,Cliente/Proveedor,Tipo,Monto Bs,Estado']
            .concat(rows.map((row) => `${row.id},${row.entity},${row.type},${roundBs(row.amount).toFixed(2)},${row.status}`))
            .join('\n');
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'Historial_Ventas_PremVida.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function roundBs(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildSaleDetailHtml(sale) {
        const issueDate = new Date(sale.created_at || Date.now()).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
        const items = sale.items || [];
        const itemsHtml = items.map((item) => {
            const product = item.products || {};
            const quantity = Number(item.quantity || 1);
            const unitPrice = roundBs(Number(item.unit_price || 0));
            const lineTotal = roundBs(quantity * unitPrice);
            return `
                <tr class="border-b border-zinc-800/70">
                    <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(product.name || 'Producto')}</td>
                    <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(product.sku || '')}</td>
                    <td class="px-4 py-3 text-sm text-zinc-300">${quantity}</td>
                    <td class="px-4 py-3 text-sm text-zinc-300">Bs. ${unitPrice.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-emerald-400">Bs. ${lineTotal.toFixed(2)}</td>
                </tr>`;
        }).join('');

        const subtotal = roundBs(sale.subtotal ?? items.reduce((sum, item) => sum + Number(item.quantity || 0) * roundBs(Number(item.unit_price || 0)), 0));
        const taxes = roundBs(sale.taxes ?? subtotal * 0.16);
        const total = roundBs(sale.total_amount ?? subtotal + taxes);

        return `
            <section class="space-y-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <p class="text-xs uppercase tracking-widest text-zinc-500">Tipo de Orden</p>
                        <h2 class="text-2xl font-bold text-white">${escapeHtml(sale.status && sale.status.toLowerCase().includes('gasto') ? 'Bill / Gasto' : 'Venta')}</h2>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase tracking-widest text-zinc-500">ID de Orden</p>
                        <p class="text-lg font-semibold text-white">${escapeHtml(sale.order_code || sale.id)}</p>
                    </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4 mb-6">
                    <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4">
                        <p class="text-xs uppercase tracking-widest text-zinc-500">Cliente / Proveedor</p>
                        <p class="mt-2 text-sm font-medium text-white">${escapeHtml(sale.customer_name || sale.entity || 'Cliente Demo')}</p>
                        <p class="text-xs text-zinc-500 mt-1">${escapeHtml(sale.customer_phone || 'N/A')}</p>
                    </div>
                    <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4">
                        <p class="text-xs uppercase tracking-widest text-zinc-500">Fecha de Emisión</p>
                        <p class="mt-2 text-sm font-medium text-white">${escapeHtml(issueDate)}</p>
                        <p class="text-xs text-zinc-500 mt-1">${escapeHtml(sale.payment_method || 'Pago Móvil')}</p>
                    </div>
                    <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4">
                        <p class="text-xs uppercase tracking-widest text-zinc-500">Método de Pago</p>
                        <p class="mt-2 text-sm font-medium text-white">${escapeHtml(sale.payment_method || 'Pago Móvil')}</p>
                    </div>
                    <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4">
                        <p class="text-xs uppercase tracking-widest text-zinc-500">Estado</p>
                        <p class="mt-2 text-sm font-medium ${sale.status && sale.status.toLowerCase().includes('pendiente') ? 'text-amber-300' : 'text-emerald-400'}">${escapeHtml(sale.status || 'Pendiente')}</p>
                    </div>
                </div>

                <div class="rounded-3xl border border-zinc-800 overflow-hidden">
                    <table class="w-full border-collapse text-left text-sm">
                        <thead class="bg-zinc-950/90 text-zinc-400 uppercase text-xs tracking-[0.15em]">
                            <tr>
                                <th class="px-4 py-3">Producto</th>
                                <th class="px-4 py-3">SKU</th>
                                <th class="px-4 py-3">Cantidad</th>
                                <th class="px-4 py-3">Precio Unitario</th>
                                <th class="px-4 py-3">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="bg-zinc-950/80">
                            ${itemsHtml || '<tr><td colspan="5" class="px-4 py-6 text-center text-zinc-500">No hay ítems registrados en esta orden.</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div class="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4 text-sm text-zinc-300">
                        <p class="font-semibold text-white mb-2">Notas:</p>
                        <p>${escapeHtml(sale.delivery_notes || 'No hay notas adicionales.')}</p>
                    </div>
                    <div class="rounded-2xl bg-zinc-950/70 border border-emerald-500/20 p-4 text-sm text-zinc-300">
                        <div class="flex justify-between mb-3"><span>Subtotal</span><span>Bs. ${subtotal.toFixed(2)}</span></div>
                        <div class="flex justify-between mb-3"><span>Impuestos (16%)</span><span>Bs. ${taxes.toFixed(2)}</span></div>
                        <div class="border-t border-zinc-800 pt-3 flex justify-between font-semibold text-white"><span>Total</span><span>Bs. ${total.toFixed(2)}</span></div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6 no-print">
                    <button type="button" onclick="window.print()" class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-600">
                        <span class="material-symbols-outlined">print</span>
                        Imprimir Factura
                    </button>
                </div>
            </section>`;
    }
});
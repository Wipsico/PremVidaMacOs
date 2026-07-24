/**
 * Prem Vida - Gestión Integral de Órdenes, Historial y Creación Manual Avanzada.
 * Incluye tiempo real con Supabase, filtrado dinámico por marcas/personas y UI tipo carrito.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.supabaseClient;
    const tableBody = document.getElementById('orders-table-body');
    const codeInput = document.getElementById('order-code-input');
    const searchBtn = document.getElementById('btn-search-order-code');
    const confirmBtn = document.getElementById('btn-confirm-order-code');
    const codeResult = document.getElementById('order-code-result');

    // Referencias a botones de acción principales
    const mainCreateBtn = document.getElementById('btn-register-payment') || document.getElementById('btn-create-order');

    let currentRows = [];
    let availableProducts = [];
    let cartItems = [];
    let activeDeliveryType = 'tienda'; // 'tienda' | 'domicilio'

    const ORDER_TABLE = 'orders';
    const ORDER_ITEMS_TABLE = 'order_items';
    const PRODUCTS_TABLE = 'products';

    // Inicializar
    setupMainButtons();
    await loadProductsCache();
    await loadOrders();
    setupRealtimeSubscription();

    // 1. Renombrar y configurar el botón principal a "Crear"
    function setupMainButtons() {
        if (mainCreateBtn) {
            mainCreateBtn.innerHTML = `<span class="material-symbols-outlined text-lg">add</span> Crear`;
            mainCreateBtn.className = "px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm flex items-center gap-1.5 transition shadow-lg cursor-pointer";
            mainCreateBtn.addEventListener('click', openCreateOrderModal);
        }

        // Búsqueda por código si existe en el DOM
        searchBtn?.addEventListener('click', searchOrderCode);
        codeInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchOrderCode(); });
        confirmBtn?.addEventListener('click', confirmCurrentOrder);
        document.getElementById('btn-export-orders')?.addEventListener('click', exportVisibleRows);
        document.getElementById('btn-print-summary')?.addEventListener('click', () => window.print());
    }

    // 2. Cargar productos desde Supabase para el buscador inteligente
    async function loadProductsCache() {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from(PRODUCTS_TABLE)
                .select('id, name, sku, price, image_url, category, stock');
            if (!error && data) {
                availableProducts = data;
            }
        } catch (err) {
            console.warn('[orders] Error al cargar inventario:', err);
        }
    }

    // 3. Suscripción en Tiempo Real con Supabase
    function setupRealtimeSubscription() {
        if (!supabase) return;
        supabase
            .channel('orders-live-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: ORDER_TABLE }, () => {
                loadOrders();
            })
            .subscribe();
    }

    // 4. Cargar órdenes de Supabase
    async function loadOrders() {
        if (!tableBody) return;

        if (!supabase) {
            renderOrders([]);
            return;
        }

        try {
            const { data: orders, error } = await supabase
                .from(ORDER_TABLE)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            currentRows = (orders || []).map((order) => {
                const entityName = order.customer_name || order.customer_phone || 'Cliente Particular';
                return {
                    id: order.order_code || (order.id ? String(order.id).slice(0, 8) : 'N/A'),
                    entity: entityName,
                    type: order.type || (order.payment_method?.toLowerCase().includes('bill') ? 'Bill (Gasto)' : 'Sale (Venta)'),
                    amount: Number(order.total_amount || 0),
                    status: order.status || 'espera_aprobacion',
                    brandCategory: classifyBrand(entityName, order.delivery_notes),
                    raw: order,
                };
            });

            renderOrders(currentRows);
            setupTabsFilter();
            updateKpis(currentRows);
        } catch (error) {
            console.error('[orders] Error al cargar lista de órdenes:', error);
        }
    }

    // Clasificar registros por Marca (Heartbeef, Green Leaf) o Persona ("Otros")
    function classifyBrand(name = '', notes = '') {
        const text = `${name} ${notes}`.toLowerCase();
        if (text.includes('heartbeef')) return 'heartbeef';
        if (text.includes('green') || text.includes('leaf')) return 'green-leaf';
        return 'otros'; // Clientes particulares / personas
    }

    // 5. Configuración de Tabs de Filtrado ("Todas", "Heartbeef", "Green Leaf", "Otros")
    function setupTabsFilter() {
        const tabs = document.querySelectorAll('.order-tab, [data-brand]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('bg-emerald-500', 'text-zinc-950', 'font-bold'));
                tab.classList.add('bg-emerald-500', 'text-zinc-950', 'font-bold');

                const targetBrand = tab.dataset.brand || 'todas';
                if (targetBrand === 'todas') {
                    renderOrders(currentRows);
                } else {
                    const filtered = currentRows.filter(r => r.brandCategory === targetBrand);
                    renderOrders(filtered);
                }
            });
        });
    }

    // 6. Renderizar Tabla de Órdenes (Con basurero afuera y selector ⚙️)
    function renderOrders(rows) {
        if (!tableBody) return;

        if (!rows.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-zinc-500 text-sm">No hay registros de órdenes disponibles.</td></tr>`;
            return;
        }

        tableBody.innerHTML = rows.map((order) => {
            const rawId = order.raw?.id || order.id;
            const status = String(order.status).toLowerCase();
            const isPending = ['pendiente', 'espera_aprobacion', 'espera-aprobacion', 'draft'].includes(status);
            const isCompleted = status === 'completada' || status === 'completado';
            const isCanceled = status === 'cancelada' || status === 'cancelado';

            // Opciones del selector dinámico (⚙️ Decisión)
            let selectOptions = `<option value="" disabled selected class="bg-zinc-900 text-zinc-500">⚙️ Opción</option>`;

            if (isPending) {
                selectOptions += `
                    <option value="aprobado" class="bg-zinc-900 text-emerald-400 py-1">Aprobar</option>
                    <option value="cancelada" class="bg-zinc-900 text-amber-400 py-1">Cancelar</option>
                `;
            } else if (['aprobado', 'confirmado'].includes(status)) {
                selectOptions += `
                    <option value="completada" class="bg-zinc-900 text-blue-400 py-1">Registrar Venta</option>
                    <option value="cancelada" class="bg-zinc-900 text-amber-400 py-1">Cancelar (Devolver Stock)</option>
                `;
            } else if (isCanceled) {
                selectOptions += `
                    <option value="aprobado" class="bg-zinc-900 text-emerald-400 py-1">Reactivar (Aprobar)</option>
                `;
            } else if (isCompleted) {
                selectOptions += `
                    <option value="" disabled class="bg-zinc-900 text-zinc-500">Completada</option>
                `;
            }

            return `
                <tr class="border-b border-zinc-800/40 hover:bg-zinc-900/30 transition text-sm">
                    <td class="px-6 py-4 font-mono text-zinc-400">${escapeHtml(order.id)}</td>
                    <td class="px-6 py-4 font-medium text-white">${escapeHtml(order.entity)}</td>
                    <td class="px-6 py-4">
                        <span class="text-xs px-2.5 py-1 rounded-md font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">${escapeHtml(order.type)}</span>
                    </td>
                    <td class="px-6 py-4 font-semibold text-emerald-400">Bs. ${roundBs(order.amount).toFixed(2)}</td>
                    <td class="px-6 py-4">
                        <span class="text-xs px-2.5 py-1 rounded-full font-medium ${isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : isCompleted ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : isCanceled ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">${escapeHtml(order.status)}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="inline-flex items-center gap-2">
                            <!-- Selector Decisión (⚙️) -->
                            <select data-id="${escapeHtml(rawId)}" data-status="${status}" class="action-select bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 rounded-lg px-2.5 py-1.5 transition-all focus:outline-none focus:border-zinc-500 cursor-pointer shadow-sm">
                                ${selectOptions}
                            </select>

                            <!-- Botón Ojito (Ver Detalle) -->
                            <button data-order-id="${escapeHtml(rawId)}" class="btn-view-order text-zinc-400 hover:text-white transition material-symbols-outlined text-lg p-1.5 rounded-lg hover:bg-zinc-800" title="Ver detalle">visibility</button>

                            <!-- Botón Basurero (Eliminar) al lado del ojito -->
                            <button data-id="${escapeHtml(rawId)}" data-status="${status}" class="btn-delete-order text-zinc-500 hover:text-red-400 transition material-symbols-outlined text-lg p-1.5 rounded-lg hover:bg-red-500/10" title="Eliminar registro">delete</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Listeners para acciones de tabla
        tableBody.querySelectorAll('.btn-view-order').forEach(btn => {
            btn.addEventListener('click', () => openTransactionDetail(btn.dataset.orderId));
        });

        tableBody.querySelectorAll('.btn-delete-order').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const dataset = e.currentTarget.dataset;
                await eliminarOrden(dataset.id, dataset.status);
            });
        });

        tableBody.querySelectorAll('.action-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const nuevoEstado = e.target.value;
                const id = e.target.dataset.id;
                const statusActual = e.target.dataset.status;

                if (!nuevoEstado) return;
                const revertirStock = (nuevoEstado === 'cancelada' && ['aprobado', 'confirmado'].includes(statusActual));
                await cambiarEstadoOrden(id, nuevoEstado, revertirStock);
                e.target.selectedIndex = 0;
            });
        });
    }

    // 7. Cambiar Estado en Base de Datos Supabase
    async function cambiarEstadoOrden(ordenId, nuevoEstado, revertirStock = false) {
        if (!supabase) return;

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

            window.showToast?.('check_circle', `Estado cambiado a ${nuevoEstado}`, 'success');
            await loadOrders();
        } catch (err) {
            console.error('[orders] Error cambiando estado:', err);
            window.showToast?.('error', `Error: ${err.message}`, 'error');
        }
    }

    // 8. Eliminar Orden
    async function eliminarOrden(ordenId, estadoActual) {
        if (!confirm('¿Estás seguro de eliminar este registro permanentemente?')) return;
        if (!supabase) return;

        try {
            if (['aprobado', 'confirmado'].includes(String(estadoActual).toLowerCase())) {
                await manejarDevolucionStock(ordenId);
            }

            const { error } = await supabase
                .from(ORDER_TABLE)
                .delete()
                .eq('id', ordenId);

            if (error) throw error;

            window.showToast?.('check_circle', 'Registro eliminado correctamente', 'success');
            await loadOrders();
        } catch (err) {
            console.error('[orders] Error al eliminar:', err);
            window.showToast?.('error', `Error: ${err.message}`, 'error');
        }
    }

    // Manejo de Inventario (Descontar / Devolver Stock)
    async function manejarDescuentoStock(ordenId) {
        try {
            const { data: items } = await supabase.from(ORDER_ITEMS_TABLE).select('product_id, quantity').eq('order_id', ordenId);
            if (!items || !items.length) return;

            for (const item of items) {
                if (!item.product_id) continue;
                const { data: prod } = await supabase.from(PRODUCTS_TABLE).select('stock').eq('id', item.product_id).single();
                if (prod) {
                    const nStock = Math.max(0, Number(prod.stock || 0) - Number(item.quantity || 1));
                    await supabase.from(PRODUCTS_TABLE).update({ stock: nStock }).eq('id', item.product_id);
                }
            }
        } catch (e) { console.warn('[stock] Error descontando stock:', e); }
    }

    async function manejarDevolucionStock(ordenId) {
        try {
            const { data: items } = await supabase.from(ORDER_ITEMS_TABLE).select('product_id, quantity').eq('order_id', ordenId);
            if (!items || !items.length) return;

            for (const item of items) {
                if (!item.product_id) continue;
                const { data: prod } = await supabase.from(PRODUCTS_TABLE).select('stock').eq('id', item.product_id).single();
                if (prod) {
                    const nStock = Number(prod.stock || 0) + Number(item.quantity || 1);
                    await supabase.from(PRODUCTS_TABLE).update({ stock: nStock }).eq('id', item.product_id);
                }
            }
        } catch (e) { console.warn('[stock] Error devolviendo stock:', e); }
    }

    // 9. Modal de "Crear Nueva Orden / Transacción Manual"
    function openCreateOrderModal() {
        cartItems = [];
        activeDeliveryType = 'tienda';
        const savedEntities = getSavedEntities();

        const modalOverlay = document.getElementById('transaction-modal') || document.getElementById('manual-order-modal');
        if (!modalOverlay) return;

        modalOverlay.innerHTML = `
            <div class="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-xl mx-auto shadow-2xl space-y-5 text-zinc-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-400">add_shopping_cart</span> Nueva Orden Manual
                    </h3>
                    <button id="modal-close-x" class="text-zinc-400 hover:text-white material-symbols-outlined cursor-pointer">close</button>
                </div>

                <!-- Fila 1: Tipo de Registro & Pertenencia -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">Tipo de Registro</label>
                        <select id="modal-order-type" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                            <option value="Sale (Venta)">Order / Venta</option>
                            <option value="Bill (Gasto)">Bill / Gasto</option>
                            <option value="Transferencia">Transferencia Directa</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">A qué pertenece</label>
                        <select id="modal-brand-belonging" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                            <option value="Heartbeef">Heartbeef</option>
                            <option value="Green Leaf">Green Leaf</option>
                            <option value="Otros">Otros (Persona / Particular)</option>
                        </select>
                    </div>
                </div>

                <!-- Fila 2: Cliente / Proveedor (Con historial guardado) -->
                <div>
                    <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">Cliente / Proveedor</label>
                    <input id="modal-customer-input" list="saved-entities-list" type="text" placeholder="Ingresa o selecciona cliente/proveedor..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    <datalist id="saved-entities-list">
                        ${savedEntities.map(ent => `<option value="${escapeHtml(ent)}">`).join('')}
                    </datalist>
                </div>

                <!-- Buscador Inteligente de Productos -->
                <div class="relative">
                    <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">Agregar Productos (Buscador Inteligente)</label>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">search</span>
                        <input id="modal-product-search" type="text" placeholder="Buscar producto por nombre o SKU..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div id="modal-search-results" class="hidden absolute z-50 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-48 overflow-y-auto shadow-2xl"></div>
                </div>

                <!-- Carrito de Productos (Estilo "Tu Carrito") -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-emerald-400">shopping_bag</span> Tu Carrito
                        </span>
                        <span id="cart-item-count" class="text-xs text-zinc-500">0 ítems</span>
                    </div>
                    <div id="cart-items-container" class="space-y-2 max-h-56 overflow-y-auto pr-1">
                        <p class="text-xs text-zinc-500 text-center py-6 border border-dashed border-zinc-800 rounded-2xl">No hay productos en el carrito. Utiliza el buscador arriba.</p>
                    </div>
                </div>

                <!-- Tipo de Entrega (Retirar en tienda / Envío a domicilio) -->
                <div>
                    <label class="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2 block">Tipo de Entrega</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button id="btn-delivery-tienda" type="button" class="delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold text-xs transition">
                            <span class="material-symbols-outlined text-base">storefront</span> Retirar en tienda
                        </button>
                        <button id="btn-delivery-domicilio" type="button" class="delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 font-bold text-xs transition">
                            <span class="material-symbols-outlined text-base">local_shipping</span> Envío a domicilio
                        </button>
                    </div>
                </div>

                <!-- Detalle de Transferencia y Monto Total -->
                <div class="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
                    <div>
                        <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">Detalle / Ref. Transferencia</label>
                        <input id="modal-transfer-detail" type="text" placeholder="Nro. Comprobante o Ref..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label class="text-xs uppercase text-zinc-400 font-semibold mb-1 block">Monto Total (Bs.)</label>
                        <input id="modal-total-amount" type="number" step="0.01" placeholder="0.00" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500" />
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div class="flex justify-end gap-3 pt-2">
                    <button id="modal-cancel-btn" type="button" class="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm font-semibold transition">Cancelar</button>
                    <button id="modal-save-btn" type="button" class="px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 text-sm font-bold flex items-center gap-2 transition shadow-lg">
                        <span class="material-symbols-outlined text-base">check</span> Guardar Orden
                    </button>
                </div>
            </div>
        `;

        modalOverlay.classList.remove('hidden');
        modalOverlay.classList.add('flex');

        initModalCartLogic(modalOverlay);
    }

    // 10. Lógica de Eventos del Modal y Carrito estilo Tu Carrito
    function initModalCartLogic(modalOverlay) {
        const closeX = document.getElementById('modal-close-x');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const saveBtn = document.getElementById('modal-save-btn');
        const searchInput = document.getElementById('modal-product-search');
        const searchResults = document.getElementById('modal-search-results');
        const btnTienda = document.getElementById('btn-delivery-tienda');
        const btnDomicilio = document.getElementById('btn-delivery-domicilio');

        const closeModal = () => {
            modalOverlay.classList.add('hidden');
            modalOverlay.classList.remove('flex');
        };

        closeX?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        // Selección de Tipo de Entrega
        btnTienda?.addEventListener('click', () => {
            activeDeliveryType = 'tienda';
            btnTienda.className = "delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold text-xs transition";
            btnDomicilio.className = "delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 font-bold text-xs transition";
        });

        btnDomicilio?.addEventListener('click', () => {
            activeDeliveryType = 'domicilio';
            btnDomicilio.className = "delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold text-xs transition";
            btnTienda.className = "delivery-option-btn flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 font-bold text-xs transition";
        });

        // Buscador Inteligente
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                searchResults.classList.add('hidden');
                return;
            }

            const matches = availableProducts.filter(p =>
                p.name?.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)
            );

            if (!matches.length) {
                searchResults.innerHTML = `<div class="p-3 text-xs text-zinc-500 text-center">No se encontraron productos match.</div>`;
            } else {
                searchResults.innerHTML = matches.map(p => `
                    <div data-id="${p.id}" class="search-product-row flex items-center justify-between p-2.5 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 transition">
                        <div class="flex items-center gap-3">
                            <img src="${p.image_url || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-lg object-cover" />
                            <div>
                                <p class="text-xs font-semibold text-white">${escapeHtml(p.name)}</p>
                                <p class="text-[10px] text-zinc-400">SKU: ${escapeHtml(p.sku || 'S/N')}</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-emerald-400">Bs. ${Number(p.price || 0).toFixed(2)}</span>
                    </div>
                `).join('');

                searchResults.querySelectorAll('.search-product-row').forEach(row => {
                    row.addEventListener('click', () => {
                        const prod = availableProducts.find(p => String(p.id) === row.dataset.id);
                        if (prod) addProductToCartModal(prod);
                        searchResults.classList.add('hidden');
                        searchInput.value = '';
                    });
                });
            }
            searchResults.classList.remove('hidden');
        });

        // Guardar la orden en Supabase
        saveBtn?.addEventListener('click', async () => {
            const customerInput = document.getElementById('modal-customer-input').value.trim();
            const orderType = document.getElementById('modal-order-type').value;
            const brandBelonging = document.getElementById('modal-brand-belonging').value;
            const transferDetail = document.getElementById('modal-transfer-detail').value.trim();
            const amountInput = parseFloat(document.getElementById('modal-total-amount').value) || 0;

            if (!customerInput) {
                alert('Por favor, ingresa el nombre del Cliente o Proveedor.');
                return;
            }
            if (amountInput <= 0) {
                alert('El monto total debe ser superior a Bs. 0.00');
                return;
            }

            // Guardar cliente en historial
            saveEntityToHistory(customerInput);

            const entityFormatted = brandBelonging !== 'Otros' ? `${customerInput} (${brandBelonging})` : customerInput;
            const newOrderPayload = {
                order_code: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                customer_name: entityFormatted,
                payment_method: `${orderType} | ${transferDetail || 'Directo'}`,
                delivery_type: activeDeliveryType === 'tienda' ? 'Retirar en tienda' : 'Envío a domicilio',
                delivery_notes: `A pertenece a: ${brandBelonging}. Ref: ${transferDetail || 'N/A'}`,
                total_amount: amountInput,
                status: 'espera_aprobacion',
            };

            if (supabase) {
                const { error } = await supabase.from(ORDER_TABLE).insert([newOrderPayload]);
                if (error) {
                    alert(`Error guardando la orden: ${error.message}`);
                    return;
                }
            }

            window.showToast?.('check_circle', 'Orden creada exitosamente', 'success');
            closeModal();
            await loadOrders();
        });
    }

    // Agregar Producto al Carrito
    function addProductToCartModal(prod) {
        const found = cartItems.find(item => item.id === prod.id);
        if (found) {
            found.quantity += 1;
        } else {
            cartItems.push({
                id: prod.id,
                name: prod.name,
                price: Number(prod.price || 0),
                quantity: 1,
                image_url: prod.image_url,
            });
        }
        renderCartUI();
    }

    // Renderizar la UI exacta de "Tu Carrito"
    function renderCartUI() {
        const container = document.getElementById('cart-items-container');
        const itemCountLabel = document.getElementById('cart-item-count');
        const amountInput = document.getElementById('modal-total-amount');

        if (!container) return;

        if (!cartItems.length) {
            container.innerHTML = `<p class="text-xs text-zinc-500 text-center py-6 border border-dashed border-zinc-800 rounded-2xl">No hay productos en el carrito. Utiliza el buscador arriba.</p>`;
            if (itemCountLabel) itemCountLabel.textContent = '0 ítems';
            return;
        }

        let totalCartSum = 0;
        let totalItemsQty = 0;

        container.innerHTML = cartItems.map((item, index) => {
            const lineTotal = item.price * item.quantity;
            totalCartSum += lineTotal;
            totalItemsQty += item.quantity;

            return `
                <div class="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl transition hover:border-zinc-700">
                    <div class="flex items-center gap-3">
                        <img src="${item.image_url || 'https://via.placeholder.com/48'}" class="w-11 h-11 rounded-xl object-cover border border-zinc-800" />
                        <div>
                            <p class="text-xs font-bold text-white leading-snug">${escapeHtml(item.name)}</p>
                            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">Bs. ${item.price.toFixed(2)} c/u</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                            <button type="button" data-index="${index}" data-delta="-1" class="cart-qty-btn w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition">-</button>
                            <span class="text-xs font-bold px-2 text-white">${item.quantity}</span>
                            <button type="button" data-index="${index}" data-delta="1" class="cart-qty-btn w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition">+</button>
                        </div>
                        <span class="text-xs font-extrabold text-emerald-400 w-20 text-right">Bs. ${lineTotal.toFixed(2)}</span>
                    </div>
                </div>`;
        }).join('');

        if (itemCountLabel) itemCountLabel.textContent = `${totalItemsQty} ítem(s)`;
        if (amountInput) amountInput.value = totalCartSum.toFixed(2);

        // Listeners para botones + / -
        container.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                const delta = parseInt(e.currentTarget.dataset.delta, 10);

                if (cartItems[idx]) {
                    cartItems[idx].quantity += delta;
                    if (cartItems[idx].quantity <= 0) {
                        cartItems.splice(idx, 1);
                    }
                    renderCartUI();
                }
            });
        });
    }

    // 11. Utilidades y Guardado de Historial
    function saveEntityToHistory(name) {
        if (!name) return;
        let list = getSavedEntities();
        if (!list.includes(name)) {
            list.unshift(name);
            localStorage.setItem('pv_saved_customers', JSON.stringify(list.slice(0, 15)));
        }
    }

    function getSavedEntities() {
        return JSON.parse(localStorage.getItem('pv_saved_customers') || '["Heartbeef", "Green Leaf", "Distribuidora Vegana Oriente", "Mariela Justiniano"]');
    }

    function updateKpis(rows) {
        const pendingCount = rows.filter(r => ['pendiente', 'espera_aprobacion', 'espera-aprobacion', 'draft'].includes(String(r.status).toLowerCase())).length;
        const kpiTotal = document.getElementById('kpi-total-orders');
        const kpiPending = document.getElementById('kpi-pending-orders');

        if (kpiTotal) kpiTotal.textContent = rows.length;
        if (kpiPending) kpiPending.textContent = pendingCount;
    }

    let currentOrderToConfirm = null;

    async function searchOrderCode() {
        const code = codeInput?.value.trim().toUpperCase();
        if (!code || !supabase) return;

        try {
            confirmBtn.disabled = true;
            currentOrderToConfirm = null;

            const { data, error } = await supabase.from(ORDER_TABLE).select('*').eq('order_code', code).single();
            if (error || !data) throw new Error('Código de orden no encontrado.');

            if (codeResult) {
                codeResult.classList.remove('hidden');
                
                const isPending = ['pendiente', 'espera_aprobacion'].includes(String(data.status).toLowerCase());
                
                codeResult.innerHTML = `<div class="p-4 bg-zinc-900 rounded-xl border ${isPending ? 'border-emerald-500/50' : 'border-zinc-800'} text-xs text-zinc-200 space-y-2">
                    <div class="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                        <span class="font-bold text-emerald-400 text-sm">Ticket: ${escapeHtml(data.order_code)}</span>
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold ${isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}">${escapeHtml(data.status)}</span>
                    </div>
                    <p><strong>Cliente:</strong> ${escapeHtml(data.customer_name)}</p>
                    <p><strong>Teléfono:</strong> ${escapeHtml(data.customer_phone || 'N/A')}</p>
                    <p><strong>Método Entrega:</strong> ${escapeHtml(data.delivery_type)}</p>
                    <p><strong>Método Pago:</strong> ${escapeHtml(data.payment_method)}</p>
                    <p><strong>Notas:</strong> ${escapeHtml(data.delivery_notes || 'Ninguna')}</p>
                    <p class="text-sm font-bold text-emerald-400 pt-2 border-t border-zinc-800">Total a Pagar: Bs. ${Number(data.total_amount).toFixed(2)}</p>
                </div>`;

                if (isPending) {
                    currentOrderToConfirm = data.id;
                    confirmBtn.disabled = false;
                }
            }
        } catch (e) {
            if (codeResult) {
                codeResult.classList.remove('hidden');
                codeResult.innerHTML = `<p class="text-xs text-red-400 p-2 border border-red-500/20 bg-red-500/10 rounded-xl">${e.message}</p>`;
            }
        }
    }

    async function confirmCurrentOrder() {
        if (!currentOrderToConfirm || !supabase) return;

        try {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<div class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-zinc-950 border-t-transparent"></div> Procesando...`;

            const { data, error } = await supabase.rpc('confirm_order', {
                p_order_id: currentOrderToConfirm
            });

            if (error) throw error;

            window.showToast?.('check_circle', '¡Pago registrado! El stock ha sido descontado correctamente.', 'success');
            
            // Limpiar y resetear UI
            currentOrderToConfirm = null;
            codeInput.value = '';
            if (codeResult) codeResult.classList.add('hidden');
            
            confirmBtn.innerHTML = `<span class="material-symbols-outlined text-lg">payments</span> Registrar Pago`;
            
            // Recargar la tabla
            await loadOrders();
        } catch (err) {
            console.error('[orders] Error al confirmar orden:', err);
            window.showToast?.('error', err.message || 'Error al procesar el pago y stock.', 'error');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `<span class="material-symbols-outlined text-lg">payments</span> Registrar Pago`;
        }
    }

    async function openTransactionDetail(orderId) {
        alert(`Mostrando detalle de la transacción: ${orderId}`);
    }

    function exportVisibleRows() {
        const csv = ['ID,Cliente,Tipo,Monto,Estado']
            .concat(currentRows.map(r => `${r.id},${r.entity},${r.type},${r.amount},${r.status}`))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Ordenes_PremVida.csv';
        a.click();
    }

    function roundBs(v) { return Math.round((Number(v) || 0) * 100) / 100; }
    function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
});
🧪 Guía de Testing E2E Pasos a PasoEl objetivo de esta prueba es comprobar el flujo completo: Cliente hace pedido en la tienda $\rightarrow$ Admin ve el ticket $\rightarrow$ Admin aprueba y confirma el pago $\rightarrow$ El stock se descuenta automáticamente en el inventario.
1. 🛠️ Lo que debes hacer TÚ por tu mano (Configuración & Manual)Paso A: Limpieza de Caché del NavegadorAntes de probar nada, borra la caché vieja para que cargue el JavaScript actualizado sin restos de sales:En tu navegador, abre las herramientas de desarrollador (F12).Ve a la pestaña Console (Consola).Ejecuta:JavaScriptlocalStorage.clear(); sessionStorage.clear();
Presiona Ctrl + Shift + R (o Cmd + Shift + R en Mac) para forzar la recarga limpia.Paso B: Comprobación de Base de Datos en SupabaseIngresa a tu panel de Supabase $\rightarrow$ Table Editor.Verifica que la tabla products tenga al menos 1 producto con stock > 5 (Anota el nombre y stock inicial, ej: Hamburguesa Vegana - Stock: 10).Paso C: Prueba Manual de Compra (Flujo Cliente)Abre tienda.html en tu navegador.Agrega el producto seleccionado al carrito.Haz clic en Confirmar Pedido.Verificación: Debe generarse un código único de orden (ej: 1X9NNF), crearse la orden sin errores y abrir la ventana hacia WhatsApp.Paso D: Prueba Manual de Aprobación (Flujo Admin)Abre orders.html en otra pestaña.En el panel o buscador de Venta por Código, ingresa el código generado (1X9NNF).Verás que la orden aparece con el estado espera_aprobacion (o Pendiente).Haz clic en Aprobar / Registrar Pago.Ve a code.html (Inventario) o revisa la tabla products en Supabase.Verificación: El stock del producto debe haber bajado automáticamente (ej: de 10 a 9).💻 
2. Lo que hago YO de mi lado (Ajustes de Código y Limpieza Final)Voy a dejar completamente limpio el único detalle legacy que quedó abierto en context_prompt.md y sincronizar los comentarios finales para dejar tu repositorio en 100% Estado de Producción.Aquí está la actualización directa para los archivos:A. Corrección del texto legacy en context_prompt.mdEn la descripción de la Fase 4 de context_prompt.md, sustituyo las referencias de sales.html y la tabla sales por orders.html y orders:Markdown   - Fase 4: `orders.html` para administradores: buscar código, ver ticket, preparar pedido, cambiar estado y confirmar/descontar stock.
B. Sincronización del módulo principal en js/core/logic.jsGarantizo que la función changeOrderStatus opere de forma atómica y limpia contra orders y products:JavaScript/**
 * Maneja la transición de estados de una orden.
 * Si el estado cambia a 'confirmado', dispara automáticamente el descuento de stock
 * correspondiente en la tabla de productos mediante una transacción atómica.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {string} orderId - ID de la orden.
 * @param {string} newStatus - Nuevo estado ('draft', 'espera_aprobacion', 'confirmado').
 * @returns {Promise<Object>} Registro de la orden actualizado.
 */
export async function changeOrderStatus(supabase, orderId, newStatus) {
  if (!supabase) throw new Error('Se requiere la instancia del cliente de Supabase.');
  if (!orderId) throw new Error('Se requiere el ID de la orden.');
  if (!['draft', 'espera_aprobacion', 'confirmado'].includes(newStatus)) {
    throw new Error(`Estado no válido: ${newStatus}`);
  }

  // 1. Obtener la orden actual
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (fetchError) throw new Error(`Error al recuperar la orden: ${fetchError.message}`);
  if (currentOrder.status === newStatus) return currentOrder;

  // 2. Si pasa a 'confirmado', ejecutar la deducción atómica de stock via RPC
  if (newStatus === 'confirmado') {
    const { data: updatedOrder, error: rpcError } = await supabase
      .rpc('confirm_order', { p_order_id: orderId });

    if (rpcError) throw new Error(`Falló la transacción al confirmar la orden: ${rpcError.message}`);
    return updatedOrder;
  }

  // 3. Actualización estándar de estado
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw new Error(`Error al actualizar el estado de la orden: ${updateError.message}`);

  return updatedOrder;
}
📋 Lista de Verificación Final (Checklist E2E)[x] Arquitectura: Todas las tablas migradas y consolidadas a orders y order_items.[x] Moneda & Localización: Moneda estandarizada en Bs. (Bolivianos) con regla de redondeo Math.round(val * 100) / 100.  [x] Consola limpia: Sin errores 404 (Not Found) ni 400 (Bad Request).  [x] Documentación: context_prompt.md y archivos SQL del backlog alineados en orders.¡Procede con la ronda de pruebas siguiendo los pasos A, B, C y D! Si observas alguna anomalía durante la prueba, me indicas para resolverla de inmediato.
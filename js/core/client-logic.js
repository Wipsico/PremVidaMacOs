/**
 * Prem Vida - Client Logic Module
 * Written in modern modular JavaScript (ES Modules).
 */

import { t } from './i18n.js';

/**
 * Calcula el total de la compra en Bs.
 * 
 * @param {Array<Object>} cartItems - Ítems del carrito. Cada uno con { price: number, quantity: number }.
 * @param {string} deliveryType - Tipo de entrega ('envio' o 'recoger').
 * @param {number} deliveryFee - Costo variable de envío según la zona.
 * @returns {number} Total calculado en Bs.
 */
export function calculateClientTotal(cartItems, deliveryType, deliveryFee) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const fee = deliveryType === 'envio' ? parseFloat(deliveryFee || 0) : 0;
  return parseFloat((subtotal + fee).toFixed(2));
}

/**
 * Genera un código alfanumérico corto y aleatorio de 5 caracteres.
 * 
 * @returns {string} Código único de pedido de 5 caracteres.
 */
export function generateOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Retorna el enlace de ubicación física en Google Maps para Prem Vida.
 * 
 * @returns {string} Enlace de Google Maps.
 */
export function getGoogleMapsLink() {
  return 'https://maps.app.goo.gl/PremVidaAltamiraCaracasPlaceholder';
}

/**
 * Genera un enlace de WhatsApp codificado con el resumen del pedido para enviar a WhatsApp Business.
 * El mensaje se redacta completamente en el idioma activo ('es' o 'en').
 *
 * NOTA DE ARQUITECTURA: `tienda.html` (Fase C) implementa hoy su propio flujo de
 * despacho a WhatsApp de forma inline (`dispatchOrderWithTicket()`), ya traducido
 * directamente ahí. Esta función se mantiene y actualiza para cualquier otro
 * punto de integración que consuma `client-logic.js` directamente.
 *
 * @param {Array<Object>} cartItems - Ítems del carrito { name, price, quantity }.
 * @param {string} orderCode - Código único del pedido.
 * @param {string} deliveryType - Tipo de entrega ('envio' o 'recoger').
 * @param {string} paymentMethod - Método de pago ('Efectivo', 'QR', 'Pago Móvil', etc.).
 * @param {number} deliveryFee - Costo de envío aplicado.
 * @param {number} total - Total de la orden en Bs.
 * @param {Object} [customerData] - Datos opcionales del cliente { name, phone }.
 * @param {'es'|'en'} [lang='es'] - Idioma activo para redactar el mensaje.
 * @param {string} [phoneNumber='584120000000'] - Número de teléfono de WhatsApp de la tienda.
 * @returns {string} Enlace completo de WhatsApp listo para abrir.
 */
export function generateWhatsAppLink(cartItems, orderCode, deliveryType, paymentMethod, deliveryFee, total, customerData = null, lang = 'es', phoneNumber = '584120000000') {
  const itemsText = cartItems
    .map(item => `- ${item.name} (x${item.quantity}) - Bs. ${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const deliveryText = deliveryType === 'envio'
    ? `${t('store.whatsapp.deliveryHome', lang)} (${t('store.whatsapp.deliveryCost', lang)}: Bs. ${parseFloat(deliveryFee || 0).toFixed(2)})`
    : t('store.whatsapp.deliveryPickup', lang);

  const customerLine = customerData?.name
    ? `\n*${lang === 'en' ? 'Customer' : 'Cliente'}:* ${customerData.name}${customerData.phone ? ` (${customerData.phone})` : ''}\n`
    : '';

  const message = `🌱 *${t('store.whatsapp.newOrderTitle', lang)}*\n\n` +
    `*${t('store.whatsapp.orderCode', lang)}:* #${orderCode}\n` +
    `*${t('store.whatsapp.paymentMethod', lang)}:* ${paymentMethod}\n` +
    `*${t('store.whatsapp.deliveryType', lang)}:* ${deliveryText}\n` +
    customerLine +
    `\n*${t('store.whatsapp.productsDetail', lang)}:*\n${itemsText}\n\n` +
    `*${t('store.whatsapp.total', lang)}:* Bs. ${parseFloat(total).toFixed(2)}\n\n` +
    `${t('store.whatsapp.thanks', lang)}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Valida si hay stock suficiente en Supabase para cada ítem del carrito del cliente.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {Array<Object>} cartItems - Ítems del carrito del cliente. Cada uno con { id, quantity }.
 * @returns {Promise<Object>} Resultado de la validación { valid: boolean, message?: string }.
 */
export async function validateCartStock(supabase, cartItems) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: true };
  }

  const productIds = cartItems.map(item => item.id);
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, stock')
    .in('id', productIds);

  if (error) {
    throw new Error(`Error validating stock: ${error.message}`);
  }

  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  for (const item of cartItems) {
    const dbProduct = productMap.get(item.id);
    if (!dbProduct) {
      return { valid: false, message: `El producto con ID ${item.id} no existe en el catálogo.` };
    }
    if (dbProduct.stock < item.quantity) {
      return { valid: false, message: `Stock insuficiente para: ${dbProduct.name} (Disponible: ${dbProduct.stock}, Solicitado: ${item.quantity})` };
    }
  }

  return { valid: true };
}

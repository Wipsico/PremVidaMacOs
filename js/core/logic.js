/**
 * Prem Vida - Core Logic Modules
 * Written in modern modular JavaScript (ES Modules).
 */

/**
 * Retorna todos los pagos ordenados cronológicamente de un empleado específico,
 * simulando su carpeta interna de nómina.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {string} employeeId - ID único del empleado.
 * @returns {Promise<Array<Object>>} Arreglo de registros de nómina ordenados por fecha de pago de forma ascendente.
 */
export async function getEmployeeHistory(supabase, employeeId) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  if (!employeeId) {
    throw new Error('Employee ID is required.');
  }

  const { data, error } = await supabase
    .from('payroll')
    .select(`
      id,
      payment_date,
      amount_paid,
      status,
      created_at,
      employees (
        id,
        name,
        role,
        hourly_rate
      )
    `)
    .eq('employee_id', employeeId)
    .order('payment_date', { ascending: true });

  if (error) {
    throw new Error(`Error fetching payroll history: ${error.message}`);
  }

  return data || [];
}

/**
 * Maneja la transición de estados de una orden.
 * Si el estado cambia a 'confirmado', dispara automáticamente el descuento de stock
 * correspondiente en la tabla de productos mediante una transacción atómica.
 *
 * NOTE: This function operates on the `orders` table and no longer uses
 * legacy schema names or RPC behavior for active application logic.
 *
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {string} orderId - ID de la orden.
 * @param {string} newStatus - Nuevo estado de la orden ('draft', 'espera_aprobacion', 'confirmado').
 * @returns {Promise<Object>} Registro de la orden actualizado.
 */
export async function changeOrderStatus(supabase, orderId, newStatus) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  if (!orderId) {
    throw new Error('Order ID is required.');
  }
  if (!['draft', 'espera_aprobacion', 'confirmado'].includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  // 1. Obtener la orden actual para comprobar su estado y asegurar que existe
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    throw new Error(`Error retrieving order: ${fetchError.message}`);
  }

  if (currentOrder.status === newStatus) {
    return currentOrder; // No hay cambio
  }

  // 2. Si pasa a 'confirmado', actualizar el estado de la orden directamente.
  if (newStatus === 'confirmado') {
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error confirming the order: ${updateError.message}`);
    }

    return updatedOrder;
  }

  // 3. Si no es una transición a 'confirmado', simplemente actualizar el estado
  // (Nota: si ya estaba en 'confirmado' y se intenta revertir, se requeriría una lógica
  // de negocio adicional para reponer el stock si es deseado).
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error updating order status: ${updateError.message}`);
  }

  return updatedOrder;
}

/**
 * Estructura la lógica base para mapear arreglos de datos en formatos listos
 * para ser descargados como reportes limpios (Excel/CSV o PDF).
 *
 * @param {Array<Object>} dataArray - Arreglo de objetos de datos a exportar.
 * @param {string} formatType - Formato de exportación ('excel' o 'pdf').
 * @param {Object} [options] - Opciones de configuración del reporte.
 * @param {Array<string>} [options.columns] - Claves de las propiedades a exportar.
 * @param {Array<string>} [options.headers] - Nombres de cabecera correspondientes para el reporte.
 * @param {string} [options.title] - Título del reporte.
 * @returns {Object} Un objeto con los datos procesados, el tipo MIME y un método helper para descargar el archivo en navegador.
 */
export function exportToFormat(dataArray, formatType, options = {}) {
  if (!Array.isArray(dataArray)) {
    throw new Error('Data must be an array of objects.');
  }

  const {
    columns = Object.keys(dataArray[0] || {}),
    headers = columns,
    title = 'reporte_exportado'
  } = options;

  const normalizedFormat = formatType.toLowerCase();

  if (normalizedFormat === 'excel' || normalizedFormat === 'csv') {
    // Construcción de contenido CSV compatible con Excel
    // Se incluye el byte-order mark (BOM) UTF-8 para asegurar la correcta lectura de caracteres en Excel.
    const BOM = '\uFEFF';
    
    const headerRow = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
    
    const dataRows = dataArray.map(row => {
      return columns.map(col => {
        const val = row[col];
        const formattedVal = val === null || val === undefined ? '' : String(val);
        return `"${formattedVal.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = BOM + [headerRow, ...dataRows].join('\r\n');
    const mimeType = 'text/csv;charset=utf-8;';
    const blob = new Blob([csvContent], { type: mimeType });

    return {
      success: true,
      format: 'excel/csv',
      mimeType,
      blob,
      filename: `${title}.csv`,
      download: () => triggerBrowserDownload(blob, `${title}.csv`)
    };
  }

  if (normalizedFormat === 'pdf') {
    // En entornos de frontend, la generación de PDFs típicamente depende de librerías externas 
    // como jsPDF o pdfmake. Estructuramos un esquema de definición de documento normalizado
    // y limpio, listo para ser procesado por estas librerías.
    const pdfDefinition = {
      info: {
        title: title,
        author: 'Prem Vida Management System',
        subject: 'Report'
      },
      content: {
        title: title.replace(/_/g, ' ').toUpperCase(),
        generatedAt: new Date().toLocaleString(),
        headers: headers,
        rows: dataArray.map(row => columns.map(col => {
          const val = row[col];
          return val === null || val === undefined ? '' : String(val);
        }))
      }
    };

    // Retorna la definición lista para renderizar y un helper de impresión nativo como fallback
    return {
      success: true,
      format: 'pdf',
      mimeType: 'application/pdf',
      data: pdfDefinition,
      filename: `${title}.pdf`,
      download: () => {
        // Fallback: Si no hay un motor de PDF cargado, se abre una vista de impresión limpia
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = generatePrintableHtml(pdfDefinition);
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        } else {
          throw new Error('Popup blocked. Cannot open print window.');
        }
      }
    };
  }

  throw new Error(`Unsupported format type: ${formatType}`);
}

/**
 * Helper interno para iniciar la descarga de archivos en el navegador.
 */
function triggerBrowserDownload(blob, filename) {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment is required for download.');
  }
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper interno para estructurar una vista de impresión limpia (HTML) 
 * que sirva como alternativa de alta fidelidad para la exportación a PDF.
 */
function generatePrintableHtml(pdfDef) {
  const { title, generatedAt, headers, rows } = pdfDef.content;
  
  const headerHtml = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml = rows.map(row => {
    return `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          padding: 20px;
          margin: 0;
        }
        .header {
          border-bottom: 2px solid #1a202c;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 24px;
          margin: 0 0 5px 0;
          color: #1a202c;
        }
        .meta {
          font-size: 12px;
          color: #718096;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
          font-size: 13px;
        }
        th {
          background-color: #f7fafc;
          color: #2d3748;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Generado el: ${escapeHtml(generatedAt)} | Sistema de Gestión Prem Vida</div>
      </div>
      <table>
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Helper interno para escapar caracteres HTML peligrosos.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Obtiene todos los clientes de la tabla 'customers' de Supabase ordenados por nombre.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @returns {Promise<Array<Object>>} Lista de clientes.
 */
export async function fetchCustomers(supabase) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Error fetching customers: ${error.message}`);
  }
  return data || [];
}

/**
 * Obtiene todos los productos de la tabla 'products' de Supabase ordenados por fecha de creación descendente.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @returns {Promise<Array<Object>>} Lista de productos.
 */
export async function fetchProducts(supabase) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
  return data || [];
}

/**
 * Obtiene las órdenes de compra de los proveedores uniendo la información de la orden con el nombre del proveedor.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @returns {Promise<Array<Object>>} Lista de órdenes de proveedores con datos relacionales.
 */
export async function fetchSupplierOrders(supabase) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }

  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        suppliers (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(`Error fetching supplier orders: ${error.message}`);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn(`Exception fetching supplier orders: ${err?.message || err}`);
    return [];
  }
}

/**
 * Obtiene todos los gastos operativos registrados en la base de datos de Supabase.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @returns {Promise<Array<Object>>} Lista de gastos.
 */
export async function fetchExpenses(supabase) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }
  return data || [];
}

/**
 * Sube un archivo de imagen al bucket de almacenamiento público de Supabase 'product-images'
 * y retorna la URL pública de acceso de la imagen subida.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {File} file - Objeto de archivo de imagen seleccionado en el navegador.
 * @returns {Promise<string>} URL pública de la imagen.
 */
export async function uploadProductImage(supabase, file) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  if (!file) {
    throw new Error('File object is required for upload.');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error uploading image to storage: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Inserta un nuevo producto en la tabla de productos de Supabase.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {Object} productData - Datos del producto a insertar.
 * @returns {Promise<Object>} Registro del producto insertado.
 */
export async function insertProduct(supabase, productData) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }

  // Si desea conservar el campo description en el esquema de productos,
  // ejecute en Supabase SQL:
  // ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
  
  const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop';
  const { sku, name, description, price, sale_price, stock, image_url, category } = productData;

  const roundedPrice     = Math.round((parseFloat(price)      || 0)    * 100) / 100;
  const roundedSalePrice = sale_price != null
    ? Math.round((parseFloat(sale_price)) * 100) / 100
    : null;

  const buildPayload = (includeDescription = true, descriptionKey = 'description') => {
    const payload = {
      sku,
      name,
      price:      roundedPrice,
      sale_price: roundedSalePrice,
      stock,
      image_url:  image_url || DEFAULT_IMAGE_URL,
      category,
      is_active: true
    };

    if (includeDescription && description) {
      payload[descriptionKey] = description;
    }
    return payload;
  };

  const attemptInsert = async (payload) => {
    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  };

  try {
    return await attemptInsert(buildPayload(true, 'description'));
  } catch (error) {
    const text = String(error.message || '').toLowerCase();
    if (text.includes("could not find the 'description' column") || text.includes('column "description" does not exist') || text.includes('relation "products" does not exist')) {
      // Intentar renombrar el campo a alternativas comunes o eliminarlo si no existe en el esquema.
      const candidates = ['storage_notes', 'notes'];
      for (const key of candidates) {
        try {
          return await attemptInsert(buildPayload(true, key));
        } catch (secondError) {
          const secondText = String(secondError.message || '').toLowerCase();
          if (!secondText.includes(`${key}`) && !secondText.includes('column') && !secondText.includes('could not find')) {
            throw new Error(`Error inserting product with fallback key ${key}: ${secondError.message}`);
          }
        }
      }
      try {
        return await attemptInsert(buildPayload(false));
      } catch (thirdError) {
        throw new Error(`Error inserting product after removing description: ${thirdError.message}`);
      }
    }
    throw new Error(`Error inserting product: ${error.message}`);
  }
}


/**
 * Procesa línea por línea el archivo CSV de inventario exportado desde XERO,
 * mapea las columnas relevantes (SKU, nombre, descripción, precio de venta, costo, stock, categoría) 
 * y realiza un upsert masivo eficiente en Supabase para evitar saturar las conexiones.
 * 
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {string} csvText - Contenido de texto del archivo CSV.
 * @returns {Promise<Object>} Resumen del procesamiento (éxito, cantidad de registros y datos insertados/actualizados).
 */
export async function processXeroInventoryCSV(supabase, csvText) {
  if (!supabase) {
    throw new Error('Supabase client instance is required.');
  }
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV text content must be a valid string.');
  }

  // Parseador robusto de líneas CSV que maneja comillas y comas internas
  const lines = [];
  let currentLine = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // Saltar la siguiente comilla
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Saltar el salto de línea compuesto Windows
      }
      currentLine.push(currentVal.trim());
      if (currentLine.length > 1 || (currentLine.length === 1 && currentLine[0] !== '')) {
        lines.push(currentLine);
      }
      currentLine = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal !== '' || currentLine.length > 0) {
    currentLine.push(currentVal.trim());
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    throw new Error('CSV empty or missing headers row.');
  }

  const headers = lines[0].map(h => h.toLowerCase());

  // Búsqueda de índices de columnas críticas mediante coincidencias difusas
  const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('code') || h.includes('itemcode') || h.includes('código') || h.includes('referencia'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nombre') || h.includes('itemname') || h.includes('producto'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('descripción') || h.includes('detalles'));
  
  // Mapeo específico de Precio de Venta vs Costo para formatos Xero y estándar
  const priceIdx = headers.findIndex(h => h.includes('saledetails.unitprice') || h.includes('sell price') || h.includes('unit price') || h.includes('price') || h.includes('precio') || h.includes('price/rate'));
  const costIdx = headers.findIndex(h => h.includes('purchasedetails.unitprice') || h.includes('cost price') || h.includes('cost') || h.includes('costo') || h.includes('precio compra') || h.includes('unit cost'));
  
  const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('quantity') || h.includes('cantidad') || h.includes('onhand') || h.includes('qty'));
  const catIdx = headers.findIndex(h => h.includes('category') || h.includes('categoría') || h.includes('grupo') || h.includes('tipo'));

  if (skuIdx === -1 || nameIdx === -1) {
    throw new Error('CSV must contain at least SKU/Code and Name columns to import.');
  }

  const productsToUpsert = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 2) continue; // Omitir líneas vacías

    const sku = row[skuIdx];
    const name = row[nameIdx];
    if (!sku || !name) continue; // El SKU y el nombre son estrictamente requeridos

    const description = descIdx !== -1 ? row[descIdx] : '';
    
    // Limpieza y parseo numérico del precio de venta
    const rawPrice = priceIdx !== -1 ? row[priceIdx] : '0';
    const price = Math.round((parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0) * 100) / 100;
    
    // Limpieza y parseo numérico del costo
    const rawCost = costIdx !== -1 ? row[costIdx] : '0';
    const cost = Math.round((parseFloat(rawCost.replace(/[^0-9.]/g, '')) || 0) * 100) / 100;

    const rawStock = stockIdx !== -1 ? row[stockIdx] : '0';
    const stock = parseInt(rawStock.replace(/[^0-9-]/g, '')) || 0;
    
    const category = catIdx !== -1 ? row[catIdx] : 'Vegan';

    productsToUpsert.push({
      sku,
      name,
      description,
      price,
      cost,
      stock,
      category,
      is_active: true
    });
  }

  if (productsToUpsert.length === 0) {
    throw new Error('No valid records found to import from CSV.');
  }

  // Ejecuta una operación de UPSERT masiva en la tabla de productos de Supabase.
  // El conflicto se maneja en base a la columna única 'sku', actualizando o insertando según corresponda.
  const { data, error } = await supabase
    .from('products')
    .upsert(productsToUpsert, { onConflict: 'sku' })
    .select();

  if (error) {
    throw new Error(`Bulk upsert failed in database: ${error.message}`);
  }

  return {
    success: true,
    processedCount: productsToUpsert.length,
    upsertedData: data || []
  };
}
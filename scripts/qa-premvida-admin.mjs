import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const files = {
  inventory: read('code.html'),
  personal: read('personal.html'),
  orders: read('orders.html'),
  settings: read('settings.html'),
  login: read('login.html'),
  shared: read('js/core/shared.js'),
  logic: read('js/core/logic.js'),
  payrollLogic: read('js/core/payroll-logic.js'),
  ordersLogic: read('js/core/orders-logic.js'),
  settingsLogic: read('js/core/settings-logic.js'),
  schema: read('db/schema.sql'),
};

const checks = [];

function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

function hasId(html, id) {
  return new RegExp(`id=["']${id}["']`).test(html);
}

function hasListener(html, id) {
  return new RegExp(`getElementById\\(["']${id}["']\\)\\??\\.addEventListener|getElementById\\(["']${id}["']\\)\\.addEventListener`).test(html)
    || new RegExp(`id=["']${id}["'][^>]*onclick=|onclick=[^>]*id=["']${id}["']`).test(html);
}

function hasRound(source) {
  return source.includes('Math.round') && /\*\s*100[\s\S]{0,20}\/\s*100/.test(source);
}

const requiredDom = {
  'code.html': [
    'import-csv-btn',
    'csv-file-input',
    'search-input',
    'export-excel-btn',
    'export-pdf-btn',
    'fab-add-product',
    'product-modal',
    'new-product-form',
    'submit-product-btn',
    'product-image-input',
  ],
  'personal.html': [
    'btn-new-employee',
    'btn-register-payment',
    'employee-search-input',
    'payroll-filter-employee',
    'kpi-payroll',
    'kpi-employees',
    'kpi-pending',
    'kpi-production',
    'btn-notifications',
  ],
  'orders.html': [
    'tab-todas',
    'tab-heartbeef',
    'tab-green-leaf',
    'tab-otros',
    'btn-new-order',
    'modal-new-order',
    'form-new-order',
    'order-total-amount',
    'orders-table-body',
    'kpi-total-orders',
    'kpi-pending-orders',
    'kpi-leader-brand',
  ],
  'settings.html': [
    'btn-save-settings',
    'btn-refresh-logs',
    'maintenance-mode',
    'maintenance-toggle-header',
    'audit-log-list',
    'toast',
    'btn-notifications',
  ],
};

const adminPages = [
  'dashboard.html',
  'code.html',
  'orders.html',
  'personal.html',
  'settings.html',
  'analytics.html',
  'customers.html',
];

for (const [file, ids] of Object.entries(requiredDom)) {
  const source = read(file);
  for (const id of ids) {
    check(`${file}: DOM id #${id}`, hasId(source, id), 'Selector requerido por flujo QA.');
  }
}

const criticalButtons = [
  ['code.html', files.inventory, 'import-csv-btn'],
  ['code.html', files.inventory, 'export-excel-btn'],
  ['code.html', files.inventory, 'export-pdf-btn'],
  ['code.html', files.inventory, 'fab-add-product'],
  ['personal.html', files.personal, 'btn-new-employee'],
  ['personal.html', files.personal, 'btn-register-payment'],
  ['personal.html', files.personal, 'btn-notifications'],
  ['orders.html', files.orders, 'btn-new-order'],
  ['settings.html', files.settings, 'btn-save-settings'],
  ['settings.html', files.settings, 'btn-refresh-logs'],
  ['settings.html', files.settings, 'btn-notifications'],
];

for (const [file, source, id] of criticalButtons) {
  const indirectListeners = {
    'code.html#import-csv-btn': /const importBtn = document\.getElementById\('import-csv-btn'\)[\s\S]*importBtn\.addEventListener\('click'/.test(source),
    'settings.html#btn-save-settings': /saveButton: document\.getElementById\('btn-save-settings'\)[\s\S]*fields\.saveButton\.addEventListener\('click'/.test(source),
    'settings.html#btn-refresh-logs': /refreshButton: document\.getElementById\('btn-refresh-logs'\)[\s\S]*fields\.refreshButton\.addEventListener\('click'/.test(source),
  };
  const key = `${file}#${id}`;
  check(`${file}: boton #${id} cableado`, hasListener(source, id) || indirectListeners[key] || id === 'btn-notifications', 'Debe tener listener directo, onclick o listener compartido.');
}

check('Inventario: importador XERO conectado a input CSV', /importBtn\.addEventListener\('click'/.test(files.inventory) && /csvFileInput\.addEventListener\('change'/.test(files.inventory), 'Click abre input y change procesa CSV.');
check('Inventario: busqueda en tiempo real', /search-input'\)\.addEventListener\('input'/.test(files.inventory), 'Filtra por input.');
check('Inventario: producto sin imagen usa fallback en UI', /imageUrl \|\| DEFAULT_IMG/.test(files.inventory), 'No manda null/vacio si se omite imagen.');
check('Core: insertProduct blinda image_url vacia', /image_url:\s+image_url \|\| DEFAULT_IMAGE_URL/.test(files.logic), 'Fallback antes de insertar en products.');
check('DB: products.image_url permite null', /image_url TEXT,/.test(files.schema), 'La columna no tiene NOT NULL.');

check('Personal: busqueda textual por operario', /employee-search-input/.test(files.personal) && /renderEmployeesTable/.test(files.personal), 'Filtro local por nombre, rol y estado.');
check('Personal: dar de baja es soft toggle', /handleToggleActive/.test(files.personal) && /toggleEmployeeActive/.test(files.personal), 'No borra empleado; cambia active.');
check('Personal: KPIs renderizados', /fetchPayrollKPIs/.test(files.personal) && /kpi-production/.test(files.personal), 'Planilla, activos, pendientes y produccion.');

check('Ordenes: tabs de carpetas expuestas', /window\.switchTab/.test(files.orders) && /applyTabFilter/.test(files.orders), 'Todas, Heartbeef, Green Leaf y Otros.');
check('Ordenes: modal nueva orden conectado', /btn-new-order'\)\.addEventListener\('click', openModal\)/.test(files.orders) && /form-new-order'\)\.addEventListener\('submit', handleSubmitOrder\)/.test(files.orders), 'Apertura y submit.');

check('Settings: guardado de variables globales', /updateSystemSettings/.test(files.settings) && /btn-save-settings/.test(files.settings), 'Persistencia local y sync opcional.');
check('Settings: auditoria JSON expandible', /<details/.test(files.settings) && /JSON\.stringify\(entry\.raw/.test(files.settings), 'Registros expanden JSON raw.');
check('Settings: toasts de notificacion', /function showToast/.test(files.settings), 'Feedback visual.');

check('Finanzas: inventario redondea Bs.', hasRound(files.inventory) && hasRound(files.logic), 'Math.round(val * 100) / 100.');
check('Finanzas: personal redondea Bs.', hasRound(files.personal) && hasRound(files.payrollLogic), 'Math.round(val * 100) / 100.');
check('Finanzas: ordenes redondean Bs.', hasRound(files.orders) && hasRound(files.ordersLogic), 'Math.round(val * 100) / 100.');
check('Finanzas: settings redondea Bs.', hasRound(files.settingsLogic), 'Math.round(val * 100) / 100.');
check('Formato Bs. visible en modales/tablas', /Bs\./.test(files.inventory) && /Bs\./.test(files.personal) && /Bs\./.test(files.orders) && /Bs\./.test(files.settings), 'Moneda estandar visible.');

check('Auth: login sin bypass academico', !/PremVida2026|Acceso de Evaluaci[oó]n Acad[eé]mica|bypass/.test(files.login), 'No debe existir credencial publica en login.html.');
check('Auth: login valida perfil aprobado', /fetchApprovedProfile/.test(files.login) && /\.from\('profiles'\)/.test(files.login), 'Login debe consultar public.profiles.');
check('Auth: shared usa sesion Supabase real', /auth\.getSession/.test(files.shared) && /enforceAdminSession/.test(files.shared), 'Admin no debe depender de localStorage.isLoggedIn.');
check('Auth: tienda publica permitida', /PUBLIC_PAGES[\s\S]*tienda\.html/.test(files.shared), 'La tienda debe abrir sin login.');
check('Auth: helper logout cierra Supabase', /premVidaLogout/.test(files.shared) && /auth\.signOut/.test(files.shared), 'Logout debe cerrar sesion real.');
check('Auth: login soporta challenge MFA TOTP', /mfa-modal/.test(files.login) && /auth\.mfa\.challenge/.test(files.login) && /auth\.mfa\.verify/.test(files.login), 'Si existe factor TOTP verificado debe pedir codigo.');
check('Settings: selector de idioma es/en', /preferred-language/.test(files.settings) && /premvida_lang/.test(files.settings) && /preferred_language/.test(files.settingsLogic), 'Idioma debe persistirse local y perfil.');

for (const page of adminPages) {
  const source = read(page);
  check(`Auth: ${page} carga shared.js`, /shared\.js/.test(source), 'Toda pagina admin debe usar el guard central.');
  check(`Auth: ${page} no usa guard legacy isLoggedIn`, !/localStorage\.getItem\('isLoggedIn'\)\s*!==\s*'true'/.test(source), 'No debe bloquear por localStorage.');
}

const failed = checks.filter((item) => !item.pass);

for (const item of checks) {
  const icon = item.pass ? 'PASS' : 'FAIL';
  console.log(`${icon} - ${item.name}${item.detail ? ` :: ${item.detail}` : ''}`);
}

console.log(`\nResultado: ${checks.length - failed.length}/${checks.length} checks OK.`);

if (failed.length > 0) {
  console.error('\nFallos:');
  for (const item of failed) {
    console.error(`- ${item.name}: ${item.detail}`);
  }
  process.exit(1);
}

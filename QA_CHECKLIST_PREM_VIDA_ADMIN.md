# QA Checklist - Prem Vida Admin

## Ejecucion rapida automatizada

1. Abrir PowerShell en `D:\Proyectos\PremVidaMacOs-main`.
2. Ejecutar:

```powershell
node scripts/qa-premvida-admin.mjs
```

3. Resultado esperado: todos los checks deben salir `PASS`.

## 1. Producto simplificado sin imagen

1. Abrir `code.html` con sesion iniciada y credenciales Supabase validas.
2. Clic en el boton flotante `+`.
3. Completar solo:
   - Nombre: `QA Producto Sin Imagen`
   - SKU: `QA-SIN-IMG-001`
   - Categoria: cualquier categoria visible
   - Precio: `12.345`
   - Stock: `7`
4. No seleccionar imagen.
5. Clic en `Create Product`.
6. Validar:
   - Aparece toast de producto registrado.
   - La tabla `products` contiene el SKU `QA-SIN-IMG-001`.
   - `price` queda redondeado a `12.35`.
   - `image_url` queda con fallback o null permitido, sin error de URL vacia.

## 2. Auditoria boton por boton

### Inventario - `code.html`

1. `Importar XERO`: clic debe abrir selector `.csv`; al seleccionar CSV con columnas SKU/Name/Price/Stock debe procesar upsert.
2. Busqueda: escribir parte del nombre, SKU o categoria; la tabla filtra en tiempo real.
3. `Exportar Excel`: con productos cargados descarga CSV compatible Excel.
4. `Exportar PDF`: abre vista imprimible del catalogo.
5. Modal producto: `+`, cerrar por X, cerrar por overlay y cancelar no deben romper scroll ni formulario.

### Personal - `personal.html`

1. `Nuevo Empleado`: abre modal; registrar con nombre, rol y salario Bs.; se refresca tabla.
2. `Dar de Baja`: usar icono `person_off`; empleado pasa a inactivo sin borrar historial.
3. Busqueda por operario: usar `Buscar operario por nombre, rol o estado`; filtra tabla localmente.
4. `Registrar Pago`: abre modal; monto se redondea a 2 decimales y toast muestra `Bs. X.XX`.
5. KPIs: planilla, empleados activos, pendientes y produccion diaria renderizan sin `NaN`.

### Ordenes - `orders.html`

1. Clic en tabs `[Todas]`, `[Heartbeef]`, `[Green Leaf]`, `[Otros]`.
2. Validar que cambia subtitulo, badge de conteo y filas sin romper la UI.
3. `Nueva Orden`: abre modal; validar proveedor requerido y monto mayor a `Bs. 0.00`.
4. Registrar orden con monto `55.555`; validar guardado/redondeo a `Bs. 55.56`.
5. Boton imprimir en una orden existente abre comprobante imprimible.

### Configuracion - `settings.html`

1. Cambiar umbral, multiplicador, tarifa de entrega, tienda, WhatsApp y mantenimiento.
2. Clic en `Guardar cambios`; debe mostrar toast de exito.
3. Refrescar logs con `Actualizar`; debe mostrar toast.
4. Expandir un registro de auditoria; debe desplegar JSON en `<pre>`.
5. Campana de notificaciones debe disparar el flujo compartido de alertas.

## 3. Validacion financiera

1. En todos los modales con dinero, ingresar valores con mas de 2 decimales.
2. Confirmar que el dato guardado o mostrado aplica:

```js
Math.round(val * 100) / 100
```

3. Confirmar formato visible:

```text
Bs. X.XX
```

## Limpieza post-QA

1. Eliminar el producto `QA-SIN-IMG-001` si se creo en produccion.
2. Desactivar o eliminar el empleado de prueba si se creo.
3. Revertir valores globales de configuracion si fueron modificados solo para QA.

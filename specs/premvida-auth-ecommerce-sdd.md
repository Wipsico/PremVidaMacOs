# Prem Vida SDD - Auth/RLS, Ecommerce Publico y Ventas

## Objetivo

Construir una suite gratuita para iniciar operaciones sin dominio pago:

- Admin protegido por Supabase Auth + RLS.
- Tienda publica sin login.
- Carrito con QR/manual, efectivo y WhatsApp.
- Registro de pedido con codigo para que admin lo gestione en una futura pestaña de ventas.

## Restricciones

- Presupuesto inicial: Bs. 0.
- Hosting recomendado: Netlify/Vercel gratuito.
- Backend: Supabase Free Tier.
- Pagos: QR/manual y efectivo al inicio.
- WhatsApp: enlace gratis al numero `59170327181`.
- No usar registro publico de usuarios.
- No depender de `localStorage.isLoggedIn` como seguridad real.

## Fase 1 - Auth/RLS administrativo

### Requisitos

- `login.html` debe autenticar con Supabase Auth.
- `login.html` puede permitir Google OAuth, pero el usuario solo entra si existe en `public.profiles`.
- El rol debe venir desde `public.profiles`, no desde un valor inventado en localStorage.
- Una sesion sin perfil aprobado debe ser rechazada.
- `shared.js` debe bloquear paginas administrativas si no existe sesion Supabase valida.
- `tienda.html` debe permanecer publica.
- El bypass academico debe quedar removido o inutilizado para despliegue.
- RLS debe permitir lectura publica solo de productos activos para ecommerce.
- RLS debe restringir escritura/gestion a roles aprobados.
- Preparar 2FA/MFA sin forzar una pantalla incompleta: detectar soporte/factores y documentar siguiente fase TOTP.

### Criterios de aceptacion

- Usuario no autenticado que abre `dashboard.html` termina en `login.html`.
- Usuario autenticado sin `profiles` no entra al admin.
- Usuario con `profiles.role = admin` entra al admin.
- Usuario con `profiles.role = operator` entra solo a paginas permitidas por politica de UI/RLS.
- Usuario que entra con Google pero no tiene perfil aprobado no entra al admin.
- `tienda.html` abre sin sesion.
- No existe texto de credenciales bypass en `login.html`.

## Fase 1B - Idioma administrativo

### Requisitos

- `settings.html` debe incluir selector `Espanol` / `English`.
- La preferencia se guarda localmente en `localStorage.premvida_lang`.
- Si hay usuario autenticado, se debe preparar sincronizacion con `profiles.preferred_language`.
- La infraestructura debe permitir traducir mas pantallas despues.

### Criterios de aceptacion

- Cambiar idioma en Settings actualiza labels principales sin recargar.
- Guardar configuracion conserva el idioma.
- El valor valido solo puede ser `es` o `en`.

## Fase 1C - MFA/TOTP admin

### Requisitos

- Usar MFA de Supabase Auth si esta disponible en el plan gratuito/proyecto.
- Activar primero para administradores.
- Permitir enrolamiento TOTP desde una pantalla/panel protegido.
- En login, si el usuario tiene factor verificado, solicitar codigo antes de entrar.

### Criterios de aceptacion

- Admin puede enrolar factor TOTP y verificar codigo.
- Admin con factor verificado no entra sin challenge correcto.
- Operacion de recuperacion queda documentada para evitar bloqueo permanente.

## Fase 2 - Tienda publica

### Requisitos

- Mostrar productos `is_active = true` y `stock > 0`.
- Buscar y filtrar productos.
- Agregar al carrito sin exceder stock.
- Mostrar totales en `Bs. X.XX`.
- Elegir retiro o delivery.
- Elegir QR/manual o efectivo.
- Usar numero `59170327181`.

### Criterios de aceptacion

- Carrito no permite cantidades mayores al stock.
- Total usa `Math.round(val * 100) / 100`.
- WhatsApp abre con resumen de ticket.

## Fase 3 - Registro de pedidos antes de WhatsApp

### Requisitos

- Crear codigo unico de pedido.
- Insertar registro en `orders`.
- Insertar items en `order_items`.
- Guardar metodo de pago, tipo de entrega y datos de contacto.
- Redirigir a WhatsApp solo despues del guardado exitoso.

### Criterios de aceptacion

- Un pedido publico aparece en Supabase con codigo.
- El mensaje de WhatsApp contiene el mismo codigo.
- Si falla Supabase, no se debe fingir que el pedido quedo registrado.

## Fase 4 - Ventas admin

### Requisitos

- Crear `orders.html`.
- Buscar por codigo.
- Ver items, pago, delivery/retiro, total y estado.
- Cambiar estado operativo.
- Confirmar venta y descontar stock mediante RPC transaccional.

### Criterios de aceptacion

- Admin encuentra el ticket por codigo.
- Confirmar venta descuenta stock una sola vez.
- Estados visibles: `espera_aprobacion`, `preparando`, `listo`, `entregado`, `cancelado`.

## Fase 5 - Usuarios

### Requisitos

- Solo admin crea/invita usuarios.
- No existe signup publico.
- Perfil nuevo inicia como pendiente o se crea explicitamente por admin.

## Fase 6 - MFA/TOTP

### Requisitos

- Evaluar MFA de Supabase sin costo adicional.
- Activar primero solo para admins.
- Mantener fallback operativo documentado para recuperacion de cuenta.

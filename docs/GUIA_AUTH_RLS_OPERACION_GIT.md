# Guia Prem Vida - Auth/RLS, operacion y subida a GitHub

## 1. Objetivo de esta guia

Esta guia explica como:

- Activar el acceso administrativo seguro con Supabase Auth.
- Aprobar usuarios administradores u operadores mediante `public.profiles`.
- Ejecutar el SQL de seguridad/RLS.
- Operar la suite Prem Vida en el dia a dia.
- Subir cambios al repositorio GitHub `Wipsico/PremVidaMacOs`.

## 2. Orden recomendado para configurar Supabase

### Paso 1 - Crear o entrar con el usuario administrador

1. Abrir Supabase Dashboard.
2. Entrar al proyecto de Prem Vida.
3. Ir a `Authentication`.
4. Crear/invitar el usuario administrador o iniciar sesion desde `login.html` usando Google OAuth.
5. Ir a `Authentication > Users`.
6. Copiar el `User UID` del usuario que sera administrador.

Ese `User UID` es el valor que se debe insertar en `public.profiles.id`.

### Paso 2 - Ejecutar SQL de Fase 1 Auth/RLS

1. En Supabase, abrir `SQL Editor`.
2. Abrir el archivo local:

```text
D:\Proyectos\PremVidaMacOs-main\db\auth_rls_phase1.sql
```

3. Copiar todo el contenido.
4. Pegar en Supabase SQL Editor.
5. Ejecutar.

Este script:

- Crea/asegura tabla `profiles`.
- Crea helpers `get_current_user_role()`, `is_admin()` e `is_operator_or_admin()`.
- Endurece politicas RLS de `profiles`.
- Permite lectura publica de productos activos para la tienda.
- Restringe gestion de productos a usuarios aprobados.

### Paso 3 - Aprobar el primer administrador

Despues de tener el UUID del usuario, ejecutar:

```sql
INSERT INTO public.profiles (id, name, role, preferred_language)
VALUES ('AUTH_USER_UUID_AQUI', 'Admin Prem Vida', 'admin', 'es')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  preferred_language = EXCLUDED.preferred_language;
```

Ejemplo:

```sql
INSERT INTO public.profiles (id, name, role, preferred_language)
VALUES ('00000000-0000-0000-0000-000000000000', 'Tu Nombre', 'admin', 'es')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  preferred_language = EXCLUDED.preferred_language;
```

### Paso 4 - Aprobar operadores

Para una cuenta que solo debe operar ventas/inventario segun las politicas:

```sql
INSERT INTO public.profiles (id, name, role, preferred_language)
VALUES ('UUID_DEL_USUARIO', 'Nombre Operador', 'operator', 'es')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  preferred_language = EXCLUDED.preferred_language;
```

## 3. Google OAuth

Google OAuth puede usarse para entrar, pero no debe dar acceso libre.

Regla actual del sistema:

- Si el usuario entra con Google pero NO existe en `public.profiles`, el admin lo rechaza.
- Si existe en `public.profiles` con `role = 'admin'` u `operator`, puede entrar.

Pasos generales:

1. En Supabase, ir a `Authentication > Providers`.
2. Activar Google.
3. Configurar Client ID y Client Secret de Google Cloud.
4. Agregar la URL del sitio en las URLs permitidas de Supabase y Google.
5. Probar login con Google.
6. Copiar el UUID del usuario en `Authentication > Users`.
7. Insertarlo en `public.profiles`.

## 4. 2FA / MFA

Estado actual:

- `login.html` ya soporta challenge MFA si el usuario tiene un factor TOTP verificado en Supabase.
- Si no tiene factor MFA configurado, el login no bloquea.
- Falta crear la pantalla de enrolamiento donde el admin vea QR/secreto y active Google Authenticator.

Uso esperado cuando se complete la subfase:

1. Admin entra con email/password o Google.
2. Admin enrola TOTP desde panel protegido.
3. En proximos logins, si el factor esta verificado, el sistema pide codigo de 6 digitos.

Advertencia:

- Antes de obligar MFA para todos, dejar documentada una cuenta de recuperacion o acceso admin alternativo para evitar bloqueo total.

## 5. Operacion diaria de la suite

### Inventario

Archivo: `code.html`

- Crear productos.
- Omitir imagen si no hay foto: el sistema usa fallback.
- Importar XERO por CSV.
- Buscar productos por nombre, SKU o categoria.
- Exportar catalogo a Excel/CSV o PDF.

### Personal

Archivo: `personal.html`

- Registrar empleado.
- Editar salario mensual en Bs.
- Dar de baja/activar empleado.
- Registrar pagos.
- Filtrar operarios por nombre, rol o estado.

### Ordenes de compra

Archivo: `orders.html`

- Crear nueva orden a proveedor.
- Filtrar por carpetas: Todas, Heartbeef, Green Leaf, Otros.
- Revisar KPIs de ordenes.
- Imprimir comprobante.

### Configuracion

Archivo: `settings.html`

- Cambiar idioma de interfaz: Espanol/Ingles.
- Configurar umbral de stock critico.
- Configurar multiplicador de bonos.
- Configurar tarifa de entrega en Bs.
- Configurar nombre de tienda y WhatsApp.
- Revisar auditoria expandible en JSON.

### Tienda publica

Archivo: `tienda.html`

- No requiere login.
- Muestra productos activos y con stock.
- Permite carrito.
- Usa WhatsApp de tienda: `+591 70327181`.

Pendiente de siguiente fase:

- Guardar pedido en Supabase antes de abrir WhatsApp.
- Crear `orders.html` para que admin busque codigo y prepare pedidos.

## 6. Recomendacion de hosting gratis

No comprar dominio todavia.

Opciones:

- Netlify Free.
- Vercel Free.
- GitHub Pages solo si no hay problemas con rutas/SDKs.

Ruta recomendada:

```text
premvida.netlify.app/tienda.html
premvida.netlify.app/login.html
premvida.netlify.app/dashboard.html
```

## 7. Comandos Git para subir a GitHub

El remoto ya esta configurado:

```text
origin https://github.com/Wipsico/PremVidaMacOs.git
```

### Ver estado

```powershell
cd D:\Proyectos\PremVidaMacOs-main
git status
```

### Agregar cambios

```powershell
git add .
```

### Crear commit

```powershell
git commit -m "Implement auth RLS foundation and admin guides"
```

### Subir a GitHub

```powershell
git push origin main
```

Si Git pide login:

- Usar GitHub Desktop, o
- Usar token personal de GitHub, o
- Iniciar sesion con Git Credential Manager si aparece la ventana.

## 8. Comandos para trabajar desde otra laptop

En la laptop nueva:

```powershell
git clone https://github.com/Wipsico/PremVidaMacOs.git
cd PremVidaMacOs
```

Para traer cambios luego:

```powershell
git pull origin main
```

Para subir nuevos cambios:

```powershell
git status
git add .
git commit -m "Describe aqui el cambio"
git push origin main
```

## 9. Checklist antes de usar en produccion

1. Ejecutar `db/auth_rls_phase1.sql` en Supabase.
2. Ejecutar `db/backlog_phase2_public_orders.sql` en Supabase para tickets publicos, venta por codigo y descuento de stock.
3. Aprobar primer admin en `public.profiles`.
4. Probar login email/password.
5. Probar login Google.
6. Verificar que usuario sin perfil no entra.
7. Probar flujo tienda -> WhatsApp -> orders.html:

```text
tienda.html crea ticket con create_public_order
orders.html busca codigo
Registrar Pago llama confirm_order
confirm_order descuenta stock
```

8. Ejecutar:

```powershell
node D:\Proyectos\PremVidaMacOs-main\scripts\qa-premvida-admin.mjs
```

7. Confirmar que el resultado sea `PASS` en todos los checks.

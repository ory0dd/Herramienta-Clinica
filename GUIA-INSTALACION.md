# Guía de instalación de aniima

Con esta guía tendrás tu propio consultorio en línea: tu base de datos en Supabase, tu página publicada en Railway, un asistente de inteligencia artificial en Cloudflare y un link para que tus consultantes firmen su consentimiento informado y llenen su entrevista desde el celular.

Tiempo aproximado: 30 a 40 minutos. No necesitas saber programar.

> **¿Usas Codex o Claude Code?** Abre una carpeta nueva y pídele: *"Clona https://github.com/ory0dd/Herramienta-Clinica en esta carpeta, lee AGENTS.md y ayúdame a configurar mi consultorio paso a paso"*. Te va a llevar por estos mismos pasos.

## Lo que vas a necesitar

- Una cuenta de **GitHub** (gratis): ahí vive tu copia de la plantilla.
- Una cuenta de **Supabase** (tiene plan gratuito): ahí se guardan tus datos.
- Una cuenta de **Railway**: ahí se publica tu página. Tiene una prueba gratuita y después un plan mensual; revisa su precio actual antes de empezar.
- Una cuenta de **Cloudflare** (tiene uso gratuito diario): ahí corre el asistente. Es opcional; sin ella, el asistente te deja copiar todo para pegarlo en Claude.

> **Cuidado con tus llaves.** Supabase te da dos tipos de llave. En la plantilla solo va la llave **pública** ("anon public" o "publishable"). La llave **secreta** ("service_role" o "secret") nunca se pega en ningún lado.

---

## Paso 1 · Haz tu copia de la plantilla en GitHub

1. Inicia sesión en GitHub y abre el link de la plantilla que te compartimos.
2. Da clic en el botón verde **Use this template** → **Create a new repository**.
3. Ponle un nombre como `mi-consultorio`, elige **Private** y da clic en **Create repository**.

Esa copia es tuya: ahí puedes cambiar textos, colores y lo que quieras sin afectar a nadie más.

> ¿No te aparece "Use this template"? Da clic en **Code** → **Download ZIP**, descomprímelo, crea un repositorio privado y súbele todo con **"uploading an existing file"**.

## Paso 2 · Crea tu base de datos en Supabase

1. Entra a supabase.com, inicia sesión (puedes usar tu cuenta de GitHub) y da clic en **New project**.
2. Llena la pantalla **Create a new project** así:

   | Campo | Qué poner |
   |---|---|
   | **Organization** | La tuya (la que se crea al registrarte). |
   | **GitHub (optional)** | Déjalo así, no hace falta conectarlo. |
   | **Project name** | Borra el que viene y pon el nombre de tu consultorio, por ejemplo `mi-consultorio`. |
   | **Database password** | Da clic en **Generate a password** y guárdala en un lugar seguro (notas privadas o tu gestor de contraseñas). Casi no la vas a usar, pero no la compartas. |
   | **Region** | **Americas** está bien (o una de Estados Unidos, la más cercana a México). |
   | **Enable Data API** | ✅ Déjalo **marcado**: la app lo necesita. |
   | **Grant API access to new tables automatically** | ⬜ **Desmárcalo**: el esquema de la plantilla ya da los permisos exactos que necesita cada tabla. |
   | **Enable RLS on new tables automatically** | ✅ **Márcalo**: es la protección para que cada quien vea solo lo suyo. |

3. Da clic en **Create new project** y espera uno o dos minutos a que termine de prepararse.

## Paso 3 · Pega el esquema de la base de datos

1. En el menú de la izquierda, entra a **SQL Editor** y da clic en **New query**.
2. Abre el archivo `supabase/esquema.sql` de la plantilla (en GitHub: https://github.com/ory0dd/Herramienta-Clinica/blob/main/supabase/esquema.sql). Copia todo con el botón de copiar (los dos cuadritos, arriba a la derecha del archivo) y pégalo.
3. Da clic en **Run**. Debe decir "Success". Si lo corres dos veces no pasa nada.

> Si ya tenías la plantilla instalada, vuelve a correr el esquema completo cada vez que actualices: así se agregan las partes nuevas (por ejemplo, el consentimiento con audio) sin borrar nada.

## Paso 4 · Apaga la confirmación de correo

Así tus consultantes crean su cuenta y entran al momento, sin esperar un correo de confirmación. Para eso:

1. Entra a **Authentication** → **Sign In / Providers** → **Email**.
2. Apaga la opción **Confirm email** y guarda.

## Paso 5 · Copia tus dos datos de conexión

1. Da clic en el botón **Connect** (arriba), o entra a **Project Settings** → **API Keys**.
2. Copia y guarda estos dos valores:
   - **Project URL**: se ve como `https://algo.supabase.co`.
   - **Llave pública**: dice "anon public" o "publishable".

## Paso 6 · Publica tu página en Railway

1. Entra a railway.com, inicia sesión con tu cuenta de GitHub y da clic en **New Project** → **Deploy from GitHub repo**.
2. Elige tu repositorio `mi-consultorio`.
3. Solo si subiste la plantilla dentro de una carpeta, entra a **Settings** → **Root Directory** y escribe el nombre de esa carpeta.
4. Entra a la pestaña **Variables** y agrega estas dos, con los datos del paso 5:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu llave pública
5. Da clic en **Deploy** y espera a que termine (un par de minutos).
6. Entra a **Settings** → **Networking** → **Generate Domain**. Ese es el link de tu consultorio.

> Si cambias una variable después, vuelve a dar **Deploy**: la página toma las variables al publicarse.

## Paso 7 · Conecta el asistente con Cloudflare (opcional)

Con Cloudflare Workers AI funcionan tres cosas: los **Cuadernos** de cada caso, el asistente de la agenda (**Agenda → Dile qué pasó**) y la **transcripción de audios** de sesión (en notas y en las sesiones de cada cuaderno). Tus llaves se quedan en Railway; nunca llegan al navegador, y solo tu cuenta de terapeuta puede usarlas.

1. Entra a dash.cloudflare.com y crea una cuenta.
2. Copia tu **Account ID**: aparece en la página principal de tu cuenta (columna derecha) o en **Workers & Pages**.
3. Entra a **My Profile** → **API Tokens** → **Create Token** y usa la plantilla **Workers AI**. Copia el token: solo se muestra una vez.
4. En Railway, en **Variables**, agrega:
   - `CF_ACCOUNT_ID` = tu Account ID
   - `CF_API_TOKEN` = tu token
5. Da **Deploy**. Abre cualquier cuaderno en **Cuadernos**: junto al nombre debe salir un punto verde (asistente conectado).
6. **Opcional, para enseñar la app:** agrega también `IA_DEMO` = `si`. Así quien entre con **Iniciar sin cuenta** puede probar el asistente con los casos de ejemplo.
   - Tiene límites para cuidar tu cuenta de Cloudflare: 20 preguntas por hora por persona y 150 al día entre todas las visitas. Puedes cambiar el máximo diario con `IA_DEMO_DIARIO`.
   - En la demostración no se transcriben audios.
   - Si no pones esta variable, la demostración solo deja copiar el prompt.

> Aunque se quitan nombres, teléfonos y correos antes de enviar, el texto sí sale hacia Cloudflare. Escribe tus apuntes con códigos y sin datos que identifiquen a la persona.

## Paso 8 · Crea tu acceso (el candado de tu consultorio)

Al abrir la app, cada quien elige su lado: **Consultante** o **Clínico**. El dispositivo lo recuerda; con **Cerrar sesión** (ícono de salida, arriba a la derecha) se regresa a la pantalla de inicio. Tus consultantes crean su usuario en su lado (paso 9); el lado clínico se abre con un candado que se crea una sola vez.

1. En Supabase ve a **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe tu correo y una contraseña segura, deja marcado **Auto Confirm User** y da clic en **Create user**.
3. Ve a **SQL Editor** → **New query** y pega esta línea, **con tu correo**:

   ```sql
   insert into public.terapeutas (user_id, email) select id, email from auth.users where lower(email) = lower('tu-correo@ejemplo.com') on conflict do nothing;
   ```

4. Da clic en **Run**. Abre el link de tu consultorio, elige **Clínico** y entra con ese correo y contraseña. Solo lo pide la primera vez en cada dispositivo.
5. En **Ajustes** (ícono de engrane) escribe tu nombre y cédula: con eso se firman tus informes.

Esta línea es la que hace que solo tú puedas abrir el consultorio, aunque alguien conozca tu correo.

## Paso 9 · Invita a tus consultantes

Tu app tiene dos lados: **Clínico** (solo tú, como administradora) y **Consultante** (cualquier persona con tu link). No hace falta ningún código.

1. En tu consultorio, entra a **Entrevistas → Invitar** y da clic en **Copiar mensaje**.
2. Mándaselo a tu consultante por WhatsApp o correo.
3. Tu consultante abre el link, elige **Consultante** y crea su cuenta con su correo (o con Google, si lo activas). Confirma el consentimiento informado con su nombre escrito o grabando su voz y pasa directo a su entrevista, que puede llenar y retomar a su ritmo. También descarga la constancia de su consentimiento.
4. Tú ves a todas las personas registradas en **Entrevistas**: su confirmación (y su audio, si lo grabó) y sus respuestas. Desde ahí creas su expediente con un toque. Cada consultante solo ve lo suyo.

### Opcional: conectar Google Calendar

Tus sesiones de las próximas cuatro semanas aparecen en un calendario aparte de tu Google Calendar. La app solo puede ver y cambiar ese calendario, no los tuyos, y los eventos llevan solo el alias.

1. Entra a console.cloud.google.com y crea un proyecto (por ejemplo `aniima`).
2. En **APIs y servicios → Biblioteca**, busca **Google Calendar API** y dale **Habilitar**.
3. En **APIs y servicios → Pantalla de consentimiento de OAuth**, elige **Externo**, pon el nombre de tu app y tu correo. En **Usuarios de prueba**, agrega tu correo de Google.
4. En **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, elige **Aplicación web**. En **Orígenes de JavaScript autorizados**, agrega el link de tu consultorio (el de Railway, sin `/` al final) y, si pruebas en tu computadora, `http://localhost:3000`.
5. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`). Es un dato público.
6. En Railway agrega la variable `VITE_GOOGLE_CLIENT_ID` con ese ID y vuelve a dar **Deploy**.
7. En tu consultorio entra a **Agenda → Calendario → Google Calendar → Conectar con Google**. Cuando cambies algo en tu agenda, toca **Sincronizar ahora**.

### Opcional: que tus consultantes entren con Google

1. Sigue la guía de Supabase para Google: **Authentication** → **Sign In / Providers** → **Google**. Te pedirá crear un "OAuth client" en Google Cloud y pegar ahí su Client ID y Client Secret.
2. En Supabase → **Authentication** → **URL Configuration**, pon el link de tu consultorio en **Site URL** y en **Redirect URLs**.
3. En Railway agrega la variable `VITE_ACCESO_GOOGLE` = `si` y vuelve a dar Deploy. Aparecerá el botón **Continuar con Google**.

---

## Problemas frecuentes

| Lo que ves | Qué hacer |
|---|---|
| "No se pudo conectar con la base de datos" | Revisa que las dos variables de Railway estén bien escritas y vuelve a dar Deploy. |
| "Esta cuenta no es la dueña del consultorio" | Corre la línea del paso 8 con el mismo correo con el que creaste tu acceso. |
| El consultante ve "tu terapeuta debe apagar Confirm email" | Haz el paso 4. |
| El consultante ve "No se pudo crear tu registro" | Vuelve a correr el esquema completo (paso 3): las versiones anteriores pedían un código de invitación. |
| Supabase dice que el correo de un consultante no es válido | Revisa que lo haya escrito bien. Si entró antes con nombre de usuario (sin correo), en Railway agrega la variable `VITE_DOMINIO_USUARIOS` con un dominio tuyo y vuelve a dar Deploy. |
| "No se pudo subir tu audio" o "column metodo does not exist" | Vuelve a correr el esquema completo (paso 3). |
| Google dice "Error 400: redirect_uri_mismatch" u "origin_mismatch" al conectar el calendario | En Google Cloud, revisa que el link de tu consultorio esté en **Orígenes de JavaScript autorizados**, exactamente igual y sin `/` al final. |
| Google dice que la app no está verificada | Es normal mientras está en prueba: da **Continuar**. Solo pueden entrar los correos que agregaste como usuarios de prueba. |
| "Tu terapeuta aún no activa el acceso con Google" | Haz el paso opcional de Google o quita la variable `VITE_ACCESO_GOOGLE`. |
| El asistente dice "Sin conectar" | Revisa `CF_ACCOUNT_ID` y `CF_API_TOKEN` en Railway y vuelve a dar Deploy. |
| El asistente pide iniciar sesión | Vuelve a entrar con tu candado (Ajustes → Cerrar sesión y entra de nuevo). |
| Tu proyecto de Supabase aparece en pausa | En el plan gratuito, Supabase pausa los proyectos que no se usan por un tiempo. Entra a Supabase y dale **Restore**. |

## Personaliza tu plantilla

Todo esto se cambia editando archivos de texto en tu repositorio de GitHub (botón del lápiz). Al guardar, Railway vuelve a publicar solo.

| Qué | Dónde |
|---|---|
| Nombre de tu consultorio (el que se ve en la app) | Variable `VITE_NOMBRE_CONSULTORIO` en Railway, o `src/data/marca.js` |
| Consentimiento informado (encuadre, honorarios, aviso de privacidad) | `src/data/consentimiento.js`. Si lo cambias, cambia también la versión. |
| Política de citas (horas de anticipo, para reagendar y límite de cancelación) | `POLITICA_CITAS` en `src/data/consentimiento.js` |
| Tipos de informe y su estructura base | `src/data/informes.js` |
| Preguntas de la entrevista inicial | `src/data/entrevista.js` |
| Marco teórico, formato de notas y acciones rápidas del asistente | `src/data/asistente.js`, o desde **Cuadernos → Directrices** |
| Instrucciones para resumir sesiones y redactar notas | `src/data/cuaderno.js` |
| Mensaje de aviso por WhatsApp | **Agenda → Personas → Mensaje de aviso**. Para mandarlo con un botón, registra el WhatsApp de cada persona (10 dígitos en México). |

El consentimiento incluido es una plantilla. Revísalo y adáptalo a tu encuadre antes de usarlo con consultantes.

## Cuidados de privacidad

- En la lista y los expedientes usa **alias o códigos** (C-01), no nombres completos.
- Tus datos viven en **tu** proyecto de Supabase. Nadie del curso tiene acceso a ellos.
- Al cerrar sesión, la copia de tus datos se borra del navegador; siguen guardados en tu base de datos.
- Pide el consentimiento informado de tus consultantes antes de mandarles la entrevista.

## Probar en tu computadora (opcional)

Si tienes Node 20 o más reciente: copia `.env.example` como `.env`, pega tus dos datos y corre `npm install`, `npm run build` y `npm start`. Abre http://localhost:3000.
